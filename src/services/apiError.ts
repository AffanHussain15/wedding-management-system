/**
 * Typed transport error. Mirrors the backend's error envelope
 * (`HttpExceptionFilter`), plus two client-only codes for failures that never
 * reach the server.
 */

/** Matches the backend `ErrorCode` enum, with client-side additions. */
export const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'DUPLICATE_RESOURCE',
  'TOKEN_EXPIRED',
  'TOKEN_INVALID',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'WEDDING_ACCESS_DENIED',
  'LINKED_TO_VENDOR_PAYMENT',
  // Client-only:
  'NETWORK_ERROR',
  'TIMEOUT',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/** One entry of the backend's `error.details` array. */
export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  /** HTTP status; 0 when the request never completed. */
  readonly status: number;
  readonly code: ApiErrorCode | string;
  readonly details?: FieldError[];
  readonly requestId?: string;

  constructor(params: {
    status: number;
    code: ApiErrorCode | string;
    message: string;
    details?: FieldError[];
    requestId?: string;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    this.requestId = params.requestId;
  }

  /** No response at all — offline, wrong host, or server not running. */
  get isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT';
  }

  /** The access token is missing, expired, or was rejected after refresh. */
  get isAuthError(): boolean {
    return (
      this.status === 401 ||
      this.code === 'UNAUTHORIZED' ||
      this.code === 'TOKEN_EXPIRED' ||
      this.code === 'TOKEN_INVALID'
    );
  }

  /**
   * Per-field messages keyed by field name, for rendering inline form errors.
   * The backend flattens nested paths to dotted keys (`items.0.amount`).
   */
  get fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const detail of this.details ?? []) {
      if (!out[detail.field]) {
        out[detail.field] = detail.message;
      }
    }
    return out;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** A message safe to show a user, for any thrown value. */
export function errorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.code === 'NETWORK_ERROR') {
      return 'Cannot reach the server. Check your connection and try again.';
    }
    if (error.code === 'TIMEOUT') {
      return 'The request took too long. Please try again.';
    }
    return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
}
