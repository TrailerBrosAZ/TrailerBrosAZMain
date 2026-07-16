export const METERS_PER_MILE = 1609.344;
export const DELIVERY_QUOTE_LIMIT_PER_HOUR = 20;

export type DeliveryZone = 'ZONE_1' | 'ZONE_2' | 'ZONE_3';
export type DeliveryQuoteResult =
  | { status: 'AVAILABLE'; zone: DeliveryZone; feeCents: number; distanceMeters: number; quotedAt: string }
  | { status: 'OUT_OF_AREA'; zone: null; feeCents: null; distanceMeters: number; quotedAt: string }
  | { status: 'ROUTING_UNAVAILABLE'; zone: null; feeCents: null; distanceMeters: null; quotedAt: string };

export function deliveryZoneForMiles(miles: number): { zone: DeliveryZone; feeCents: number } | null {
  if (!Number.isFinite(miles) || miles < 0) throw new Error('Delivery distance must be nonnegative.');
  if (miles <= 10) return { zone: 'ZONE_1', feeCents: 2000 };
  if (miles <= 20) return { zone: 'ZONE_2', feeCents: 4000 };
  if (miles <= 35) return { zone: 'ZONE_3', feeCents: 6000 };
  return null;
}

export function deliveryQuoteFromMeters(distanceMeters: number, quotedAt = new Date().toISOString()): DeliveryQuoteResult {
  const price = deliveryZoneForMiles(distanceMeters / METERS_PER_MILE);
  return price
    ? { status: 'AVAILABLE', ...price, distanceMeters, quotedAt }
    : { status: 'OUT_OF_AREA', zone: null, feeCents: null, distanceMeters, quotedAt };
}

export const routingUnavailable = (quotedAt = new Date().toISOString()): DeliveryQuoteResult => ({
  status: 'ROUTING_UNAVAILABLE', zone: null, feeCents: null, distanceMeters: null, quotedAt,
});

export function customerDeliveryQuote(quote: DeliveryQuoteResult) {
  return { status: quote.status, available: quote.status === 'AVAILABLE', zone: quote.zone, feeCents: quote.feeCents, quotedAt: quote.quotedAt };
}
