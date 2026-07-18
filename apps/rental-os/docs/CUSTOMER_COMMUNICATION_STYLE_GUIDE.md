# Customer communication style guide

Version 1C staging supports exactly two deterministic, owner-controlled customer messages. Both render as matching plain-text and email-client-safe HTML. They use no AI, external fonts, remote images, tracking pixels, or public links.

## Voice and presentation

- Lead with the authoritative outcome: “booking confirmed” or “rental return complete.”
- Use short sections, direct labels, Arizona-local dates and times, and restrained Trailer Bros black/orange branding.
- Never imply payment, refund, delivery, agreement, inspection, or availability outcomes that are not supported by authoritative stored records.
- Support contact values are configured at send time. Never hardcode a phone number or secret in a template.
- HTML uses inline styles, semantic headings, presentation tables for layout, system fonts, high-contrast text, and a responsive 620-pixel container.

## Booking Confirmation

Trigger: an owner prepares the message for a synthetic direct reservation only after the authoritative server confirms the reservation, signed agreement, explicit inspection choice, reconciled collection, qualification, required delivery/interstate approvals, and final availability.

Authoritative statements:

- Confirmation code, trailer, Arizona pickup/return, and fulfillment come from the reservation snapshot.
- Rental, dolly, approved delivery, refundable deposit, and total collected come from the server payment breakdown and reconciled collection prerequisite.
- The signed-agreement receipt is represented by a secure-link placeholder until the protected link-delivery workflow is approved.
- `SEND_FORM` includes the secure inspection-link placeholder. `DECLINE_FORM` states that no inspection link is included.

Suppression: external-source reservations, incomplete qualification or approval, unsigned agreement, unreconciled payment, missing inspection choice, or an availability conflict block preparation. The message never says “request received.”

## Rental Closeout

Trigger: an owner prepares the message only after a completed return inspection and deliberate deposit decision.

Authoritative statements:

- Return time, trailer, and closeout identity come from the reservation and inspection records.
- “$100 security-deposit refund completed” appears only when the immutable payment ledger contains a successful deposit-release refund.
- A recorded release without a successful ledger refund explicitly says the refund is not yet recorded.
- A damage-retain decision reports only the owner-recorded amount and keeps the outcome review-oriented; it does not claim a charge, legal conclusion, or customer fault.

## Delivery and audit controls

- Preparation creates an immutable versioned record containing subject, plain text, HTML, source hash, content hash, and authoritative provenance.
- Copying and every Gmail attempt produce audit events. Gmail self-send remains synthetic-only, exact-recipient-only, confirmation-gated, idempotent, and duplicate protected.
- “Accepted by Gmail” means provider acceptance only. It is never presented as delivery or read proof.
- New wording or legal representations require a new template version. Existing prepared or sent records are never overwritten.

## Attorney and owner review

Final agreement language, inspection-decline wording, damage/retention wording, and any future customer-facing secure-link language require owner acceptance and Arizona-attorney review before public launch.
