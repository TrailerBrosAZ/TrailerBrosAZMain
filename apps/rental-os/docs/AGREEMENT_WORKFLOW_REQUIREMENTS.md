# Rental Agreement workflow requirements

This is a future owner/customer workflow requirement, not an implemented signing or communication feature.

## Required owner entry points

- A permanent **Rental Agreement** quick action on the owner dashboard.
- A **Send Agreement** action on every reservation detail view.
- A fast manual/walk-in flow that creates the minimum customer and reservation record before an agreement may be opened or signed. No orphan agreement is permitted.

## Delivery and signing options

- Generate a secure, reservation-specific, expiring and revocable agreement link with no customer identity in the URL.
- Send only a reviewed fixed email template after owner confirmation.
- Provide a copy-link action for the owner to paste manually into Google Voice or another approved human-controlled message.
- Provide an in-person open/sign option on an owner-controlled device.
- Do not claim delivery, customer acknowledgment, authorization, or signature until the corresponding workflow records evidence.

## Status and evidence

Track `Not Sent`, `Sent`, `Opened`, `Signed`, and `Expired` with timestamped audit events. Link status to one reservation and agreement version. A signed agreement becomes an immutable artifact automatically attached to that reservation, with integrity metadata and owner/customer copies. Future Google Drive storage is secondary archive only; the Rental OS record remains authoritative.

The workflow must define link expiration/revocation, authenticated owner access, customer session protection, document versioning, signature consent/evidence, retry and delivery-failure handling, privacy/retention, seven-year record retention, and a no-network fallback before implementation. Email, Google Voice/text copy, signature, PDF creation, and archive integrations remain disabled in this phase.
