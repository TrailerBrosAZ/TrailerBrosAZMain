import { customerDeliveryQuote, deliveryQuoteFromMeters, routingUnavailable, type DeliveryQuoteResult } from '../shared/delivery.js';

export interface DeliveryRouter { quote(destination: string, now: Date): Promise<DeliveryQuoteResult> }
export const unavailableDeliveryRouter: DeliveryRouter = { quote: async (_destination, now) => routingUnavailable(now.toISOString()) };

type RoutesError = { error?: { status?: string; message?: string; details?: Array<{ reason?: string }> } };
export function extractFirstRouteDistanceMeters(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object') return null;
  const routes = (payload as { routes?: unknown }).routes;
  if (!Array.isArray(routes) || routes.length === 0) return null;
  const firstRoute = routes[0];
  if (!firstRoute || typeof firstRoute !== 'object') return null;
  const rawDistance = (firstRoute as { distanceMeters?: unknown }).distanceMeters;
  const distance = typeof rawDistance === 'number'
    ? rawDistance
    : typeof rawDistance === 'string' && /^\d+(?:\.\d+)?$/.test(rawDistance)
      ? Number(rawDistance)
      : Number.NaN;
  return Number.isFinite(distance) && distance >= 0 ? distance : null;
}
export function classifyRoutesFailure(httpStatus:number,payload:RoutesError={}){
  const googleStatus=String(payload.error?.status||'UNKNOWN');const reason=String(payload.error?.details?.[0]?.reason||'');const message=String(payload.error?.message||'').toLowerCase();
  if(httpStatus===429||googleStatus==='RESOURCE_EXHAUSTED')return{googleStatus,category:'QUOTA_OR_RATE_LIMIT'};
  if(message.includes('billing'))return{googleStatus,category:'BILLING_NOT_ACTIVE'};
  if(message.includes('has not been used')||message.includes('is disabled'))return{googleStatus,category:'ROUTES_API_NOT_ENABLED'};
  if(httpStatus===403||googleStatus==='PERMISSION_DENIED'||reason.includes('API_KEY'))return{googleStatus,category:'API_KEY_OR_RESTRICTION'};
  if(httpStatus===400||googleStatus==='INVALID_ARGUMENT')return{googleStatus,category:'REQUEST_OR_WAYPOINT_INVALID'};
  return{googleStatus,category:'UPSTREAM_UNAVAILABLE'};
}
export function createGoogleRoutesDeliveryRouter(apiKey?: string, origin?: string, fetcher: typeof fetch = fetch): DeliveryRouter {
  if (!apiKey || !origin) { console.warn(JSON.stringify({event:'delivery_routes_configuration_missing',apiKeyPresent:Boolean(apiKey),originPresent:Boolean(origin)}));return unavailableDeliveryRouter; }
  return {
    async quote(destination, now) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetcher('https://routes.googleapis.com/directions/v2:computeRoutes', {
          method: 'POST', signal: controller.signal,
          headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey, 'x-goog-fieldmask': 'routes.distanceMeters' },
          body: JSON.stringify({ origin: { address: origin }, destination: { address: destination }, travelMode: 'DRIVE' }),
        });
        if (!response.ok) {let payload:RoutesError={};try{payload=await response.json() as RoutesError}catch{payload={}}const failure=classifyRoutesFailure(response.status,payload);console.warn(JSON.stringify({event:'delivery_routes_upstream_failure',httpStatus:response.status,...failure,apiKeyPresent:true,originPresent:true}));return routingUnavailable(now.toISOString());}
        const payload: unknown = await response.json();
        const meters = extractFirstRouteDistanceMeters(payload);
        if (meters === null) {
          console.warn(JSON.stringify({ event: 'delivery_routes_response_unusable', httpStatus: response.status, category: 'NO_USABLE_ROUTE_DISTANCE' }));
          return routingUnavailable(now.toISOString());
        }
        return deliveryQuoteFromMeters(meters, now.toISOString());
      } catch(error) { console.warn(JSON.stringify({event:'delivery_routes_transport_failure',category:error instanceof DOMException&&error.name==='AbortError'?'TIMEOUT':'NETWORK_OR_RUNTIME',apiKeyPresent:true,originPresent:true}));return routingUnavailable(now.toISOString()); }
      finally { clearTimeout(timeout); }
    },
  };
}

export { customerDeliveryQuote };
