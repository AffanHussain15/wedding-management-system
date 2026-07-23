/**
 * App constants. The domain option lists are the single source of truth —
 * the string-literal unions in `@types` are derived from them.
 */

export const APP_NAME = 'Smart Wedding Manager';
export const CURRENCY_CODE = 'PKR';
export const CURRENCY_SYMBOL = 'Rs';

export const VENDOR_CATEGORIES = [
  'Catering',
  'Decor',
  'Photography',
  'Bridal Makeup',
  'Mehndi Artist',
  'Sound & DJ',
  'Venue',
] as const;

export const PAYMENT_STATUSES = ['Paid', 'Advance', 'Pending'] as const;

export const RSVP_STATUSES = ['Confirmed', 'Pending', 'Not Coming'] as const;

export const GUEST_GROUPS = ['Mardana', 'Zanana', 'Family'] as const;

export const GUEST_SIDES = ['Bride', 'Groom'] as const;

export const FUNCTION_NAMES = ['Dholki', 'Mayun', 'Mehndi', 'Baraat', 'Walima'] as const;

export const FUNCTION_STATUSES = ['done', 'upcoming', 'pending'] as const;

export const REMINDER_TYPES = ['payment', 'booking', 'task'] as const;

export const EXPENSE_TYPES = ['Advance', 'Balance', 'Full'] as const;

/** List-screen filters include the "All" sentinel. */
export const VENDOR_FILTERS = ['All', ...PAYMENT_STATUSES] as const;
export const GUEST_FILTERS = ['All', ...RSVP_STATUSES] as const;
export const TASK_FILTERS = ['All', 'Pending', 'Done'] as const;

/** Vendor categories typically involved in each function. */
export const FUNCTION_VENDOR_MAP: Record<
  (typeof FUNCTION_NAMES)[number],
  ReadonlyArray<(typeof VENDOR_CATEGORIES)[number]>
> = {
  Dholki: ['Sound & DJ', 'Decor'],
  Mayun: ['Bridal Makeup'],
  Mehndi: ['Mehndi Artist', 'Sound & DJ', 'Decor'],
  Baraat: ['Venue', 'Photography', 'Sound & DJ'],
  Walima: ['Catering', 'Venue', 'Photography'],
};
