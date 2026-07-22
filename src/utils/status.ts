/** Payment-status derivation and status → pill-style mappings. */

import { statusColors } from '@theme';
import type { PaymentStatus, RsvpStatus, FunctionStatus } from '@types';

export interface StatusStyle {
  bg: string;
  text: string;
}

export const derivePaymentStatus = (
  cost: number,
  advance: number,
): PaymentStatus => {
  if (cost > 0 && advance >= cost) return 'Paid';
  if (advance > 0) return 'Advance';
  return 'Pending';
};

export const balanceOf = (cost: number, advance: number): number =>
  Math.max(0, cost - advance);

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
    case 'upcoming':
      return statusColors.upcoming;
    default:
      return statusColors.planned;
  }
};

export const functionStatusLabel = (status: FunctionStatus): string => {
  switch (status) {
    case 'done':
      return 'Done';
    case 'upcoming':
      return 'Upcoming';
    default:
      return 'Planned';
  }
};
