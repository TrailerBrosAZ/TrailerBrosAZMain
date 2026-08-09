# Customer Booking Foundation contract

This checkpoint is a protected staging preview. Cloudflare Access continues to protect the complete Worker, assets, customer-preview route, and APIs. It is not linked from the public website and cannot accept real customer traffic.

The customer launch preview now presents the complete intended journey: authoritative availability, deterministic quote, qualification, delivery quote/review, agreement action, payment readiness, and booking outcome. Agreement and payment stages are explicitly blocked—not simulated as complete—until legal/public-link and live-Stripe approvals exist. The visual treatment reuses the checked-in Trailer Bros brand asset; it does not change the public website.

## Customer experience

The protected preview uses a focused four-step journey: authoritative schedule and add-ons, renter/trip details, agreement with all qualification acknowledgments and signature evidence, and final review plus Stripe test-mode payment. A clear confirmation screen follows successful server-side reconciliation. Each step replaces the previous pane so the customer does not navigate a long implementation ledger. Live payment, public access, and unreviewed legal wording remain blocked.

Payment is the last customer action. A browser success signal never confirms a booking. After signed-webhook reconciliation records collection, the server performs the separately idempotent final availability and evidence transaction. Only that successful server transaction produces the customer-facing confirmed state.

## Availability and intent lifecycle

- Reservations and availability blocks in the Rental OS remain the authoritative calendar.
- The customer calendar is a privacy-minimized Rental OS view. It shows only available/unavailable days and never exposes customer names, sources, reasons, confirmation codes, or reservation details.
- Google Calendar is not used by checkout and is not an availability authority. A future one-way informational copy remains a post-pilot roadmap item.
- Pickup and return are selected as separate calendar dates and constrained time choices. Times use 15-minute increments from 6:00 AM through 10:00 PM in `America/Phoenix`; arbitrary minute values are rejected by the shared rule and API.
- Availability checks include persisted reservations in `Pending Review`, `Confirmed`, `Checked Out`, and `Inspection Pending`, plus all availability blocks.
- Booking intents never block availability and never appear as reservations.
- A standard qualified intent with no owner exception is `SUBMITTED` and has a 15-minute quote/checkout-validity window. After a successful availability check, an authoritative 15-minute checkout hold blocks overlapping reservations and blackouts. The opaque raw hold token remains in the browser only; D1 stores its hash.
- The customer sees a persistent countdown. Expiration retains the hold and intent records for audit but releases availability and requires a fresh availability, qualification, and quote check.
- An interstate or delivery request is explicitly `REVIEW_REQUIRED` and remains available for owner review for 24 hours.
- Both states remain non-blocking. Owner review or future approval does not reserve dates or guarantee availability.
- After either window ends, the operational state is `EXPIRED`; the record and audit history are retained rather than deleted. Expiration means pricing, qualification answers, and authoritative availability must all be revalidated before proceeding.
- Submission rechecks availability inside the same atomic database batch that inserts the intent and its audit event. A schedule change between preview and submission returns a conflict without writing an intent or audit event.
- A client-generated idempotency key has a unique database index. Repeating the same submission key returns the original intent and creates no duplicate audit event.
- Every preview-created intent is explicitly synthetic. No card, license image, insurance document, signature, agreement, or inspection photo is collected.
- Future conversion to a reservation and any future payment attempt are intentionally absent. Either must use a new transaction that rechecks authoritative availability immediately before proceeding; database overlap triggers remain the final enforcement layer.

## Qualification contract

The customer is not asked to type tow-vehicle year, make, model, or towing details. Instead, the workflow requires an explicit acknowledgment that the renter is responsible for using a properly rated and capable tow vehicle for the intended trailer and load. A neutral compatibility note is retained in the current schema for audit continuity until a future migration removes that legacy field.

Submission requires full legal name, email, phone, confirmation of age 25 or older, confirmation that only the named renter will tow, towing-suitability acknowledgment, acknowledgment of a 2-5/16-inch hitch ball and electric brake controller, insurance-requirement acknowledgment, and intended use. International use is rejected. Interstate use requires destination/details and produces an owner-approval exception. Delivery requires an address and produces a calculation/approval exception.

The acknowledgment fields record only what the synthetic preview form captured. They do not prove insurance coverage, identity, payment authorization, or completion of a future production verification process.

## Quote contract

- Rental: $60 per complete 24-hour period.
- Remaining time: rounded up to the next hour at $10 per hour, capped at the $60 daily rate.
- Dolly: $10 for each started rental day (`ceil(duration / 24 hours)`, minimum one day).
- Tow straps: included.
- Refundable security-deposit requirement: $100, displayed separately.
- No separate Arizona tax line is displayed or added.
- Delivery charge: unavailable until one-way road-distance calculation and owner approval exist.

The displayed estimate includes rental, dolly, the deposit requirement, and a server-calculated delivery fee when routing determines that the address is within the online service area. Delivery is always `REVIEW_REQUIRED`. The customer sees only availability, zone, and fee; exact distance and the hidden origin are never returned. Routing failure produces an owner-review fallback with no invented fee. The estimate is not collected revenue and does not establish a confirmed booking.

The customer estimate recalculates immediately when a valid pickup/return period, dolly selection, or fulfillment selection changes. The browser uses the same deterministic quote function as the API, but the API remains authoritative and recalculates before storing an intent. Invalid or incomplete ranges never display a numeric estimate.

## Owner review

The owner-only Booking Intents area lists intents and exposes stored qualification answers, requested Arizona dates, quote snapshot, explicit state, exceptions, interstate and delivery approval needs, window end, synthetic marking, and audit history. The interface distinguishes an expired quote/review window from record deletion and repeats that approval cannot hold availability. There are no confirm, convert, payment, agreement, email, delete, or customer-message actions in this checkpoint.
