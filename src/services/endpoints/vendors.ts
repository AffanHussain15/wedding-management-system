/** Module 04 — Vendors and vendor payments. 8 endpoints. */

import {
  request,
  requestList,
  requestVoid,
  requestWithMeta,
  type RequestOptions,
} from '../client';
import type {
  ApiVendorCategory,
  CategoryOption,
  CreateVendorPayload,
  Paginated,
  RecordPaymentPayload,
  RecordPaymentResult,
  UpdateVendorPayload,
  Vendor,
  VendorDetail,
  VendorListItem,
  VendorListQuery,
  VendorSummaryAfterPayment,
} from '../apiTypes';

type Opts = Pick<RequestOptions, 'signal'>;

const base = (weddingId: string) => `/weddings/${weddingId}/vendors`;

export const vendorsApi = {
  /**
   * 4.1 `GET .../vendors` — any member. `status` filters on the derived
   * PENDING/ADVANCE/PAID value, which the backend computes after aggregating
   * payments.
   */
  async list(
    weddingId: string,
    query: VendorListQuery = {},
    opts: Opts = {},
  ): Promise<Paginated<VendorListItem>> {
    return requestList<VendorListItem>(base(weddingId), { query, ...opts });
  },

  /** 4.2 `GET .../vendors/:vendorId` — includes payment history. */
  get(weddingId: string, vendorId: string, opts: Opts = {}) {
    return request<VendorDetail>('GET', `${base(weddingId)}/${vendorId}`, opts);
  },

  /**
   * 4.3 `POST .../vendors` — OWNER or CO_OWNER. `customCategory` is required
   * when `category` is 'OTHER'.
   */
  create(weddingId: string, payload: CreateVendorPayload, opts: Opts = {}) {
    return request<Vendor>('POST', base(weddingId), { body: payload, ...opts });
  },

  /** 4.4 `PATCH .../vendors/:vendorId` — OWNER or CO_OWNER. */
  update(
    weddingId: string,
    vendorId: string,
    payload: UpdateVendorPayload,
    opts: Opts = {},
  ) {
    return request<Vendor>('PATCH', `${base(weddingId)}/${vendorId}`, {
      body: payload,
      ...opts,
    });
  },

  /** 4.5 `DELETE .../vendors/:vendorId` — OWNER or CO_OWNER. Soft delete, 204. */
  remove(weddingId: string, vendorId: string, opts: Opts = {}) {
    return requestVoid('DELETE', `${base(weddingId)}/${vendorId}`, opts);
  },

  /**
   * 4.6 `POST .../vendors/:vendorId/payments` — OWNER or CO_OWNER.
   *
   * Also creates a matching budget item in the same transaction, so the Budget
   * screen updates too. Overpayment is allowed but returns a `warning`. The
   * backend puts `warning` and `vendorSummary` in `meta`; both are folded back
   * into the result here.
   */
  async recordPayment(
    weddingId: string,
    vendorId: string,
    payload: RecordPaymentPayload,
    opts: Opts = {},
  ): Promise<RecordPaymentResult> {
    const { data, meta } = await requestWithMeta<
      RecordPaymentResult['payment']
    >('POST', `${base(weddingId)}/${vendorId}/payments`, {
      body: payload,
      ...opts,
    });
    return {
      payment: data,
      warning: typeof meta.warning === 'string' ? meta.warning : null,
      vendorSummary:
        (meta.vendorSummary as VendorSummaryAfterPayment | undefined) ?? null,
    };
  },

  /**
   * 4.7 `DELETE .../vendors/:vendorId/payments/:paymentId` — OWNER or
   * CO_OWNER. Cascades the linked budget item's deletion. 204.
   */
  removePayment(
    weddingId: string,
    vendorId: string,
    paymentId: string,
    opts: Opts = {},
  ) {
    return requestVoid(
      'DELETE',
      `${base(weddingId)}/${vendorId}/payments/${paymentId}`,
      opts,
    );
  },

  /** 4.8 `GET /vendors/categories` — static list, any authenticated user. */
  async categories(opts: Opts = {}) {
    const { data } = await requestWithMeta<CategoryOption<ApiVendorCategory>[]>(
      'GET',
      '/vendors/categories',
      opts,
    );
    return Array.isArray(data) ? data : [];
  },
};
