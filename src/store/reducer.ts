/**
 * Pure reducer. Id generation and status derivation happen in the action
 * creators (see WeddingContext), so this stays deterministic and testable.
 */

import {
  seedWedding,
  seedVendors,
  seedGuests,
  seedBudget,
  seedFunctions,
  seedTasks,
  seedReminders,
} from '@data';
import { GUEST_GROUPS } from '@constants';
import type { GuestGroup } from '@types';
import type { WeddingState, WeddingAction } from './types';

export const initialState: WeddingState = {
  wedding: seedWedding,
  vendors: seedVendors,
  guests: seedGuests,
  budget: seedBudget,
  functions: seedFunctions,
  tasks: seedTasks,
  reminders: seedReminders,
};

const nextGroup = (group: GuestGroup): GuestGroup => {
  const idx = GUEST_GROUPS.indexOf(group);
  return GUEST_GROUPS[(idx + 1) % GUEST_GROUPS.length];
};

export function weddingReducer(
  state: WeddingState,
  action: WeddingAction,
): WeddingState {
  switch (action.type) {
    case 'ADD_VENDOR':
      return { ...state, vendors: [...state.vendors, action.vendor] };

    case 'UPDATE_VENDOR':
      return {
        ...state,
        vendors: state.vendors.map(v =>
          v.id === action.id ? { ...v, ...action.changes } : v,
        ),
      };

    case 'REMOVE_VENDOR':
      return {
        ...state,
        vendors: state.vendors.filter(v => v.id !== action.id),
      };

    case 'ADD_GUEST':
      return { ...state, guests: [...state.guests, action.guest] };

    case 'SET_GUEST_RSVP':
      return {
        ...state,
        guests: state.guests.map(g =>
          g.id === action.id ? { ...g, rsvp: action.rsvp } : g,
        ),
      };

    case 'CYCLE_GUEST_GROUP':
      return {
        ...state,
        guests: state.guests.map(g =>
          g.id === action.id ? { ...g, group: nextGroup(g.group) } : g,
        ),
      };

    case 'REMOVE_GUEST':
      return {
        ...state,
        guests: state.guests.filter(g => g.id !== action.id),
      };

    case 'ADD_EXPENSE':
      return {
        ...state,
        budget: state.budget.map(c =>
          c.name === action.category
            ? { ...c, spent: c.spent + action.amount }
            : c,
        ),
      };

    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.task] };

    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.id ? { ...t, done: !t.done } : t,
        ),
      };

    case 'TOGGLE_FUNCTION_SELECTED':
      return {
        ...state,
        wedding: {
          ...state.wedding,
          functionsSelected: {
            ...state.wedding.functionsSelected,
            [action.name]: !state.wedding.functionsSelected[action.name],
          },
        },
      };

    case 'UPDATE_WEDDING':
      return {
        ...state,
        wedding: { ...state.wedding, ...action.changes },
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
