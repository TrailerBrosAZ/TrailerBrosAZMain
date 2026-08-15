# Trailer Bros Rental OS roadmap

## Post-pilot: optional Google Calendar informational copy

Google Calendar is formally deferred for the initial controlled pilot and is not a launch dependency. Rental OS remains the sole authoritative availability and reservation system.

A later, separately approved integration may create or update a one-way informational copy of eligible Rental OS reservations in Google Calendar. It must be idempotent, auditable, retryable, and visibly report copy/reconciliation failures. Google Calendar must never create, edit, cancel, block, approve, or write back into Rental OS, and Calendar events must never be treated as availability authority. No Calendar account, credential, API, or external resource is connected by this roadmap entry.

## Direct confirmation and closeout foundation

Protected staging prepares exactly two auditable, deterministic previews after authoritative prerequisites: booking confirmation and rental closeout. An owner-confirmed synthetic self-send adapter is implemented for the exact configured test recipient only; it never sends automatically and currently requires owner Gmail reauthorization. Public/customer delivery remains gated by attorney review, secure customer access, production Gmail configuration, privacy/retention approval, backups, and production acceptance.

## Stripe Payment Foundation

Protected staging implements an append-only synthetic payment ledger, Stripe test-mode provider adapter, Payment Element checkout, signed exact-path webhook verification/deduplication, server reconciliation, payment/refund/deposit policy calculations, and explicit post-collection reservation confirmation. Card data remains in Stripe.js. Live keys, live money movement, production webhooks, public checkout, and customer communications remain disabled. See `PAYMENT_FOUNDATION.md` for the contract and launch gates.

## Priority order

The Rental OS remains the authoritative reservation and availability calendar. Reliable overlap protection, safe customer booking, Stripe payment workflows, immutable agreements, reviewed communications, and production security and recovery hardening take priority over autonomous or customer-facing AI behavior.

## Analytics & Owner Intelligence

### Owner-dashboard intelligence checkpoint

- Implemented on the feature branch: actionable dashboard summary cards, an accessible **Needs Attention** drawer, and direct reservation links.
- Implemented on the feature branch: a private owner-only Analytics route with deterministic database calculations and explicit `America/Phoenix` boundaries.
- Implemented metrics: reservation requests, active/completed rentals, booked rental revenue, confirmed-booking revenue, cancellations and no-shows, average rental duration, utilization, lead-source performance, weekly and monthly request trends, requested pickup day of week, delivery and dolly uptake, and upcoming unbooked availability.
- Implemented safeguards: booked revenue is separated from collected revenue; analytics do not present test-ledger activity as production collected revenue, fees, refunds, or net revenue.
- Implemented controls and evidence: date-range presets, custom dates, adjacent comparison, documented metric contracts, deterministic threshold insights, explicit insufficient-data states, synthetic exclusion by default, and automated analytics coverage.
- The exact definitions and thresholds are maintained in [Analytics metric contracts](ANALYTICS_METRICS.md).

### Later financial-data phase

- Use Stripe as the source of truth for collected revenue, processing fees, refunds, security-deposit activity, and net revenue.
- Support a one-time, controlled historical Square or CSV import so reporting may include pre-Stripe history. This must not create an ongoing Square connection or dependency.
- Keep imported history traceable to its source and import run, with validation, reconciliation, rollback/recovery instructions, and duplicate protection.

### Later GPT analyst phase

- Add a private, owner-only **Ask Trailer Bros Analyst** panel within the dashboard.
- Call OpenAI from the server only. Store the API key as a Cloudflare secret and enforce a small monthly usage limit and request-level cost controls.
- Give the analyst only narrowly scoped, read-only aggregate tools, such as performance, utilization, lead-source, and availability reports.
- Do not give the analyst unrestricted database access, customer driver-license or identity data, card data, write access to reservations, refund authority, messaging capability, or permission to take external actions.
- Begin with business questions and explainable recommendations. Do not permit autonomous decisions or customer-facing AI communication.
- Before enabling the feature, document data minimization, prompt and response retention, access logging, deletion policy, cost limits and alerts, failure behavior, prompt-injection controls, and test/evaluation requirements.

This sequence does not move analytics or AI ahead of the core owner and customer workflows. Autonomous or customer-facing AI remains out of scope until the authoritative calendar, safe booking, Stripe, agreements, communications, authentication, hosting, backups, monitoring, and production-hardening requirements are complete and approved.

## Rental Agreement fallback and walk-in requirements

Implemented in protected synthetic staging: a permanent dashboard **Rental Agreement** quick action, reservation-bound owner open/sign flow, explicit consent evidence, immutable versioned snapshots, deterministic print-ready agreement rendering and hashes, pickup-condition completion or affirmative decline, status display, audit history, and opaque hashed/revocable/expiring reservation links. Links remain synthetic-only behind Access. Still required: public customer-access approval, **Send Agreement**, reviewed delivery, final attorney-approved PDF/e-sign acceptance, archive copies, and legal approval. See [Rental Agreement workflow requirements](AGREEMENT_WORKFLOW_REQUIREMENTS.md). No external communication or public signing access is enabled.

### Attorney-review release gate

Public agreement signing and live checkout are fail-closed. The owner dashboard reports **Attorney Approval Required** by default. Release requires a deliberate, immutable owner record containing the exact current agreement version and matching source hash, attorney review date, and approval reference. No approval is seeded or simulated; changing the source version/hash requires renewed review. The review packet, checklist, and source/change manifest are [Attorney review packet](ATTORNEY_REVIEW_PACKET.md), [Attorney checklist](ATTORNEY_REVIEW_CHECKLIST.md), and [Agreement source and change log](AGREEMENT_SOURCE_AND_CHANGELOG.md). This control does not itself publish customer access or enable live payments.

## Customer Booking Foundation

Implemented for protected synthetic staging: a four-step booking wizard; authoritative calendar and 15-minute checkout holds; qualification and towing requirements; deterministic rental/dolly/delivery quotes; international rejection; immutable agreement acceptance and pickup-condition choice; Stripe test-mode collection and webhook reconciliation; explicit, idempotent, transaction-safe reservation confirmation; secure-link preparation; deterministic confirmation preview; retained intent/session/audit history; and owner review. Public exposure, live Stripe, automatic customer communication, attorney approval, and real customer records remain disabled. See [Customer Booking Foundation contract](CUSTOMER_BOOKING_FOUNDATION.md) and [Direct checkout orchestration](DIRECT_CHECKOUT_ORCHESTRATION.md).

## Backup and operational hardening

Protected staging uses authenticated health diagnostics, repeatable D1 export verification and restore rehearsal, environment-isolation checks, and documented owner-lockout, incident, promotion, rollback, RPO, and RTO procedures. Production resources, monitoring services, recovery administrators, and policy changes remain subject to separate approval. See [Backup, recovery, and incident runbook](BACKUP_AND_INCIDENT_RUNBOOK.md) and [Production readiness, threat model, and data map](PRODUCTION_READINESS_AND_DATA.md).

## Owner communication preparation

Implemented in protected synthetic staging: stored, audited owner previews for the two approved deterministic templates—booking confirmation and rental closeout—plus copy-text and exact-recipient, confirmation-gated Gmail synthetic self-send. No customer-recipient delivery, Google Voice, SMS, or other delivery integration is connected. See [Deterministic communication preparation](COMMUNICATION_PREPARATION.md).

### Gmail test-mode delivery readiness

Protected staging implements exact-account OAuth authorization, encrypted D1 token storage, deterministic Gmail delivery attempts, stable message identifiers, retry/resend controls, verified-PDF attachment gating, and an owner-only synthetic self-send gate. The current connection requires owner reauthorization; `NO_SEND` remains the fail-closed state whenever authorization or an authoritative prerequisite is absent. No production Gmail sender or customer-recipient rule is enabled. See [Gmail test-mode integration runbook](GMAIL_TEST_MODE_RUNBOOK.md).
# Direct Checkout Orchestration Foundation

Protected staging now composes availability, authoritative quoting, qualification, immutable pre-reservation agreement evidence, explicit pickup-condition choice, Stripe test payment reconciliation, atomic reservation conversion, secure-link creation, and prepared Booking Confirmation into an expiring synthetic direct-checkout state machine. Public access, live Stripe, attorney approval, customer delivery, and automatic email remain blocked pending separate approval. See `DIRECT_CHECKOUT_ORCHESTRATION.md`.
