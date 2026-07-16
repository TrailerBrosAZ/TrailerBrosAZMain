export const SECURITY_DEPOSIT_CENTS = 10_000;
export type PaymentBreakdown = { rentalCents:number; dollyCents:number; deliveryCents:number; depositCents:number; taxCents:0; totalCents:number };
export type PaymentLedgerKind = 'PAYMENT_COLLECTED'|'PAYMENT_FAILED'|'REFUND_SUCCEEDED'|'REFUND_FAILED'|'DEPOSIT_RETAINED'|'DISPUTE_OPENED'|'DISPUTE_RESOLVED'|'RECONCILIATION_REQUIRED';

export function paymentBreakdown(input:{rentalChargeCents:number;dollyDays:number;deliveryChargeCents?:number|null}):PaymentBreakdown{
  const rentalCents=Math.max(0,Math.trunc(input.rentalChargeCents));
  const dollyCents=Math.max(0,Math.trunc(input.dollyDays))*1_000;
  const deliveryCents=Math.max(0,Math.trunc(input.deliveryChargeCents||0));
  return {rentalCents,dollyCents,deliveryCents,depositCents:SECURITY_DEPOSIT_CENTS,taxCents:0,totalCents:rentalCents+dollyCents+deliveryCents+SECURITY_DEPOSIT_CENTS};
}

export function cancellationRefund(input:{paid:PaymentBreakdown;pickupAt:Date;decidedAt:Date;noShow:boolean}){
  const noticeHours=(input.pickupAt.getTime()-input.decidedAt.getTime())/3_600_000;
  const full=!input.noShow&&noticeHours>=48;
  return {noticeHours,refundCents:full?input.paid.totalCents:input.paid.totalCents-input.paid.depositCents,retainedCents:full?0:input.paid.depositCents,policy:full?'FULL_REFUND':'RETAIN_DEPOSIT'} as const;
}

export function depositRefund(amountCollectedCents:number){return Math.min(SECURITY_DEPOSIT_CENTS,Math.max(0,Math.trunc(amountCollectedCents)));}
