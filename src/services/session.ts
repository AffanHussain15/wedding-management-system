/**
 * The persisted auth session: token pair + the signed-in user.
 *
 * Held in a module singleton rather than React state so the HTTP client can
 * read the access token without a hook, and so a 401-driven refresh can update
 * it from outside the component tree. React layers subscribe via `subscribe`.
 */

import { STORAGE_KEYS } from './config';
import type { AuthTokens, PublicUser } from './apiTypes';
import { readJson, readString, remove, writeJson, writeString } from './storage';

export interface Session extends AuthTokens {
  user: PublicUser;
}

type Listener = (session: Session | null) => void;

let current: Session | null = null;
let hydrated = false;
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of [...listeners]) {
    listener(current);
  }
}

/** Subscribe to session changes. Returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSession(): Session | null {
  return current;
}

export function getAccessToken(): string | null {
  return current?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return current?.refreshToken ?? null;
}

/** True once `loadSession()` has run — used to hold the splash screen. */
export function isHydrated(): boolean {
  return hydrated;
}

/** Restores the session from storage. Safe to call more than once. */
export async function loadSession(): Promise<Session | null> {
  if (!hydrated) {
    current = await readJson<Session>(STORAGE_KEYS.session);
    hydrated = true;
    emit();
  }
  return current;
}

export async function setSession(session: Session): Promise<void> {
  current = session;
  hydrated = true;
  await writeJson(STORAGE_KEYS.session, session);
  emit();
}

/**
 * Swaps in a rotated token pair, keeping the current user. No-op when there is
 * no session (a concurrent logout won the race).
 */
export async function updateTokens(tokens: AuthTokens): Promise<void> {
  if (!current) return;
  current = { ...current, ...tokens };
  await writeJson(STORAGE_KEYS.session, current);
  emit();
}

/** Updates the cached user, e.g. after a profile edit. */
export async function updateSessionUser(user: PublicUser): Promise<void> {
  if (!current) return;
  current = { ...current, user };
  await writeJson(STORAGE_KEYS.session, current);
  emit();
}

export async function clearSession(): Promise<void> {
  current = null;
  hydrated = true;
  await remove(STORAGE_KEYS.session);
  await remove(STORAGE_KEYS.activeWeddingId);
  emit();
}

// --- Active wedding --------------------------------------------------------
// Every domain endpoint is scoped to a :weddingId, so the app has to remember
// which wedding the user is working on. Persisted separately from the session
// because it survives token rotation and is not a credential.

export async function loadActiveWeddingId(): Promise<string | null> {
  return readString(STORAGE_KEYS.activeWeddingId);
}

export async function saveActiveWeddingId(weddingId: string): Promise<void> {
  await writeString(STORAGE_KEYS.activeWeddingId, weddingId);
}

export async function clearActiveWeddingId(): Promise<void> {
  await remove(STORAGE_KEYS.activeWeddingId);
}
