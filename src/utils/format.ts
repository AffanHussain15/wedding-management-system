/**
 * Formatting helpers. Implemented without `Intl`/`toLocaleString`, which is
 * unreliable on Hermes (Android), so output is identical across platforms.
 */

import { CURRENCY_SYMBOL } from '@constants';

const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** Month names for a calendar's month grid, January first. */
export const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const MS_PER_DAY = 86_400_000;

/** 220000 → "220,000". */
export const formatNumber = (value: number): string =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** 220000 → "Rs 220,000". */
export const formatCurrency = (value: number): string =>
  `${CURRENCY_SYMBOL} ${formatNumber(value)}`;

/** "Ayesha Khan" → "AK". */
export const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .map(word => word[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

/**
 * "YYYY-MM-DD" → local Date, or null when absent/malformed. API dates can be
 * null (an unset wedding date), which reaches here as '', so every caller has
 * to tolerate a missing value rather than rendering "January 1, 1900".
 */
export const parseDate = (iso: string): Date | null => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * "2027-02-14" → "February 14, 2027" (long), "February 14" (monthDay),
 * or "Feb 14" (short). Returns `fallback` for an empty or invalid date.
 */
export const formatDate = (
  iso: string,
  style: 'long' | 'short' | 'monthDay' = 'long',
  fallback = 'Date not set',
): string => {
  const d = parseDate(iso);
  if (!d) return fallback;
  const month = (style === 'short' ? MONTH_NAMES_SHORT : MONTHS_LONG)[d.getMonth()];
  if (style === 'long') return `${month} ${d.getDate()}, ${d.getFullYear()}`;
  return `${month} ${d.getDate()}`;
};

/** Whole days from today until the given ISO date (never negative; 0 if unset). */
export const daysUntil = (iso: string): number => {
  const target = parseDate(iso);
  if (!target) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / MS_PER_DAY));
};

/** "today" | "tomorrow" | "in N days", or '' when the date is unset. */
export const relativeDay = (iso: string): string => {
  if (!parseDate(iso)) return '';
  const days = daysUntil(iso);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
};

/**
 * Date → "YYYY-MM-DD" from the local calendar fields. Deliberately not
 * `toISOString().slice(0, 10)`, which shifts to UTC and can land a day off.
 */
export const toIsoDate = (date: Date): string => {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

/** Today as "YYYY-MM-DD", for date defaults in forms. */
export const todayIso = (): string => toIsoDate(new Date());

/** "February 2027" — a calendar header. `month` is 0-based. */
export const monthLabel = (year: number, month: number): string =>
  `${MONTHS_LONG[month]} ${year}`;

/** Days in a 0-based month (day 0 of the next month is this month's last). */
export const daysInMonth = (year: number, month: number): number =>
  new Date(year, month + 1, 0).getDate();

/** Weekday of the 1st, 0 = Sunday — how many blanks the month grid starts with. */
export const firstWeekdayOfMonth = (year: number, month: number): number =>
  new Date(year, month, 1).getDay();

/**
 * "YYYY-MM-DD" → the value to send the API, or undefined when empty.
 *
 * Stays date-only instead of `toISOString()`. A local midnight converted to UTC
 * lands on the *previous* day everywhere east of Greenwich — 2030-01-01 in
 * Pakistan becomes 2029-12-31T19:00:00Z — and the API hands dates back by
 * truncating at the 'T', so every date the user picked came back a day early.
 * Every date field the app writes validates as `@IsDateString()` server-side,
 * which accepts a bare date.
 */
export const toApiDate = (iso: string): string | undefined => {
  const d = parseDate(iso);
  return d ? toIsoDate(d) : undefined;
};

export const clamp = (value: number, min = 0, max = 100): number =>
  Math.min(max, Math.max(min, value));

/** part/total as a rounded 0–100 percentage (0 when total is 0). */
export const percentage = (part: number, total: number): number =>
  total > 0 ? Math.round((part / total) * 100) : 0;
