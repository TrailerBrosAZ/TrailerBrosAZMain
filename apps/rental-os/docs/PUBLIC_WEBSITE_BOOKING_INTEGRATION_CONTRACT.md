# Future public website booking integration contract

No public-site change is part of this checkpoint. The existing Trailer Bros website, GitHub Pages configuration, DNS, CNAME, and forms remain authoritative and unchanged until a controlled rollout is approved.

## Proposed CTA and redirect

- Add one reviewed “Check availability / Book” CTA only after production acceptance. It opens the dedicated production Rental OS customer hostname in the same tab; the public site must not embed protected staging or expose owner routes.
- Optional deep-link parameters are limited to campaign/source attribution and a selected trailer code. Dates, prices, customer details, payment state, approval state, or authentication claims are never trusted from query parameters.
- The customer application owns the full booking journey. Back navigation returns to a reviewed Trailer Bros public URL without altering a submitted intent.

## Availability boundary

- The Rental OS database is authoritative. A future public availability endpoint returns only coarse availability for the requested trailer/window and no customer, reservation, blackout reason, owner, or operational data.
- Availability is advisory until the transaction that creates/converts a reservation. Payment and conversion must recheck availability atomically.
- Rate limiting, bot controls, abuse monitoring, privacy review, CORS allowlisting, and public-threat testing are required before removing Access from customer-only routes.

## Errors, attribution, and rollback

- Customer messages distinguish invalid input, unavailable dates, review-required delivery/interstate use, expired quote, payment failure, and temporary service failure without exposing internal details.
- Attribution uses an allowlisted source/campaign token stored with the intent; no cross-site customer identifiers or advertising pixels are required. Synthetic and staff QA traffic remains excluded from reporting.
- Rollback is one public CTA removal/reversion plus disabling the customer-only production route. Existing reservations remain in Rental OS and owner operations remain available; rollback must never revert D1 data or weaken overlap protection.

## Launch approvals still required

Owner approval is required for the final CTA wording/location, public customer hostname, attorney-reviewed agreement, public secure-link design, live Stripe activation, payment/refund acceptance, communication templates/delivery, privacy and retention notices, backups/monitoring, support fallback, accessibility testing, and production go-live/rollback rehearsal.
