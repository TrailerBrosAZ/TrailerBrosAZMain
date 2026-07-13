export const externalSources = ['BIG_RENTALS', 'NEIGHBORS_TRAILER', 'FACEBOOK_MARKETPLACE', 'OTHER'] as const;
export type ExternalSource = (typeof externalSources)[number];

export const reservationStatuses = ['DRAFT', 'PENDING_REVIEW', 'PENDING_AGREEMENT', 'PENDING_PAYMENT', 'CONFIRMED', 'PICKED_UP', 'RETURNED_PENDING_INSPECTION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;
export type ReservationStatus = (typeof reservationStatuses)[number];
export const blockingStatuses: ReservationStatus[] = ['PENDING_REVIEW', 'PENDING_AGREEMENT', 'PENDING_PAYMENT', 'CONFIRMED', 'PICKED_UP', 'RETURNED_PENDING_INSPECTION'];

const transitions: Record<ReservationStatus, ReservationStatus[]> = {
  DRAFT: ['PENDING_REVIEW', 'CANCELLED'],
  PENDING_REVIEW: ['PENDING_AGREEMENT', 'CANCELLED'],
  PENDING_AGREEMENT: ['PENDING_PAYMENT', 'CANCELLED'],
  PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PICKED_UP', 'CANCELLED', 'NO_SHOW'],
  PICKED_UP: ['RETURNED_PENDING_INSPECTION'],
  RETURNED_PENDING_INSPECTION: ['COMPLETED'],
  COMPLETED: [], CANCELLED: [], NO_SHOW: [],
};

export function canTransition(from: ReservationStatus, to: ReservationStatus) {
  return transitions[from].includes(to);
}

export type CancellationOutcome = { rentalRefundCents: number; retainedCents: number; label: string };
export function cancellationOutcome(input: { pickupAt: Date; cancelledAt: Date; rentalChargeCents: number; noShow?: boolean }): CancellationOutcome {
  const noticeHours = (input.pickupAt.getTime() - input.cancelledAt.getTime()) / 3_600_000;
  if (!input.noShow && noticeHours >= 48) return { rentalRefundCents: input.rentalChargeCents, retainedCents: 0, label: 'Full refund' };
  const retainedCents = Math.min(10_000, input.rentalChargeCents);
  return { rentalRefundCents: input.rentalChargeCents - retainedCents, retainedCents, label: input.noShow ? 'No-show — $100 forfeited' : 'Late cancellation — $100 forfeited' };
}

export function validateBookingWindow(startAt: Date, endAt: Date) {
  if (endAt <= startAt) throw new Error('Return must be after pickup.');
  for (const date of [startAt, endAt]) {
    const minutes = date.getMinutes();
    if (minutes !== 0 && minutes !== 30) throw new Error('Times must use 30-minute increments.');
    const hour = date.getHours();
    if (hour < 6 || hour > 22 || (hour === 22 && minutes > 0)) throw new Error('Times must be between 6:00 AM and 10:00 PM Arizona time.');
  }
}

export function qualifiesRenter(input: { age: number; internationalUse: boolean; namedRenterWillTow: boolean }) {
  return input.age >= 25 && !input.internationalUse && input.namedRenterWillTow;
}
