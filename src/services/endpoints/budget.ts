/** Module 06 — Budget. 7 endpoints. */

import {
  request,
  requestList,
  requestVoid,
  requestWithMeta,
  type RequestOptions,
} from '../client';
import type {
  ApiBudgetCategory,
  BudgetItem,
  BudgetItemListQuery,
  BudgetSummary,
  CategoryOption,
  CreateBudgetItemPayload,
  Paginated,
  UpdateBudgetItemPayload,
} from '../apiTypes';

type Opts = Pick<RequestOptions, 'signal'>;

const base = (weddingId: string) => `/weddings/${weddingId}/budget`;

export const budgetApi = {
  /**
   * 6.1 `GET .../budget/summary` — totals plus a per-category breakdown.
   * `totalBudget`, `remaining` and `percentUsed` are null when the wedding has
   * no budget set.
   */
  summary(weddingId: string, opts: Opts = {}) {
    return request<BudgetSummary>('GET', `${base(weddingId)}/summary`, opts);
  },

  /** 6.2 `GET .../budget/items` — any member. */
  async listItems(
    weddingId: string,
    query: BudgetItemListQuery = {},
    opts: Opts = {},
  ): Promise<Paginated<BudgetItem>> {
    return requestList<BudgetItem>(`${base(weddingId)}/items`, {
      query,
      ...opts,
    });
  },

  /** 6.3 `GET .../budget/items/:itemId` — any member. */
  getItem(weddingId: string, itemId: string, opts: Opts = {}) {
    return request<BudgetItem>('GET', `${base(weddingId)}/items/${itemId}`, opts);
  },

  /**
   * 6.4 `POST .../budget/items` — OWNER or CO_OWNER. `customCategory` is
   * required when `category` is 'OTHER'; `expenseDate` cannot be more than a
   * year in the future.
   */
  createItem(
    weddingId: string,
    payload: CreateBudgetItemPayload,
    opts: Opts = {},
  ) {
    return request<BudgetItem>('POST', `${base(weddingId)}/items`, {
      body: payload,
      ...opts,
    });
  },

  /**
   * 6.5 `PATCH .../budget/items/:itemId` — OWNER or CO_OWNER. Changing the
   * amount of an item auto-created from a vendor payment fails with 422
   * LINKED_TO_VENDOR_PAYMENT; edit it through the vendor instead.
   */
  updateItem(
    weddingId: string,
    itemId: string,
    payload: UpdateBudgetItemPayload,
    opts: Opts = {},
  ) {
    return request<BudgetItem>('PATCH', `${base(weddingId)}/items/${itemId}`, {
      body: payload,
      ...opts,
    });
  },

  /**
   * 6.6 `DELETE .../budget/items/:itemId` — OWNER or CO_OWNER. Also fails with
   * 422 LINKED_TO_VENDOR_PAYMENT for vendor-synced items. 204 on success.
   */
  removeItem(weddingId: string, itemId: string, opts: Opts = {}) {
    return requestVoid('DELETE', `${base(weddingId)}/items/${itemId}`, opts);
  },

  /** 6.7 `GET /budget/categories` — static list, any authenticated user. */
  async categories(opts: Opts = {}) {
    const { data } = await requestWithMeta<CategoryOption<ApiBudgetCategory>[]>(
      'GET',
      '/budget/categories',
      opts,
    );
    return Array.isArray(data) ? data : [];
  },
};
