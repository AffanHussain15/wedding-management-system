/**
 * App constants. The domain option lists are the single source of truth —
 * the string-literal unions in `@types` are derived from them.
 *
 * The vendor, budget, guest and payment-method lists are the human-readable
 * labels for the backend's enums, kept in the same order and wording the API
 * uses for its `/vendors/categories` and `/budget/categories` reference
 * endpoints. `services/mappers.ts` converts between label and enum value.
 */

export const APP_NAME = 'Smart Wedding Manager';
export const CURRENCY_CODE = 'PKR';
export const CURRENCY_SYMBOL = 'Rs';

/** Labels for the API's `VendorCategory` enum, in API order. */
export const VENDOR_CATEGORIES = [
  'Catering',
  'Photography',
  'Decoration',
  'Salon',
  'Transport',
  'Band / DJ',
  'Venue',
  'Dress Designer',
  'Jewellery',
  'Invitation Cards',
  'Other',
] as const;

/** Labels for the API's `BudgetCategory` enum, in API order. */
export const BUDGET_CATEGORIES = [
  'Catering',
  'Decoration',
  'Dresses',
  'Jewellery',
  'Photography',
  'Venue',
  'Transport',
  'Invitation Cards',
  'Salon & Makeup',
  'Gifts',
  'Miscellaneous',
  'Other',
] as const;

export const PAYMENT_STATUSES = ['Paid', 'Advance', 'Pending'] as const;

export const RSVP_STATUSES = ['Confirmed', 'Pending', 'Not Coming'] as const;

/** Labels for the API's `GatheringType` enum. */
export const GUEST_GROUPS = ['Mardana', 'Zanana', 'Mixed'] as const;

/** Labels for the API's `GuestSide` enum — 'Both' is the API default. */
export const GUEST_SIDES = ['Bride', 'Groom', 'Both'] as const;

/** Labels for the API's `PaymentMethod` enum. */
export const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Card', 'Other'] as const;

/** Labels for the API's `TaskPriority` enum. */
export const TASK_PRIORITIES = ['Low', 'Medium', 'High'] as const;

/**
 * Suggested function names for the setup wizard. Events are free-text on the
 * server, so this is a starting list rather than a closed set.
 */
export const FUNCTION_NAMES = ['Dholki', 'Mayun', 'Mehndi', 'Baraat', 'Walima'] as const;

/**
 * Derived from the API's `computedStatus`. 'next' marks the single nearest
 * upcoming function; 'upcoming' is every other future one.
 */
export const FUNCTION_STATUSES = ['done', 'next', 'upcoming', 'postponed', 'cancelled'] as const;

/** Local-only reminder categories — the backend has no reminders module yet. */
export const REMINDER_TYPES = ['payment', 'booking', 'task'] as const;

/** List-screen filters include the "All" sentinel. */
export const VENDOR_FILTERS = ['All', ...PAYMENT_STATUSES] as const;
export const GUEST_FILTERS = ['All', ...RSVP_STATUSES] as const;
export const TASK_FILTERS = ['All', 'Pending', 'Done'] as const;

/**
 * Vendor categories typically involved in each function — a hint for the setup
 * wizard only. Real function↔vendor links come from the API's `eventId`.
 */
export const FUNCTION_VENDOR_MAP: Record<
  (typeof FUNCTION_NAMES)[number],
  ReadonlyArray<(typeof VENDOR_CATEGORIES)[number]>
> = {
  Dholki: ['Band / DJ', 'Decoration'],
  Mayun: ['Salon'],
  Mehndi: ['Salon', 'Band / DJ', 'Decoration'],
  Baraat: ['Venue', 'Photography', 'Band / DJ'],
  Walima: ['Catering', 'Venue', 'Photography'],
};

/** Page size for list screens; the API caps `limit` at 100. */
export const PAGE_SIZE = 100;
