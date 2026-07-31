/**
 * Authentication and active-wedding state.
 *
 * Sits above `WeddingProvider` because every domain endpoint is scoped to a
 * `:weddingId`, so the app needs a signed-in user *and* a selected wedding
 * before it can fetch anything.
 *
 * Wedding discovery goes through `GET /users/me`, which returns the caller's
 * memberships — there is no `GET /weddings` list endpoint.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  api,
  clearSession,
  errorMessage,
  loadActiveWeddingId,
  loadSession,
  saveActiveWeddingId,
  setSession,
  setUnauthorizedHandler,
  subscribeToSession,
  type CurrentUser,
  type LoginPayload,
  type RegisterPayload,
  type Session,
  type WeddingMembershipSummary,
} from '@services';

export interface AuthContextValue {
  /** False until the persisted session has been read from storage. */
  ready: boolean;
  session: Session | null;
  isAuthenticated: boolean;
  /** Full profile from `GET /users/me`; null until loaded. */
  profile: CurrentUser | null;
  weddings: WeddingMembershipSummary[];
  activeWeddingId: string | null;
  /**
   * False while `GET /users/me` is still in flight, so callers can tell "no
   * weddings" apart from "memberships not known yet".
   */
  profileLoaded: boolean;
  /** Set when the user is signed in but belongs to no wedding yet. */
  needsWeddingSetup: boolean;
  /** Non-fatal message from the last profile load, for a retry banner. */
  profileError: string | null;

  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-reads `GET /users/me`, e.g. after creating or joining a wedding. */
  refreshProfile: () => Promise<void>;
  selectWedding: (weddingId: string) => Promise<void>;
  /**
   * Makes a freshly created wedding active immediately, without waiting on a
   * `GET /users/me` round trip to confirm it. `refreshProfile` alone is too
   * fragile for this: the backend runs on a Render free instance that can
   * take 40-60s to wake up, and if that request is slow or fails right after
   * `POST /weddings` succeeds, `needsWeddingSetup` would stay true forever —
   * stranding a brand-new user on the setup wizard with no way into the app
   * and no error shown, since they already have an `activeWeddingId`.
   */
  completeWeddingSetup: (wedding: WeddingMembershipSummary) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren): React.JSX.Element {
  const [ready, setReady] = useState(false);
  const [session, setSessionState] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CurrentUser | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [activeWeddingId, setActiveWeddingId] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /**
   * Guards `GET /users/me` responses against arriving too late to be true.
   *
   * The epoch is bumped whenever something outside `loadProfile` establishes
   * newer truth about memberships — creating a wedding, or switching user. A
   * read issued before that bump was accurate when it left, but applying it now
   * would roll the state back: an empty `weddings` erases the wedding just
   * created *and* unsets `activeWeddingId`, which drops a brand-new user out of
   * the app and back onto a freshly mounted setup wizard.
   *
   * `request` also dedupes concurrent reads, so the provider's effect and an
   * awaiting caller share one in-flight fetch instead of racing two.
   */
  const profileEpoch = useRef(0);
  const profileRequest = useRef<{
    epoch: number;
    promise: Promise<CurrentUser | null>;
  } | null>(null);

  // Mirror the module-level session singleton into React state, so a refresh
  // failure deep inside the HTTP client re-renders the navigator.
  useEffect(() => subscribeToSession(setSessionState), []);

  // Restore the persisted session (and last active wedding) on cold start.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [restored, weddingId] = await Promise.all([
        loadSession(),
        loadActiveWeddingId(),
      ]);
      if (cancelled || !mounted.current) return;
      setSessionState(restored);
      setActiveWeddingId(weddingId);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // A dead session (refresh failed) drops us back to the auth stack.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!mounted.current) return;
      setProfile(null);
      setProfileLoaded(false);
      setActiveWeddingId(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const loadProfile = useCallback((): Promise<CurrentUser | null> => {
    const epoch = profileEpoch.current;
    const inFlight = profileRequest.current;
    if (inFlight && inFlight.epoch === epoch) return inFlight.promise;

    const promise = (async (): Promise<CurrentUser | null> => {
      try {
        const me = await api.users.me();
        // Superseded while in flight — report the response to the caller, but
        // don't let it overwrite newer state.
        if (!mounted.current || epoch !== profileEpoch.current) return me;
        setProfile(me);
        setProfileError(null);
        setProfileLoaded(true);

        // Reconcile the stored wedding id against actual memberships: a wedding
        // the user was removed from must not stay selected.
        setActiveWeddingId(previous => {
          const stillAMember =
            previous !== null && me.weddings.some(w => w.id === previous);
          if (stillAMember) return previous;
          const fallback = me.weddings[0]?.id ?? null;
          // Persistence is best-effort and already swallows its own errors.
          if (fallback) saveActiveWeddingId(fallback);
          return fallback;
        });
        return me;
      } catch (error) {
        if (mounted.current && epoch === profileEpoch.current) {
          setProfileError(errorMessage(error));
          setProfileLoaded(true);
        }
        return null;
      } finally {
        // Only retire our own entry; a bump may already have replaced it.
        if (profileRequest.current?.epoch === epoch) {
          profileRequest.current = null;
        }
      }
    })();

    profileRequest.current = { epoch, promise };
    return promise;
  }, []);

  // Load the profile whenever we become authenticated.
  useEffect(() => {
    if (!ready || !session) {
      setProfile(null);
      setProfileLoaded(false);
      return;
    }
    if (profileLoaded) return;
    // `loadProfile` captures its own failures into `profileError`.
    loadProfile();
  }, [ready, session, profileLoaded, loadProfile]);

  const applyAuthResult = useCallback(
    async (result: { user: Session['user']; accessToken: string; refreshToken: string }) => {
      // Drop any previous user's profile *before* the session lands, so the
      // render `setSession` triggers can't be decided on their memberships.
      // The bump also discards a read still in flight for the previous user,
      // which would otherwise land as if it described this one.
      profileEpoch.current += 1;
      setProfile(null);
      setProfileLoaded(false);
      await setSession({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      // Fetch the profile immediately so the navigator knows whether to show
      // the app or the wedding-setup flow without an intermediate flash.
      await loadProfile();
    },
    [loadProfile],
  );

  const login = useCallback(
    async (payload: LoginPayload) => {
      await applyAuthResult(await api.auth.login(payload));
    },
    [applyAuthResult],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      await applyAuthResult(await api.auth.register(payload));
    },
    [applyAuthResult],
  );

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      await applyAuthResult(await api.auth.google(idToken));
    },
    [applyAuthResult],
  );

  const logout = useCallback(async () => {
    const refreshToken = session?.refreshToken;
    if (refreshToken) {
      try {
        await api.auth.logout(refreshToken);
      } catch {
        // Revoking server-side is best-effort: a network failure must still
        // clear local credentials, or the user stays stuck signed in.
      }
    }
    profileEpoch.current += 1;
    await clearSession();
    if (!mounted.current) return;
    setProfile(null);
    setProfileLoaded(false);
    setActiveWeddingId(null);
  }, [session]);

  const selectWedding = useCallback(async (weddingId: string) => {
    await saveActiveWeddingId(weddingId);
    if (mounted.current) setActiveWeddingId(weddingId);
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  const completeWeddingSetup = useCallback(async (wedding: WeddingMembershipSummary) => {
    // This wedding is newer than any profile read already in flight — those
    // were sent before it existed and would report no memberships.
    profileEpoch.current += 1;
    const epoch = profileEpoch.current;

    await saveActiveWeddingId(wedding.id);
    if (!mounted.current) return;
    setActiveWeddingId(wedding.id);
    setProfile(prev => {
      if (!prev) return prev;
      if (prev.weddings.some(w => w.id === wedding.id)) return prev;
      return { ...prev, weddings: [...prev.weddings, wedding] };
    });

    // Reconcile with the server in the background — not awaited, so this
    // function resolves (and navigation proceeds) without waiting on a
    // second network round trip. Deliberately not via `loadProfile`, which
    // would overwrite `weddings` outright: right after creation the
    // membership may not have caught up in a read yet, and a stale response
    // must not erase the wedding we already know exists (or touch
    // `activeWeddingId`, which we just explicitly set).
    (async () => {
      try {
        const me = await api.users.me();
        // A later wedding (or a logout) has since superseded this reconcile.
        if (!mounted.current || epoch !== profileEpoch.current) return;
        const weddings = me.weddings.some(w => w.id === wedding.id)
          ? me.weddings
          : [...me.weddings, wedding];
        setProfile({ ...me, weddings });
        setProfileError(null);
        setProfileLoaded(true);
      } catch (error) {
        if (mounted.current && epoch === profileEpoch.current) {
          setProfileError(errorMessage(error));
        }
      }
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      isAuthenticated: session !== null,
      profile,
      weddings: profile?.weddings ?? [],
      activeWeddingId,
      profileLoaded,
      // Only meaningful once the profile has actually loaded, otherwise every
      // cold start would briefly claim the user has no weddings.
      needsWeddingSetup:
        session !== null &&
        profileLoaded &&
        profileError === null &&
        (profile?.weddings.length ?? 0) === 0,
      profileError,
      login,
      register,
      loginWithGoogle,
      logout,
      refreshProfile,
      selectWedding,
      completeWeddingSetup,
    }),
    [
      ready,
      session,
      profile,
      profileLoaded,
      profileError,
      activeWeddingId,
      login,
      register,
      loginWithGoogle,
      logout,
      refreshProfile,
      selectWedding,
      completeWeddingSetup,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
