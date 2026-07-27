/** Payment-status derivation and status → pill-style mappings. */

import { statusColors, colors } from '@theme';
import type { PaymentStatus, RsvpStatus, FunctionStatus } from '@types';

export interface StatusStyle {
  bg: string;
  text: string;
}

/**
 * Local mirror of the backend's derived vendor status, for optimistic UI only.
 * The server value returned by the API is authoritative.
 */
export const derivePaymentStatus = (cost: number, advance: number): PaymentStatus => {
  if (cost > 0 && advance >= cost) return 'Paid';
  if (advance > 0) return 'Advance';
  return 'Pending';
};

export const balanceOf = (cost: number, advance: number): number => Math.max(0, cost - advance);

export const paymentStatusStyle = (status: PaymentStatus): StatusStyle => {
  switch (status) {
    case 'Paid':
      return statusColors.paid;
    case 'Advance':
      return statusColors.advance;
    default:
      return statusColors.pending;
  }
};

export const rsvpStatusStyle = (rsvp: RsvpStatus): StatusStyle => {
  switch (rsvp) {
    case 'Confirmed':
      return statusColors.confirmed;
    case 'Not Coming':
      return statusColors.notComing;
    default:
      return statusColors.pending;
  }
};

export const functionStatusStyle = (status: FunctionStatus): StatusStyle => {
  switch (status) {
    case 'done':
      return statusColors.done;
    case 'next':
      return statusColors.upcoming;
    case 'postponed':
      return statusColors.advance;
    case 'cancelled':
      return statusColors.notComing;
    default:
      return statusColors.planned;
  }
};

export const functionStatusLabel = (status: FunctionStatus): string => {
  switch (status) {
    case 'done':
      return 'Done';
    case 'next':
      return 'Next Up';
    case 'postponed':
      return 'Postponed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Upcoming';
  }
};

/** Solid dot color for a function on the timeline / dashboard. */
export const functionDotColor = (status: FunctionStatus): string => {
  switch (status) {
    case 'done':
      return colors.success;
    case 'next':
      return colors.accent;
    case 'postponed':
      return colors.primaryLight;
    case 'cancelled':
      return colors.danger;
    default:
      return '#D9CBAE';
  }
};
