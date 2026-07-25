# Protected staging external usability script

## Setup

1. Open the owner-provided `/customer-preview` staging link.
2. Authenticate through Cloudflare Access with the exact email address the owner approved.
3. Confirm the page visibly says **TEST / STAGING** and tells you to use synthetic information.
4. Run once at desktop width and once at approximately 390px mobile width.

Use a fresh invented identity for each run. Suggested data: `Synthetic Tester A`, `tester-a@example.test`, `480-555-0101`, and a fictional but plausible tow vehicle. For delivery-route testing, use a public business or landmark address, not a home address.

## Tasks

### 1. Find pricing

Without submitting, explain the base rental rate, extra-hour/daily-cap behavior, dolly price, refundable security-deposit requirement, delivery treatment, and whether a separate Arizona tax line appears. Record anything ambiguous.

### 2. Assess towing requirements

Find the minimum age, named-renter-only towing rule, hitch-ball size, brake-controller requirement, insurance acknowledgment, interstate-review requirement, and international-use rule. Attempt one submission with a required acknowledgment missing and record whether the correction is understandable.

### 3. Check dates and availability

Choose future pickup and return values in Arizona time. Verify only 15-minute choices from 6:00 AM through 10:00 PM are offered. Try an invalid range, then a valid range. Confirm the quote updates and the app explains that availability is not held.

### 4. Request delivery

Switch to delivery, enter a complete public location, and explicitly request a quote. Confirm the customer sees only availability, zone, fee, and time—not the hidden origin, exact mileage, route, or map. Test an address beyond the online service area if the owner supplies one. Confirm delivery remains subject to owner review.

### 5. Complete the booking preview

Submit a fully synthetic, qualified pickup request. Confirm the result distinguishes a 30-minute quote/checkout window from record retention. Also submit an interstate or delivery request and confirm it becomes `REVIEW_REQUIRED` for 24 hours without holding dates.

### 6. Exercise Stripe test-mode payment and recovery

Only if the protected flow offers Stripe test payment:

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 9995`
- Use any future expiry, any three-digit CVC, and a synthetic postal code.

Never use a real card. Confirm a failed result gives a useful next step. After a temporary browser/processing error, refresh the authoritative status: if the signed webhook succeeded, the screen must show payment collected and a separate **Confirm reservation** step, not another card retry. A retry may appear only when the server still reports unpaid. Payment success alone must not silently create or confirm a reservation.

### 7. Understand cancellation

Using only the displayed staging information, explain what you believe happens at 48 hours or more before pickup and within 48 hours. Flag any wording that appears contradictory or claims attorney approval. Do not treat this exercise as legal advice.

### 8. Mobile and accessibility

At 390px, complete the main flow using touch-sized controls. Check visible focus, labels, date/calendar controls, scrolling, error placement, quote readability, and whether any content overlaps or requires horizontal scrolling.

## Completion

Do not retry the same submission repeatedly. Record the approximate Arizona time, task number, expected and actual result, severity, and reproducible steps. Tell the owner when testing is complete so access can be revoked and the synthetic batch reconciled.
