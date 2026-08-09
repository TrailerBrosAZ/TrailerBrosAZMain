import { describe, expect, it, vi } from 'vitest';
import { deliveryQuoteFromMeters, deliveryZoneForMiles, METERS_PER_MILE } from '../src/shared/delivery.js';
import { classifyRoutesFailure, createGoogleRoutesDeliveryRouter, extractFirstRouteDistanceMeters } from '../src/server/delivery.js';

describe('delivery quoting',()=>{
  it.each([[0,0,0],[3.56,4,1000],[10,10,2500],[10.001,11,2750],[35.001,36,9000]])('prices %s one-way road miles', (miles,billableMiles,feeCents)=>expect(deliveryZoneForMiles(Number(miles))).toEqual({zone:'PER_MILE',billableMiles,feeCents}));
  it('uses distance meters without exposing route details',()=>expect(deliveryQuoteFromMeters(10*METERS_PER_MILE)).toMatchObject({status:'AVAILABLE',zone:'PER_MILE',billableMiles:10,feeCents:2500}));
  it('extracts the first distance from the documented Routes response',()=>expect(extractFirstRouteDistanceMeters({routes:[{distanceMeters:772}]})).toBe(772));
  it('safely rejects empty, missing, and malformed Routes responses',()=>{
    expect(extractFirstRouteDistanceMeters({routes:[]})).toBeNull();
    expect(extractFirstRouteDistanceMeters({routes:[{}]})).toBeNull();
    expect(extractFirstRouteDistanceMeters({routes:[{distanceMeters:'not-a-distance'}]})).toBeNull();
    expect(extractFirstRouteDistanceMeters(null)).toBeNull();
  });
  it('accepts a finite numeric distance serialized on the wire as text',()=>expect(extractFirstRouteDistanceMeters({routes:[{distanceMeters:'772'}]})).toBe(772));
  it('calls Routes once with the documented endpoint and exact field-mask header token',async()=>{const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({routes:[{distanceMeters:16093.44}]}),{status:200}));const quote=await createGoogleRoutesDeliveryRouter('test-key','test-origin',fetcher).quote('test destination',new Date('2027-01-01T00:00:00Z'));expect(quote).toMatchObject({status:'AVAILABLE',zone:'PER_MILE',feeCents:2500});expect(fetcher).toHaveBeenCalledTimes(1);const [endpoint,init]=fetcher.mock.calls[0] as [string,RequestInit];expect(endpoint).toBe('https://routes.googleapis.com/directions/v2:computeRoutes');expect(init.headers).toMatchObject({'x-goog-api-key':'test-key','x-goog-fieldmask':'routes.distanceMeters'});expect(init.headers).not.toHaveProperty('x-goog-field-mask');expect(String(init.body)).not.toContain('test-key');const failed=await createGoogleRoutesDeliveryRouter('test-key','test-origin',vi.fn().mockResolvedValue(new Response('',{status:503}))).quote('test destination',new Date('2027-01-01T00:00:00Z'));expect(failed).toMatchObject({status:'ROUTING_UNAVAILABLE',feeCents:null});});
  it('classifies upstream diagnostics without retaining response detail',()=>{expect(classifyRoutesFailure(403,{error:{status:'PERMISSION_DENIED',message:'API key blocked'}})).toEqual({googleStatus:'PERMISSION_DENIED',category:'API_KEY_OR_RESTRICTION'});expect(classifyRoutesFailure(400,{error:{status:'INVALID_ARGUMENT'}})).toEqual({googleStatus:'INVALID_ARGUMENT',category:'REQUEST_OR_WAYPOINT_INVALID'});expect(JSON.stringify(classifyRoutesFailure(403,{error:{status:'PERMISSION_DENIED',message:'sensitive detail'}}))).not.toContain('sensitive detail');});
});
