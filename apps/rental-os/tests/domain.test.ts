import { describe, expect, it } from 'vitest';
import { cancellationOutcome, canTransition, operationalStatus, qualifiesRenter, reservationStatuses, validateBookingWindow } from '../src/shared/domain.js';

describe('reservation lifecycle', () => {
  it('uses only the approved persisted statuses', () => {
    expect(reservationStatuses).toEqual(['PENDING_REVIEW','CONFIRMED','CHECKED_OUT','INSPECTION_PENDING','COMPLETED','CANCELLED','NO_SHOW']);
  });
  it('allows only approved transitions', () => {
    expect(canTransition('PENDING_REVIEW','CONFIRMED')).toBe(true);
    expect(canTransition('CONFIRMED','CHECKED_OUT')).toBe(true);
    expect(canTransition('CHECKED_OUT','INSPECTION_PENDING')).toBe(true);
    expect(canTransition('INSPECTION_PENDING','COMPLETED')).toBe(true);
    expect(canTransition('CONFIRMED','COMPLETED')).toBe(false);
    expect(canTransition('COMPLETED','CONFIRMED')).toBe(false);
  });
  it('derives pickup and return due without persisting them', () => {
    const now=new Date('2027-01-10T15:00:00Z');
    expect(operationalStatus('CONFIRMED',new Date('2027-01-10T14:00:00Z'),new Date('2027-01-11T14:00:00Z'),now)).toBe('PICKUP_DUE');
    expect(operationalStatus('CHECKED_OUT',new Date('2027-01-09T14:00:00Z'),new Date('2027-01-10T14:00:00Z'),now)).toBe('RETURN_DUE');
  });
});

describe('cancellation outcomes', () => {
  const pickupAt=new Date('2027-01-10T15:00:00Z');
  it('records a full rental refund at the exact 48-hour boundary',()=>expect(cancellationOutcome({pickupAt,decidedAt:new Date('2027-01-08T15:00:00Z'),rentalChargeCents:18000})).toMatchObject({rentalRefundCents:18000,retainedCents:0}));
  it('records the rental refund separately from the $100 late outcome',()=>expect(cancellationOutcome({pickupAt,decidedAt:new Date('2027-01-08T15:00:01Z'),rentalChargeCents:18000})).toMatchObject({rentalRefundCents:18000,retainedCents:10000}));
  it('records the $100 no-show outcome without an inspection',()=>expect(cancellationOutcome({pickupAt,decidedAt:pickupAt,rentalChargeCents:6000,noShow:true})).toMatchObject({rentalRefundCents:6000,retainedCents:10000}));
});

describe('qualification and operating window',()=>{
  it('requires age 25, named renter towing, and domestic use',()=>{expect(qualifiesRenter({age:25,internationalUse:false,namedRenterWillTow:true})).toBe(true);expect(qualifiesRenter({age:24,internationalUse:false,namedRenterWillTow:true})).toBe(false);expect(qualifiesRenter({age:30,internationalUse:true,namedRenterWillTow:true})).toBe(false)});
  it('accepts every 15-minute increment within operating-hour boundaries',()=>{for(const minute of [0,15,30,45])expect(()=>validateBookingWindow(new Date(2027,1,1,6,minute),new Date(2027,1,1,8,minute))).not.toThrow();expect(()=>validateBookingWindow(new Date(2027,1,1,6,0),new Date(2027,1,1,22,0))).not.toThrow()});
  it('rejects arbitrary minutes and times outside operating hours',()=>{expect(()=>validateBookingWindow(new Date(2027,1,1,8,22),new Date(2027,1,1,9,0))).toThrow(/15-minute/);expect(()=>validateBookingWindow(new Date(2027,1,1,5,45),new Date(2027,1,1,8,0))).toThrow(/6:00 AM/);expect(()=>validateBookingWindow(new Date(2027,1,1,8,0),new Date(2027,1,1,22,15))).toThrow(/6:00 AM/)});
});
