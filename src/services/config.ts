/**
 * API connection settings, read from `.env` (see `.env.example`). Values are
 * inlined by babel at build time, so restart Metro with `--reset-cache` after
 * editing `.env`.
 *
 * The backend mounts every route under a global `v1` prefix
 * (see backend `create-app.ts`), so BASE_URL must include it.
 *
 * When `.env` leaves `API_HOST` blank the fallback is per-platform, because a
 * device/emulator cannot reach the host machine's `localhost`:
 *   - Android emulator  → 10.0.2.2 is the host loopback alias
 *   - iOS simulator     → shares the host network, so localhost works
 *   - physical device   → set API_HOST to your machine's LAN IP
 */

import { Platform } from 'react-native';
import {
  API_HOST as ENV_API_HOST,
  API_PREFIX as ENV_API_PREFIX,
  REQUEST_TIMEOUT_MS as ENV_REQUEST_TIMEOUT_MS,
} from '@env';

const FALLBACK_HOST = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

/** Scheme + host + port, with any trailing slash trimmed. */
export const API_HOST = (ENV_API_HOST?.trim() || FALLBACK_HOST).replace(/\/+$/, '');

export const API_PREFIX = ENV_API_PREFIX?.trim() || 'v1';

export const API_BASE_URL = `${API_HOST}/${API_PREFIX}`;

// A blank `API_HOST` is the single most common cause of "the request took too
// long": the fallback resolves to an emulator-only loopback alias, which on a
// physical device is unroutable, so requests are black-holed rather than
// refused and every call burns the full timeout before failing. Say so once at
// startup, since the symptom on screen looks like a slow server, not a config
// mistake.
if (__DEV__ && !ENV_API_HOST?.trim()) {
  console.warn(
    `[config] API_HOST is not set in .env — falling back to ${API_HOST}. ` +
      'That address only works on an emulator/simulator; on a physical device ' +
      "set API_HOST to your deployed URL or your machine's LAN IP, then restart " +
      'Metro with --reset-cache.',
  );
}

/**
 * Aborts a request that never resolves (backend down, captive portal, …).
 *
 * The default has to clear a cold start, not just a warm request: the API runs
 * on a Render free instance that sleeps when idle and takes 40-60s to wake, so
 * a 20s budget turned every first launch into a spurious "request took too
 * long" on the home screen. Override via `.env` for a local backend, where a
 * much shorter budget is appropriate.
 */
export const REQUEST_TIMEOUT_MS = Number(ENV_REQUEST_TIMEOUT_MS) > 0
  ? Number(ENV_REQUEST_TIMEOUT_MS)
  : 90_000;

/** Storage keys for the persisted session. Bump the suffix to force logout. */
export const STORAGE_KEYS = {
  session: 'wms.session.v1',
  activeWeddingId: 'wms.activeWeddingId.v1',
} as const;
