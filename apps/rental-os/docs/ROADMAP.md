# Trailer Bros Rental OS roadmap

## Priority order

The Rental OS remains the authoritative reservation and availability calendar. Reliable overlap protection, safe customer booking, Stripe payment workflows, immutable agreements, reviewed communications, and production security and recovery hardening take priority over autonomous or customer-facing AI behavior.

## Analytics & Owner Intelligence

### Next owner-dashboard phase

- Make dashboard summary cards actionable. **Needs Attention** opens an action drawer; the other cards open the relevant filtered Schedule or Reservations view.
- Add a private, owner-only Analytics section. All calculations must be deterministic, database-backed, and explicitly use `America/Phoenix` date boundaries rather than the viewer's device timezone.
- Report booking count, booked rental revenue, confirmed-booking revenue, cancellations and no-shows, average rental duration, utilization, lead-source performance, weekly and monthly trends, day-of-week demand, delivery and dolly uptake, and upcoming unbooked availability.
- Label **booked revenue** separately from **collected revenue**. Collected revenue is unavailable and must not be inferred until payment integration exists.
- Provide date-range and comparison controls with documented inclusive/exclusive boundaries and Arizona-time behavior.
- Generate deterministic insight cards only from measured thresholds. Define each metric, denominator, threshold, comparison period, and insufficient-data behavior. Exclude synthetic/sample records by default, with any inclusion override clearly visible.
- Add automated coverage for analytics calculations, empty states, cancellations and no-shows, source attribution, date boundaries, Arizona time, synthetic-data exclusion, and comparison periods.

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
