/**
 * Translation between the API's wire types and the app's view models.
 *
 * All enum⇄label conversion lives here so no screen ever hard-codes a
 * SCREAMING_CASE server value. Every `*ToApi` function is the exact inverse of
 * its `*FromApi` counterpart.
 *
 * Where the two models genuinely diverge, the behaviour is:
 *  - `Vendor.rating` — no backend column; always 0.
 *  - per-category budget targets — the backend stores only one wedding-level
 *    `totalBudget`, so only spend is per-category.
 *  - `WeddingDetails.bride`/`groom` — split from the single `Wedding.name` on
 *    " & " and rejoined on write.
 *  - `WeddingDetails.venue` — no wedding-level venue column; taken from the
 *    earliest event.
 *  - `Task.owner` — the API stores a user id, so a member list is needed to
 *    resolve a display name.
 */

import {
  BUDGET_CATEGORIES,
  PAYMENT_METHODS,
  TASK_PRIORITIES,
  VENDOR_CATEGORIES,
} from '@constants';
import type {
  BudgetCategory,
  BudgetCategoryName,
  BudgetOverview,
  Expense,
  Guest,
  GuestGroup,
  GuestSide,
  FunctionStatus,
  Member,
  PaymentMethodLabel,
  PaymentStatus,
  RsvpStatus,
  Task,
  TaskPriorityLabel,
  Vendor,
  VendorCategory,
  WeddingDetails,
  WeddingFunction,
} from '@types';

import {
  toDateOnly,
  toNullableNumber,
  toNumber,
  type ApiBudgetCategory,
  type ApiGuestSide,
  type ApiRsvpStatus,
  type ApiVendorCategory,
  type BudgetItem,
  type BudgetSummary,
  type ComputedEventStatus,
  type EventListItem,
  type GatheringType,
  type GuestListItem,
  type PaymentMethod,
  type TaskListItem,
  type TaskPriority,
  type VendorListItem,
  type VendorPaymentStatus,
  type WeddingDetail,
  type WeddingMember,
} from './apiTypes';

// ---------------------------------------------------------------------------
// Enum ⇄ label tables
// ---------------------------------------------------------------------------

/**
 * Builds a reverse lookup from a value→label record. Falls back to the given
 * default for unknown input, so a new server enum value can never crash a
 * screen — it just renders as the fallback.
 */
function invert<V extends string, L extends string>(
  forward: Record<V, L>,
): (label: string, fallback: V) => V {
  const reverse = new Map<string, V>();
  for (const [value, label] of Object.entries(forward) as [V, L][]) {
    reverse.set(label, value);
  }
  return (label, fallback) => reverse.get(label) ?? fallback;
}

const VENDOR_CATEGORY_LABELS: Record<ApiVendorCategory, VendorCategory> = {
  CATERING: 'Catering',
  PHOTOGRAPHY: 'Photography',
  DECORATION: 'Decoration',
  SALON: 'Salon',
  TRANSPORT: 'Transport',
  BAND_DJ: 'Band / DJ',
  VENUE: 'Venue',
  DRESS_DESIGNER: 'Dress Designer',
  JEWELLERY: 'Jewellery',
  INVITATION_CARDS: 'Invitation Cards',
  OTHER: 'Other',
};
const vendorCategoryFromLabel = invert(VENDOR_CATEGORY_LABELS);

const BUDGET_CATEGORY_LABELS: Record<ApiBudgetCategory, BudgetCategoryName> = {
  CATERING: 'Catering',
  DECORATION: 'Decoration',
  DRESSES: 'Dresses',
  JEWELLERY: 'Jewellery',
  PHOTOGRAPHY: 'Photography',
  VENUE: 'Venue',
  TRANSPORT: 'Transport',
  INVITATION_CARDS: 'Invitation Cards',
  SALON_MAKEUP: 'Salon & Makeup',
  GIFTS: 'Gifts',
  MISCELLANEOUS: 'Miscellaneous',
  OTHER: 'Other',
};
const budgetCategoryFromLabel = invert(BUDGET_CATEGORY_LABELS);

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, PaymentMethodLabel> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CARD: 'Card',
  OTHER: 'Other',
};
const paymentMethodFromLabel = invert(PAYMENT_METHOD_LABELS);

const PAYMENT_STATUS_LABELS: Record<VendorPaymentStatus, PaymentStatus> = {
  PENDING: 'Pending',
  ADVANCE: 'Advance',
  PAID: 'Paid',
};
const paymentStatusFromLabel = invert(PAYMENT_STATUS_LABELS);

const RSVP_LABELS: Record<ApiRsvpStatus, RsvpStatus> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  DECLINED: 'Not Coming',
};
const rsvpFromLabel = invert(RSVP_LABELS);

const GUEST_SIDE_LABELS: Record<ApiGuestSide, GuestSide> = {
  BRIDE: 'Bride',
  GROOM: 'Groom',
  BOTH: 'Both',
};
const guestSideFromLabel = invert(GUEST_SIDE_LABELS);

const GATHERING_LABELS: Record<GatheringType, GuestGroup> = {
  MARDANA: 'Mardana',
  ZANANA: 'Zanana',
  MIXED: 'Mixed',
};
const gatheringFromLabel = invert(GATHERING_LABELS);

const TASK_PRIORITY_LABELS: Record<TaskPriority, TaskPriorityLabel> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};
const taskPriorityFromLabel = invert(TASK_PRIORITY_LABELS);

/**
 * `UPCOMING` becomes 'upcoming' and the single nearest event's `NEXT` becomes
 * 'next', so the timeline can highlight exactly one function.
 */
const EVENT_STATUS_LABELS: Record<ComputedEventStatus, FunctionStatus> = {
  DONE: 'done',
  NEXT: 'next',
  UPCOMING: 'upcoming',
  POSTPONED: 'postponed',
  CANCELLED: 'cancelled',
};

// --- Exported converters ---------------------------------------------------

export const vendorCategoryToApi = (label: VendorCategory): ApiVendorCategory =>
  vendorCategoryFromLabel(label, 'OTHER');
export const vendorCategoryToLabel = (value: ApiVendorCategory): VendorCategory =>
  VENDOR_CATEGORY_LABELS[value] ?? 'Other';

export const budgetCategoryToApi = (label: BudgetCategoryName): ApiBudgetCategory =>
  budgetCategoryFromLabel(label, 'OTHER');
export const budgetCategoryToLabel = (value: string): BudgetCategoryName =>
  BUDGET_CATEGORY_LABELS[value as ApiBudgetCategory] ?? 'Other';

export const paymentMethodToApi = (label: PaymentMethodLabel): PaymentMethod =>
  paymentMethodFromLabel(label, 'OTHER');
export const paymentMethodToLabel = (value: PaymentMethod): PaymentMethodLabel =>
  PAYMENT_METHOD_LABELS[value] ?? 'Other';

export const paymentStatusToApi = (label: PaymentStatus): VendorPaymentStatus =>
  paymentStatusFromLabel(label, 'PENDING');
export const paymentStatusToLabel = (value: VendorPaymentStatus): PaymentStatus =>
  PAYMENT_STATUS_LABELS[value] ?? 'Pending';

export const rsvpToApi = (label: RsvpStatus): ApiRsvpStatus =>
  rsvpFromLabel(label, 'PENDING');
export const rsvpToLabel = (value: ApiRsvpStatus): RsvpStatus =>
  RSVP_LABELS[value] ?? 'Pending';

export const guestSideToApi = (label: GuestSide): ApiGuestSide =>
  guestSideFromLabel(label, 'BOTH');
export const guestSideToLabel = (value: ApiGuestSide): GuestSide =>
  GUEST_SIDE_LABELS[value] ?? 'Both';

export const gatheringToApi = (label: GuestGroup): GatheringType =>
  gatheringFromLabel(label, 'MIXED');
export const gatheringToLabel = (value: GatheringType): GuestGroup =>
  GATHERING_LABELS[value] ?? 'Mixed';

export const taskPriorityToApi = (label: TaskPriorityLabel): TaskPriority =>
  taskPriorityFromLabel(label, 'MEDIUM');
export const taskPriorityToLabel = (value: TaskPriority): TaskPriorityLabel =>
  TASK_PRIORITY_LABELS[value] ?? 'Medium';

/** All vendor category labels, for pickers. */
export const vendorCategoryOptions = VENDOR_CATEGORIES;
/** All budget category labels, for pickers. */
export const budgetCategoryOptions = BUDGET_CATEGORIES;
/** All payment method labels, for pickers. */
export const paymentMethodOptions = PAYMENT_METHODS;
/** All task priority labels, for pickers. */
export const taskPriorityOptions = TASK_PRIORITIES;

// ---------------------------------------------------------------------------
// Record mappers
// ---------------------------------------------------------------------------

export function vendorFromApi(row: VendorListItem): Vendor {
  return {
    id: row.id,
    name: row.name,
    category: vendorCategoryToLabel(row.category),
    phone: row.phone ?? '',
    cost: toNumber(row.totalPrice),
    advance: toNumber(row.totalPaid),
    status: paymentStatusToLabel(row.status),
    eventId: row.eventId,
    // No rating column exists server-side.
    rating: 0,
  };
}

export function guestFromApi(row: GuestListItem): Guest {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? '',
    side: guestSideToLabel(row.side),
    group: gatheringToLabel(row.gathering),
    rsvp: rsvpToLabel(row.rsvpStatus),
    groupSize: row.groupSize,
    tableNumber: row.tableNumber,
  };
}

export function functionFromApi(row: EventListItem): WeddingFunction {
  return {
    id: row.id,
    name: row.name,
    date: toDateOnly(row.eventDate),
    // The list endpoint omits startTime; the detail endpoint has it.
    time: '',
    venue: row.venueName ?? '',
    status: EVENT_STATUS_LABELS[row.computedStatus] ?? 'upcoming',
  };
}

/**
 * Maps a task, resolving `assignedTo` to a display name via the wedding's
 * member list. `eventNames` maps event id → name for the function label.
 */
export function taskFromApi(
  row: TaskListItem,
  memberNames: Map<string, string>,
  eventNames: Map<string, string>,
): Task {
  const owner = row.assignedTo
    ? (memberNames.get(row.assignedTo) ??
      // Assignee has left the wedding; the assignment is kept as history.
      (row.assigneeIsActiveMember === false ? 'Former member' : 'Unknown member'))
    : 'Unassigned';

  return {
    id: row.id,
    title: row.title,
    owner,
    assignedTo: row.assignedTo,
    assigneeIsActiveMember: row.assigneeIsActiveMember,
    function: row.eventId ? (eventNames.get(row.eventId) ?? '') : '',
    eventId: row.eventId,
    priority: taskPriorityToLabel(row.priority),
    dueDate: toDateOnly(row.dueDate),
    done: row.status === 'DONE',
  };
}

export function expenseFromApi(row: BudgetItem): Expense {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    // A custom label is only present when category is OTHER.
    categoryName: row.customCategory ?? budgetCategoryToLabel(row.category),
    amount: toNumber(row.amount),
    date: toDateOnly(row.expenseDate),
    method: paymentMethodToLabel(row.paymentMethod),
    notes: row.notes,
    fromVendorPayment: row.vendorId !== null,
  };
}

export function budgetCategoriesFromApi(summary: BudgetSummary): BudgetCategory[] {
  const rows = Array.isArray(summary.byCategory) ? summary.byCategory : [];
  return rows
    .map(row => ({
      key: row.category,
      name: budgetCategoryToLabel(row.category),
      spent: toNumber(row.amount),
    }))
    // Largest spend first, so the chart legend reads top-down.
    .sort((a, b) => b.spent - a.spent);
}

export function budgetOverviewFromApi(summary: BudgetSummary): BudgetOverview {
  return {
    totalBudget: toNullableNumber(summary.totalBudget),
    totalSpent: toNumber(summary.totalSpent),
    remaining: toNullableNumber(summary.remaining),
    percentUsed: toNullableNumber(summary.percentUsed),
  };
}

export function memberFromApi(row: WeddingMember): Member {
  return {
    userId: row.userId,
    fullName: row.fullName,
    email: row.email,
    role: row.role,
    joinedAt: toDateOnly(row.joinedAt),
  };
}

// --- Couple name ⇄ Wedding.name -------------------------------------------

const COUPLE_SEPARATOR = ' & ';

/**
 * Separators to split a stored name on. The app writes " & ", but a wedding
 * created elsewhere — Postman, a seed, an earlier build — may use "&" without
 * spaces, "and", "aur" or "+". Reading only " & " silently dropped the groom
 * from those, so the Dulha's name never reached the screens.
 */
const COUPLE_SEPARATORS = /\s*(?:&|\+|\band\b|\baur\b)\s*/i;

/** "Ayesha & Danyal" → { bride: 'Ayesha', groom: 'Danyal' }. */
export function splitCoupleName(name: string): { bride: string; groom: string } {
  const trimmed = name.trim();
  const match = COUPLE_SEPARATORS.exec(trimmed);
  if (!match) return { bride: trimmed, groom: '' };
  return {
    bride: trimmed.slice(0, match.index).trim(),
    groom: trimmed.slice(match.index + match[0].length).trim(),
  };
}

/** { bride, groom } → "Ayesha & Danyal", tolerating either side being blank. */
export function joinCoupleName(bride: string, groom: string): string {
  const left = bride.trim();
  const right = groom.trim();
  if (left && right) return `${left}${COUPLE_SEPARATOR}${right}`;
  return left || right;
}

/**
 * Maps the wedding record. `venue` has no wedding-level column, so the caller
 * passes the earliest event's venue when one is known.
 */
export function weddingFromApi(
  wedding: WeddingDetail,
  venue = '',
): WeddingDetails {
  const { bride, groom } = splitCoupleName(wedding.name);
  return {
    id: wedding.id,
    bride,
    groom,
    weddingDate: toDateOnly(wedding.weddingDate),
    city: wedding.venueCity ?? '',
    venue,
    totalBudget: toNullableNumber(wedding.totalBudget),
    estimatedGuests: wedding.estimatedGuests,
    role: wedding.role,
  };
}

/** Roles allowed to create/edit/delete most records. */
export function canEdit(role: WeddingDetails['role']): boolean {
  return role === 'OWNER' || role === 'CO_OWNER';
}

/** Roles allowed to add guests, tasks and events (VIEWER cannot). */
export function canContribute(role: WeddingDetails['role']): boolean {
  return role === 'OWNER' || role === 'CO_OWNER' || role === 'FAMILY_MEMBER';
}
