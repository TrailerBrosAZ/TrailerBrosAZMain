import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { authorizeIdentity, authorizeOwner, verifyAccessTokenWithKeySet } from '../src/server/auth.js';

const development = { ENVIRONMENT:'development' as const,AUTH_MODE:'mock' as const,ALLOWED_OWNER_EMAIL:'owner@example.test' };
const access = { ENVIRONMENT:'staging' as const,AUTH_MODE:'cloudflare-access' as const,ALLOWED_OWNER_EMAIL:'owner@example.test',ACCESS_TEAM_DOMAIN:'team.example.test',ACCESS_AUD:'approved-audience' };

async function jwt(overrides: { issuer?:string; audience?:string; email?:string; expirationTime?:string|number; subject?:string } = {}) {
  const { publicKey, privateKey } = await generateKeyPair('RS256'); const jwk = await exportJWK(publicKey); jwk.kid='test-key';
  const token = await new SignJWT({email:overrides.email??'owner@example.test'}).setProtectedHeader({alg:'RS256',kid:'test-key'}).setIssuer(overrides.issuer??'https://team.example.test').setAudience(overrides.audience??'approved-audience').setSubject(overrides.subject??'owner-subject').setIssuedAt().setExpirationTime(overrides.expirationTime??'5m').sign(privateKey);
  return { token, keySet:createLocalJWKSet({keys:[jwk]}) };
}

describe('owner authorization',()=>{
  it('allows only the exact local mock owner',async()=>{const request=new Request('http://local/api',{headers:{'x-dev-owner-email':'owner@example.test'}});expect((await authorizeOwner(request,development)).email).toBe('owner@example.test');await expect(authorizeOwner(new Request('http://local/api',{headers:{'x-dev-owner-email':'other@example.test'}}),development)).rejects.toMatchObject({status:403});});
  it('rejects missing local identity and never permits mock mode outside development',async()=>{await expect(authorizeOwner(new Request('http://local'),development)).rejects.toMatchObject({status:401});await expect(authorizeOwner(new Request('http://local'),{...development,ENVIRONMENT:'staging'})).rejects.toMatchObject({status:503});});
  it('cryptographically accepts a valid issuer, audience, expiry, subject, and exact email',async()=>{const signed=await jwt();const verifier=(token:string)=>verifyAccessTokenWithKeySet(token,access,signed.keySet);const identity=await authorizeOwner(new Request('http://local',{headers:{'cf-access-jwt-assertion':signed.token}}),access,verifier);expect(identity).toMatchObject({email:'owner@example.test',subject:'owner-subject',source:'cloudflare-access'});});
  it.each([
    ['expired',{expirationTime:'-1m'}],['wrong issuer',{issuer:'https://wrong.example.test'}],['wrong audience',{audience:'wrong'}],['wrong email',{email:'other@example.test'}],['missing subject',{subject:''}],
  ] as const)('rejects %s JWTs',async(_label,overrides)=>{const signed=await jwt(overrides);const verifier=(token:string)=>verifyAccessTokenWithKeySet(token,access,signed.keySet);await expect(authorizeOwner(new Request('http://local',{headers:{'cf-access-jwt-assertion':signed.token}}),access,verifier)).rejects.toBeDefined();});
  it('rejects missing and malformed JWT assertions without leaking verifier errors',async()=>{await expect(authorizeOwner(new Request('http://local'),access)).rejects.toMatchObject({status:401});await expect(authorizeOwner(new Request('http://local',{headers:{'cf-access-jwt-assertion':'malformed'}}),access,async()=>{throw new Error('internal verifier detail');})).rejects.toMatchObject({status:401,message:'Cloudflare Access assertion is invalid.'});});
  it('classifies exact allowlisted tester identities without granting owner authorization',async()=>{const signed=await jwt({email:'tester@example.test',subject:'tester-subject'});const environment={...access,ALLOWED_TESTER_EMAILS:'tester@example.test, second@example.test'};const verifier=(token:string)=>verifyAccessTokenWithKeySet(token,environment,signed.keySet);expect(await authorizeIdentity(new Request('http://local',{headers:{'cf-access-jwt-assertion':signed.token}}),environment,verifier)).toMatchObject({email:'tester@example.test',role:'external-tester'});await expect(authorizeOwner(new Request('http://local',{headers:{'cf-access-jwt-assertion':signed.token}}),environment,verifier)).rejects.toMatchObject({status:403});});
  it('requires an exact tester email and rejects domain or substring matches',async()=>{const environment={...development,ALLOWED_TESTER_EMAILS:'tester@example.test'};await expect(authorizeIdentity(new Request('http://local',{headers:{'x-dev-owner-email':'other@example.test'}}),environment)).rejects.toMatchObject({status:403});await expect(authorizeIdentity(new Request('http://local',{headers:{'x-dev-owner-email':'tester@example.test.evil'}}),environment)).rejects.toMatchObject({status:403});});
});
