/**
 * API connection settings.
 *
 * The backend mounts every route under a global `v1` prefix
 * (see backend `create-app.ts`), so BASE_URL must include it.
 *
 * Host defaults are per-platform because a device/emulator cannot reach the
 * host machine's `localhost`:
 *   - Android emulator  → 10.0.2.2 is the host loopback alias
 *   - iOS simulator     → shares the host network, so localhost works
 *   - physical device   → set API_HOST to your machine's LAN IP
 */

import { Platform } from 'react-native';

/** Override this (or `API_BASE_URL` below) when pointing at a deployed API. */
export const API_HOST = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

export const API_PREFIX = 'v1';

export const API_BASE_URL = `${API_HOST}/${API_PREFIX}`;

/** Aborts a request that never resolves (backend down, captive portal, …). */
export const REQUEST_TIMEOUT_MS = 20_000;

/** Storage keys for the persisted session. Bump the suffix to force logout. */
export const STORAGE_KEYS = {
  session: 'wms.session.v1',
  activeWeddingId: 'wms.activeWeddingId.v1',
} as const;
