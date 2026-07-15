# Backup, recovery, and incident runbook

This runbook applies to the protected synthetic-data staging environment. It does not authorize production resources, real customer data, Access-policy changes, or external integrations.

## Backup policy

D1 Time Travel is the first-line point-in-time recovery mechanism. Cloudflare currently retains seven days on the Free plan; confirm the current limit before relying on it. SQL exports provide independent, longer-lived recovery points.

Recommended future production cadence:

- Export once daily after the operating day, and immediately before every migration or release.
- Retain 14 daily exports, 8 weekly exports, and 12 month-end exports.
- Keep exports encrypted in an owner-controlled location outside Git, chat, application hosting, and the public website.
- Independent encrypted Google Drive backup storage and daily automation are required before public customer booking. Connecting Drive or implementing that automation is not authorized in this checkpoint.
- Record only timestamp, environment, SHA-256 digest, byte count, verification result, schema counts, and aggregate row counts in an operations log. Never copy customer rows into logs.
- Review backup age and the most recent verification weekly. Perform an isolated restore rehearsal monthly and before a production pilot.

Target recovery point objective (RPO) is at most 24 hours from the independent export, with a more recent point often available inside the active Time Travel window. Target recovery time objective (RTO) is four hours for this owner-operated pilot. These are operating targets, not a guarantee; measure rehearsal times before approving production.

## Safe export and verification

The ignored local staging configuration is required. The command refuses checked-in or production-shaped configuration paths.

```powershell
npm run backup:export:staging -- --database=<staging-database-name> --config=wrangler.staging.local.jsonc
npm run backup:verify -- data/backups/<export-file>.sql
```

Verification checks SQL integrity, foreign keys, required tables, all four authoritative overlap triggers, synthetic markers, and aggregate counts. Its output contains no customer row values, credentials, identifiers, or secrets. SQL exports themselves are private records: never commit, paste, email, or place them in unencrypted shared storage.

For a local isolated rehearsal, run `npm run d1:rehearse`. It migrates a fresh local D1 database, imports synthetic records, verifies preserved reservations, blackouts, audit events, inspections, photo metadata, and synthetic markers, exports the database, restores it into a second local D1 store, and rechecks aggregate integrity and overlap rejection.

For a remote rehearsal, after explicit approval:

1. Export and verify staging.
2. Create one uniquely named temporary recovery D1 database only.
3. Import the verified export into that database.
4. query integrity and aggregate counts only; run an overlap-rejection check with synthetic records.
5. Delete the temporary database immediately and confirm it no longer appears in `wrangler d1 list`.

Never restore over staging or production merely to test a backup. A Time Travel restore is destructive and in-place; capture the current bookmark and fresh export first, record Cloudflare's returned undo bookmark, and require owner approval for the exact target and timestamp.

## Owner lockout recovery

The current Access policy remains exact-email only. Do not add email OTP, Everyone, domain-wide rules, bypasses, or a second identity without explicit approval.

If Google works but the application does not:

1. Test the Worker URL in a private browser window and record the timestamp and non-sensitive error.
2. Confirm unauthenticated access still redirects or denies; do not disable Access while diagnosing.
3. In Cloudflare, inspect Access authentication logs, application audience, policy decision, IdP health, and Worker logs.
4. Confirm the Worker still validates issuer, audience, signature, and the exact approved email.

If the approved Google account is inaccessible, use Google's documented account-recovery process from a previously trusted device. If Cloudflare account access is also lost, use Cloudflare account recovery/support. Never weaken the application policy as a shortcut.

Before production, designate one recovery administrator using a separate, strongly secured identity with phishing-resistant MFA and least-privilege Cloudflare roles. The person will be selected later and must not automatically receive Rental OS application access. Store recovery instructions and recovery codes offline. Adding that person, granting application access, or changing Access remains a separate owner-approved action.

Access verification after every release:

- An unauthenticated request must be denied or redirected before assets and API data are returned.
- A Google account other than the exact approved owner must receive a policy denial.
- The approved owner must reach the dashboard and authenticated `/api/health` endpoint.
- No policy may contain Everyone, domain-wide approval, bypass, or OTP fallback.

## Monitoring and diagnostics

`GET /api/health` is authenticated and returns only environment, timestamp, database readability, required-table count, schema readiness, and overlap-trigger count. It must never expose row data or binding identifiers. A missing token is denied before diagnostics run.

Failure triage:

- Worker: inspect deployment/version and tail request logs; correlate status and timestamp without logging request bodies.
- D1: run read-only schema and aggregate checks, inspect D1 errors, and compare the applied migration journal. Do not repair with ad hoc writes.
- Authentication: inspect Access policy decisions and JWT validation failures. Keep fail-closed behavior.
- Migration: stop writes, export the current database, compare migrations, and rehearse the correction on an isolated database.
- API: reproduce with synthetic data, record route/status/correlation time, and verify audit-event atomicity.

Recommended future alerts (not enabled here): any backup or verification failure; latest verified export older than 26 hours; two consecutive health failures within five minutes; Worker/API 5xx rate above 1% or five errors in five minutes; any migration failure; repeated D1 write errors or unusual D1 usage; more than five unexpected Access denials in ten minutes; and any Access-policy change. Start with Cloudflare's included logs/notifications and add paid monitoring only after approval.

Incident checklist:

1. Protect data and availability: keep Access fail-closed and pause owner writes if integrity is uncertain.
2. Record start time, symptoms, last known good release/migration/backup, and affected workflows.
3. Outage: check Access, Worker, D1, then authenticated health in that order.
4. Booking conflict: do not override triggers; preserve both attempts and audit evidence, then resolve through owner workflow.
5. Failed write: confirm whether both the business record and audit event rolled back; never retry blindly.
6. Owner lockout: follow the recovery procedure without adding a public bypass.
7. Recover on an isolated copy first, verify aggregate counts and business workflows, then obtain approval for any in-place restore.
8. Document cause, recovery point, data loss if any, and preventive action.

## Promotion and rollback controls

Production does not exist and cannot be inferred from staging. Only the owner may approve production deployment, migration, maintenance, or rollback. Promotion also requires a separate Worker, D1 database, Access application/policy, secrets, ignored configuration, backup destination, and monitoring plan. All identifiers and secrets remain outside Git.

Before promotion: full preflight; verified staging acceptance; current export; isolated restore rehearsal; migration compatibility review; exact-email authentication tests; legal/agreement, payment, communication, privacy, and retention acceptance; rollback owner; and a maintenance window. Apply migrations before code only when backward compatible; otherwise use an approved staged migration plan.

The checked-in configuration contains placeholders and disables `workers.dev` and preview URLs for staging/production. `npm run ops:validate-config` enforces those boundaries. Staging commands must use only `wrangler.staging.local.jsonc`; a future production command must require a separately named ignored configuration and explicit release approval.

For code rollback, select the last verified Worker version and re-run authenticated and unauthorized checks. Database migrations should normally use an audited forward-fix migration. For destructive data recovery, restore to an isolated database first; in-place Time Travel or database replacement requires a fresh backup, exact recovery bookmark/timestamp, owner approval, and post-restore verification.
