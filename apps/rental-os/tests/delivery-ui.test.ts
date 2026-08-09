import { describe, expect, it } from 'vitest';
import { ownerDeliveryPresentation,type OwnerDeliveryIntent } from '../src/shared/deliveryPresentation.js';
const intent=(overrides:Record<string,unknown>={}):OwnerDeliveryIntent=>({fulfillment_type:'DELIVERY',...overrides});
describe('owner delivery presentation',()=>{
 it('clearly labels an automatic per-mile quote',()=>expect(ownerDeliveryPresentation(intent({delivery_quote_status:'AVAILABLE',delivery_distance_meters:5729,delivery_charge_cents:1000,delivery_quoted_at:'2027-01-01T15:00:00.000Z'}))).toEqual({status:'Automatically calculated - owner approval required',zone:'Per-mile delivery',fee:'$10.00',timestamp:'Jan 1, 2027, 8:00 AM',calculation:'4 billable one-way road miles (rounded up) at $2.50/mile'}));
 it('fails closed without a route fee',()=>expect(ownerDeliveryPresentation(intent({delivery_quote_status:'OUT_OF_AREA',delivery_quoted_at:'2027-01-01T15:00:00.000Z'}))).toMatchObject({status:'Requires owner review',zone:'Not quoted',fee:'Unavailable'}));
 it('clearly labels safe routing failure without inventing a fee',()=>expect(ownerDeliveryPresentation(intent({delivery_quote_status:'ROUTING_UNAVAILABLE'}))).toEqual({status:'Owner review required',zone:'Unavailable',fee:'Not calculated',timestamp:'Unavailable',calculation:'Routing unavailable; no fee was invented'}));
 it('does not expose origin, route, map, key, or raw exact distance',()=>expect(JSON.stringify(ownerDeliveryPresentation(intent({delivery_quote_status:'AVAILABLE',delivery_distance_meters:5729,delivery_charge_cents:1000})))).not.toMatch(/origin|map|api key|5729/i));
});
