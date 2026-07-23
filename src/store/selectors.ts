/** Pure derivations over WeddingState, so screens don't recompute inline. */

import { daysUntil, relativeDay, percentage } from '@utils';
import type { WeddingState } from './types';

export interface BudgetTotals {
  allotted: number;
  spent: number;
  remaining: number;
  pctUsed: number;
}

export const selectBudgetTotals = (state: WeddingState): BudgetTotals => {
  const allotted = state.budget.reduce((sum, c) => sum + c.allotted, 0);
  const spent = state.budget.reduce((sum, c) => sum + c.spent, 0);
  return {
    allotted,
    spent,
    remaining: allotted - spent,
    pctUsed: percentage(spent, allotted),
  };
};

export interface GuestCounts {
  total: number;
  confirmed: number;
  pending: number;
  notComing: number;
  confirmedPct: number;
}

export const selectGuestCounts = (state: WeddingState): GuestCounts => {
  const total = state.guests.length;
  const confirmed = state.guests.filter(g => g.rsvp === 'Confirmed').length;
  const pending = state.guests.filter(g => g.rsvp === 'Pending').length;
  const notComing = state.guests.filter(g => g.rsvp === 'Not Coming').length;
  return {
    total,
    confirmed,
    pending,
    notComing,
    confirmedPct: percentage(confirmed, total),
  };
};

export interface VendorStats {
  total: number;
  booked: number;
  bookedPct: number;
}

export const selectVendorStats = (state: WeddingState): VendorStats => {
  const total = state.vendors.length;
  const booked = state.vendors.filter(v => v.status !== 'Pending').length;
  return { total, booked, bookedPct: percentage(booked, total) };
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

export const selectNextFunction = (state: WeddingState): NextFunctionInfo => {
  const next = state.functions.find(f => f.status !== 'done');
  if (!next) return { name: 'All set', relative: 'Nothing pending' };
  return { name: next.name, relative: relativeDay(next.date) };
};

/**
 * Overall planning progress (0–100): the average of task completion, guest
 * confirmation, vendors booked and budget used.
 */
export const selectOverallProgress = (state: WeddingState): number => {
  const tasks = selectTaskStats(state).donePct;
  const guests = selectGuestCounts(state).confirmedPct;
  const vendors = selectVendorStats(state).bookedPct;
  const budget = Math.min(100, selectBudgetTotals(state).pctUsed);
  return Math.round((tasks + guests + vendors + budget) / 4);
};
