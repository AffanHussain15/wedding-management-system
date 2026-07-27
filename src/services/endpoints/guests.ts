/** Module 05 — Guests, RSVP and the public invite pages. 11 endpoints. */

import {
  request,
  requestList,
  requestVoid,
  requestWithMeta,
  type RequestOptions,
} from '../client';
import type {
  ApiRsvpStatus,
  BulkImportResult,
  BulkSendInvitesPayload,
  CreateGuestPayload,
  Guest,
  GuestListItem,
  GuestListQuery,
  GuestSummary,
  MessageResponse,
  Paginated,
  PublicInvite,
  SendInvitePayload,
  SubmitRsvpPayload,
  UpdateGuestPayload,
  UploadFile,
} from '../apiTypes';

type Opts = Pick<RequestOptions, 'signal'>;

const base = (weddingId: string) => `/weddings/${weddingId}/guests`;

/** Uploads are slower than normal calls; 5 MB over mobile data needs room. */
const UPLOAD_TIMEOUT_MS = 60_000;

/**
 * MIME types the backend accepts for bulk import. It matches on the exact
 * string, so a picker returning e.g. 'application/octet-stream' is rejected —
 * use `mimeTypeForFileName` to derive the right value.
 */
export const IMPORT_MIME_TYPES = {
  csv: 'text/csv',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;

/** Best-effort MIME type from a file name, for the bulk-import upload. */
export function mimeTypeForFileName(fileName: string): string | null {
  const extension = fileName.toLowerCase().split('.').pop();
  switch (extension) {
    case 'csv':
      return IMPORT_MIME_TYPES.csv;
    case 'xls':
      return IMPORT_MIME_TYPES.xls;
    case 'xlsx':
      return IMPORT_MIME_TYPES.xlsx;
    default:
      return null;
  }
}

export const guestsApi = {
  /** 5.1 `GET .../guests` — any member. */
  async list(
    weddingId: string,
    query: GuestListQuery = {},
    opts: Opts = {},
  ): Promise<Paginated<GuestListItem>> {
    return requestList<GuestListItem>(base(weddingId), { query, ...opts });
  },

  /**
   * 5.2 `GET .../guests/summary` — powers the three summary cards. Head counts
   * sum `groupSize`; `totalGroups` counts guest rows.
   */
  summary(weddingId: string, opts: Opts = {}) {
    return request<GuestSummary>('GET', `${base(weddingId)}/summary`, opts);
  },

  /**
   * 5.3 `POST .../guests` — OWNER, CO_OWNER or FAMILY_MEMBER. Omit `eventIds`
   * to treat the guest as invited to every event.
   */
  create(weddingId: string, payload: CreateGuestPayload, opts: Opts = {}) {
    return request<Guest>('POST', base(weddingId), { body: payload, ...opts });
  },

  /**
   * 5.4 `POST .../guests/bulk-import` — multipart CSV/XLSX, max 5 MB.
   * Expected columns: name, groupSize, phone, side, gathering. Rows that fail
   * validation are reported in `failures` rather than aborting the import;
   * the call only fails (422) when *no* row is valid.
   */
  bulkImport(weddingId: string, file: UploadFile, opts: Opts = {}) {
    const formData = new FormData();
    // RN's FormData accepts this file descriptor shape, which the DOM lib's
    // types don't model — hence the cast.
    formData.append('file', file as unknown as Blob);

    return request<BulkImportResult>('POST', `${base(weddingId)}/bulk-import`, {
      formData,
      timeoutMs: UPLOAD_TIMEOUT_MS,
      ...opts,
    });
  },

  /** 5.5 `PATCH .../guests/:guestId` — OWNER, CO_OWNER or FAMILY_MEMBER. */
  update(
    weddingId: string,
    guestId: string,
    payload: UpdateGuestPayload,
    opts: Opts = {},
  ) {
    return request<Guest>('PATCH', `${base(weddingId)}/${guestId}`, {
      body: payload,
      ...opts,
    });
  },

  /** 5.6 `PATCH .../guests/:guestId/rsvp` — manual RSVP override. */
  setRsvp(
    weddingId: string,
    guestId: string,
    rsvpStatus: ApiRsvpStatus,
    opts: Opts = {},
  ) {
    return request<Guest>('PATCH', `${base(weddingId)}/${guestId}/rsvp`, {
      body: { rsvpStatus },
      ...opts,
    });
  },

  /** 5.7 `DELETE .../guests/:guestId` — soft delete, 204. */
  remove(weddingId: string, guestId: string, opts: Opts = {}) {
    return requestVoid('DELETE', `${base(weddingId)}/${guestId}`, opts);
  },

  /**
   * 5.8 `POST .../guests/:guestId/send-invite` — 202 Accepted.
   * Fails with RATE_LIMITED if an invite was sent in the last 24 hours; pass
   * `force: true` to override.
   *
   * Note: the backend only logs the invite link today (SMS/WhatsApp/email
   * delivery is not implemented), so nothing actually reaches the guest.
   */
  sendInvite(
    weddingId: string,
    guestId: string,
    payload: SendInvitePayload = {},
    opts: Opts = {},
  ) {
    return request<MessageResponse>(
      'POST',
      `${base(weddingId)}/${guestId}/send-invite`,
      { body: payload, ...opts },
    );
  },

  /** 5.9 `POST .../guests/bulk-send-invites` — OWNER or CO_OWNER. */
  bulkSendInvites(
    weddingId: string,
    payload: BulkSendInvitesPayload,
    opts: Opts = {},
  ) {
    return request<MessageResponse>(
      'POST',
      `${base(weddingId)}/bulk-send-invites`,
      { body: payload, ...opts },
    );
  },
};

/**
 * Public, unauthenticated RSVP endpoints. The `rsvpToken` in the URL *is* the
 * credential, so these never send a bearer token. Rate limited to 10/min.
 */
export const publicRsvpApi = {
  /** 5.10 `GET /public/rsvp/:rsvpToken`. */
  getInvite(rsvpToken: string, opts: Opts = {}) {
    return request<PublicInvite>(
      'GET',
      `/public/rsvp/${encodeURIComponent(rsvpToken)}`,
      { auth: false, ...opts },
    );
  },

  /**
   * 5.11 `POST /public/rsvp/:rsvpToken`. `attendingCount` must not exceed the
   * guest's group size (422 otherwise).
   */
  async submit(
    rsvpToken: string,
    payload: SubmitRsvpPayload,
    opts: Opts = {},
  ): Promise<MessageResponse> {
    const { data } = await requestWithMeta<MessageResponse>(
      'POST',
      `/public/rsvp/${encodeURIComponent(rsvpToken)}`,
      { body: payload, auth: false, ...opts },
    );
    return data ?? { message: 'RSVP recorded successfully.' };
  },
};
