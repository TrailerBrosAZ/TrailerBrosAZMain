import { describe, expect, it } from 'vitest';
import { ownerDeliveryPresentation } from '../src/shared/deliveryPresentation.js';
import type { OwnerDeliveryIntent } from '../src/shared/deliveryPresentation.js';

const intent=(overrides:Record<string,unknown>={}):OwnerDeliveryIntent=>({fulfillment_type:'DELIVERY',...overrides});

describe('owner delivery presentation',()=>{
 it('clearly labels an automatic zone quote',()=>expect(ownerDeliveryPresentation(intent({delivery_quote_status:'AVAILABLE',delivery_zone:'ZONE_2',delivery_charge_cents:4000,delivery_quoted_at:'2027-01-01T15:00:00.000Z'}))).toEqual({status:'Automatically calculated — owner approval required',zone:'Zone 2',fee:'$40.00',timestamp:'Jan 1, 2027, 8:00 AM',calculation:'Automatic Routes quote snapshot'}));
 it('clearly labels outside-area delivery without a fee',()=>expect(ownerDeliveryPresentation(intent({delivery_quote_status:'OUT_OF_AREA',delivery_quoted_at:'2027-01-01T15:00:00.000Z'}))).toMatchObject({status:'Unavailable for online delivery',zone:'Outside online service area',fee:'Unavailable'}));
 it('clearly labels safe routing failure without inventing a fee',()=>expect(ownerDeliveryPresentation(intent({delivery_quote_status:'ROUTING_UNAVAILABLE'}))).toEqual({status:'Owner review required',zone:'Unavailable',fee:'Not calculated',timestamp:'Unavailable',calculation:'Routing unavailable; no fee was invented'}));
 it('does not expose origin, route, map, key, or exact distance',()=>expect(JSON.stringify(ownerDeliveryPresentation(intent({delivery_quote_status:'AVAILABLE',delivery_zone:'ZONE_1',delivery_charge_cents:2000})))).not.toMatch(/origin|map|api key|distance/i));
});
