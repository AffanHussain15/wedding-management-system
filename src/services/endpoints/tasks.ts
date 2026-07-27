/** Module 07 — Tasks. 4 endpoints. */

import { request, requestList, requestVoid, type RequestOptions } from '../client';
import type {
  CreateTaskPayload,
  Paginated,
  Task,
  TaskListItem,
  TaskListQuery,
  UpdateTaskPayload,
} from '../apiTypes';

type Opts = Pick<RequestOptions, 'signal'>;

const base = (weddingId: string) => `/weddings/${weddingId}/tasks`;

export const tasksApi = {
  /**
   * 7.6 `GET .../tasks` — any member. Each row carries
   * `assigneeIsActiveMember`: false means the assignee has left the wedding
   * (the assignment is kept as history), null means unassigned.
   */
  async list(
    weddingId: string,
    query: TaskListQuery = {},
    opts: Opts = {},
  ): Promise<Paginated<TaskListItem>> {
    return requestList<TaskListItem>(base(weddingId), { query, ...opts });
  },

  /**
   * 7.7 `POST .../tasks` — OWNER, CO_OWNER or FAMILY_MEMBER. `assignedTo` must
   * be a current member of this wedding.
   */
  create(weddingId: string, payload: CreateTaskPayload, opts: Opts = {}) {
    return request<Task>('POST', base(weddingId), { body: payload, ...opts });
  },

  /**
   * 7.8 `PATCH .../tasks/:taskId`. OWNER/CO_OWNER may change any field. A
   * FAMILY_MEMBER may only send `status`, and only for a task assigned to
   * themselves — anything else is a 403. Use `setStatus` for that case so no
   * extra keys slip into the body.
   */
  update(
    weddingId: string,
    taskId: string,
    payload: UpdateTaskPayload,
    opts: Opts = {},
  ) {
    return request<Task>('PATCH', `${base(weddingId)}/${taskId}`, {
      body: payload,
      ...opts,
    });
  },

  /** Status-only update — the sole edit a non-privileged member may perform. */
  setStatus(
    weddingId: string,
    taskId: string,
    status: NonNullable<UpdateTaskPayload['status']>,
    opts: Opts = {},
  ) {
    return request<Task>('PATCH', `${base(weddingId)}/${taskId}`, {
      body: { status },
      ...opts,
    });
  },

  /** 7.9 `DELETE .../tasks/:taskId` — OWNER or CO_OWNER. Soft delete, 204. */
  remove(weddingId: string, taskId: string, opts: Opts = {}) {
    return requestVoid('DELETE', `${base(weddingId)}/${taskId}`, opts);
  },
};
