# Stripe test-mode payment integration

Status: real Stripe adapter and Payment Element foundation for protected synthetic staging. It remains mock-only until all three encrypted test-mode bindings are present. No live key, real charge, public checkout, or public webhook is permitted.

## Authoritative contract

- Total due is approved rental charge + dolly at $10 per rental day + approved delivery fee + a collected $100 refundable security deposit. There is no separate Arizona sales-tax line.
- The server ignores client amounts and rechecks reservation state, agreement, qualification, delivery/interstate approval, and authoritative availability before creating a PaymentIntent.
- At least 48 hours before pickup, refund the complete collected total. Inside 48 hours or for a no-show, refund rental, dolly, and delivery and retain $100.
- Early return creates no automatic refund. A clean-return decision refunds at most the $100 actually collected. Damage retention requires the linked return inspection, owner amount/reason/damage notes, and never exceeds the collected deposit.
- Payment success never changes reservation status. Browser success is not authoritative; only server reconciliation and verified webhook history can append successful collection.

## Adapter and reconciliation

`PaymentProvider` has deterministic mock and Stripe-test implementations. The Stripe adapter calls PaymentIntents and Refunds with Stripe idempotency keys, test-key format enforcement, server-calculated amounts, and synthetic metadata. The browser receives only the publishable key and PaymentIntent client secret needed by Stripe.js; card data goes directly to Stripe and never enters Rental OS.

`payment_ledger_entries` is append-only. `payment_webhook_events` deduplicates provider event IDs and stores only sanitized identifiers/statuses, timestamps, and a payload hash—not raw payloads or card data. Stripe signatures are verified against the untouched request body and `Stripe-Signature` header with a five-minute timestamp tolerance. Unmatched events are marked for reconciliation; older events cannot overwrite newer conclusions.

The protected route is `/api/payments/webhooks/stripe`. It intentionally remains behind Cloudflare Access, so Stripe cannot deliver to it. Do not add an Access bypass until separately approved.

## Encrypted staging bindings

These names are placeholders only; values must never be committed, written to local files, documentation, chat, or logs:

- `STRIPE_TEST_SECRET_KEY`
- `STRIPE_TEST_PUBLISHABLE_KEY`
- `STRIPE_TEST_WEBHOOK_SECRET`

Prefer a restricted test key when Stripe supports the required PaymentIntent and Refund write permissions. The Worker rejects live secret-key prefixes. All three bindings are required together; otherwise the application continues with the deterministic mock provider.

## Public-launch blockers

Before a public webhook or customer checkout: approve an exact Cloudflare Access service-token/bypass design limited to the single webhook path; configure and verify Stripe test webhook delivery; exercise asynchronous, retry, dispute, refund, and reconciliation operations; approve legal/refund language and fixed communications; complete production backups/recovery and privacy review; create separate production resources; and explicitly approve live-mode credentials and public customer access.
