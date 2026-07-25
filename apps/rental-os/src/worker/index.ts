import { handleApiRequest, handleStripeWebhookRequest } from '../server/api.js';
import { AuthorizationError, authorizeIdentity, type AuthEnvironment } from '../server/auth.js';
import { createD1DatabasePort, type D1DatabaseLike } from './d1.js';
import { createGoogleRoutesDeliveryRouter } from '../server/delivery.js';
import { createStripeTestPaymentProvider, createStripeTestWebhookVerifier } from '../server/paymentProvider.js';

export type WorkerEnvironment = AuthEnvironment & { DB?: D1DatabaseLike; ASSETS?: { fetch(request: Request): Promise<Response> }; GOOGLE_MAPS_API_KEY?: string; DELIVERY_ORIGIN?: string; STRIPE_TEST_SECRET_KEY?: string; STRIPE_TEST_PUBLISHABLE_KEY?: string; STRIPE_TEST_WEBHOOK_SECRET?: string; GMAIL_OAUTH_CLIENT_ID?:string;GMAIL_OAUTH_CLIENT_SECRET?:string;GMAIL_TOKEN_ENCRYPTION_KEY?:string;GMAIL_APPROVED_SENDER?:string;GMAIL_TEST_RECIPIENT?:string };
const placeholders = /CONFIGURE_|local-development-only/i;
export function validateWorkerEnvironment(env: WorkerEnvironment): asserts env is WorkerEnvironment & { DB: D1DatabaseLike; ASSETS: { fetch(request: Request): Promise<Response> } } {
  if (!env.DB || !env.ASSETS) throw new Error('Required Worker bindings are missing.');
  if (env.ENVIRONMENT !== 'development' && [env.ALLOWED_OWNER_EMAIL,env.ACCESS_TEAM_DOMAIN,env.ACCESS_AUD].some(value => !value || placeholders.test(value))) throw new Error('Non-development authorization is not configured.');
  if (env.ENVIRONMENT !== 'development' && env.AUTH_MODE !== 'cloudflare-access') throw new Error('Non-development environments require Cloudflare Access.');
}
export const worker = {
  async fetch(request: Request, env: WorkerEnvironment): Promise<Response> {
    try { validateWorkerEnvironment(env); } catch { return new Response('Service configuration unavailable.', { status: 503, headers: { 'cache-control': 'no-store' } }); }
    const url = new URL(request.url);
    if(url.pathname==='/api/payments/webhooks/stripe'){
      if(request.method.toUpperCase()!=='POST')return Response.json({error:'Method not allowed.'},{status:405,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}});
      if(!env.STRIPE_TEST_WEBHOOK_SECRET)return Response.json({error:'Webhook unavailable.'},{status:503,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}});
      try{return await handleStripeWebhookRequest(request,createD1DatabasePort(env.DB),createStripeTestWebhookVerifier(env.STRIPE_TEST_WEBHOOK_SECRET))}catch{return Response.json({error:'Webhook unavailable.'},{status:503,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}})}
    }
    if (url.pathname.startsWith('/api/')) {
      const stripeBindingsPresent=Boolean(env.STRIPE_TEST_SECRET_KEY||env.STRIPE_TEST_PUBLISHABLE_KEY||env.STRIPE_TEST_WEBHOOK_SECRET);
      const stripeConfigured=Boolean((env.STRIPE_TEST_SECRET_KEY?.startsWith('sk_test_')||env.STRIPE_TEST_SECRET_KEY?.startsWith('rk_test_'))&&env.STRIPE_TEST_PUBLISHABLE_KEY?.startsWith('pk_test_')&&env.STRIPE_TEST_WEBHOOK_SECRET?.startsWith('whsec_'));
      if(stripeBindingsPresent&&!stripeConfigured)return new Response('Stripe test configuration unavailable.',{status:503,headers:{'cache-control':'no-store'}});
      let paymentProvider;
      try { paymentProvider=stripeConfigured?createStripeTestPaymentProvider({secretKey:env.STRIPE_TEST_SECRET_KEY!,webhookSecret:env.STRIPE_TEST_WEBHOOK_SECRET!}):undefined; }
      catch { return new Response('Test payment configuration unavailable.',{status:503,headers:{'cache-control':'no-store'}}); }
      return handleApiRequest(request, { ...env, DB: createD1DatabasePort(env.DB) }, { deliveryRouter: createGoogleRoutesDeliveryRouter(env.GOOGLE_MAPS_API_KEY, env.DELIVERY_ORIGIN),paymentProvider,stripePublishableKey:stripeConfigured?env.STRIPE_TEST_PUBLISHABLE_KEY:undefined });
    }
    try {
      const identity=await authorizeIdentity(request,env);
      const testerAsset=url.pathname==='/customer-preview'||url.pathname.startsWith('/assets/')||url.pathname==='/tb-logo-circle.png'||url.pathname==='/favicon.svg';
      if(identity.role==='external-tester'&&!testerAsset)return new Response('Owner authorization required.',{status:403,headers:{'cache-control':'no-store'}});
    } catch (error) { const status = error instanceof AuthorizationError ? error.status : 401; return new Response('Authorization required.', { status, headers: { 'cache-control': 'no-store' } }); }
    const response = await env.ASSETS.fetch(request); const headers = new Headers(response.headers);
    headers.set('cache-control', 'private, no-store'); headers.set('x-content-type-options', 'nosniff'); headers.set('referrer-policy', 'no-referrer');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
export default worker;
