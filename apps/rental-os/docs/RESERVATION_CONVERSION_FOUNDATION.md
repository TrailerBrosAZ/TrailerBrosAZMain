# Reservation conversion foundation

This server-only foundation converts a synthetic, unexpired booking intent into a `PENDING_REVIEW` reservation inside one database transaction. It is deliberately not exposed by the customer or owner UI and has no HTTP conversion route in this checkpoint.

Conversion requires a fresh authoritative availability query, deterministic quote parity, complete qualification review, explicit delivery/interstate approvals when applicable, and signed-agreement evidence supplied by a future trusted server workflow. Browser-supplied agreement status is never accepted. A unique intent and idempotency record prevents duplicate conversion; database overlap triggers remain the final concurrency guard and roll back the customer, reservation, conversion, and audit writes together.

Only synthetic staging intents are eligible. Conversion does not collect payment, confirm the rental, send a message, expose a public link, or guarantee future approval. The resulting reservation stays `PENDING_REVIEW` and its audit records say that payment and communication were not executed. Enabling an owner command requires a later reviewed agreement-link workflow and payment/confirmation policy.
