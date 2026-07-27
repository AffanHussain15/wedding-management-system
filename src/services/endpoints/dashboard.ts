/** Module 08 — Dashboard. 1 endpoint. */

import { request, type RequestOptions } from '../client';
import type { DashboardSummary } from '../apiTypes';

type Opts = Pick<RequestOptions, 'signal'>;

export const dashboardApi = {
  /**
   * 8.1 `GET .../dashboard` — any member. Server-side cached for 60s and
   * invalidated on any write, so a value here can lag a mutation by up to a
   * second; refetch after mutating if the number must be exact.
   */
  get(weddingId: string, opts: Opts = {}) {
    return request<DashboardSummary>(
      'GET',
      `/weddings/${weddingId}/dashboard`,
      opts,
    );
  },
};
