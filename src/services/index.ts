/**
 * API layer entry point.
 *
 * Every backend route is reachable through the single `api` object:
 *
 *   import { api, ApiError, errorMessage } from '@services';
 *   const { items } = await api.vendors.list(weddingId, { status: 'PENDING' });
 *
 * Endpoints throw `ApiError` on failure — never a bare string — so callers can
 * branch on `error.code` / `error.status` and read `error.fieldErrors` for
 * inline form validation.
 */

import { authApi } from './endpoints/auth';
import { budgetApi } from './endpoints/budget';
import { dashboardApi } from './endpoints/dashboard';
import { eventsApi } from './endpoints/events';
import { guestsApi, publicRsvpApi } from './endpoints/guests';
import { tasksApi } from './endpoints/tasks';
import { usersApi } from './endpoints/users';
import { vendorsApi } from './endpoints/vendors';
import { weddingsApi } from './endpoints/weddings';

export const api = {
  auth: authApi,
  users: usersApi,
  weddings: weddingsApi,
  vendors: vendorsApi,
  guests: guestsApi,
  publicRsvp: publicRsvpApi,
  budget: budgetApi,
  events: eventsApi,
  tasks: tasksApi,
  dashboard: dashboardApi,
} as const;

export { IMPORT_MIME_TYPES, mimeTypeForFileName } from './endpoints/guests';
export type { CreateWeddingResult } from './endpoints/weddings';
export type { UpdatedProfile } from './endpoints/users';

// Errors
export { ApiError, isApiError, errorMessage, API_ERROR_CODES } from './apiError';
export type { ApiErrorCode, FieldError } from './apiError';

// Session
export {
  clearSession,
  getSession,
  isHydrated,
  loadSession,
  setSession,
  subscribe as subscribeToSession,
  updateSessionUser,
  loadActiveWeddingId,
  saveActiveWeddingId,
  clearActiveWeddingId,
} from './session';
export type { Session } from './session';

// Client internals worth exposing
export { setUnauthorizedHandler } from './client';
export type { ApiResponse, QueryParams, RequestOptions } from './client';

// Storage (for swapping in a secure/persistent adapter)
export { isPersistent, setStorageAdapter } from './storage';
export type { StorageAdapter } from './storage';

// Config
export { API_BASE_URL, API_HOST } from './config';

// Wire types and helpers
export * from './apiTypes';

// API <-> view-model mapping
export * from './mappers';
