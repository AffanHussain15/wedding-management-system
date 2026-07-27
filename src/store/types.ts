/**
 * Global domain state and the reducer's action union.
 *
 * Everything except `tables` and `reminders` is a projection of server data —
 * the reducer only ever *stores* what the API returned, so it stays pure and
 * all network work lives in `WeddingContext`. UI-only concerns (active tab,
 * filters, search text) remain in component state.
 *
 * `tables` and `reminders` are local-only: the backend has no seating model and
 * no notifications module yet, so they never reach the server and are lost when
 * the app restarts.
 */

import type {
  BudgetCategory,
  BudgetOverview,
  Expense,
  Guest,
  ID,
  Member,
  Reminder,
  SeatingTable,
  Task,
  Vendor,
  WeddingDetails,
  WeddingFunction,
} from '@types';

export interface WeddingState {
  wedding: WeddingDetails;
  vendors: Vendor[];
  /** Spend per category, from the budget summary. */
  budget: BudgetCategory[];
  /** Wedding-level budget totals. */
  budgetOverview: BudgetOverview;
  /** Individual expense rows. */
  expenses: Expense[];
  guests: Guest[];
  functions: WeddingFunction[];
  tasks: Task[];
  members: Member[];
  /** Local-only. */
  reminders: Reminder[];
  /** Local-only. */
  tables: SeatingTable[];
}

/** Everything fetched in one load pass, applied atomically. */
export interface WeddingSnapshot {
  wedding: WeddingDetails;
  vendors: Vendor[];
  guests: Guest[];
  budget: BudgetCategory[];
  budgetOverview: BudgetOverview;
  expenses: Expense[];
  functions: WeddingFunction[];
  tasks: Task[];
  members: Member[];
}

export type WeddingAction =
  | { type: 'HYDRATE'; snapshot: WeddingSnapshot }
  | { type: 'SET_WEDDING'; wedding: WeddingDetails }
  | { type: 'SET_VENDORS'; vendors: Vendor[] }
  | { type: 'SET_GUESTS'; guests: Guest[] }
  | {
      type: 'SET_BUDGET';
      budget: BudgetCategory[];
      overview: BudgetOverview;
      expenses: Expense[];
    }
  | { type: 'SET_FUNCTIONS'; functions: WeddingFunction[] }
  | { type: 'SET_TASKS'; tasks: Task[] }
  | { type: 'SET_MEMBERS'; members: Member[] }
  // Local-only seating planner.
  | { type: 'ADD_TABLE'; table: SeatingTable }
  | { type: 'REMOVE_TABLE'; id: ID }
  | { type: 'RENAME_TABLE'; id: ID; name: string }
  | { type: 'ASSIGN_GUEST'; tableId: ID; guestId: ID }
  | { type: 'UNASSIGN_GUEST'; guestId: ID }
  | { type: 'RESET' };
