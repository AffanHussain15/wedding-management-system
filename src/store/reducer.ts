/**
 * Pure reducer over `WeddingState`. Network calls, id generation and API
 * mapping all happen in `WeddingContext`, so this stays deterministic and
 * testable.
 */

import type { SeatingTable, WeddingDetails, WeddingFunction } from '@types';
import type { WeddingAction, WeddingState } from './types';

const emptyWedding: WeddingDetails = {
  id: null,
  bride: '',
  groom: '',
  weddingDate: '',
  city: '',
  venue: '',
  totalBudget: null,
  estimatedGuests: null,
  role: null,
};

export const initialState: WeddingState = {
  wedding: emptyWedding,
  vendors: [],
  budget: [],
  budgetOverview: {
    totalBudget: null,
    totalSpent: 0,
    remaining: null,
    percentUsed: null,
  },
  expenses: [],
  guests: [],
  functions: [],
  tasks: [],
  members: [],
  reminders: [],
  tables: [],
};

/**
 * Drops guests that no longer exist server-side from local seating tables, so
 * a refresh can't leave a table pointing at a deleted guest. Returns the same
 * array reference when nothing changed, to keep memoized rows from re-rendering.
 */
function pruneTables(tables: SeatingTable[], guestIds: Set<string>): SeatingTable[] {
  let changed = false;
  const next = tables.map(table => {
    const kept = table.guestIds.filter(id => guestIds.has(id));
    if (kept.length === table.guestIds.length) return table;
    changed = true;
    return { ...table, guestIds: kept };
  });
  return changed ? next : tables;
}

/**
 * Chronological order, soonest first, with undated functions last.
 *
 * Enforced here rather than trusting the server's `sortBy=eventDate` default:
 * the timeline renders this array positionally, and `selectNextFunction` used to
 * fall back to its first entry, so any caller that passed a different `sortBy`
 * — or any endpoint that stopped defaulting — would silently mis-order the
 * timeline and name the wrong "Upcoming" function. Dates are zero-padded
 * "YYYY-MM-DD", so a plain string compare sorts them correctly.
 */
function sortByDate(functions: WeddingFunction[]): WeddingFunction[] {
  return [...functions].sort((a, b) => {
    if (!a.date) return b.date ? 1 : 0;
    if (!b.date) return -1;
    return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
  });
}

export function weddingReducer(state: WeddingState, action: WeddingAction): WeddingState {
  switch (action.type) {
    case 'HYDRATE': {
      const { snapshot } = action;
      return {
        ...state,
        ...snapshot,
        functions: sortByDate(snapshot.functions),
        tables: pruneTables(state.tables, new Set(snapshot.guests.map(g => g.id))),
      };
    }

    case 'SET_WEDDING':
      return { ...state, wedding: action.wedding };

    case 'SET_VENDORS':
      return { ...state, vendors: action.vendors };

    case 'SET_GUESTS':
      return {
        ...state,
        guests: action.guests,
        tables: pruneTables(state.tables, new Set(action.guests.map(g => g.id))),
      };

    case 'SET_BUDGET':
      return {
        ...state,
        budget: action.budget,
        budgetOverview: action.overview,
        expenses: action.expenses,
      };

    case 'SET_FUNCTIONS':
      return { ...state, functions: sortByDate(action.functions) };

    case 'SET_TASKS':
      return { ...state, tasks: action.tasks };

    case 'SET_MEMBERS':
      return { ...state, members: action.members };

    case 'ADD_TABLE':
      return { ...state, tables: [...state.tables, action.table] };

    case 'REMOVE_TABLE':
      return { ...state, tables: state.tables.filter(t => t.id !== action.id) };

    case 'RENAME_TABLE':
      return {
        ...state,
        tables: state.tables.map(t => (t.id === action.id ? { ...t, name: action.name } : t)),
      };

    case 'ASSIGN_GUEST':
      return {
        ...state,
        tables: state.tables.map(t => {
          // Remove from every other table first, so a guest is seated once.
          const without = t.guestIds.filter(id => id !== action.guestId);
          if (t.id !== action.tableId) {
            return without.length === t.guestIds.length ? t : { ...t, guestIds: without };
          }
          return { ...t, guestIds: [...without, action.guestId] };
        }),
      };

    case 'UNASSIGN_GUEST':
      return {
        ...state,
        tables: state.tables.map(t =>
          t.guestIds.includes(action.guestId)
            ? { ...t, guestIds: t.guestIds.filter(id => id !== action.guestId) }
            : t,
        ),
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
