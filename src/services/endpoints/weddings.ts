/** Module 03 — Wedding workspace, members and invites. 10 endpoints. */

import {
  request,
  requestVoid,
  requestWithMeta,
  type RequestOptions,
} from '../client';
import type {
  AcceptedInvite,
  CreatedInvite,
  CreatedWedding,
  CreateWeddingPayload,
  InviteMemberPayload,
  UpdateWeddingPayload,
  Wedding,
  WeddingDetail,
  WeddingMember,
  WeddingRole,
} from '../apiTypes';

type Opts = Pick<RequestOptions, 'signal'>;

/** `POST /weddings` may return a warning when the date is in the past. */
export interface CreateWeddingResult {
  wedding: CreatedWedding;
  warning: string | null;
}

export const weddingsApi = {
  /**
   * 3.3 `POST /weddings`. The creator becomes OWNER. Not wedding-scoped, so
   * any authenticated user may call it.
   */
  async create(
    payload: CreateWeddingPayload,
    opts: Opts = {},
  ): Promise<CreateWeddingResult> {
    const { data, meta } = await requestWithMeta<CreatedWedding>(
      'POST',
      '/weddings',
      { body: payload, ...opts },
    );
    return {
      wedding: data,
      warning: typeof meta.warning === 'string' ? meta.warning : null,
    };
  },

  /**
   * 3.4 `GET /weddings/:weddingId`. Returns 404 (never 403) when the caller
   * is not a member, so a not-found and a no-access case are indistinguishable.
   */
  get(weddingId: string, opts: Opts = {}) {
    return request<WeddingDetail>('GET', `/weddings/${weddingId}`, opts);
  },

  /** 3.5 `PATCH /weddings/:weddingId` — OWNER or CO_OWNER. */
  update(weddingId: string, payload: UpdateWeddingPayload, opts: Opts = {}) {
    return request<Wedding>('PATCH', `/weddings/${weddingId}`, {
      body: payload,
      ...opts,
    });
  },

  /** 3.6 `DELETE /weddings/:weddingId` — OWNER only. Soft delete, 204. */
  remove(weddingId: string, opts: Opts = {}) {
    return requestVoid('DELETE', `/weddings/${weddingId}`, opts);
  },

  /** 3.7 `GET /weddings/:weddingId/members` — any member. */
  async members(weddingId: string, opts: Opts = {}) {
    const { data } = await requestWithMeta<WeddingMember[]>(
      'GET',
      `/weddings/${weddingId}/members`,
      opts,
    );
    return Array.isArray(data) ? data : [];
  },

  /**
   * 3.8 `POST /weddings/:weddingId/invites` — OWNER or CO_OWNER. Invitable
   * roles are CO_OWNER, FAMILY_MEMBER and VIEWER; OWNER is rejected.
   *
   * Note: delivery of the invite email is not implemented server-side yet
   * (the link is only logged), so the invitee cannot currently receive it.
   */
  invite(weddingId: string, payload: InviteMemberPayload, opts: Opts = {}) {
    return request<CreatedInvite>('POST', `/weddings/${weddingId}/invites`, {
      body: payload,
      ...opts,
    });
  },

  /** Revoke a pending invite — OWNER or CO_OWNER. 204. */
  revokeInvite(weddingId: string, inviteId: string, opts: Opts = {}) {
    return requestVoid(
      'DELETE',
      `/weddings/${weddingId}/invites/${inviteId}`,
      opts,
    );
  },

  /**
   * 3.9 `POST /invites/accept`. The invite's wedding comes from the token, so
   * this is not wedding-scoped. Fails with 422 if the invite was issued to a
   * different email than the signed-in account's.
   */
  acceptInvite(token: string, opts: Opts = {}) {
    return request<AcceptedInvite>('POST', '/invites/accept', {
      body: { token },
      ...opts,
    });
  },

  /**
   * 3.10 `DELETE /weddings/:weddingId/members/:userId` — OWNER or CO_OWNER.
   * Removing the last OWNER fails with 422. 204 on success.
   */
  removeMember(weddingId: string, userId: string, opts: Opts = {}) {
    return requestVoid(
      'DELETE',
      `/weddings/${weddingId}/members/${userId}`,
      opts,
    );
  },

  /**
   * 3.11 `PATCH /weddings/:weddingId/members/:userId` — OWNER only.
   * Demoting the last OWNER fails with 422.
   */
  updateMemberRole(
    weddingId: string,
    userId: string,
    role: WeddingRole,
    opts: Opts = {},
  ) {
    return request<{ userId: string; role: WeddingRole }>(
      'PATCH',
      `/weddings/${weddingId}/members/${userId}`,
      { body: { role }, ...opts },
    );
  },
};
