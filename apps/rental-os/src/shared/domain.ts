export const externalSources = ['BIG_RENTALS', 'NEIGHBORS_TRAILER', 'FACEBOOK_MARKETPLACE', 'OTHER'] as const;
export type ExternalSource = (typeof externalSources)[number];

import { arizonaParts } from './arizonaTime.js';

export const reservationStatuses = ['PENDING_REVIEW', 'CONFIRMED', 'CHECKED_OUT', 'INSPECTION_PENDING', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;
export type ReservationStatus = (typeof reservationStatuses)[number];
export type OperationalStatus = ReservationStatus | 'PICKUP_DUE' | 'RETURN_DUE';
export const blockingStatuses: ReservationStatus[] = ['PENDING_REVIEW', 'CONFIRMED', 'CHECKED_OUT', 'INSPECTION_PENDING'];

const transitions: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING_REVIEW: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CHECKED_OUT', 'CANCELLED', 'NO_SHOW'],
  CHECKED_OUT: ['INSPECTION_PENDING'],
  INSPECTION_PENDING: ['COMPLETED'],
  COMPLETED: [], CANCELLED: [], NO_SHOW: [],
};
export function canTransition(from: ReservationStatus, to: ReservationStatus) { return transitions[from].includes(to); }
export function operationalStatus(status: ReservationStatus, pickupAt: Date, returnAt: Date, now = new Date()): OperationalStatus {
  if (status === 'CONFIRMED' && now >= pickupAt) return 'PICKUP_DUE';
  if (status === 'CHECKED_OUT' && now >= returnAt) return 'RETURN_DUE';
  return status;
}

export type CancellationOutcome = { rentalRefundCents: number; retainedCents: number; label: string; noticeHours: number };
export function cancellationOutcome(input: { pickupAt: Date; decidedAt: Date; rentalChargeCents: number; noShow?: boolean }): CancellationOutcome {
  const noticeHours = (input.pickupAt.getTime() - input.decidedAt.getTime()) / 3_600_000;
  if (!input.noShow && noticeHours >= 48) return { rentalRefundCents: input.rentalChargeCents, retainedCents: 0, label: 'Full rental refund recorded', noticeHours };
  return { rentalRefundCents: input.rentalChargeCents, retainedCents: 10_000, label: input.noShow ? 'No-show: $100 retained outcome recorded' : 'Late cancellation: $100 retained outcome recorded', noticeHours };
}

export function validateBookingWindow(startAt: Date, endAt: Date) {
  if (endAt <= startAt) throw new Error('Return must be after pickup.');
  for (const date of [startAt, endAt]) {
    const {hour,minute}=arizonaParts(date);
    if (minute % 15 !== 0) throw new Error('Pickup and return must use 15-minute increments.');
    if (hour < 6 || hour > 22 || (hour === 22 && minute > 0)) throw new Error('Times must be between 6:00 AM and 10:00 PM Arizona time.');
  }
}
export function qualifiesRenter(input: { age: number; internationalUse: boolean; namedRenterWillTow: boolean }) { return input.age >= 25 && !input.internationalUse && input.namedRenterWillTow; }
