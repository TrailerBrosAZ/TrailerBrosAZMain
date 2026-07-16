export type ProviderPaymentStatus='SUCCEEDED'|'FAILED'|'REQUIRES_CONFIRMATION'|'PROCESSING';
export type ProviderResult={providerPaymentId:string;status:ProviderPaymentStatus;clientSecret?:string;failureCategory?:string};
export type RefundResult={providerRefundId:string;status:'SUCCEEDED'|'FAILED'|'PROCESSING';failureCategory?:string};
export type SanitizedWebhook={providerEventId:string;type:string;providerPaymentId:string;status:string;createdAt:string};
export interface PaymentProvider{
  readonly provider:'MOCK'|'STRIPE_TEST';
  createPayment(input:{amountCents:number;currency:'usd';idempotencyKey:string;metadata:{reservationId:string;synthetic:'true'}}):Promise<ProviderResult>;
  createRefund(input:{providerPaymentId:string;amountCents:number;idempotencyKey:string;reason:string}):Promise<RefundResult>;
  retrievePayment(providerPaymentId:string):Promise<ProviderResult>;
  verifyWebhook(rawBody:string,signature:string):Promise<SanitizedWebhook>;
}
export type StripeWebhookVerifier=Pick<PaymentProvider,'provider'|'verifyWebhook'>;

export function createMockPaymentProvider(options:{failPayments?:boolean;failRefunds?:boolean}={}):PaymentProvider{
  const payments=new Map<string,ProviderResult>();const refunds=new Map<string,RefundResult>();
  return {provider:'MOCK',
    async createPayment(input){const existing=payments.get(input.idempotencyKey);if(existing)return existing;const result:ProviderResult=options.failPayments?{providerPaymentId:`mock_pay_${input.idempotencyKey}`,status:'FAILED',failureCategory:'TEST_DECLINE'}:{providerPaymentId:`mock_pay_${input.idempotencyKey}`,status:'SUCCEEDED'};payments.set(input.idempotencyKey,result);return result},
    async createRefund(input){const existing=refunds.get(input.idempotencyKey);if(existing)return existing;const result:RefundResult=options.failRefunds?{providerRefundId:`mock_ref_${input.idempotencyKey}`,status:'FAILED',failureCategory:'TEST_REFUND_FAILURE'}:{providerRefundId:`mock_ref_${input.idempotencyKey}`,status:'SUCCEEDED'};refunds.set(input.idempotencyKey,result);return result},
    async retrievePayment(providerPaymentId){return{providerPaymentId,status:'SUCCEEDED'}},
    async verifyWebhook(rawBody,signature){if(signature!=='mock-valid')throw new Error('Webhook signature verification failed.');const parsed=JSON.parse(rawBody) as Record<string,unknown>;if(!parsed.id||!parsed.type)throw new Error('Webhook payload is incomplete.');return {providerEventId:String(parsed.id),type:String(parsed.type),providerPaymentId:parsed.paymentId?String(parsed.paymentId):'',status:String(parsed.status||'UNKNOWN'),createdAt:String(parsed.createdAt||new Date(0).toISOString())}}
  };
}

type StripeAdapterOptions={secretKey:string;webhookSecret:string;fetchImpl?:typeof fetch;now?:()=>number};
const stripeApi='https://api.stripe.com/v1';
function stripeStatus(status:string):ProviderPaymentStatus{return status==='succeeded'?'SUCCEEDED':status==='canceled'?'FAILED':status==='processing'?'PROCESSING':'REQUIRES_CONFIRMATION'}
async function stripeRequest(fetchImpl:typeof fetch,path:string,secretKey:string,idempotencyKey:string,form:URLSearchParams){
  const response=await fetchImpl(`${stripeApi}${path}`,{method:'POST',headers:{authorization:`Bearer ${secretKey}`,'content-type':'application/x-www-form-urlencoded','idempotency-key':idempotencyKey},body:form.toString()});
  const payload=await response.json() as Record<string,unknown>;
  if(!response.ok){const error=(payload.error||{}) as Record<string,unknown>;throw new Error(`Stripe request failed: ${String(error.type||'api_error')}`)}
  return payload;
}
function timingSafeEqual(left:string,right:string){const a=new TextEncoder().encode(left);const b=new TextEncoder().encode(right);if(a.length!==b.length)return false;let difference=0;for(let index=0;index<a.length;index++)difference|=a[index]^b[index];return difference===0}
async function hmacHex(secret:string,value:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const signature=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value));return Array.from(new Uint8Array(signature)).map(byte=>byte.toString(16).padStart(2,'0')).join('')}
export function createStripeTestWebhookVerifier(webhookSecret:string,now:()=>number=Date.now):StripeWebhookVerifier{if(!webhookSecret.startsWith('whsec_'))throw new Error('Stripe test webhook configuration is invalid.');return{provider:'STRIPE_TEST',async verifyWebhook(rawBody,signature){const parts=signature.split(',').map(part=>part.split('=',2));const timestamp=parts.find(([key])=>key==='t')?.[1];const signatures=parts.filter(([key])=>key==='v1').map(([,value])=>value);if(!timestamp||!signatures.length)throw new Error('Webhook signature verification failed.');if(Math.abs(Math.floor(now()/1000)-Number(timestamp))>300)throw new Error('Webhook signature timestamp is outside tolerance.');const expected=await hmacHex(webhookSecret,`${timestamp}.${rawBody}`);if(!signatures.some(value=>timingSafeEqual(value,expected)))throw new Error('Webhook signature verification failed.');const event=JSON.parse(rawBody) as Record<string,unknown>;const object=((event.data as Record<string,unknown>|undefined)?.object||{}) as Record<string,unknown>;if(!event.id||!event.type)throw new Error('Webhook payload is incomplete.');return{providerEventId:String(event.id),type:String(event.type),providerPaymentId:typeof object.payment_intent==='string'?object.payment_intent:typeof object.id==='string'&&String(event.type).startsWith('payment_intent.')?String(object.id):'',status:String(object.status||event.type),createdAt:new Date(Number(event.created||0)*1000).toISOString()}}}}

export function createStripeTestPaymentProvider(options:StripeAdapterOptions):PaymentProvider{
  if(!options.secretKey.startsWith('sk_test_')&&!options.secretKey.startsWith('rk_test_'))throw new Error('Stripe test-mode secret configuration is invalid.');
  if(!options.webhookSecret.startsWith('whsec_'))throw new Error('Stripe test webhook configuration is invalid.');
  const fetchImpl=options.fetchImpl||fetch;const webhookVerifier=createStripeTestWebhookVerifier(options.webhookSecret,options.now||Date.now);
  return {provider:'STRIPE_TEST',
    async createPayment(input){const form=new URLSearchParams({amount:String(input.amountCents),currency:input.currency,'automatic_payment_methods[enabled]':'true','metadata[reservation_id]':input.metadata.reservationId,'metadata[synthetic]':input.metadata.synthetic,description:'Trailer Bros synthetic staging reservation'});const payload=await stripeRequest(fetchImpl,'/payment_intents',options.secretKey,input.idempotencyKey,form);return{providerPaymentId:String(payload.id),status:stripeStatus(String(payload.status)),clientSecret:typeof payload.client_secret==='string'?payload.client_secret:undefined,failureCategory:payload.last_payment_error?'PAYMENT_METHOD_FAILED':undefined}},
    async createRefund(input){const form=new URLSearchParams({payment_intent:input.providerPaymentId,amount:String(input.amountCents),reason:'requested_by_customer','metadata[owner_reason]':input.reason.slice(0,300)});const payload=await stripeRequest(fetchImpl,'/refunds',options.secretKey,input.idempotencyKey,form);const status=String(payload.status);return{providerRefundId:String(payload.id),status:status==='succeeded'?'SUCCEEDED':status==='failed'||status==='canceled'?'FAILED':'PROCESSING',failureCategory:status==='failed'?'REFUND_FAILED':undefined}},
    async retrievePayment(providerPaymentId){if(!/^pi_[A-Za-z0-9_]+$/.test(providerPaymentId))throw new Error('Stripe payment identifier is invalid.');const response=await fetchImpl(`${stripeApi}/payment_intents/${encodeURIComponent(providerPaymentId)}`,{headers:{authorization:`Bearer ${options.secretKey}`}});const payload=await response.json() as Record<string,unknown>;if(!response.ok)throw new Error('Stripe payment lookup failed.');return{providerPaymentId:String(payload.id),status:stripeStatus(String(payload.status)),failureCategory:payload.last_payment_error?'PAYMENT_METHOD_FAILED':undefined}},
    verifyWebhook:webhookVerifier.verifyWebhook
  };
}
