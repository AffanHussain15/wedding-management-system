/** Domain models. Unions are derived from the option lists in `@constants`. */

import type {
  VENDOR_CATEGORIES,
  PAYMENT_STATUSES,
  RSVP_STATUSES,
  GUEST_GROUPS,
  GUEST_SIDES,
  FUNCTION_NAMES,
  FUNCTION_STATUSES,
  REMINDER_TYPES,
  EXPENSE_TYPES,
} from '@constants';

export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type RsvpStatus = (typeof RSVP_STATUSES)[number];
export type GuestGroup = (typeof GUEST_GROUPS)[number];
export type GuestSide = (typeof GUEST_SIDES)[number];
export type FunctionName = (typeof FUNCTION_NAMES)[number];
export type FunctionStatus = (typeof FUNCTION_STATUSES)[number];
export type ReminderType = (typeof REMINDER_TYPES)[number];
export type ExpenseType = (typeof EXPENSE_TYPES)[number];

export type ID = number;

export interface Vendor {
  id: ID;
  name: string;
  category: VendorCategory;
  phone: string;
  /** Total agreed cost (PKR). */
  cost: number;
  /** Amount already paid (PKR). */
  advance: number;
  /** Derived from cost/advance on create/edit. */
  status: PaymentStatus;
  /** 0–5; 0 means unrated. */
  rating: number;
}

export interface Guest {
  id: ID;
  name: string;
  phone: string;
  side: GuestSide;
  group: GuestGroup;
  rsvp: RsvpStatus;
}

export interface BudgetCategory {
  name: string;
  allotted: number;
  spent: number;
}

/** A seating table/section with the guests assigned to it. */
export interface SeatingTable {
  id: ID;
  name: string;
  guestIds: ID[];
}

export interface WeddingFunction {
  id: ID;
  name: FunctionName;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  time: string;
  venue: string;
  status: FunctionStatus;
}

export interface Task {
  id: ID;
  title: string;
  owner: string;
  function: FunctionName;
  done: boolean;
}

export interface Reminder {
  id: ID;
  type: ReminderType;
  text: string;
  /** Human-readable relative date, e.g. "in 5 days". */
  date: string;
}

/** Couple/event details captured during the setup wizard. */
export interface WeddingDetails {
  bride: string;
  groom: string;
  /** ISO date (YYYY-MM-DD). */
  weddingDate: string;
  city: string;
  venue: string;
  functionsSelected: Record<FunctionName, boolean>;
}

export interface VendorInput {
  name: string;
  category: VendorCategory;
  phone: string;
  cost: number;
  advance: number;
}

export interface GuestInput {
  name: string;
  phone: string;
  side: GuestSide;
  group: GuestGroup;
}

export interface TaskInput {
  title: string;
  owner: string;
  function: FunctionName;
}
