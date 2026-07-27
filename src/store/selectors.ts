/** Pure derivations over WeddingState, so screens don't recompute inline. */

import { balanceOf, daysUntil, formatNumber, percentage, relativeDay } from '@utils';
import type { ReminderType } from '@types';
import type { WeddingState } from './types';

export interface BudgetTotals {
  /** The wedding's total budget; null when none is set. */
  allotted: number | null;
  spent: number;
  /** null when no budget is set, since "remaining" is then undefined. */
  remaining: number | null;
  pctUsed: number;
}

/**
 * Taken straight from the API's budget summary rather than summed client-side —
 * the backend already aggregates spend and holds the wedding-level budget.
 */
export const selectBudgetTotals = (state: WeddingState): BudgetTotals => {
  const { totalBudget, totalSpent, remaining, percentUsed } = state.budgetOverview;
  return {
    allotted: totalBudget,
    spent: totalSpent,
    remaining,
    pctUsed: percentUsed ?? 0,
  };
};

export interface GuestCounts {
  /** Guest entries (groups), not head count. */
  total: number;
  confirmed: number;
  pending: number;
  notComing: number;
  confirmedPct: number;
  /** Sum of `groupSize` across all entries. */
  totalHeads: number;
  confirmedHeads: number;
}

export const selectGuestCounts = (state: WeddingState): GuestCounts => {
  let confirmed = 0;
  let pending = 0;
  let notComing = 0;
  let totalHeads = 0;
  let confirmedHeads = 0;

  for (const guest of state.guests) {
    totalHeads += guest.groupSize;
    if (guest.rsvp === 'Confirmed') {
      confirmed += 1;
      confirmedHeads += guest.groupSize;
    } else if (guest.rsvp === 'Pending') {
      pending += 1;
    } else {
      notComing += 1;
    }
  }

  return {
    total: state.guests.length,
    confirmed,
    pending,
    notComing,
    confirmedPct: percentage(confirmed, state.guests.length),
    totalHeads,
    confirmedHeads,
  };
};

export interface VendorStats {
  total: number;
  booked: number;
  bookedPct: number;
  fullyPaid: number;
}

export const selectVendorStats = (state: WeddingState): VendorStats => {
  const total = state.vendors.length;
  const booked = state.vendors.filter(v => v.status !== 'Pending').length;
  const fullyPaid = state.vendors.filter(v => v.status === 'Paid').length;
  return { total, booked, bookedPct: percentage(booked, total), fullyPaid };
};

export interface TaskStats {
  total: number;
  done: number;
  donePct: number;
}

export const selectTaskStats = (state: WeddingState): TaskStats => {
  const total = state.tasks.length;
  const done = state.tasks.filter(t => t.done).length;
  return { total, done, donePct: percentage(done, total) };
};

export const selectDaysLeft = (state: WeddingState): number => daysUntil(state.wedding.weddingDate);

export interface NextFunctionInfo {
  name: string;
  relative: string;
}

/**
 * The function the API flagged as 'next', falling back to the first that is
 * neither finished nor cancelled.
 */
export const selectNextFunction = (state: WeddingState): NextFunctionInfo => {
  const next =
    state.functions.find(f => f.status === 'next') ??
    state.functions.find(f => f.status !== 'done' && f.status !== 'cancelled');
  if (!next) return { name: 'All set', relative: 'Nothing pending' };
  return { name: next.name, relative: relativeDay(next.date) || 'Date not set' };
};

/**
 * Overall planning progress (0–100): the average of task completion, guest
 * confirmation, vendors booked and budget used.
 *
 * The server computes its own `overallProgress` on the dashboard endpoint with a
 * slightly different formula (it treats "budget set" as binary), so the two can
 * differ by a few points. This one drives the local ring so it stays consistent
 * with the numbers rendered beside it.
 */
export const selectOverallProgress = (state: WeddingState): number => {
  const tasks = selectTaskStats(state).donePct;
  const guests = selectGuestCounts(state).confirmedPct;
  const vendors = selectVendorStats(state).bookedPct;
  const budget = Math.min(100, selectBudgetTotals(state).pctUsed);
  return Math.round((tasks + guests + vendors + budget) / 4);
};

export interface DerivedReminder {
  id: string;
  type: ReminderType;
  text: string;
  /** Human-readable timing, e.g. "in 5 days" or "Overdue". */
  date: string;
  /** Sort key: smaller is more urgent. */
  urgency: number;
}

/** Functions within this window are worth surfacing. */
const UPCOMING_WINDOW_DAYS = 30;
/** Tasks due within this window are worth surfacing. */
const TASK_WINDOW_DAYS = 14;

/**
 * Reminders computed on-device.
 *
 * The backend's notifications and background-jobs modules aren't implemented,
 * so there is no reminders endpoint to read. Rather than invent rows, this
 * derives the same three signals the design called for from data the API does
 * return: outstanding vendor balances, imminent functions, and tasks that are
 * overdue or due soon.
 */
export const selectReminders = (state: WeddingState): DerivedReminder[] => {
  const out: DerivedReminder[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const vendor of state.vendors) {
    const balance = balanceOf(vendor.cost, vendor.advance);
    if (vendor.cost > 0 && balance > 0) {
      out.push({
        id: `vendor-${vendor.id}`,
        type: 'payment',
        text: `Rs ${formatNumber(balance)} still due to ${vendor.name}`,
        date: vendor.status === 'Pending' ? 'No payment yet' : 'Balance outstanding',
        // A vendor with nothing paid at all is the more pressing case.
        urgency: vendor.status === 'Pending' ? 0 : 1,
      });
    }
  }

  for (const fn of state.functions) {
    if (fn.status === 'done' || fn.status === 'cancelled' || !fn.date) continue;
    const days = daysUntil(fn.date);
    if (days <= UPCOMING_WINDOW_DAYS) {
      out.push({
        id: `event-${fn.id}`,
        type: 'booking',
        text: `${fn.name}${fn.venue ? ` at ${fn.venue}` : ''}`,
        date: relativeDay(fn.date),
        urgency: days,
      });
    }
  }

  for (const task of state.tasks) {
    if (task.done || !task.dueDate) continue;
    const overdue = task.dueDate < today;
    const days = daysUntil(task.dueDate);
    if (overdue || days <= TASK_WINDOW_DAYS) {
      out.push({
        id: `task-${task.id}`,
        type: 'task',
        text: task.title,
        date: overdue ? 'Overdue' : relativeDay(task.dueDate),
        urgency: overdue ? -1 : days,
      });
    }
  }

  return out.sort((a, b) => a.urgency - b.urgency);
};
