# Pre-production convergence audit

Audit date: 2026-08-15 Arizona time. Scope: committed local source and the existing protected, synthetic-only Cloudflare staging Worker/D1. This document is operational evidence, not legal advice, attorney approval, public exposure authorization, or production deployment approval.

## Launch-critical convergence

| Requirement | Result | Evidence and boundary |
| --- | --- | --- |
| Authoritative checkout recovery | VERIFIED READY | A transient/client Stripe confirmation error triggers server refresh before any retry is offered. `PAYMENT_PENDING`, `PAYMENT_COLLECTED`, `CONFIRMATION_PENDING`, and `COMPLETE` never invite another payment. |
| Webhook success and separate confirmation | VERIFIED READY | Signed webhook/server reconciliation records collection idempotently; payment alone does not transition the reservation. The customer receives a distinct final reservation-confirmation action. |
| Customer delivery presentation | VERIFIED READY | Quote and review UI show billable miles, `$2.50 per mile`, and delivery total only. They omit the private origin, route, map, exact raw distance, and internal “one-way”/“rounded up” calculation wording. The canonical agreement retains the owner-approved detailed delivery clause; changing that substantive clause requires owner/counsel direction. |
| Agreement reading viewport | VERIFIED READY | Desktop uses `clamp(560px, 65vh, 760px)` and exact-mobile uses `clamp(380px, 54vh, 560px)`, with contained scrolling and visible keyboard focus. |
| Scroll-gated confirmations | VERIFIED READY | Required confirmation and consent inputs are native `disabled` controls until the exact current agreement version reaches the bottom; the gate uses a six-pixel tolerance and resets on version change. |
| Confirmation readability | VERIFIED READY | Desktop and exact 390px checks cover 14px/1.55+ confirmation copy, single-column mobile layout, contained controls, and no horizontal overflow. |
| Canonical agreement | IMPLEMENTED BUT NEEDS OWNER ACCEPTANCE | `src/legal/TB-RA-2026-08-v1.md` is the complete customer-facing source. Status remains `OWNER_DRAFT_ATTORNEY_REVIEW_PENDING`; no approval is claimed. |
| Agreement evidence chain | VERIFIED READY | Screen clauses derive from the canonical mirror; acceptance stores the canonical template version/hash and immutable snapshot; conversion preserves them; `agreement-pdf-v1` renders deterministic bytes; stored document hash is SHA-256; downloads and Gmail attachments recompute and verify that hash before release. |
| Historical immutability | VERIFIED READY | Database triggers reject update/delete of agreement templates, accepted checkout agreements, signed agreement instances, and generated agreement documents. New wording requires a new version and new acceptance. |
| Secret/privacy/legal-claim scan | VERIFIED READY | Tracked source contains placeholders and secret names only. No secret value, private service-origin address, real customer record, or attorney-approval claim is permitted. Public/live settings remain disabled. |

Agreement template hashing uses SHA-256 over deterministic canonical JSON (`agreementTemplateHash`): sorted object keys containing the exact canonical Markdown, source version, legal-review status, parsed clauses, and pickup-condition source. PDF hashing uses SHA-256 over the exact generated PDF bytes. These are different, deliberate hashes: the first binds accepted legal source; the second binds the downloadable/attached artifact.

## Production-readiness matrix

| Area | Classification | What remains |
| --- | --- | --- |
| Production Worker and D1 | MANUAL CONFIGURATION REQUIRED | Create separately named production resources only after owner approval; use distinct bindings/secrets and a verified empty/import baseline. No production resources are currently represented as ready. |
| Migrations | IMPLEMENTED BUT NEEDS OWNER ACCEPTANCE | Staging schema is rehearsed through the current migration set. Production requires verified pre-migration export, exact migration review, apply, count/trigger/foreign-key reconciliation, and owner sign-off. |
| Owner/admin versus customer Access | UNRESOLVED BLOCKER | Owner APIs must remain exact-identity protected while only narrowly scoped customer routes become public. Bot/rate controls, token/referrer/cache protections, abuse testing, and failure behavior need approval and acceptance. |
| Live Stripe configuration and webhook | UNRESOLVED BLOCKER | Test mode only is accepted. Create a least-privilege live key, publishable key, exact webhook secret/destination, and narrow Access exception only after explicit approval; then run live-mode operational acceptance without real customer launch. |
| Payment idempotency and reconciliation | VERIFIED READY | Server-authoritative amounts, idempotency, webhook signature/deduplication/order handling, collection/retry guards, refunds, and separate confirmation are implemented and tested in test mode. Live acceptance is still required. |
| Gmail production sending | UNRESOLVED BLOCKER | Current sending is exact-recipient test mode. Production recipient rules, sender/OAuth configuration, bounce/support handling, retry/unknown-state procedure, and owner acceptance are required. |
| Public website booking entry point | MANUAL CONFIGURATION REQUIRED | Approved CTA/deep-link copy and rollback contract exist; public HTML/Pages remain unchanged and must be changed only in a separately approved rollout. |
| Backup/export/restore | IMPLEMENTED BUT NEEDS OWNER ACCEPTANCE | Manual D1 export verification and isolated restore rehearsal exist. Independent encrypted Google Drive storage, daily automation, retention enforcement, and failure alerting are required before customer launch. |
| Monitoring and error visibility | MANUAL CONFIGURATION REQUIRED | Health diagnostics/runbooks exist. Configure no-PII Worker/API error alerts, backup/migration/Access-change alerts, D1 usage thresholds, and an owner notification path. |
| Rollback | IMPLEMENTED BUT NEEDS OWNER ACCEPTANCE | Version rollback and database recovery procedures are documented. Owner must rehearse code rollback, forward-fix migration recovery, customer notice decision, and payment/email reconciliation. |
| Privacy and retention | UNRESOLVED BLOCKER | Final privacy notice, data minimization/retention schedule, deletion/dispute holds, subject-request handling, secure photo storage decision, and archive controls require counsel/owner approval. |
| Taxes | UNRESOLVED BLOCKER | The application intentionally has no separate Arizona tax line. Qualified tax/accounting guidance and an owner decision must be recorded before public collection; do not infer “no tax owed” from the current UI. |
| Insurance | UNRESOLVED BLOCKER | Counsel/owner must approve customer wording and the operational verification/escalation procedure. The application must not represent verification as complete without the future workflow. |
| Entity/title alignment | UNRESOLVED BLOCKER | Verify the contracting entity, trailer title/ownership, Stripe merchant, Gmail sender, public disclosures, and agreement header are legally and operationally aligned. |
| Owner operating procedures | IMPLEMENTED BUT NEEDS OWNER ACCEPTANCE | Complete supervised drills for booking exceptions, duplicate/unknown payments, refunds/deposits, agreement/email failures, backup restore, Access lockout, incident response, deployment, and rollback. |
| Google Calendar copy | DEFERRED POST-LAUNCH | Rental OS remains authoritative. Any later Calendar integration is one-way informational copy only and never writes availability into Rental OS. |

## Safest production-release sequence

1. Obtain counsel disposition for the exact agreement, electronic acceptance, cancellation/deposit, privacy/retention, insurance, and public wording; create a new agreement version if any wording changes.
2. Record owner decisions for taxes, contracting entity/title alignment, customer-support contact, retention, secure photo handling, and public customer-access boundaries.
3. Create isolated production Worker/D1/Access and least-privilege secrets; do not reuse staging identifiers or synthetic data.
4. Export and verify the empty/import baseline, apply the exact reviewed migrations, verify tables/triggers/foreign keys, and take the first retained production backup.
5. Configure monitoring, backup automation, alert delivery, owner-lockout recovery, incident contacts, and rollback authority.
6. Configure Stripe live mode and the exact signed webhook route; run controlled owner acceptance and ledger reconciliation before enabling customer traffic.
7. Configure Gmail production sending and complete exactly-once, bounce/support, PDF attachment, and unknown-result acceptance.
8. Deploy production code with customer routes still closed; perform authenticated owner smoke tests and synthetic production-readiness tests that create no real charge or message.
9. Enable the narrowly scoped customer boundary, then perform a final end-to-end controlled test under the approved policy.
10. Change the public website CTA only after owner go-live approval; monitor the first bookings and retain a rollback window.

## Rollback

1. Stop new customer sessions at the customer boundary without disabling owner access or the exact Stripe webhook.
2. Preserve and export D1; do not delete or rewrite payments, webhooks, signed agreements, documents, communications, or audits.
3. Reconcile Stripe and Gmail external outcomes before retrying or compensating any operation.
4. Roll the Worker back to the last accepted production version when schema-compatible. Never reverse a non-reversible migration blindly; use a reviewed forward repair or verified restore into an isolated recovery database.
5. Verify authoritative availability, payment ledger, agreement/document hashes, communication attempts, and audit counts before reopening.
6. The owner alone approves reopening, migration, maintenance, or rollback completion.

## Current readiness conclusion

Protected synthetic staging may continue. Public launch is **NOT READY** and fail-closed. The largest blockers are counsel disposition, public customer-access architecture, production infrastructure/backups/monitoring, live Stripe/Gmail acceptance, privacy/tax/insurance/entity decisions, and owner operating-procedure acceptance.

## 2026-08-15 protected-staging verification evidence

- Worker version `0f42a94a-fa80-4dc3-8b7e-d81ff2dd2b9d` was deployed only to the existing protected staging Worker. The public site, DNS, GitHub Pages, Access policy, production, and Stripe live mode were not changed.
- D1 was exported and verified before migration. Only `0017_agreement_integrity_guards.sql` was pending and applied. Aggregate reconciliation preserved all existing rows; all reservations and blackouts remain explicitly synthetic. A post-change local import/export/restore rehearsal passed.
- Full preflight passed: 38 test files and 303 tests, lint, typecheck, readiness gate, production build, environment isolation, Worker dry run, schema generation with no unexpected drift, fresh/upgrade D1 rehearsal, backup/restore rehearsal, and HTTP smoke.
- Desktop and exact 390px protected-browser checks passed. The agreement pane is responsive, the required native inputs remain disabled before the bottom is reached, keyboard End unlocks them, inline Markdown formatting is rendered rather than displayed as formatting tokens, and no horizontal overflow was observed.
- A complete synthetic direct checkout passed. One Stripe test collection produced one collected ledger entry and one distinct signed webhook record. Collection showed a separate `Confirm reservation` action, offered no payment retry, and created exactly one confirmed reservation only after that action.
- The accepted agreement recorded version `TB-RA-2026-08-v1`; the owner UI generated one immutable `agreement-pdf-v1` artifact, recorded a 64-character SHA-256 document hash, exposed the protected download, and prepared the deterministic Booking Confirmation preview from authoritative payment/agreement data.
- Unauthenticated owner API access returned the Access redirect. Unauthenticated GET on the exact webhook path returned method-not-allowed, while an unsigned POST reached the Worker and was rejected as unauthorized. No other route was bypassed.
- The current Gmail staging connection requires owner reauthorization. No email was sent during this audit. Existing accepted delivery attempts remain immutable, and automated tests cover MIME rendering, exact-recipient enforcement, idempotency, and verified-PDF attachment gating, but a fresh provider-delivery acceptance remains a manual staging action after reauthorization.
- The final synthetic records are retained as labeled staging acceptance evidence; they do not affect public or production availability.
