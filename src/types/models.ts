/**
 * Domain models — the app's *view* models, mapped from the API's wire types by
 * `services/mappers.ts`. Unions are derived from the option lists in
 * `@constants`.
 *
 * Ids are the server's UUID strings. Records with no backend counterpart
 * (seating tables, reminders) use a `local-` prefixed id.
 */

import type {
  VENDOR_CATEGORIES,
  BUDGET_CATEGORIES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  RSVP_STATUSES,
  GUEST_GROUPS,
  GUEST_SIDES,
  FUNCTION_NAMES,
  FUNCTION_STATUSES,
  REMINDER_TYPES,
  TASK_PRIORITIES,
} from '@constants';

export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];
export type BudgetCategoryName = (typeof BUDGET_CATEGORIES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentMethodLabel = (typeof PAYMENT_METHODS)[number];
export type RsvpStatus = (typeof RSVP_STATUSES)[number];
export type GuestGroup = (typeof GUEST_GROUPS)[number];
export type GuestSide = (typeof GUEST_SIDES)[number];
export type FunctionStatus = (typeof FUNCTION_STATUSES)[number];
export type ReminderType = (typeof REMINDER_TYPES)[number];
export type TaskPriorityLabel = (typeof TASK_PRIORITIES)[number];

/** Suggested names offered by the setup wizard; event names are free text. */
export type SuggestedFunctionName = (typeof FUNCTION_NAMES)[number];

/** Mirrors the API's `WeddingRole`. */
export type WeddingRoleLabel = 'OWNER' | 'CO_OWNER' | 'FAMILY_MEMBER' | 'VIEWER';

/** Server UUID, or a `local-` id for records that exist only on the device. */
export type ID = string;

export interface Vendor {
  id: ID;
  name: string;
  category: VendorCategory;
  phone: string;
  /** Total agreed cost (PKR); 0 when the API has no price set. */
  cost: number;
  /** Sum of recorded payments (PKR) — the API's `totalPaid`. */
  advance: number;
  /** Derived server-side from payments vs cost. */
  status: PaymentStatus;
  /** Function this vendor is booked for, when linked. */
  eventId: ID | null;
  /**
   * Not stored by the backend — the schema has no vendor-rating column. Always
   * 0 for API-sourced vendors; retained so existing UI keeps compiling.
   */
  rating: number;
}

export interface Guest {
  id: ID;
  name: string;
  phone: string;
  side: GuestSide;
  group: GuestGroup;
  rsvp: RsvpStatus;
  /** People this entry covers (the API's `groupSize`). */
  groupSize: number;
  /** Free-text table label from the API, distinct from local seating tables. */
  tableNumber: string | null;
}

/**
 * Spend rolled up by category, from `GET .../budget/summary`.
 *
 * There is deliberately no `allotted` field: the backend stores a single
 * `Wedding.totalBudget` and no per-category allocation, so a per-category
 * target cannot be derived. Overall targets live in `BudgetOverview`.
 */
export interface BudgetCategory {
  /** API enum value, used as a stable key. */
  key: string;
  name: string;
  spent: number;
}

/** Totals from `GET .../budget/summary`; nulls mean "no budget set". */
export interface BudgetOverview {
  totalBudget: number | null;
  totalSpent: number;
  remaining: number | null;
  percentUsed: number | null;
}

/** A single expense row from `GET .../budget/items`. */
export interface Expense {
  id: ID;
  title: string;
  /** API enum value. */
  category: string;
  categoryName: string;
  amount: number;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  method: PaymentMethodLabel;
  notes: string | null;
  /** True for items auto-created from a vendor payment; these are read-only. */
  fromVendorPayment: boolean;
}

/** A seating table/section with the guests assigned to it. Local-only. */
export interface SeatingTable {
  id: ID;
  name: string;
  guestIds: ID[];
}

/** A wedding function — an API `Event`. */
export interface WeddingFunction {
  id: ID;
  /** Free text on the server, e.g. "Mehndi" or "Rasm-e-Henna". */
  name: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** "HH:mm", or '' when unset. */
  time: string;
  venue: string;
  status: FunctionStatus;
}

export interface Task {
  id: ID;
  title: string;
  /** Display name of the assignee, or 'Unassigned'. */
  owner: string;
  assignedTo: ID | null;
  /** False when the assignee has since left the wedding. */
  assigneeIsActiveMember: boolean | null;
  /** Name of the linked function, or '' when not tied to one. */
  function: string;
  eventId: ID | null;
  priority: TaskPriorityLabel;
  /** ISO date (YYYY-MM-DD), or '' when no due date. */
  dueDate: string;
  done: boolean;
}

/** Local-only: the backend has no notifications/reminders module yet. */
export interface Reminder {
  id: ID;
  type: ReminderType;
  text: string;
  /** Human-readable relative date, e.g. "in 5 days". */
  date: string;
}

/**
 * Couple/event details. The API stores a single `Wedding.name`; the app shows
 * the couple separately, so `bride`/`groom` are split from and joined back into
 * that field using " & " as the separator.
 */
export interface WeddingDetails {
  id: ID | null;
  bride: string;
  groom: string;
  /** ISO date (YYYY-MM-DD), or '' when unset. */
  weddingDate: string;
  city: string;
  /** Not a wedding-level API field — taken from the earliest event's venue. */
  venue: string;
  totalBudget: number | null;
  estimatedGuests: number | null;
  /** The caller's role in this wedding; gates write actions. */
  role: WeddingRoleLabel | null;
}

/** A member of the wedding workspace. */
export interface Member {
  userId: ID;
  fullName: string;
  email: string;
  role: WeddingRoleLabel;
  joinedAt: string;
}

export interface VendorInput {
  name: string;
  category: VendorCategory;
  phone: string;
  cost: number;
  /** Recorded as a first payment right after the vendor is created. */
  advance: number;
  eventId?: ID | null;
}

export interface GuestInput {
  name: string;
  phone: string;
  side: GuestSide;
  group: GuestGroup;
  groupSize?: number;
}

export interface TaskInput {
  title: string;
  eventId?: ID | null;
  assignedTo?: ID | null;
  priority?: TaskPriorityLabel;
  /** ISO date (YYYY-MM-DD). */
  dueDate?: string;
}

export interface ExpenseInput {
  category: BudgetCategoryName;
  title: string;
  amount: number;
  method?: PaymentMethodLabel;
  notes?: string;
}

export interface FunctionInput {
  name: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  time?: string;
  venue?: string;
}
