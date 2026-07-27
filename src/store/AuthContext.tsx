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

  const loadProfile = useCallback(async (): Promise<CurrentUser | null> => {
    try {
      const me = await api.users.me();
      if (!mounted.current) return me;
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
      if (mounted.current) {
        setProfileError(errorMessage(error));
        setProfileLoaded(true);
      }
      return null;
    }
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
      await setSession({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      setProfileLoaded(false);
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

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      isAuthenticated: session !== null,
      profile,
      weddings: profile?.weddings ?? [],
      activeWeddingId,
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
