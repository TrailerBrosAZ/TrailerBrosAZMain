# Trailer Bros Rental OS roadmap

## Direct confirmation and closeout foundation

Protected staging now prepares exactly two auditable, deterministic previews after authoritative prerequisites: booking confirmation and rental closeout. No message is sent. Public/Gmail enablement remains gated by attorney review, secure customer access, provider credentials, privacy/retention approval, backups, and production acceptance.

## Stripe Payment Foundation

Protected staging defines an append-only synthetic payment ledger, deterministic provider contract, payment/refund/deposit policy calculations, sanitized webhook journal, and owner-only mock preview. Stripe credentials, checkout, cards, public webhooks, live money movement, communications, and reservation confirmation remain disabled. See `PAYMENT_FOUNDATION.md` for the contract and launch gates.

## Priority order

The Rental OS remains the authoritative reservation and availability calendar. Reliable overlap protection, safe customer booking, Stripe payment workflows, immutable agreements, reviewed communications, and production security and recovery hardening take priority over autonomous or customer-facing AI behavior.

## Analytics & Owner Intelligence

### Owner-dashboard intelligence checkpoint

- Implemented on the feature branch: actionable dashboard summary cards, an accessible **Needs Attention** drawer, and direct reservation links.
- Implemented on the feature branch: a private owner-only Analytics route with deterministic database calculations and explicit `America/Phoenix` boundaries.
- Implemented metrics: reservation requests, active/completed rentals, booked rental revenue, confirmed-booking revenue, cancellations and no-shows, average rental duration, utilization, lead-source performance, weekly and monthly request trends, requested pickup day of week, delivery and dolly uptake, and upcoming unbooked availability.
- Implemented safeguards: booked revenue is separated from collected revenue; collected revenue, fees, refunds, and net revenue remain explicitly unavailable until Stripe exists.
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

## Customer Booking Foundation

Implemented for protected synthetic staging: customer schedule selection, authoritative availability checks, qualification and towing requirements, deterministic quotes, international rejection, explicit non-blocking `SUBMITTED` 30-minute quote windows and `REVIEW_REQUIRED` 24-hour approval-review windows, retained expired records, idempotent submission, atomic availability revalidation, minimized audit events, and owner-only intent review. Payment, agreement, communication, reservation conversion, public exposure, and live customer records remain disabled. See [Customer Booking Foundation contract](CUSTOMER_BOOKING_FOUNDATION.md).

## Backup and operational hardening

Protected staging uses authenticated health diagnostics, repeatable D1 export verification and restore rehearsal, environment-isolation checks, and documented owner-lockout, incident, promotion, rollback, RPO, and RTO procedures. Production resources, monitoring services, recovery administrators, and policy changes remain subject to separate approval. See [Backup, recovery, and incident runbook](BACKUP_AND_INCIDENT_RUNBOOK.md) and [Production readiness, threat model, and data map](PRODUCTION_READINESS_AND_DATA.md).

## Owner communication preparation

Implemented in protected synthetic staging: stored, audited owner previews for the two currently approved deterministic templates—booking confirmation and rental closeout—and an explicit copy-text action. No message is sent and no Gmail, Google Voice, SMS, or other delivery integration is connected. See [Deterministic communication preparation](COMMUNICATION_PREPARATION.md).

### Gmail test-mode delivery readiness

The protected staging architecture now defines exact-account OAuth authorization, encrypted D1 token storage, deterministic Gmail delivery attempts, stable message identifiers, retry/resend controls, and an owner-only synthetic self-send gate. `NO_SEND` remains the default until the owner separately configures and authorizes Gmail. No Google resource, credential, authorization, or message send is part of the checkpoint. See [Gmail test-mode integration runbook](GMAIL_TEST_MODE_RUNBOOK.md).
# Direct Checkout Orchestration Foundation

Protected staging now composes availability, authoritative quoting, qualification, immutable pre-reservation agreement evidence, explicit pickup-condition choice, Stripe test payment reconciliation, atomic reservation conversion, secure-link creation, and prepared Booking Confirmation into an expiring synthetic direct-checkout state machine. Public access, live Stripe, attorney approval, customer delivery, and automatic email remain blocked pending separate approval. See `DIRECT_CHECKOUT_ORCHESTRATION.md`.
