export type GmailConnectionStatus='CONFIGURATION_MISSING'|'AUTHORIZATION_REQUIRED'|'CONNECTED_HEALTHY'|'TOKEN_EXPIRED'|'DISCONNECTED'|'DELIVERY_UNAVAILABLE';

export const gmailConnectionCopy:Record<GmailConnectionStatus,string>={
  CONFIGURATION_MISSING:'Configuration missing — preview and copy remain available.',
  AUTHORIZATION_REQUIRED:'Owner authorization required before any test send.',
  CONNECTED_HEALTHY:'Connected and healthy for owner-only synthetic test delivery.',
  TOKEN_EXPIRED:'Authorization expired — reconnect before sending.',
  DISCONNECTED:'Disconnected by owner.',
  DELIVERY_UNAVAILABLE:'Delivery unavailable — no message will be sent.',
};

export function gmailSendAvailability(input:{connectionStatus?:string;hasPreparedRecord:boolean;attemptState?:string}){
  if(input.connectionStatus!=='CONNECTED_HEALTHY')return{enabled:false,reason:'Connect the approved owner Gmail account before test delivery.'};
  if(!input.hasPreparedRecord)return{enabled:false,reason:'Prepare an eligible booking-confirmation or rental-closeout preview first.'};
  if(input.attemptState==='SENDING')return{enabled:false,reason:'This synthetic test is already being sent.'};
  if(input.attemptState==='ACCEPTED_BY_GMAIL')return{enabled:false,reason:'Gmail already accepted this immutable communication. Duplicate sending is blocked.'};
  if(input.attemptState==='FAILED'||input.attemptState==='UNKNOWN')return{enabled:true,requiresRetryReason:true,reason:'A retry requires an owner reason and a new confirmation.'};
  return{enabled:true,requiresRetryReason:false,reason:'Ready for one owner-confirmed synthetic test delivery.'};
}

export function gmailSafeFailure(error?:string,blockers?:string[],classification?:string){
  if(blockers?.length)return`Not sent: ${blockers.join(' ')} Complete the listed prerequisites, prepare a new preview if needed, then try again.`;
  if(error?.includes('already sending')||error?.includes('accepted by Gmail'))return'Not sent: Gmail already has this communication or it is currently sending. Review the immutable delivery attempt before taking another action.';
  if(error?.includes('retry reason'))return'Not sent: enter an owner retry reason, review the confirmation, and try again.';
  if(error?.includes('authorization'))return'Not sent: Gmail authorization is unavailable or expired. Reauthorize the approved owner account, then try again.';
  if(classification==='PROVIDER_RATE_LIMITED')return'Not sent: Gmail temporarily limited the request. Wait, enter a retry reason, and confirm one retry.';
  if(classification==='AUTHORIZATION_REVOKED')return'Not sent: Gmail rejected the authorization. Reauthorize the approved owner account before retrying.';
  return'Not sent: Gmail did not accept the request. Review connection status and the prepared communication, then try again.';
}
