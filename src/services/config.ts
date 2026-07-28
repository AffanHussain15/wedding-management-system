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

/** Aborts a request that never resolves (backend down, captive portal, …). */
export const REQUEST_TIMEOUT_MS = Number(ENV_REQUEST_TIMEOUT_MS) > 0
  ? Number(ENV_REQUEST_TIMEOUT_MS)
  : 20_000;

/** Storage keys for the persisted session. Bump the suffix to force logout. */
export const STORAGE_KEYS = {
  session: 'wms.session.v1',
  activeWeddingId: 'wms.activeWeddingId.v1',
} as const;
