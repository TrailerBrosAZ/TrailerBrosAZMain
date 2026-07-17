# Rental Agreement workflow requirements

The protected staging foundation now implements owner-driven synthetic agreement opening/signing, immutable snapshots, explicit consent evidence, a required mutually exclusive pickup-inspection choice, pickup-condition completion/decline, status display, and audit history. Public links, delivery, final PDFs, and external storage remain future requirements. Deterministic communication previews exist, but delivery is unavailable.

## Required owner entry points

- A permanent **Rental Agreement** quick action on the owner dashboard is implemented and opens owner reservations.
- Reservation detail provides protected open/sign/inspection actions. A future **Send Agreement** action remains disabled until secure links and reviewed delivery exist.
- A fast manual/walk-in flow that creates the minimum customer and reservation record before an agreement may be opened or signed. No orphan agreement is permitted.

## Delivery and signing options

- Generate a secure, reservation-specific, expiring and revocable agreement link with no customer identity in the URL.
- Send only a reviewed fixed email template after owner confirmation.
- Provide a copy-link action for the owner to paste manually into Google Voice or another approved human-controlled message.
- Provide an in-person open/sign option on an owner-controlled device.
- Do not claim delivery, customer acknowledgment, authorization, or signature until the corresponding workflow records evidence.

## Status and evidence

The foundation tracks `Opened` and `Signed` with timestamped audit events and binds each instance to one reservation and template version/hash. Future secure delivery adds `Not Sent`, `Sent`, and `Expired`. A signed agreement record is immutable and attached to its reservation; owner/customer PDF copies and Google Drive secondary archive are not yet implemented.

The workflow must define link expiration/revocation, authenticated owner access, customer session protection, document versioning, signature consent/evidence, retry and delivery-failure handling, privacy/retention, seven-year record retention, and a no-network fallback before implementation. Email, Google Voice/text copy, signature, PDF creation, and archive integrations remain disabled in this phase.
