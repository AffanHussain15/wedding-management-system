/** Module 02 — Authentication. 9 endpoints. */

import { request, requestWithMeta, type RequestOptions } from '../client';
import type {
  ActiveSession,
  AuthResult,
  AuthTokens,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  ResetPasswordPayload,
} from '../apiTypes';

type Opts = Pick<RequestOptions, 'signal'>;

export const authApi = {
  /** 2.1 `POST /auth/register` — rate limited to 5 per 15 min. */
  register(payload: RegisterPayload, opts: Opts = {}) {
    return request<AuthResult>('POST', '/auth/register', {
      body: payload,
      auth: false,
      ...opts,
    });
  },

  /** 2.2 `POST /auth/login` — rate limited to 5 per 15 min. */
  login(payload: LoginPayload, opts: Opts = {}) {
    return request<AuthResult>('POST', '/auth/login', {
      body: payload,
      auth: false,
      ...opts,
    });
  },

  /** 2.3 `POST /auth/google` — `idToken` from the native Google Sign-In SDK. */
  google(idToken: string, opts: Opts = {}) {
    return request<AuthResult>('POST', '/auth/google', {
      body: { idToken },
      auth: false,
      ...opts,
    });
  },

  /**
   * 2.4 `POST /auth/forgot-password`. Always resolves with the same message
   * whether or not the email exists, so it cannot be used to enumerate users.
   */
  forgotPassword(email: string, opts: Opts = {}) {
    return request<MessageResponse>('POST', '/auth/forgot-password', {
      body: { email },
      auth: false,
      ...opts,
    });
  },

  /** 2.5 `POST /auth/reset-password`. Revokes every session on success. */
  resetPassword(payload: ResetPasswordPayload, opts: Opts = {}) {
    return request<MessageResponse>('POST', '/auth/reset-password', {
      body: payload,
      auth: false,
      ...opts,
    });
  },

  /**
   * 2.6 `POST /auth/refresh`. Normally unnecessary — the HTTP client rotates
   * tokens automatically on a 401. Exposed for explicit/manual refreshes.
   */
  refresh(refreshToken: string, opts: Opts = {}) {
    return request<AuthTokens>('POST', '/auth/refresh', {
      body: { refreshToken },
      auth: false,
      ...opts,
    });
  },

  /** 2.7 `POST /auth/logout` — revokes just this device's refresh token. */
  logout(refreshToken: string, opts: Opts = {}) {
    return request<MessageResponse>('POST', '/auth/logout', {
      body: { refreshToken },
      ...opts,
    });
  },

  /** 2.8 `POST /auth/logout-all` — revokes every refresh token. */
  logoutAll(opts: Opts = {}) {
    return request<MessageResponse>('POST', '/auth/logout-all', { ...opts });
  },

  /** 2.9 `GET /auth/sessions` — active devices. */
  async sessions(opts: Opts = {}) {
    const { data } = await requestWithMeta<ActiveSession[]>(
      'GET',
      '/auth/sessions',
      opts,
    );
    return Array.isArray(data) ? data : [];
  },
};
