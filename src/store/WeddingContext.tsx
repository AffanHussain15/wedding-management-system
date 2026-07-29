/**
 * Server-backed domain store for the active wedding.
 *
 * Loads every slice the app needs in one parallel pass, then exposes action
 * creators that call the API and refetch only the slices a write can affect.
 * Screens never see wire types, HTTP, or SCREAMING_CASE enum values.
 *
 * Every write returns `Promise<ActionResult>` rather than throwing, so an
 * `onPress` can await it and surface an error without a try/catch — and a
 * caller that ignores the result still cannot produce an unhandled rejection.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  api,
  ApiError,
  budgetCategoriesFromApi,
  budgetCategoryToApi,
  budgetOverviewFromApi,
  errorMessage,
  expenseFromApi,
  functionFromApi,
  gatheringToApi,
  guestFromApi,
  guestSideToApi,
  joinCoupleName,
  memberFromApi,
  paymentMethodToApi,
  rsvpToApi,
  taskFromApi,
  taskPriorityToApi,
  vendorCategoryToApi,
  vendorFromApi,
  weddingFromApi,
} from '@services';
import { GUEST_GROUPS, PAGE_SIZE } from '@constants';
import { nextId, toApiDate } from '@utils';
import type {
  ExpenseInput,
  FunctionInput,
  GuestInput,
  ID,
  RsvpStatus,
  TaskInput,
  VendorInput,
  WeddingDetails,
} from '@types';

import { initialState, weddingReducer } from './reducer';
import type { WeddingSnapshot, WeddingState } from './types';

/** Uniform outcome for every write, so screens never need try/catch. */
export type ActionResult =
  | { ok: true; warning?: string | null }
  | { ok: false; error: ApiError; message: string };

const succeeded = (warning?: string | null): ActionResult => ({ ok: true, warning });

function failed(error: unknown): ActionResult {
  const apiError =
    error instanceof ApiError
      ? error
      : new ApiError({
          status: 0,
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Something went wrong.',
        });
  return { ok: false, error: apiError, message: errorMessage(apiError) };
}

export interface WeddingActions {
  // Vendors
  addVendor: (input: VendorInput) => Promise<ActionResult>;
  updateVendor: (id: ID, changes: Partial<VendorInput>) => Promise<ActionResult>;
  removeVendor: (id: ID) => Promise<ActionResult>;
  recordVendorPayment: (vendorId: ID, amount: number, note?: string) => Promise<ActionResult>;

  // Guests
  addGuest: (input: GuestInput) => Promise<ActionResult>;
  updateGuest: (id: ID, changes: Partial<GuestInput>) => Promise<ActionResult>;
  setGuestRsvp: (id: ID, rsvp: RsvpStatus) => Promise<ActionResult>;
  cycleGuestGroup: (id: ID) => Promise<ActionResult>;
  removeGuest: (id: ID) => Promise<ActionResult>;
  sendGuestInvite: (id: ID) => Promise<ActionResult>;

  // Budget
  addExpense: (input: ExpenseInput) => Promise<ActionResult>;
  updateExpense: (id: ID, changes: Partial<ExpenseInput>) => Promise<ActionResult>;
  removeExpense: (id: ID) => Promise<ActionResult>;

  // Functions (API events)
  addFunction: (input: FunctionInput) => Promise<ActionResult>;
  updateFunction: (id: ID, changes: Partial<FunctionInput>) => Promise<ActionResult>;
  removeFunction: (id: ID) => Promise<ActionResult>;

  // Tasks
  addTask: (input: TaskInput) => Promise<ActionResult>;
  toggleTask: (id: ID) => Promise<ActionResult>;
  removeTask: (id: ID) => Promise<ActionResult>;

  // Wedding
  updateWedding: (changes: Partial<WeddingDetails>) => Promise<ActionResult>;

  // Local-only seating planner (no server counterpart).
  addTable: (name: string) => void;
  removeTable: (id: ID) => void;
  renameTable: (id: ID, name: string) => void;
  assignGuest: (tableId: ID, guestId: ID) => void;
  unassignGuest: (guestId: ID) => void;

  reset: () => void;
}

export interface WeddingContextValue {
  state: WeddingState;
  actions: WeddingActions;
  /** True during the first load of a wedding. */
  loading: boolean;
  /** True while a refresh runs over already-rendered data. */
  refreshing: boolean;
  /** Set when the load failed; `refresh` retries. */
  error: string | null;
  refresh: () => Promise<void>;
  /** True once a wedding has loaded successfully at least once. */
  hasData: boolean;
}

const WeddingContext = createContext<WeddingContextValue | null>(null);

export interface WeddingProviderProps extends PropsWithChildren {
  /** Active wedding; null renders children with an empty, idle store. */
  weddingId: string | null;
}

export function WeddingProvider({
  weddingId,
  children,
}: WeddingProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(weddingReducer, initialState);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  const mounted = useRef(true);
  const controller = useRef<AbortController | null>(null);
  // Lets action creators read current state without depending on it, so they
  // stay referentially stable and memoized rows don't re-render on every edit.
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);

  // --- Loading -------------------------------------------------------------

  const fetchSnapshot = useCallback(
    async (id: string, signal: AbortSignal): Promise<WeddingSnapshot> => {
      const opts = { signal };
      const [wedding, vendors, guests, budgetSummary, expenses, events, tasks, members] =
        await Promise.all([
          api.weddings.get(id, opts),
          api.vendors.list(id, { limit: PAGE_SIZE }, opts),
          api.guests.list(id, { limit: PAGE_SIZE, sortBy: 'name', sortOrder: 'asc' }, opts),
          api.budget.summary(id, opts),
          api.budget.listItems(id, { limit: PAGE_SIZE }, opts),
          api.events.list(id, { limit: PAGE_SIZE }, opts),
          api.tasks.list(id, { limit: PAGE_SIZE }, opts),
          api.weddings.members(id, opts),
        ]);

      const functions = events.items.map(functionFromApi);
      // Tasks reference members by user id and events by event id, so both
      // lookups must exist before tasks can be mapped for display.
      const memberNames = new Map(members.map(m => [m.userId, m.fullName]));
      const eventNames = new Map(functions.map(f => [f.id, f.name]));

      return {
        // The API has no wedding-level venue column, so the earliest event's
        // venue stands in for it on the header and profile screens.
        wedding: weddingFromApi(wedding, functions[0]?.venue ?? ''),
        vendors: vendors.items.map(vendorFromApi),
        guests: guests.items.map(guestFromApi),
        budget: budgetCategoriesFromApi(budgetSummary),
        budgetOverview: budgetOverviewFromApi(budgetSummary),
        expenses: expenses.items.map(expenseFromApi),
        functions,
        tasks: tasks.items.map(row => taskFromApi(row, memberNames, eventNames)),
        members: members.map(memberFromApi),
      };
    },
    [],
  );

  const load = useCallback(
    async (id: string, isRefresh: boolean) => {
      controller.current?.abort();
      const next = new AbortController();
      controller.current = next;

      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const snapshot = await fetchSnapshot(id, next.signal);
        if (!mounted.current || next.signal.aborted) return;
        dispatch({ type: 'HYDRATE', snapshot });
        setHasData(true);
      } catch (err) {
        if (next.signal.aborted || (err as Error)?.name === 'AbortError') return;
        if (!mounted.current) return;
        setError(errorMessage(err));
      } finally {
        if (mounted.current && !next.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [fetchSnapshot],
  );

  useEffect(() => {
    if (!weddingId) {
      controller.current?.abort();
      dispatch({ type: 'RESET' });
      setHasData(false);
      setLoading(false);
      setRefreshing(false);
      setError(null);
      return;
    }
    // Switching weddings must never show the previous one's rows.
    dispatch({ type: 'RESET' });
    setHasData(false);
    // `load` captures its own failures into `error`, so it never rejects.
    load(weddingId, false);
  }, [weddingId, load]);

  const refresh = useCallback(async () => {
    if (weddingId) await load(weddingId, true);
  }, [weddingId, load]);

  // --- Targeted refetches --------------------------------------------------
  // A write only invalidates some slices, so each action refreshes just those
  // rather than re-running the full eight-request load.

  const reloadVendors = useCallback(async (id: string) => {
    const vendors = await api.vendors.list(id, { limit: PAGE_SIZE });
    if (mounted.current) {
      dispatch({ type: 'SET_VENDORS', vendors: vendors.items.map(vendorFromApi) });
    }
  }, []);

  const reloadGuests = useCallback(async (id: string) => {
    const guests = await api.guests.list(id, {
      limit: PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    if (mounted.current) {
      dispatch({ type: 'SET_GUESTS', guests: guests.items.map(guestFromApi) });
    }
  }, []);

  const reloadBudget = useCallback(async (id: string) => {
    const [summary, items] = await Promise.all([
      api.budget.summary(id),
      api.budget.listItems(id, { limit: PAGE_SIZE }),
    ]);
    if (mounted.current) {
      dispatch({
        type: 'SET_BUDGET',
        budget: budgetCategoriesFromApi(summary),
        overview: budgetOverviewFromApi(summary),
        expenses: items.items.map(expenseFromApi),
      });
    }
  }, []);

  const reloadTasks = useCallback(async (id: string) => {
    const tasks = await api.tasks.list(id, { limit: PAGE_SIZE });
    if (!mounted.current) return;
    const current = stateRef.current;
    const memberNames = new Map(current.members.map(m => [m.userId, m.fullName]));
    const eventNames = new Map(current.functions.map(f => [f.id, f.name]));
    dispatch({
      type: 'SET_TASKS',
      tasks: tasks.items.map(row => taskFromApi(row, memberNames, eventNames)),
    });
  }, []);

  const reloadFunctions = useCallback(async (id: string) => {
    const events = await api.events.list(id, { limit: PAGE_SIZE });
    if (mounted.current) {
      dispatch({ type: 'SET_FUNCTIONS', functions: events.items.map(functionFromApi) });
    }
  }, []);

  // --- Actions -------------------------------------------------------------

  const actions = useMemo<WeddingActions>(() => {
    /** Runs a write against the active wedding, mapping any throw to a result. */
    const write = async (
      fn: (id: string) => Promise<ActionResult | void>,
    ): Promise<ActionResult> => {
      const id = weddingId;
      if (!id) return failed(new Error('No wedding selected.'));
      try {
        return (await fn(id)) ?? succeeded();
      } catch (err) {
        return failed(err);
      }
    };

    return {
      // --- Vendors ---------------------------------------------------------

      addVendor: input =>
        write(async id => {
          const category = vendorCategoryToApi(input.category);
          const vendor = await api.vendors.create(id, {
            name: input.name,
            category,
            // The API requires a label when the category is OTHER.
            ...(category === 'OTHER' ? { customCategory: input.category } : {}),
            ...(input.phone ? { phone: input.phone } : {}),
            ...(input.cost > 0 ? { totalPrice: input.cost } : {}),
            ...(input.eventId ? { eventId: input.eventId } : {}),
          });

          // "Advance" is payment history, not a vendor column, so it becomes the
          // vendor's first payment. That also creates a budget item server-side,
          // hence the budget refetch.
          let warning: string | null = null;
          if (input.advance > 0) {
            const result = await api.vendors.recordPayment(id, vendor.id, {
              amount: input.advance,
              note: 'Advance',
            });
            warning = result.warning;
            await reloadBudget(id);
          }
          await reloadVendors(id);
          return succeeded(warning);
        }),

      updateVendor: (vendorId, changes) =>
        write(async id => {
          // `advance` is payment history, so it is deliberately not mapped here —
          // use `recordVendorPayment` to change what has been paid.
          const payload = {
            ...(changes.name !== undefined ? { name: changes.name } : {}),
            ...(changes.category !== undefined
              ? {
                  category: vendorCategoryToApi(changes.category),
                  // The API requires a label whenever the category is OTHER.
                  ...(vendorCategoryToApi(changes.category) === 'OTHER'
                    ? { customCategory: changes.category }
                    : {}),
                }
              : {}),
            ...(changes.phone !== undefined ? { phone: changes.phone } : {}),
            ...(changes.cost !== undefined ? { totalPrice: changes.cost } : {}),
            ...(changes.eventId ? { eventId: changes.eventId } : {}),
          };
          if (Object.keys(payload).length > 0) {
            await api.vendors.update(id, vendorId, payload);
          }
          await reloadVendors(id);
        }),

      removeVendor: vendorId =>
        write(async id => {
          await api.vendors.remove(id, vendorId);
          // Budget items created from this vendor's payments survive the
          // soft delete, so budget totals are unchanged.
          await reloadVendors(id);
        }),

      recordVendorPayment: (vendorId, amount, note) =>
        write(async id => {
          const result = await api.vendors.recordPayment(id, vendorId, {
            amount,
            ...(note ? { note } : {}),
          });
          await Promise.all([reloadVendors(id), reloadBudget(id)]);
          return succeeded(result.warning);
        }),

      // --- Guests ----------------------------------------------------------

      addGuest: input =>
        write(async id => {
          await api.guests.create(id, {
            name: input.name,
            groupSize: input.groupSize ?? 1,
            ...(input.phone ? { phone: input.phone } : {}),
            side: guestSideToApi(input.side),
            gathering: gatheringToApi(input.group),
          });
          await reloadGuests(id);
        }),

      updateGuest: (guestId, changes) =>
        write(async id => {
          await api.guests.update(id, guestId, {
            ...(changes.name !== undefined ? { name: changes.name } : {}),
            ...(changes.phone !== undefined ? { phone: changes.phone } : {}),
            ...(changes.side !== undefined ? { side: guestSideToApi(changes.side) } : {}),
            ...(changes.group !== undefined
              ? { gathering: gatheringToApi(changes.group) }
              : {}),
            ...(changes.groupSize !== undefined ? { groupSize: changes.groupSize } : {}),
          });
          await reloadGuests(id);
        }),

      setGuestRsvp: (guestId, rsvp) =>
        write(async id => {
          await api.guests.setRsvp(id, guestId, rsvpToApi(rsvp));
          await reloadGuests(id);
        }),

      cycleGuestGroup: guestId =>
        write(async id => {
          const guest = stateRef.current.guests.find(g => g.id === guestId);
          if (!guest) return;
          const index = GUEST_GROUPS.indexOf(guest.group);
          const next = GUEST_GROUPS[(index + 1) % GUEST_GROUPS.length];
          await api.guests.update(id, guestId, { gathering: gatheringToApi(next) });
          await reloadGuests(id);
        }),

      removeGuest: guestId =>
        write(async id => {
          await api.guests.remove(id, guestId);
          await reloadGuests(id);
        }),

      sendGuestInvite: guestId =>
        write(async id => {
          await api.guests.sendInvite(id, guestId);
        }),

      // --- Budget ----------------------------------------------------------

      addExpense: input =>
        write(async id => {
          const category = budgetCategoryToApi(input.category);
          await api.budget.createItem(id, {
            category,
            ...(category === 'OTHER' ? { customCategory: input.category } : {}),
            title: input.title,
            amount: input.amount,
            ...(input.method ? { paymentMethod: paymentMethodToApi(input.method) } : {}),
            ...(input.notes ? { notes: input.notes } : {}),
          });
          await reloadBudget(id);
        }),

      updateExpense: (itemId, changes) =>
        write(async id => {
          const category =
            changes.category !== undefined ? budgetCategoryToApi(changes.category) : undefined;

          await api.budget.updateItem(id, itemId, {
            ...(category
              ? {
                  category,
                  ...(category === 'OTHER' ? { customCategory: changes.category } : {}),
                }
              : {}),
            ...(changes.title !== undefined ? { title: changes.title } : {}),
            ...(changes.amount !== undefined ? { amount: changes.amount } : {}),
            ...(changes.method !== undefined
              ? { paymentMethod: paymentMethodToApi(changes.method) }
              : {}),
            ...(changes.notes !== undefined ? { notes: changes.notes } : {}),
          });
          // Editing an amount moves the category and overall totals, so the
          // whole summary is refetched rather than patched locally.
          await reloadBudget(id);
        }),

      removeExpense: itemId =>
        write(async id => {
          await api.budget.removeItem(id, itemId);
          await reloadBudget(id);
        }),

      // --- Functions -------------------------------------------------------

      addFunction: input =>
        write(async id => {
          const eventDate = toApiDate(input.date);
          if (!eventDate) throw new Error('A valid date (YYYY-MM-DD) is required.');
          await api.events.create(id, {
            name: input.name,
            eventDate,
            ...(input.time ? { startTime: input.time } : {}),
            ...(input.venue ? { venueName: input.venue } : {}),
          });
          await reloadFunctions(id);
        }),

      updateFunction: (eventId, changes) =>
        write(async id => {
          await api.events.update(id, eventId, {
            ...(changes.name !== undefined ? { name: changes.name } : {}),
            ...(changes.date !== undefined ? { eventDate: toApiDate(changes.date) } : {}),
            ...(changes.time !== undefined ? { startTime: changes.time } : {}),
            ...(changes.venue !== undefined ? { venueName: changes.venue } : {}),
          });
          await reloadFunctions(id);
        }),

      removeFunction: eventId =>
        write(async id => {
          await api.events.remove(id, eventId);
          // Deleting an event unlinks its vendors and tasks server-side.
          await Promise.all([reloadFunctions(id), reloadVendors(id), reloadTasks(id)]);
        }),

      // --- Tasks -----------------------------------------------------------

      addTask: input =>
        write(async id => {
          await api.tasks.create(id, {
            title: input.title,
            ...(input.eventId ? { eventId: input.eventId } : {}),
            ...(input.assignedTo ? { assignedTo: input.assignedTo } : {}),
            ...(input.priority ? { priority: taskPriorityToApi(input.priority) } : {}),
            ...(input.dueDate ? { dueDate: toApiDate(input.dueDate) } : {}),
          });
          await reloadTasks(id);
        }),

      toggleTask: taskId =>
        write(async id => {
          const task = stateRef.current.tasks.find(t => t.id === taskId);
          if (!task) return;
          // Status-only update — also the single edit a FAMILY_MEMBER may make,
          // and only on a task assigned to them.
          await api.tasks.setStatus(id, taskId, task.done ? 'PENDING' : 'DONE');
          await reloadTasks(id);
        }),

      removeTask: taskId =>
        write(async id => {
          await api.tasks.remove(id, taskId);
          await reloadTasks(id);
        }),

      // --- Wedding ---------------------------------------------------------

      updateWedding: changes =>
        write(async id => {
          const current = stateRef.current.wedding;
          const bride = changes.bride ?? current.bride;
          const groom = changes.groom ?? current.groom;
          const nameChanged = changes.bride !== undefined || changes.groom !== undefined;

          await api.weddings.update(id, {
            ...(nameChanged ? { name: joinCoupleName(bride, groom) } : {}),
            ...(changes.weddingDate !== undefined
              ? { weddingDate: toApiDate(changes.weddingDate) }
              : {}),
            ...(changes.city !== undefined ? { venueCity: changes.city } : {}),
            ...(changes.totalBudget ? { totalBudget: changes.totalBudget } : {}),
            ...(changes.estimatedGuests ? { estimatedGuests: changes.estimatedGuests } : {}),
          });

          // The budget summary embeds totalBudget, so it can change here too.
          const [wedding] = await Promise.all([api.weddings.get(id), reloadBudget(id)]);
          if (mounted.current) {
            dispatch({
              type: 'SET_WEDDING',
              wedding: weddingFromApi(wedding, stateRef.current.wedding.venue),
            });
          }
        }),

      // --- Local-only seating ----------------------------------------------

      addTable: name =>
        dispatch({
          type: 'ADD_TABLE',
          table: { id: nextId(), name: name.trim() || 'New Table', guestIds: [] },
        }),
      removeTable: id => dispatch({ type: 'REMOVE_TABLE', id }),
      renameTable: (id, name) => dispatch({ type: 'RENAME_TABLE', id, name: name.trim() }),
      assignGuest: (tableId, guestId) => dispatch({ type: 'ASSIGN_GUEST', tableId, guestId }),
      unassignGuest: guestId => dispatch({ type: 'UNASSIGN_GUEST', guestId }),

      reset: () => dispatch({ type: 'RESET' }),
    };
  }, [weddingId, reloadBudget, reloadFunctions, reloadGuests, reloadTasks, reloadVendors]);

  const value = useMemo<WeddingContextValue>(
    () => ({ state, actions, loading, refreshing, error, refresh, hasData }),
    [state, actions, loading, refreshing, error, refresh, hasData],
  );

  return <WeddingContext.Provider value={value}>{children}</WeddingContext.Provider>;
}

export function useWedding(): WeddingContextValue {
  const ctx = useContext(WeddingContext);
  if (!ctx) {
    throw new Error('useWedding must be used within a <WeddingProvider>');
  }
  return ctx;
}
