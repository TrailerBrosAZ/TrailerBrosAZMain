import { handleApiRequest } from '../server/api.js';
import { AuthorizationError, authorizeOwner, type AuthEnvironment } from '../server/auth.js';
import { createD1DatabasePort, type D1DatabaseLike } from './d1.js';

export type WorkerEnvironment = AuthEnvironment & { DB?: D1DatabaseLike; ASSETS?: { fetch(request: Request): Promise<Response> } };
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
    if (url.pathname.startsWith('/api/')) return handleApiRequest(request, { ...env, DB: createD1DatabasePort(env.DB) });
    try { await authorizeOwner(request, env); } catch (error) { const status = error instanceof AuthorizationError ? error.status : 401; return new Response('Owner authorization required.', { status, headers: { 'cache-control': 'no-store' } }); }
    const response = await env.ASSETS.fetch(request); const headers = new Headers(response.headers);
    headers.set('cache-control', 'private, no-store'); headers.set('x-content-type-options', 'nosniff'); headers.set('referrer-policy', 'no-referrer');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
export default worker;
