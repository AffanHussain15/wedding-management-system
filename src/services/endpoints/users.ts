/** Module 03 — Users. 2 endpoints. */

import { request, type RequestOptions } from '../client';
import type { CurrentUser, UpdateProfilePayload } from '../apiTypes';

type Opts = Pick<RequestOptions, 'signal'>;

/** The trimmed profile returned by PATCH (no `weddings` array). */
export type UpdatedProfile = Omit<CurrentUser, 'weddings'>;

export const usersApi = {
  /**
   * 3.1 `GET /users/me`. Also returns every wedding the user belongs to with
   * their role — this is how the app discovers which weddings exist, since
   * there is no `GET /weddings` list endpoint.
   */
  me(opts: Opts = {}) {
    return request<CurrentUser>('GET', '/users/me', opts);
  },

  /** 3.2 `PATCH /users/me`. `phone` must be E.164, e.g. "+923001234567". */
  updateProfile(payload: UpdateProfilePayload, opts: Opts = {}) {
    return request<UpdatedProfile>('PATCH', '/users/me', {
      body: payload,
      ...opts,
    });
  },
};
