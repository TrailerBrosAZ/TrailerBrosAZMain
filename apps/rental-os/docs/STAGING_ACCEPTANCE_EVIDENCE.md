# Protected staging acceptance evidence — historical checkpoint

This file preserves the July 22 acceptance checkpoint. It is not current production-readiness evidence. The dated pre-production convergence result and current release classifications are recorded in `PRE_PRODUCTION_CONVERGENCE_AUDIT.md`; public launch remains fail-closed.

Checkpoint date: 2026-07-22 Arizona time. Environment: existing protected synthetic staging only. Worker version: `d7f65f7c…`. No production, public-site, DNS, live-payment, or real-customer configuration changed.

## Readiness outcomes

- **Protected synthetic staging pilot: READY.** All pilot-critical automated and external acceptance evidence passed. This permits continued owner-only synthetic testing behind Cloudflare Access; it is not approval for real customers, live payments, or public links.
- **Public launch: NOT_READY.** Fail-closed pending Arizona-counsel approval of the exact agreement source, controlled public wording corrections, public customer-access design, live-payment approval, and production acceptance.
- **Attorney approval: NOT RECORDED.** The current agreement remains operative. No future terms are represented as approved or superseding it.

## Executed acceptance evidence

| Area | Result | Evidence / limitation |
|---|---|---|
| Direct checkout, replay, expiry | PASS | Automated direct-checkout/API suites cover replay, expiry, stale availability, and atomic conversion. The browser run also exposed and corrected a nested-button form-resubmission defect before continuing. |
| Concurrent overlap | PASS | Database overlap triggers and API race coverage reject conflicting reservation/blackout writes. |
| Qualification/review routing | PASS | Age, named-tower, hitch, controller, insurance and international rejection; interstate/delivery review retention. |
| Secure links | PASS | Hash-at-rest, expiry, revocation, replay/rate boundary and reservation-purpose controls. |
| Stripe test-mode 3DS | PASS | Official Stripe 3DS test method completed its authentication challenge. The server-authoritative $160.00 synthetic collection reconciled through a signed webhook. Browser success did not create or confirm a reservation; explicit finalization was still required. Provider identifiers are deliberately omitted. |
| Payment/conversion reconciliation | PASS | Payment remained reconciled/non-converted until the separate final confirmation. Final conversion produced one linked synthetic reservation and preserved fresh readiness/availability checks. Six stored webhook events have six distinct provider event identifiers. |
| Google Calendar | DEFERRED / NOT IMPLEMENTED / NOT A PILOT DEPENDENCY | Rental OS is the sole authoritative availability and reservation system. A future post-pilot Calendar feature may be one-way outbound copy only, with no Calendar-to-Rental-OS writes. |
| Google Maps delivery | PASS — automated | Routes response parsing, exact field mask, boundary pricing, privacy, and safe fallback are covered. No external Maps call was required for this acceptance fixture. |
| Gmail exactly-once | PASS | One freshly prepared Booking Confirmation was sent only to the configured exact-match staging recipient. Gmail returned accepted; one immutable delivery attempt and one matching audit event exist. Duplicate sending is disabled. Delivery/read receipt is not claimed. |
| Desktop browser | PASS | Authenticated dashboard and owner navigation rendered at the desktop breakpoint with no horizontal overflow or console warnings/errors. Evidence: `data/acceptance/desktop-dashboard-2026-07-22.png`. |
| 390px mobile browser | PASS | Exact 390 × 844 viewport; dashboard and Customer Preview rendered without horizontal overflow, with accessible mobile navigation and no console warnings/errors. Evidence: `data/acceptance/mobile-dashboard-390x844-2026-07-22.png` and `data/acceptance/mobile-customer-preview-390x844-2026-07-22.png`. |
| Unauthenticated Access | PASS | Fresh unauthenticated requests to `/` and `/api/dashboard` each returned HTTP 302 to Cloudflare Access. No ordinary app/API bypass was observed. |
| Backup/export/restore | PASS | A verified pre-migration export was taken. The previously authorized isolated remote recovery rehearsal matched reservations, blocks, audits, intents, ledgers, communications, Gmail attempts, and triggers, then removed the temporary recovery database. The final post-migration restorable export passed SQLite integrity, foreign-key, schema, trigger, and aggregate verification. |
| Migration safety | PASS | Trace identified a 500 on the attorney-readiness endpoint because tracked migration `0015_superb_silver_surfer.sql` was the only pending staging migration. A fresh verified export preceded applying only `0015`; existing record counts remained intact and the fail-closed attorney gate rendered normally afterward. |
| Synthetic reconciliation | PASS | Count-only reconciliation found zero non-synthetic records across reservations, availability blocks, booking intents, payment ledgers, communications, and Gmail attempts. Final dataset contains six synthetic reservations, six intents, thirteen ledger entries, six unique webhook events, seven communication records, and five Gmail attempts. |
| Public/live disabled | PASS | The public site and production configuration were not changed. Live Stripe, public customer access, Google Calendar, and production deployment remain disabled. |
| Attorney approval | BLOCKED FOR PUBLIC LAUNCH | The attorney-approval table remains empty. No approval was simulated. |

The generated machine-readable artifact is `data/test-readiness-evidence.json` (ignored and non-sensitive). `npm run test:readiness` reports both scopes: protected synthetic pilot readiness and public-launch readiness. `--require-ready` remains tied to the public launch gate and therefore exits nonzero while attorney approval is blocked.

## Defects discovered during execution

1. Nested direct-checkout action buttons inherited the parent booking form submit behavior. Every nested action now has `type="button"`, with regression coverage.
2. Staging had tracked migration `0015` pending, causing the attorney-readiness API to fail closed with HTTP 500. The database was exported and verified before applying only that migration. No reservation, blackout, audit, inspection, analytics, intent, payment, agreement, communication, or Gmail-attempt record was lost.

## Synthetic-data cleanup

The evidence dataset is retained temporarily for audit and regression review. Before any approved real-customer pilot, take another verified export and execute an owner-approved cleanup plan that preserves immutable audit/provider reconciliation evidence. Never delete audit history merely to make counts look clean.

## 2026-08-26 Gmail reauthorization and fresh acceptance addendum

This addendum records a fresh protected-staging acceptance after the owner completed Gmail reauthorization. It contains no OAuth code, token, credential, recipient address, full provider identifier, message body, or real customer data.

- Gmail authorization returned `CONNECTED` with only the identity scopes and `gmail.send`; the integration remained exact-recipient and synthetic-only.
- One new synthetic direct checkout produced one confirmed reservation, one signed immutable `TB-RA-2026-08-v1` agreement, one reconciled Stripe test collection, and one distinct signed webhook record. Payment collection still required the separate final reservation-confirmation action.
- The owner generated one deterministic `agreement-pdf-v1` artifact. The 41,389 decoded PDF bytes recomputed to the exact stored SHA-256 document hash. The Booking Confirmation send path independently repeated the same integrity check before attaching those bytes.
- One deterministic Booking Confirmation with matching HTML/plain-text alternatives and the expected synthetic confirmation subject was accepted by Gmail for the configured owner test recipient. D1 contains one immutable communication record, one delivery attempt in `ACCEPTED_BY_GMAIL`, one send-started audit event, and one send-recorded audit event.
- Refreshing and reopening the reservation left the send control disabled with the explicit duplicate-blocked explanation. Server tests also passed for accepted-attempt replay rejection, failed/unknown safe retry requirements, duplicate checkout/reconciliation, and signed-webhook deduplication.
- Targeted Gmail, communication, agreement/PDF, checkout-recovery, direct-checkout, and webhook suites passed: 13 files and 89 tests. Full preflight passed: 38 files and 306 tests, plus lint, typecheck, readiness gate, build, environment validation, Worker dry run, schema generation, D1 migration/restore rehearsal, and HTTP smoke.
- Gmail API acceptance is not represented as inbox delivery or read receipt. Customer-recipient sending and production Gmail remain blocked.

Protected synthetic staging acceptance is complete for the tested Gmail provider path. Public launch remains `NOT_READY` and fail-closed under the blockers listed in `PRE_PRODUCTION_CONVERGENCE_AUDIT.md`.
