/**
 * Formatting helpers. Implemented without `Intl`/`toLocaleString`, which is
 * unreliable on Hermes (Android), so output is identical across platforms.
 */

import { CURRENCY_SYMBOL } from '@constants';

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
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

const parseDate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

/** "2027-02-14" → "February 14, 2027" (long) or "Feb 14" (short). */
export const formatDate = (
  iso: string,
  style: 'long' | 'short' = 'long',
): string => {
  const d = parseDate(iso);
  const month = (style === 'long' ? MONTHS_LONG : MONTHS_SHORT)[d.getMonth()];
  return style === 'long'
    ? `${month} ${d.getDate()}, ${d.getFullYear()}`
    : `${month} ${d.getDate()}`;
};

/** Whole days from today until the given ISO date (never negative). */
export const daysUntil = (iso: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(
    0,
    Math.ceil((parseDate(iso).getTime() - today.getTime()) / MS_PER_DAY),
  );
};

/** "today" | "tomorrow" | "in N days". */
export const relativeDay = (iso: string): string => {
  const days = daysUntil(iso);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
};

export const clamp = (value: number, min = 0, max = 100): number =>
  Math.min(max, Math.max(min, value));

/** part/total as a rounded 0–100 percentage (0 when total is 0). */
export const percentage = (part: number, total: number): number =>
  total > 0 ? Math.round((part / total) * 100) : 0;
