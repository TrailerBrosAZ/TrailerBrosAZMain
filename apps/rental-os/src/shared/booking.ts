import { validateBookingWindow } from './domain.js';

export const BOOKING_INTENT_TTL_MINUTES=30;
export const REVIEW_REQUIRED_INTENT_TTL_HOURS=24;
export const RENTAL_DAY_CENTS=6000;
export const EXTRA_HOUR_CENTS=1000;
export const SECURITY_DEPOSIT_CENTS=10000;
export const DOLLY_DAY_CENTS=1000;
export const BOOKING_TIME_OPTIONS=Array.from({length:65},(_,index)=>{const minutes=360+index*15;const hour=Math.floor(minutes/60);const minute=minutes%60;const value=`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;const displayHour=hour>12?hour-12:hour;return{value,label:`${displayHour}:${String(minute).padStart(2,'0')} ${hour>=12?'PM':'AM'}`}});

export type BookingQuote={durationMinutes:number;fullDays:number;extraHours:number;extraHourChargeCents:number;extraHourCapped:boolean;rentalDays:number;rentalChargeCents:number;dollyChargeCents:number;securityDepositCents:number;deliveryChargeCents:null;estimatedDueBeforeDeliveryCents:number;taxCents:number;towStrapsIncluded:true};

export function calculateBookingQuote(pickupAt:Date,returnAt:Date,dollyRequested:boolean):BookingQuote{
  validateBookingWindow(pickupAt,returnAt);
  const durationMinutes=Math.ceil((returnAt.getTime()-pickupAt.getTime())/60_000);
  const fullDays=Math.floor(durationMinutes/1440);
  const remainingMinutes=durationMinutes%1440;
  const extraHours=remainingMinutes?Math.ceil(remainingMinutes/60):0;
  const rawExtra=extraHours*EXTRA_HOUR_CENTS;
  const extraHourChargeCents=Math.min(rawExtra,RENTAL_DAY_CENTS);
  const rentalDays=Math.max(1,Math.ceil(durationMinutes/1440));
  const rentalChargeCents=fullDays*RENTAL_DAY_CENTS+extraHourChargeCents;
  const dollyChargeCents=dollyRequested?rentalDays*DOLLY_DAY_CENTS:0;
  return{durationMinutes,fullDays,extraHours,extraHourChargeCents,extraHourCapped:rawExtra>RENTAL_DAY_CENTS,rentalDays,rentalChargeCents,dollyChargeCents,securityDepositCents:SECURITY_DEPOSIT_CENTS,deliveryChargeCents:null,estimatedDueBeforeDeliveryCents:rentalChargeCents+dollyChargeCents+SECURITY_DEPOSIT_CENTS,taxCents:0,towStrapsIncluded:true};
}

export type BookingIntentState='SUBMITTED'|'REVIEW_REQUIRED';

export function bookingIntentPolicy(now:Date,reviewRequired:boolean){
  const status:BookingIntentState=reviewRequired?'REVIEW_REQUIRED':'SUBMITTED';
  const ttlMinutes=reviewRequired?REVIEW_REQUIRED_INTENT_TTL_HOURS*60:BOOKING_INTENT_TTL_MINUTES;
  return{status,expiresAt:new Date(now.getTime()+ttlMinutes*60_000)};
}

export function bookingIntentExpiration(now:Date,reviewRequired=false){return bookingIntentPolicy(now,reviewRequired).expiresAt}
