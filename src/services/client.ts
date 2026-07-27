/**
 * HTTP core for every API call.
 *
 * Responsibilities:
 *  - unwraps the backend's success envelope (`{ success, data, meta }`) so
 *    callers receive `data` directly, with `meta` available when needed;
 *  - turns error envelopes and transport failures into a typed `ApiError`;
 *  - attaches the bearer token and, on a 401, refreshes it once and replays
 *    the original request — with all concurrent 401s sharing a single refresh;
 *  - applies a request timeout and honours a caller-supplied AbortSignal.
 */

import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';
import { ApiError, type FieldError } from './apiError';
import type { AuthTokens, ResponseMeta } from './apiTypes';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  updateTokens,
} from './session';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/** Primitive query values; `undefined`/`null` entries are dropped. */
export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null
>;

export interface RequestOptions {
  /** JSON request body. Ignored for GET. */
  body?: unknown;
  query?: QueryParams;
  /** Send the bearer token. Default true; set false for public endpoints. */
  auth?: boolean;
  /** Multipart body; when set, `body` is ignored and no Content-Type is set. */
  formData?: FormData;
  signal?: AbortSignal;
  /** Overrides the default timeout (uploads need longer). */
  timeoutMs?: number;
}

/** A response plus its envelope metadata (pagination, warnings). */
export interface ApiResponse<T> {
  data: T;
  meta: ResponseMeta;
}

const EMPTY_META: ResponseMeta = { timestamp: '', requestId: '' };

function buildUrl(path: string, query?: QueryParams): string {
  const base = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return base;

  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `${base}?${parts.join('&')}` : base;
}

function parseFieldErrors(value: unknown): FieldError[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const details = value.filter(
    (entry): entry is FieldError =>
      !!entry &&
      typeof entry === 'object' &&
      typeof (entry as FieldError).field === 'string' &&
      typeof (entry as FieldError).message === 'string',
  );
  return details.length ? details : undefined;
}

/** Builds an ApiError from a non-2xx response body of unknown shape. */
function toApiError(status: number, body: unknown): ApiError {
  const envelope = (body ?? {}) as {
    error?: { code?: unknown; message?: unknown; details?: unknown };
    message?: unknown;
    meta?: { requestId?: unknown };
  };
  const error = envelope.error ?? {};

  const code =
    typeof error.code === 'string'
      ? error.code
      : status === 401
        ? 'UNAUTHORIZED'
        : 'INTERNAL_ERROR';

  const message =
    typeof error.message === 'string'
      ? error.message
      : typeof envelope.message === 'string'
        ? envelope.message
        : `Request failed with status ${status}.`;

  return new ApiError({
    status,
    code,
    message,
    details: parseFieldErrors(error.details),
    requestId:
      typeof envelope.meta?.requestId === 'string'
        ? envelope.meta.requestId
        : undefined,
  });
}

/**
 * Runs fetch with a timeout, mapping transport failures to ApiError. Kept
 * separate from envelope handling so the refresh call can reuse it.
 */
async function rawFetch(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  callerSignal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onCallerAbort = () => controller.abort();
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener('abort', onCallerAbort);
  }

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (timedOut) {
      throw new ApiError({
        status: 0,
        code: 'TIMEOUT',
        message: 'The request timed out.',
      });
    }
    // A caller-initiated abort (unmount, new search keystroke) must stay an
    // AbortError so callers can distinguish cancellation from failure.
    if (callerSignal?.aborted) throw error;
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Network request failed.',
    });
  } finally {
    clearTimeout(timeoutId);
    callerSignal?.removeEventListener('abort', onCallerAbort);
  }
}

/** Reads a response body that may be empty (204) or not valid JSON. */
async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  let text: string;
  try {
    text = await response.text();
  } catch {
    return undefined;
  }
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    // HTML error page from a proxy, or a plain-text crash — surface the text.
    return { error: { message: text.slice(0, 300) } };
  }
}

// --- Token refresh ---------------------------------------------------------

let refreshPromise: Promise<AuthTokens | null> | null = null;

/** Called when the session can no longer be recovered. */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

/**
 * Rotates the token pair. Uses a bare fetch (not `request`) so a 401 from the
 * refresh endpoint itself cannot recurse. Concurrent callers share one
 * in-flight refresh.
 */
function refreshTokens(): Promise<AuthTokens | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async (): Promise<AuthTokens | null> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await rawFetch(
        buildUrl('/auth/refresh'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        },
        REQUEST_TIMEOUT_MS,
      );

      if (!response.ok) return null;

      const body = (await readBody(response)) as { data?: AuthTokens } | undefined;
      const tokens = body?.data;
      if (!tokens?.accessToken || !tokens?.refreshToken) return null;

      await updateTokens(tokens);
      return tokens;
    } catch {
      // Network failure during refresh: do not destroy the session — the token
      // may still be valid once connectivity returns.
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// --- Public request API ----------------------------------------------------

/** Issues a request and returns both `data` and envelope `meta`. */
export async function requestWithMeta<T>(
  method: Method,
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const {
    body,
    query,
    auth = true,
    formData,
    signal,
    timeoutMs = REQUEST_TIMEOUT_MS,
  } = options;

  const url = buildUrl(path, query);

  const send = async (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    // Multipart must not set Content-Type — fetch appends the boundary.
    if (!formData && body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) headers.Authorization = `Bearer ${token}`;

    const init: RequestInit = { method, headers };
    if (formData) init.body = formData;
    else if (body !== undefined && method !== 'GET') init.body = JSON.stringify(body);

    return rawFetch(url, init, timeoutMs, signal);
  };

  let response = await send(auth ? getAccessToken() : null);

  // A 401 on an authenticated call means the access token expired: rotate it
  // once and replay. Only once — a second 401 is a real auth failure.
  if (response.status === 401 && auth && getRefreshToken()) {
    const tokens = await refreshTokens();
    if (tokens) {
      response = await send(tokens.accessToken);
    } else {
      await clearSession();
      onUnauthorized?.();
    }
  }

  const payload = await readBody(response);

  if (!response.ok) {
    const error = toApiError(response.status, payload);
    if (error.status === 401 && auth) {
      // Still unauthenticated after the retry — drop the dead session.
      await clearSession();
      onUnauthorized?.();
    }
    throw error;
  }

  const envelope = (payload ?? {}) as { data?: unknown; meta?: ResponseMeta };
  return {
    data: envelope.data as T,
    meta: envelope.meta ?? EMPTY_META,
  };
}

/** Issues a request and returns just the `data` payload. */
export async function request<T>(
  method: Method,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { data } = await requestWithMeta<T>(method, path, options);
  return data;
}

/** For 204 endpoints, where there is no payload to unwrap. */
export async function requestVoid(
  method: Method,
  path: string,
  options: RequestOptions = {},
): Promise<void> {
  await requestWithMeta<undefined>(method, path, options);
}

/**
 * List endpoints: returns rows plus pagination lifted out of `meta`. Defends
 * against a missing/!array payload so a bad response can't crash a FlatList.
 */
export async function requestList<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ items: T[]; pagination?: ResponseMeta['pagination'] }> {
  const { data, meta } = await requestWithMeta<T[]>('GET', path, options);
  return {
    items: Array.isArray(data) ? data : [],
    pagination: meta.pagination,
  };
}
