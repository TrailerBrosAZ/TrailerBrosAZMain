# Phase 3 private-staging readiness

Staging and production are intentionally unconfigured. Do not improvise IDs, bindings, hostnames, credentials, or Access settings and do not deploy the top-level local configuration.

Before future staging, verify private-by-design behavior locally:

1. Run `npm run preflight` successfully.
2. Confirm unauthenticated Worker asset and `/api/*` requests return `401`, while missing or placeholder non-development configuration returns `503`.
3. Confirm authorized responses use `Cache-Control: private, no-store` or `no-store`.
4. Confirm `wrangler.jsonc` has no real account ID, database ID, hostname, token, secret, Access audience, team domain, or owner email.
5. Confirm the public website and root repository files have no diff.

Phase 3 requires separate owner approval for a Cloudflare account and narrowly scoped permissions, a staging Worker, staging D1 database, private hostname, Zero Trust team, Access application, Google identity provider, exact allowed owner email, Access team domain/audience, backup/restore policy, selected data import, and an owner-lockout recovery procedure. Staging acceptance is required before any production configuration is considered.

No Stripe, Gmail, Drive, Calendar, Voice, SMS, customer access, or hosted inspection-photo storage belongs in this phase.
