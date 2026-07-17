# Direct booking confirmation and closeout communications foundation

Protected staging implements exactly two deterministic customer-message records: `BOOKING_CONFIRMATION` and `RENTAL_CLOSEOUT`. Both are synthetic, owner-preview-only records. The provider is deliberately `NO_SEND`; absent Gmail configuration fails closed as `SEND_UNAVAILABLE` and can never be represented as sent or delivered.

Each record retains reservation association, recipient, communication type, template key/version, source-template SHA-256, rendered-content SHA-256, state, preparation/copy timestamps, a safe error classification, an idempotency key, synthetic marker, and immutable audit evidence. Message content/provenance cannot be updated or deleted. No card data, Stripe secret, license image, signature evidence, inspection notes, route, or unnecessary agreement data belongs in a communication record.

## Communications matrix

| Type | Trigger/prerequisites | Included | Suppressed/blocked | Owner override |
|---|---|---|---|---|
| Booking confirmation | Direct reservation; authoritative `CONFIRMED`; qualification and delivery/interstate approvals; signed agreement with explicit inspection choice; server-reconciled collection; final transactional availability check | Arizona pickup/return, trailer, approved fulfillment, itemized rental/dolly/delivery/deposit/total, support placeholders, secure agreement-link placeholder | External/manual sources; missing evidence; stale availability; inspection link when choice is `DECLINE_FORM` | No override. Correct source records and re-prepare. |
| Rental closeout | Completed return inspection and deliberate deposit decision | Return confirmation, thank-you, factual deposit outcome | Refund-completed wording unless immutable ledger says `REFUND_SUCCEEDED`; unsupported legal conclusions | Retained/under-review outcomes require owner review; no auto-send. |

There is no generic request-received email, reminder campaign, drip sequence, SMS, or AI-generated text.

## Future Gmail adapter gate

No OAuth client, credential, scope, Gmail API call, sender identity, or Google Voice number is configured. A future adapter requires explicit approval and: owner-controlled Google project; least-privilege Gmail send scope; exact Trailer Bros Gmail sender verification; encrypted Worker secrets; recipient validation; provider idempotency; retry limits; sanitized errors; thread metadata without message-body duplication; send reconciliation; and a documented rollback to `NO_SEND`. Gmail API acceptance is not proof of inbox delivery, so states must distinguish queued, sent-unverified, failed, and any independently supported delivery signal.

The Google Voice contact is a configuration placeholder only. No phone number may be invented or committed.

## Retention, recovery, and public release

Verified D1 exports preserve communication provenance and audit events. Restore rehearsals must verify content hashes, idempotency, and immutable triggers. Public release additionally requires Arizona-attorney review, approved final agreement/inspection wording, a public customer-access threat model, secure link delivery design, privacy/retention approval, Gmail provider acceptance tests, independent encrypted backups, and production owner approval.
