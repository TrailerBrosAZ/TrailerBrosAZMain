import { describe, expect, it } from 'vitest';
import { cancellationOutcome, canTransition, qualifiesRenter, validateBookingWindow } from '../src/shared/domain.js';

describe('reservation lifecycle', () => {
  it('allows only approved forward transitions', () => { expect(canTransition('CONFIRMED','PICKED_UP')).toBe(true); expect(canTransition('CONFIRMED','COMPLETED')).toBe(false); expect(canTransition('COMPLETED','CONFIRMED')).toBe(false); });
});
describe('cancellation outcomes', () => {
  const pickupAt=new Date('2027-01-10T15:00:00Z');
  it('fully refunds with at least 48 hours notice',()=>expect(cancellationOutcome({pickupAt,cancelledAt:new Date('2027-01-08T15:00:00Z'),rentalChargeCents:18000})).toEqual({rentalRefundCents:18000,retainedCents:0,label:'Full refund'}));
  it('retains $100 inside 48 hours',()=>expect(cancellationOutcome({pickupAt,cancelledAt:new Date('2027-01-09T15:01:00Z'),rentalChargeCents:18000}).retainedCents).toBe(10000));
  it('never retains more than the rental amount',()=>expect(cancellationOutcome({pickupAt,cancelledAt:pickupAt,rentalChargeCents:6000,noShow:true})).toMatchObject({rentalRefundCents:0,retainedCents:6000}));
});
describe('qualification and operating window',()=>{
  it('requires age 25, named renter towing, and domestic use',()=>{expect(qualifiesRenter({age:25,internationalUse:false,namedRenterWillTow:true})).toBe(true);expect(qualifiesRenter({age:24,internationalUse:false,namedRenterWillTow:true})).toBe(false);expect(qualifiesRenter({age:30,internationalUse:true,namedRenterWillTow:true})).toBe(false)});
  it('requires 30-minute increments and operating hours',()=>{expect(()=>validateBookingWindow(new Date(2027,1,1,6,0),new Date(2027,1,1,22,0))).not.toThrow();expect(()=>validateBookingWindow(new Date(2027,1,1,5,30),new Date(2027,1,1,8,0))).toThrow(/6:00 AM/);expect(()=>validateBookingWindow(new Date(2027,1,1,8,15),new Date(2027,1,1,9,0))).toThrow(/30-minute/)});
});
