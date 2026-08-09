export const METERS_PER_MILE = 1609.344;
export const DELIVERY_QUOTE_LIMIT_PER_HOUR = 20;

export const DELIVERY_RATE_CENTS_PER_ONE_WAY_MILE=250;
export type DeliveryZone = 'PER_MILE';
export type DeliveryQuoteResult =
  | { status: 'AVAILABLE'; zone: DeliveryZone; feeCents: number; billableMiles:number; distanceMeters: number; quotedAt: string }
  | { status: 'OUT_OF_AREA'; zone: null; feeCents: null; distanceMeters: number; quotedAt: string }
  | { status: 'ROUTING_UNAVAILABLE'; zone: null; feeCents: null; distanceMeters: null; quotedAt: string };

export function deliveryZoneForMiles(miles: number): { zone: DeliveryZone; feeCents: number; billableMiles:number } {
  if (!Number.isFinite(miles) || miles < 0) throw new Error('Delivery distance must be nonnegative.');
  const billableMiles=Math.ceil(miles);
  return {zone:'PER_MILE',billableMiles,feeCents:billableMiles*DELIVERY_RATE_CENTS_PER_ONE_WAY_MILE};
}

export function deliveryQuoteFromMeters(distanceMeters: number, quotedAt = new Date().toISOString()): DeliveryQuoteResult {
  const price = deliveryZoneForMiles(distanceMeters / METERS_PER_MILE);
  return { status: 'AVAILABLE', ...price, distanceMeters, quotedAt };
}

export const routingUnavailable = (quotedAt = new Date().toISOString()): DeliveryQuoteResult => ({
  status: 'ROUTING_UNAVAILABLE', zone: null, feeCents: null, distanceMeters: null, quotedAt,
});

export function customerDeliveryQuote(quote: DeliveryQuoteResult) {
  return { status: quote.status, available: quote.status === 'AVAILABLE', pricingMethod:quote.status==='AVAILABLE'?'ONE_WAY_ROAD_MILES_ROUNDED_UP':null, billableMiles:quote.status==='AVAILABLE'?quote.billableMiles:null, rateCentsPerMile:quote.status==='AVAILABLE'?DELIVERY_RATE_CENTS_PER_ONE_WAY_MILE:null, feeCents: quote.feeCents, quotedAt: quote.quotedAt };
}
