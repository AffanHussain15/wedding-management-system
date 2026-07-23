/**
 * Global domain state and the reducer's action union. UI-only concerns
 * (active tab, filters, search text) live in component state, not here.
 */

import type {
  Vendor,
  Guest,
  BudgetCategory,
  WeddingFunction,
  Task,
  Reminder,
  SeatingTable,
  WeddingDetails,
  RsvpStatus,
  FunctionName,
  ID,
} from '@types';

export interface WeddingState {
  wedding: WeddingDetails;
  vendors: Vendor[];
  guests: Guest[];
  budget: BudgetCategory[];
  functions: WeddingFunction[];
  tasks: Task[];
  reminders: Reminder[];
  tables: SeatingTable[];
}

export type WeddingAction =
  | { type: 'ADD_VENDOR'; vendor: Vendor }
  | { type: 'UPDATE_VENDOR'; id: ID; changes: Partial<Vendor> }
  | { type: 'REMOVE_VENDOR'; id: ID }
  | { type: 'ADD_GUEST'; guest: Guest }
  | { type: 'SET_GUEST_RSVP'; id: ID; rsvp: RsvpStatus }
  | { type: 'CYCLE_GUEST_GROUP'; id: ID }
  | { type: 'REMOVE_GUEST'; id: ID }
  | { type: 'ADD_EXPENSE'; category: string; amount: number }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'TOGGLE_TASK'; id: ID }
  | { type: 'TOGGLE_FUNCTION_SELECTED'; name: FunctionName }
  | { type: 'UPDATE_WEDDING'; changes: Partial<WeddingDetails> }
  | { type: 'ADD_TABLE'; table: SeatingTable }
  | { type: 'REMOVE_TABLE'; id: ID }
  | { type: 'RENAME_TABLE'; id: ID; name: string }
  | { type: 'ASSIGN_GUEST'; tableId: ID; guestId: ID }
  | { type: 'UNASSIGN_GUEST'; guestId: ID }
  | { type: 'RESET' };
