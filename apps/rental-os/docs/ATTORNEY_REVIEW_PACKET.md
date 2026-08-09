# Trailer Bros Rental OS attorney review packet

Status: **Attorney review required. Not legal advice and not a representation of legal approval.** This packet describes the protected synthetic staging implementation so Arizona counsel can review the customer agreement, evidence flow, and operating policies. It does not replace counsel's advice.

## Business and equipment facts presented for review

- Operator: Trailer Bros LLC, Arizona, operating in Maricopa County.
- Equipment: one 14-foot tandem-axle trailer; published 7,000-pound GVWR and approximately 5,200-pound payload capacity, with payload pending physical plate verification.
- Renter: minimum age 25; only the named renter may tow.
- Geography: Arizona use is permitted; interstate use requires disclosure and owner approval; international use is prohibited.
- Towing qualification: renter records tow-vehicle details and acknowledges the required 2-5/16-inch hitch ball, electric brake controller, and insurance responsibility. The application does not claim that insurance coverage was independently verified.
- Time rules: pickup and return from 6:00 AM through 10:00 PM America/Phoenix time, in 15-minute increments; no automatic turnaround buffer.
- Rental price: $60 per complete 24-hour rental day. Additional time is $10 per hour, capped at $60 for a partial day. Dolly is $10 per rental day. Tie-down straps are included.
- Security deposit: $100 refundable deposit requirement. Release occurs only after owner inspection; a damage-related retain decision requires the completed return inspection, amount, reason, and damage notes.
- Tax display: no separate Arizona tax line in the current quote.
- Delivery, one-way driving distance: $2.50 per one-way road mile, with the server-calculated road distance rounded up to the next whole mile. Delivery requires owner approval and does not guarantee availability; routing failure requires owner review without an invented fee.
- Cancellation: at least 48 hours before pickup records a full-refund outcome. Within 48 hours or no-show records a $100 retained outcome and refund of the applicable rental-related amount. Early return has no automatic prorated refund.
- Payments: Stripe is the intended direct-payment processor. Current protected staging uses synthetic records and Stripe test mode only; it does not authorize live collection.

## Implemented customer evidence journey

| Stage | Customer-facing wording/evidence | Stored evidence | Integrity controls | Not claimed |
| --- | --- | --- | --- | --- |
| Availability and quote | Arizona dates/times, availability result, itemized estimate, delivery status | intent times, quote components, source state, expiration | server calculation, authoritative overlap query, D1 overlap triggers, idempotency | An intent does not hold dates, guarantee delivery, or confirm a rental |
| Qualification | age 25, named renter towing, hitch, brake controller, insurance responsibility, intended use, trip type | explicit boolean answers, tow/use details, exception list | server validation; international rejection; owner review for delivery/interstate | Insurance policy validity, identity, license, or vehicle capability is not verified |
| Agreement | versioned terms and explicit acknowledgments | immutable template version/hash and renter, reservation/intent, and quote snapshots | exact source version/hash; signed instances cannot be overwritten | Attorney approval, customer delivery, or legal sufficiency |
| Signature | printed name, electronic consent, terms acknowledgment, towing/insurance acknowledgment | consent and acknowledgment timestamps, signed timestamp, signature-evidence JSON | append-only evidence and audit event; deterministic document hash | A specific e-sign law conclusion or identity-proofing level |
| Pickup-condition choice | `SEND_FORM` or affirmative `DECLINE_FORM` wording from the versioned source | exact choice and timestamp; completion/decline record | silence is not treated as decline; signed choice is immutable | Decline does not accept unknown damage or waive every claim |
| Payment | server-authoritative total and test-mode readiness | append-only payment ledger, sanitized provider IDs/statuses, webhook journal | Stripe signature verification, idempotency, server reconciliation | Live payment, authorization, collection, or confirmation from browser success alone |
| Confirmation | deterministic Booking Confirmation only after prerequisites | versioned communication content/hash, readiness evidence, delivery attempts | server readiness and audit; exact-recipient synthetic testing | Customer delivery unless provider acceptance is recorded |
| Pickup condition | notes, checklist/condition evidence, optional metadata labels | inspection timestamp, actor, notes, damage facts, metadata only | lifecycle validation and audit | Hosted photos, customer identity verification, or automatic fault allocation |
| Return inspection | condition, usage/trip notes, damage notes | timestamped return inspection and related audit | required before damage-related deposit decision | Automatic damage valuation or customer agreement with findings |
| Deposit outcome | deliberate release or retain record | decision, amount, reason, damage notes, payment action/ledger | return inspection prerequisite; duplicate/cumulative refund safeguards | A refund unless authoritative payment records show success |
| Closeout | deterministic returned/complete and deposit wording | versioned content/hash and audit/delivery attempt | suppression when authoritative facts are missing | Deposit release/refund when no reconciled refund exists |

## Version, hash, timestamp, and audit model

The protected-staging agreement source version is `TB-RA-2026-08-v1`, classified `OWNER_DRAFT_ATTORNEY_REVIEW_PENDING`. It does not replace the operative public agreement. The application computes a canonical SHA-256 source hash, stores template version/hash with every agreement snapshot, stores acknowledgment and signature timestamps, and renders a deterministic PDF with its own content hash and renderer version. Signed agreement records and attorney approval records are protected against update and deletion by database triggers. Audit events identify the aggregate, action, actor, timestamp, and minimized structured facts. Raw secure-link tokens, payment card data, OAuth secrets, and hosted photo content are not agreement evidence.

## Questions requiring Arizona counsel

Counsel should complete [the attorney checklist](ATTORNEY_REVIEW_CHECKLIST.md), identify required revisions, and approve an exact agreement version. The owner must then deliberately record the approved version, review date, and approval reference in the protected owner interface. A source version or hash change returns the release gate to **Attorney Approval Required**.

## Release gate

The default state is fail-closed. No record is seeded or simulated. Future public agreement signing and live checkout remain blocked until a matching immutable attorney-approval record exists for the exact current source version and hash. Recording approval does not itself publish a route, enable Stripe live mode, change Access, or constitute legal advice.
