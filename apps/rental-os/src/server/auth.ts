import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey, type JWTPayload } from 'jose';

export type AuthEnvironment = {
  ENVIRONMENT: 'development' | 'staging' | 'production';
  AUTH_MODE: 'mock' | 'cloudflare-access';
  ALLOWED_OWNER_EMAIL: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
};
export type OwnerIdentity = { email: string; subject: string; source: 'local-mock' | 'cloudflare-access' };
export type TokenVerifier = (token: string, environment: AuthEnvironment) => Promise<JWTPayload>;

export class AuthorizationError extends Error {
  constructor(message: string, readonly status = 401) { super(message); }
}

const jwks = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
export async function verifyAccessTokenWithKeySet(token: string, environment: AuthEnvironment, keySet: JWTVerifyGetKey): Promise<JWTPayload> {
  const domain = environment.ACCESS_TEAM_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!domain || !environment.ACCESS_AUD) throw new AuthorizationError('Cloudflare Access is not configured.', 503);
  const verified = await jwtVerify(token, keySet, { issuer: `https://${domain}`, audience: environment.ACCESS_AUD });
  return verified.payload;
}

export const verifyCloudflareAccessToken: TokenVerifier = async (token, environment) => {
  const domain = environment.ACCESS_TEAM_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!domain || !environment.ACCESS_AUD) throw new AuthorizationError('Cloudflare Access is not configured.', 503);
  const issuer = `https://${domain}`;
  let keySet = jwks.get(domain);
  if (!keySet) { keySet = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`)); jwks.set(domain, keySet); }
  return verifyAccessTokenWithKeySet(token, environment, keySet);
};

export async function authorizeOwner(request: Request, environment: AuthEnvironment, verifier: TokenVerifier = verifyCloudflareAccessToken): Promise<OwnerIdentity> {
  const allowed = environment.ALLOWED_OWNER_EMAIL.trim().toLowerCase();
  if (!allowed) throw new AuthorizationError('Owner authorization is not configured.', 503);
  if (environment.AUTH_MODE === 'mock') {
    if (environment.ENVIRONMENT !== 'development') throw new AuthorizationError('Mock authorization is limited to local development.', 503);
    const email = request.headers.get('x-dev-owner-email')?.trim().toLowerCase();
    if (!email) throw new AuthorizationError('Local owner header is required.');
    if (email !== allowed) throw new AuthorizationError('This owner is not approved.', 403);
    return { email, subject: `local:${email}`, source: 'local-mock' };
  }
  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) throw new AuthorizationError('Cloudflare Access assertion is required.');
  let payload: JWTPayload;
  try { payload = await verifier(token, environment); } catch (error) { if (error instanceof AuthorizationError) throw error; throw new AuthorizationError('Cloudflare Access assertion is invalid.'); }
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (email !== allowed) throw new AuthorizationError('This owner is not approved.', 403);
  if (!payload.sub) throw new AuthorizationError('Cloudflare Access subject is missing.');
  return { email, subject: payload.sub, source: 'cloudflare-access' };
}
