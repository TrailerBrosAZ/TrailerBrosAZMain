export type ProviderResult={providerPaymentId:string;status:'SUCCEEDED'|'FAILED';failureCategory?:string};
export type RefundResult={providerRefundId:string;status:'SUCCEEDED'|'FAILED';failureCategory?:string};
export type SanitizedWebhook={providerEventId:string;type:string;providerPaymentId?:string;status:string;createdAt:string};
export interface PaymentProvider{
  createPayment(input:{amountCents:number;currency:'usd';idempotencyKey:string;metadata:{reservationId:string;synthetic:'true'}}):Promise<ProviderResult>;
  createRefund(input:{providerPaymentId:string;amountCents:number;idempotencyKey:string;reason:string}):Promise<RefundResult>;
  verifyWebhook(rawBody:string,signature:string):Promise<SanitizedWebhook>;
}

export function createMockPaymentProvider(options:{failPayments?:boolean;failRefunds?:boolean}={}):PaymentProvider{
  const payments=new Map<string,ProviderResult>();const refunds=new Map<string,RefundResult>();
  return {
    async createPayment(input){const existing=payments.get(input.idempotencyKey);if(existing)return existing;const result:ProviderResult=options.failPayments?{providerPaymentId:`mock_pay_${input.idempotencyKey}`,status:'FAILED',failureCategory:'TEST_DECLINE'}:{providerPaymentId:`mock_pay_${input.idempotencyKey}`,status:'SUCCEEDED'};payments.set(input.idempotencyKey,result);return result},
    async createRefund(input){const existing=refunds.get(input.idempotencyKey);if(existing)return existing;const result:RefundResult=options.failRefunds?{providerRefundId:`mock_ref_${input.idempotencyKey}`,status:'FAILED',failureCategory:'TEST_REFUND_FAILURE'}:{providerRefundId:`mock_ref_${input.idempotencyKey}`,status:'SUCCEEDED'};refunds.set(input.idempotencyKey,result);return result},
    async verifyWebhook(rawBody,signature){if(signature!=='mock-valid')throw new Error('Webhook signature verification failed.');const parsed=JSON.parse(rawBody) as Record<string,unknown>;if(!parsed.id||!parsed.type)throw new Error('Webhook payload is incomplete.');return {providerEventId:String(parsed.id),type:String(parsed.type),providerPaymentId:parsed.paymentId?String(parsed.paymentId):undefined,status:String(parsed.status||'UNKNOWN'),createdAt:String(parsed.createdAt||new Date(0).toISOString())}}
  };
}
