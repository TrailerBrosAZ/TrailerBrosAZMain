export type PreparedCommunication={recipient:string;subject:string;body:string;idempotencyKey:string};
export type CommunicationProviderResult={state:'SEND_UNAVAILABLE';safeErrorClassification:'PROVIDER_NOT_CONFIGURED'};
export interface CommunicationProvider{readonly provider:'NO_SEND';prepare(message:PreparedCommunication):Promise<CommunicationProviderResult>}
export function createNoSendCommunicationProvider():CommunicationProvider{return{provider:'NO_SEND',async prepare(){return{state:'SEND_UNAVAILABLE',safeErrorClassification:'PROVIDER_NOT_CONFIGURED'}}}}
export function validateGmailConfiguration(environment:Record<string,unknown>){return{configured:false,ready:false,reason:'GMAIL_NOT_CONNECTED',senderConfigured:Boolean(environment.GMAIL_SENDER_IDENTITY),credentialsPresent:Boolean(environment.GMAIL_OAUTH_CREDENTIALS)}}
