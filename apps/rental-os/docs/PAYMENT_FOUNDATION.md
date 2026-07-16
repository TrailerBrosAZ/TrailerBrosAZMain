# Stripe Payment Foundation

Status: protected staging foundation using a deterministic mock provider. No Stripe account, key, webhook, card, live charge, or public checkout is connected.

## Authoritative contract

- Total due is approved rental charge + dolly at $10 per rental day + approved delivery fee + a collected $100 refundable security deposit. There is no separate Arizona sales-tax line.
- Scheduled/booked value remains a reservation analytics measure. Collected, refunded, retained, and net amounts come only from the append-only payment ledger.
- At least 48 hours before pickup, the refund is the complete collected total. Inside 48 hours or for a no-show, rental, dolly, and delivery are refunded and $100 is retained.
- Early return creates no automatic refund. A clean-return deposit release requires the return workflow and refunds at most the $100 actually collected.
- Damage retention requires an owner decision, amount, reason, damage notes, and linked return inspection. It cannot exceed $100 or the originally collected total. No additional damage charge exists.
- Payment success never changes reservation status and never bypasses agreement, qualification, delivery/interstate approval, authoritative availability, or owner review.

## State and reconciliation model

`payment_ledger_entries` is append-only and uses unique idempotency keys. Entries distinguish successful/failed collection, successful/failed refund, deposit retention, disputes, and reconciliation-required states. Every server action appends an immutable audit event. `payment_webhook_events` stores only the provider event ID, type, provider payment ID, sanitized status, timestamps, and a payload hash; raw payloads and card data are never stored.

The mock provider implements the intended Stripe server boundary: payment creation, refund creation, and verified webhook normalization. Duplicate requests return the existing ledger record. Duplicate webhook event IDs are ignored. Out-of-order or unmatched future Stripe events must be recorded for owner reconciliation and must never infer a reservation transition.

## Later Stripe test-mode handoff

No secrets are currently required. A future approved test-mode setup will need encrypted Worker secrets named `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, entered directly with Wrangler secret entry or the Cloudflare dashboard. The future webhook endpoint must verify the raw body before parsing, accept only Stripe signatures, rate-limit abuse, and expose no customer checkout route until separately approved.

Before live mode: approve legal agreement and displayed refund language; test support and dispute procedures; confirm Stripe business/account readiness; verify privacy notice and fixed customer templates; complete production backups and recovery; conduct payment, refund, reconciliation, failure, and rollback acceptance tests; and explicitly approve public customer access. Live and test keys must use separate environments and D1 databases.
