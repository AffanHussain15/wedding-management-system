/** Module 07 — Event timeline. 5 endpoints. */

import { request, requestList, requestVoid, type RequestOptions } from '../client';
import type {
  CreateEventPayload,
  Event,
  EventDetail,
  EventListItem,
  EventListQuery,
  Paginated,
  UpdateEventPayload,
} from '../apiTypes';

type Opts = Pick<RequestOptions, 'signal'>;

const base = (weddingId: string) => `/weddings/${weddingId}/events`;

export const eventsApi = {
  /**
   * 7.1 `GET .../events` — any member. Defaults to 50 per page sorted by date
   * ascending. Exactly one event carries `computedStatus: 'NEXT'` (the nearest
   * upcoming one with no manual override).
   */
  async list(
    weddingId: string,
    query: EventListQuery = {},
    opts: Opts = {},
  ): Promise<Paginated<EventListItem>> {
    return requestList<EventListItem>(base(weddingId), { query, ...opts });
  },

  /** 7.2 `GET .../events/:eventId` — adds linked vendor/guest/task counts. */
  get(weddingId: string, eventId: string, opts: Opts = {}) {
    return request<EventDetail>('GET', `${base(weddingId)}/${eventId}`, opts);
  },

  /**
   * 7.3 `POST .../events` — OWNER, CO_OWNER or FAMILY_MEMBER (note that
   * create is more permissive than update/delete here). `startTime` is "HH:mm".
   */
  create(weddingId: string, payload: CreateEventPayload, opts: Opts = {}) {
    return request<Event>('POST', base(weddingId), { body: payload, ...opts });
  },

  /**
   * 7.4 `PATCH .../events/:eventId` — OWNER or CO_OWNER. Set `manualStatus` to
   * override the date-derived status (e.g. POSTPONED, CANCELLED).
   */
  update(
    weddingId: string,
    eventId: string,
    payload: UpdateEventPayload,
    opts: Opts = {},
  ) {
    return request<Event>('PATCH', `${base(weddingId)}/${eventId}`, {
      body: payload,
      ...opts,
    });
  },

  /**
   * 7.5 `DELETE .../events/:eventId` — OWNER or CO_OWNER. Soft-deletes and
   * unlinks vendors/tasks and drops guest-event invites. 204.
   */
  remove(weddingId: string, eventId: string, opts: Opts = {}) {
    return requestVoid('DELETE', `${base(weddingId)}/${eventId}`, opts);
  },
};
