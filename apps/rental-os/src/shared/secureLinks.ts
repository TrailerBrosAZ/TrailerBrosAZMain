export const SECURE_LINK_PURPOSES=['AGREEMENT_SIGNING','PICKUP_INSPECTION','RETURN_INSPECTION'] as const;
export type SecureLinkPurpose=typeof SECURE_LINK_PURPOSES[number];
export const SECURE_LINK_DEFAULT_TTL_MINUTES=60;
export const SECURE_LINK_MAX_TTL_MINUTES=24*60;
export const SECURE_LINK_CREATE_LIMIT_PER_HOUR=5;
export const SECURE_LINK_USE_LIMIT_PER_HOUR=20;

const bytesToBase64Url=(bytes:Uint8Array)=>{let binary='';for(const value of bytes)binary+=String.fromCharCode(value);return btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'')};
export function createOpaqueToken(){const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return bytesToBase64Url(bytes)}
export async function hashSecureToken(token:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return Array.from(new Uint8Array(digest)).map(value=>value.toString(16).padStart(2,'0')).join('')}
export const secureLinkStatus=(link:Record<string,unknown>,now=new Date())=>link.revoked_at?'REVOKED':link.used_at?'USED':Date.parse(String(link.expires_at))<=now.getTime()?'EXPIRED':'ACTIVE';
