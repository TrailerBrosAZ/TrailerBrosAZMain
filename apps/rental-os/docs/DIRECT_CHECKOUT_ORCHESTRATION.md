# Direct Checkout Orchestration Foundation

Status: protected, synthetic staging foundation. It is not a public checkout and is not approved for live payments or customers.

## Authoritative lifecycle

`QUOTE_READY → AGREEMENT_REQUIRED → AGREEMENT_SIGNED → PAYMENT_REQUIRED → PAYMENT_PENDING → PAYMENT_COLLECTED → CONFIRMATION_PENDING → COMPLETE`

Terminal safe outcomes are `OWNER_REVIEW_REQUIRED`, `UNAVAILABLE`, `EXPIRED`, `ABANDONED`, and `REVOKED`. Delivery, interstate, external-source, expired, or otherwise exceptional requests cannot enter automatic checkout. Checkout sessions expire after 30 minutes, never hold dates, retain an audit history, and use opaque tokens whose hashes—not raw values—are stored. A separate CSRF token is required for every mutation.

The server recomputes the Arizona-time quote and checks the authoritative reservation/blackout calendar when a session begins, before payment creation, and before final conversion. Browser payment success is never authoritative. A signed Stripe webhook or trusted server retrieval must reconcile collection before final conversion. The final D1 batch creates exactly one customer, confirmed direct reservation, conversion record, signed agreement copy, pickup-condition choice, immutable reservation-linked payment entry, hashed secure links, prepared Booking Confirmation, audit event, and completed session. Database uniqueness and overlap triggers reject duplicate or conflicting conversion.

## Customer wording

- Quote ready
- Agreement required
- Agreement complete
- Payment required
- Payment processing
- Payment received
- Confirming reservation
- Reservation confirmed
- Owner review required
- Dates no longer available
- Checkout expired / closed / unavailable

The interface states that dates are not held until final confirmation, attorney review is still required, and signed server reconciliation—not the browser—controls payment status.

## Security and privacy boundary

- Protected staging and synthetic records only.
- Raw session and CSRF tokens display only to the active browser and are never persisted or audited.
- Payloads are capped at 64 KB; cross-origin mutation requests are rejected when an Origin header is present.
- Customer responses omit owner notes, provider identifiers, route distance, other renters, and audit payloads.
- Payment card data stays in Stripe.js. D1 stores sanitized test identifiers and immutable ledger facts only.
- Delivery and interstate requests remain nonblocking owner review. External bookings never enter this workflow.

## Public-launch blockers

Before any Access bypass or public link: Arizona-attorney agreement approval; approved privacy notice and retention schedule; bot protection; public-session rate limiting independent of owner identity; secure public token delivery and recovery; production Stripe keys/webhook and payment acceptance; Gmail transactional-delivery acceptance and bounce monitoring; independent encrypted backups; alerts and incident drills; accessibility/security testing; production data migration and rollback rehearsal; owner acceptance of all customer wording and refund/deposit handling.
