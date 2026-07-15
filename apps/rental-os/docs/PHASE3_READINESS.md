# Protected staging operations and production readiness

An approved private Cloudflare staging environment exists for synthetic-data owner testing. Its Worker, D1 binding, and Access configuration are maintained separately from source control. Production remains intentionally unconfigured. Do not copy staging identifiers into committed files, improvise production bindings, or deploy the top-level local configuration.

Before any staging release, verify private-by-design behavior locally:

1. Run `npm run preflight` successfully.
2. Confirm Cloudflare Access denies or redirects unauthenticated requests before application assets or `/api/*` responses are exposed; direct Worker authorization tests must return `401` for a missing token, while missing or placeholder non-development configuration returns `503`.
3. Confirm authorized responses use `Cache-Control: private, no-store` or `no-store`.
4. Confirm `wrangler.jsonc` has no real account ID, database ID, hostname, token, secret, Access audience, team domain, or owner identity.
5. Confirm the public website and root repository files have no diff.

The existing staging environment must remain fail-closed behind Cloudflare Access, allow only the approved owner identity, protect application assets and API routes, use explicitly marked synthetic data, exclude those records from analytics by default, disable public caching of authenticated responses, and preserve the D1 overlap triggers. Staging releases require a full local preflight plus authenticated, unauthenticated, persistence, overlap, analytics, and browser-console checks.

Before any production pilot is considered, obtain separate owner approval for production resources and configuration, a backup and restore policy, owner-lockout recovery, monitoring and alerts, real-data migration controls, retention and privacy procedures, secret rotation, incident response, and rollback. Staging acceptance does not authorize production provisioning or deployment.

The implemented local controls and operating procedures are defined in [Backup, recovery, and incident runbook](BACKUP_AND_INCIDENT_RUNBOOK.md). The authenticated `/api/health` route reports only non-sensitive schema readiness; unauthenticated requests are denied before it runs. `npm run ops:validate-config` rejects committed real identifiers and unsafe staging/production exposure settings. These controls support staging verification but do not provision monitoring, create a recovery administrator, or authorize production.

No Stripe, Gmail, Drive, Calendar, Voice, SMS, customer access, or hosted inspection-photo storage belongs in this phase.
