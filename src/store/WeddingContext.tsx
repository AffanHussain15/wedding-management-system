/**
 * Typed store context. Exposes action creators that handle id generation and
 * status derivation, so screens never build raw action objects. Consume via
 * the `useWedding` hook.
 */

import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from 'react';

import { derivePaymentStatus, nextId } from '@utils';
import type {
  VendorInput,
  GuestInput,
  TaskInput,
  RsvpStatus,
  FunctionName,
  WeddingDetails,
  ID,
} from '@types';

import { weddingReducer, initialState } from './reducer';
import type { WeddingState } from './types';

export interface WeddingActions {
  addVendor: (input: VendorInput) => void;
  updateVendor: (id: ID, changes: Partial<VendorInput>) => void;
  removeVendor: (id: ID) => void;
  addGuest: (input: GuestInput) => void;
  setGuestRsvp: (id: ID, rsvp: RsvpStatus) => void;
  cycleGuestGroup: (id: ID) => void;
  removeGuest: (id: ID) => void;
  addExpense: (category: string, amount: number) => void;
  addTask: (input: TaskInput) => void;
  toggleTask: (id: ID) => void;
  toggleFunctionSelected: (name: FunctionName) => void;
  updateWedding: (changes: Partial<WeddingDetails>) => void;
  reset: () => void;
}

export interface WeddingContextValue {
  state: WeddingState;
  actions: WeddingActions;
}

const WeddingContext = createContext<WeddingContextValue | null>(null);

export function WeddingProvider({ children }: PropsWithChildren): React.JSX.Element {
  const [state, dispatch] = useReducer(weddingReducer, initialState);

  // dispatch is stable, so action creators are memoized once.
  const actions = useMemo<WeddingActions>(
    () => ({
      addVendor: input =>
        dispatch({
          type: 'ADD_VENDOR',
          vendor: {
            ...input,
            id: nextId(),
            status: derivePaymentStatus(input.cost, input.advance),
            rating: 0,
          },
        }),

      updateVendor: (id, changes) => {
        // Re-derive payment status when cost/advance change.
        const withStatus =
          changes.cost !== undefined || changes.advance !== undefined
            ? {
                ...changes,
                status: derivePaymentStatus(changes.cost ?? 0, changes.advance ?? 0),
              }
            : changes;
        dispatch({ type: 'UPDATE_VENDOR', id, changes: withStatus });
      },

      removeVendor: id => dispatch({ type: 'REMOVE_VENDOR', id }),

      addGuest: input =>
        dispatch({
          type: 'ADD_GUEST',
          guest: { ...input, id: nextId(), rsvp: 'Pending' },
        }),

      setGuestRsvp: (id, rsvp) => dispatch({ type: 'SET_GUEST_RSVP', id, rsvp }),

      cycleGuestGroup: id => dispatch({ type: 'CYCLE_GUEST_GROUP', id }),

      removeGuest: id => dispatch({ type: 'REMOVE_GUEST', id }),

      addExpense: (category, amount) => dispatch({ type: 'ADD_EXPENSE', category, amount }),

      addTask: input =>
        dispatch({
          type: 'ADD_TASK',
          task: { ...input, id: nextId(), done: false },
        }),

      toggleTask: id => dispatch({ type: 'TOGGLE_TASK', id }),

      toggleFunctionSelected: name => dispatch({ type: 'TOGGLE_FUNCTION_SELECTED', name }),

      updateWedding: changes => dispatch({ type: 'UPDATE_WEDDING', changes }),

      reset: () => dispatch({ type: 'RESET' }),
    }),
    [],
  );

  const value = useMemo<WeddingContextValue>(() => ({ state, actions }), [state, actions]);

  return <WeddingContext.Provider value={value}>{children}</WeddingContext.Provider>;
}

export function useWedding(): WeddingContextValue {
  const ctx = useContext(WeddingContext);
  if (!ctx) {
    throw new Error('useWedding must be used within a <WeddingProvider>');
  }
  return ctx;
}
