import { createRemoteJWKSet, jwtVerify } from 'jose';

export const GMAIL_SEND_SCOPE='https://www.googleapis.com/auth/gmail.send';
export const GMAIL_IDENTITY_SCOPES=['openid','email'] as const;
export const GMAIL_CALLBACK_PATH='/api/integrations/gmail/oauth/callback';
export const APPROVED_GMAIL_SENDER='trailerbrosaz@gmail.com';

const encoder=new TextEncoder();
const decoder=new TextDecoder();
const GOOGLE_JWKS=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const base64url=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const base64=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes));
const fromBase64url=(value:string)=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),character=>character.charCodeAt(0));
export async function sha256(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value)))).map(byte=>byte.toString(16).padStart(2,'0')).join('')}
export function secureRandomToken(bytes=32){const value=new Uint8Array(bytes);crypto.getRandomValues(value);return base64url(value)}
export async function pkceChallenge(verifier:string){return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(verifier))))}

export type EncryptedValue={ciphertext:string;iv:string;keyVersion:string};
async function encryptionKey(encoded:string){const raw=fromBase64url(encoded.trim());if(raw.byteLength!==32)throw new Error('TOKEN_ENCRYPTION_UNAVAILABLE');return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt'])}
export async function encryptToken(value:string,encodedKey:string,keyVersion='v1'):Promise<EncryptedValue>{const iv=new Uint8Array(12);crypto.getRandomValues(iv);const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},await encryptionKey(encodedKey),encoder.encode(value));return{ciphertext:base64url(new Uint8Array(ciphertext)),iv:base64url(iv),keyVersion}}
export async function decryptToken(value:EncryptedValue,encodedKey:string){try{const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromBase64url(value.iv)},await encryptionKey(encodedKey),fromBase64url(value.ciphertext));return decoder.decode(plaintext)}catch{throw new Error('TOKEN_DECRYPTION_FAILED')}}

export type GmailConfiguration={clientId:string;clientSecret:string;tokenEncryptionKey:string;approvedSender:string;testRecipient:string};
export function gmailConfiguration(environment:Record<string,unknown>):{configured:boolean;reason:string|null;configuration?:GmailConfiguration}{
 const clientId=String(environment.GMAIL_OAUTH_CLIENT_ID||'').trim(),clientSecret=String(environment.GMAIL_OAUTH_CLIENT_SECRET||'').trim(),tokenEncryptionKey=String(environment.GMAIL_TOKEN_ENCRYPTION_KEY||'').trim(),approvedSender=String(environment.GMAIL_APPROVED_SENDER||APPROVED_GMAIL_SENDER).trim().toLowerCase(),testRecipient=String(environment.GMAIL_TEST_RECIPIENT||'').trim().toLowerCase();
 if(!clientId||!clientSecret||!tokenEncryptionKey||!testRecipient)return{configured:false,reason:'CONFIGURATION_MISSING'};
 if(approvedSender!==APPROVED_GMAIL_SENDER||testRecipient!==APPROVED_GMAIL_SENDER)return{configured:false,reason:'OWNER_MAILBOX_MISMATCH'};
 return{configured:true,reason:null,configuration:{clientId,clientSecret,tokenEncryptionKey,approvedSender,testRecipient}};
}
export async function createAuthorizationRequest(configuration:GmailConfiguration,redirectUri:string){const state=secureRandomToken(),verifier=secureRandomToken(48),challenge=await pkceChallenge(verifier);const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');for(const [key,value] of Object.entries({client_id:configuration.clientId,redirect_uri:redirectUri,response_type:'code',scope:[...GMAIL_IDENTITY_SCOPES,GMAIL_SEND_SCOPE].join(' '),access_type:'offline',prompt:'consent select_account',include_granted_scopes:'false',login_hint:configuration.approvedSender,state,code_challenge:challenge,code_challenge_method:'S256'}))url.searchParams.set(key,value);return{authorizationUrl:url.toString(),state,stateHash:await sha256(state),verifier}}
export async function validateGoogleIdentity(idToken:string,clientId:string){const {payload}=await jwtVerify(idToken,GOOGLE_JWKS,{audience:clientId,issuer:['https://accounts.google.com','accounts.google.com']});const email=String(payload.email||'').toLowerCase();if(email!==APPROVED_GMAIL_SENDER||payload.email_verified!==true)throw new Error('OWNER_IDENTITY_MISMATCH');return{subjectHash:await sha256(String(payload.sub)),email}}

export type GmailTokenBundle={accessToken:string;refreshToken:string;expiresAt:string;scope:string};
export async function exchangeGoogleCode(input:{code:string;verifier:string;redirectUri:string;configuration:GmailConfiguration;fetcher?:typeof fetch}){const fetcher=input.fetcher||fetch;const response=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code:input.code,client_id:input.configuration.clientId,client_secret:input.configuration.clientSecret,redirect_uri:input.redirectUri,grant_type:'authorization_code',code_verifier:input.verifier})});if(!response.ok)throw new Error('GOOGLE_TOKEN_EXCHANGE_FAILED');const result=await response.json() as Record<string,unknown>;if(!result.access_token||!result.refresh_token||!result.id_token)throw new Error('GOOGLE_TOKEN_RESPONSE_INVALID');const identity=await validateGoogleIdentity(String(result.id_token),input.configuration.clientId);const scopes=String(result.scope||'').split(' ');if(!scopes.includes(GMAIL_SEND_SCOPE)||scopes.some(scope=>scope.includes('/auth/gmail.')&&scope!==GMAIL_SEND_SCOPE))throw new Error('GMAIL_SCOPE_MISMATCH');return{identity,bundle:{accessToken:String(result.access_token),refreshToken:String(result.refresh_token),expiresAt:new Date(Date.now()+Number(result.expires_in||3600)*1000).toISOString(),scope:scopes.join(' ')} satisfies GmailTokenBundle}}

export type GmailSendResult={state:'ACCEPTED_BY_GMAIL'|'FAILED'|'UNKNOWN';providerMessageId?:string;safeErrorClassification?:string};
export function gmailRetryDecision(priorState:string|undefined,retryOverrideReason:string|undefined){if(!priorState)return{allowed:true,attemptNumber:1};if(priorState==='SENDING'||priorState==='ACCEPTED_BY_GMAIL')return{allowed:false,reason:'DUPLICATE_SEND_BLOCKED'};if(!retryOverrideReason?.trim())return{allowed:false,reason:'OWNER_OVERRIDE_REASON_REQUIRED'};return{allowed:true,attemptNumber:2}}
export function encodeMimeSubject(subject:string){
 if(/[\r\n]/.test(subject))throw new Error('INVALID_EMAIL_SUBJECT');
 if(/^[\x20-\x7e]*$/.test(subject))return subject;
 const chunks:string[]=[];let current='';let bytes=0;
 for(const character of subject){const size=encoder.encode(character).byteLength;if(current&&bytes+size>42){chunks.push(current);current='';bytes=0}current+=character;bytes+=size}
 if(current)chunks.push(current);
 return chunks.map(chunk=>`=?UTF-8?B?${base64(encoder.encode(chunk))}?=`).join(' ');
}
export type GmailAttachment={filename:string;contentType:string;base64Content:string};
export interface GmailTransport{send(input:{accessToken:string;sender:string;recipient:string;subject:string;body:string;htmlBody:string;stableMessageId:string;attachment?:GmailAttachment}):Promise<GmailSendResult>}
export function createGmailTransport(fetcher:typeof fetch=fetch):GmailTransport{return{async send(input){
 const stable=input.stableMessageId.replace(/[^A-Za-z0-9]/g,'').slice(0,48),alternativeBoundary=`tb_alt_${stable}`,mixedBoundary=`tb_mix_${stable}`;
 const alternatives=[`--${alternativeBoundary}`,'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: 8bit','',input.body,`--${alternativeBoundary}`,'Content-Type: text/html; charset=UTF-8','Content-Transfer-Encoding: 8bit','',input.htmlBody,`--${alternativeBoundary}--`].join('\r\n');
 const body=input.attachment?[`--${mixedBoundary}`,`Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,'',alternatives,`--${mixedBoundary}`,`Content-Type: ${input.attachment.contentType}; name="${input.attachment.filename}"`,'Content-Transfer-Encoding: base64',`Content-Disposition: attachment; filename="${input.attachment.filename}"`,'',input.attachment.base64Content.replace(/(.{76})/g,'$1\r\n'),`--${mixedBoundary}--`].join('\r\n'):alternatives;
 const headers=[`From: ${input.sender}`,`To: ${input.recipient}`,`Subject: ${encodeMimeSubject(input.subject)}`,`Message-ID: <${input.stableMessageId}@rental-os.invalid>`,'MIME-Version: 1.0',`Content-Type: ${input.attachment?`multipart/mixed; boundary="${mixedBoundary}"`:`multipart/alternative; boundary="${alternativeBoundary}"`}`,'',body,''].join('\r\n');const raw=base64url(encoder.encode(headers));try{const response=await fetcher('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',headers:{authorization:`Bearer ${input.accessToken}`,'content-type':'application/json'},body:JSON.stringify({raw})});if(!response.ok)return{state:'FAILED',safeErrorClassification:response.status===401?'AUTHORIZATION_REVOKED':response.status===429?'PROVIDER_RATE_LIMITED':'PROVIDER_REJECTED'};const result=await response.json() as {id?:string};return result.id?{state:'ACCEPTED_BY_GMAIL',providerMessageId:result.id}:{state:'UNKNOWN',safeErrorClassification:'PROVIDER_RESPONSE_UNCERTAIN'}}catch{return{state:'UNKNOWN',safeErrorClassification:'PROVIDER_UNREACHABLE'}}}}}
