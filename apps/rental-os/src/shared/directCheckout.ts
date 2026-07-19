import { calculateBookingQuote, SECURITY_DEPOSIT_CENTS } from './booking.js';

export const DIRECT_CHECKOUT_TTL_MINUTES=30;
export const DIRECT_CHECKOUT_STATES=['QUOTE_READY','AGREEMENT_REQUIRED','AGREEMENT_SIGNED','PAYMENT_REQUIRED','PAYMENT_PENDING','PAYMENT_COLLECTED','CONFIRMATION_PENDING','COMPLETE','OWNER_REVIEW_REQUIRED','UNAVAILABLE','EXPIRED','ABANDONED','REVOKED'] as const;
export type DirectCheckoutState=typeof DIRECT_CHECKOUT_STATES[number];
export const DIRECT_CHECKOUT_TERMINAL_STATES:DirectCheckoutState[]=['COMPLETE','OWNER_REVIEW_REQUIRED','UNAVAILABLE','EXPIRED','ABANDONED','REVOKED'];

const transitions:Record<DirectCheckoutState,DirectCheckoutState[]>={
 QUOTE_READY:['AGREEMENT_REQUIRED','OWNER_REVIEW_REQUIRED','UNAVAILABLE','EXPIRED','ABANDONED','REVOKED'],
 AGREEMENT_REQUIRED:['AGREEMENT_SIGNED','OWNER_REVIEW_REQUIRED','UNAVAILABLE','EXPIRED','ABANDONED','REVOKED'],
 AGREEMENT_SIGNED:['PAYMENT_REQUIRED','OWNER_REVIEW_REQUIRED','UNAVAILABLE','EXPIRED','ABANDONED','REVOKED'],
 PAYMENT_REQUIRED:['PAYMENT_PENDING','OWNER_REVIEW_REQUIRED','UNAVAILABLE','EXPIRED','ABANDONED','REVOKED'],
 PAYMENT_PENDING:['PAYMENT_COLLECTED','PAYMENT_REQUIRED','OWNER_REVIEW_REQUIRED','UNAVAILABLE','EXPIRED','ABANDONED','REVOKED'],
 PAYMENT_COLLECTED:['CONFIRMATION_PENDING','UNAVAILABLE','REVOKED'],
 CONFIRMATION_PENDING:['COMPLETE','REVOKED'],COMPLETE:[],OWNER_REVIEW_REQUIRED:[],UNAVAILABLE:[],EXPIRED:[],ABANDONED:[],REVOKED:[],
};
export function canCheckoutTransition(from:DirectCheckoutState,to:DirectCheckoutState){return transitions[from]?.includes(to)||false}
export function checkoutOperationalState(state:DirectCheckoutState,expiresAt:string,now=new Date()):DirectCheckoutState{return !DIRECT_CHECKOUT_TERMINAL_STATES.includes(state)&&Date.parse(expiresAt)<=now.getTime()?'EXPIRED':state}
export function customerCheckoutState(state:DirectCheckoutState){return ({QUOTE_READY:'Quote ready',AGREEMENT_REQUIRED:'Agreement required',AGREEMENT_SIGNED:'Agreement complete',PAYMENT_REQUIRED:'Payment required',PAYMENT_PENDING:'Payment processing',PAYMENT_COLLECTED:'Payment received',CONFIRMATION_PENDING:'Confirming reservation',COMPLETE:'Reservation confirmed',OWNER_REVIEW_REQUIRED:'Owner review required',UNAVAILABLE:'Dates no longer available',EXPIRED:'Checkout expired',ABANDONED:'Checkout closed',REVOKED:'Checkout unavailable'} satisfies Record<DirectCheckoutState,string>)[state]}

export function directCheckoutBlockers(intent:Record<string,unknown>){const blockers:string[]=[];
 if(Number(intent.is_synthetic)!==1)blockers.push('SYNTHETIC_STAGING_ONLY');
 if(String(intent.status)!=='SUBMITTED')blockers.push(String(intent.status)==='REVIEW_REQUIRED'?'OWNER_REVIEW_REQUIRED':'INTENT_NOT_ELIGIBLE');
 if(String(intent.trip_type)!=='IN_STATE')blockers.push('INTERSTATE_OWNER_REVIEW');
 if(String(intent.fulfillment_type)!=='PICKUP')blockers.push('DELIVERY_OWNER_REVIEW');
 if([intent.age_25_confirmed,intent.named_renter_only_towing,intent.hitch_ball_acknowledged,intent.brake_controller_acknowledged,intent.insurance_acknowledged].some(value=>Number(value)!==1))blockers.push('QUALIFICATION_INCOMPLETE');
 return blockers;
}
export function checkoutQuoteSnapshot(intent:Record<string,unknown>){const quote=calculateBookingQuote(new Date(String(intent.pickup_at)),new Date(String(intent.return_at)),Number(intent.dolly_requested)===1);return{rentalChargeCents:quote.rentalChargeCents,dollyChargeCents:quote.dollyChargeCents,deliveryChargeCents:0,securityDepositCents:SECURITY_DEPOSIT_CENTS,taxCents:0,totalCents:quote.estimatedDueBeforeDeliveryCents,rentalDays:quote.rentalDays,pickupAt:String(intent.pickup_at),returnAt:String(intent.return_at),trailerId:Number(intent.trailer_id)}}
export async function checkoutSnapshotHash(value:unknown){const encoded=new TextEncoder().encode(JSON.stringify(value));return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoded))).map(byte=>byte.toString(16).padStart(2,'0')).join('')}
