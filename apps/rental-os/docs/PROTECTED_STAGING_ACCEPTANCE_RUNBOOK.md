# Protected staging acceptance runbook

This runbook prepares the remaining controlled-pilot evidence. It does not authorize production, public exposure, live payments, real customer data, legal approval, Access changes, or new external resources. Use only the existing protected staging Worker/D1, Stripe test mode, the configured Gmail test recipient, and synthetic fixtures.

## Preconditions and stop conditions

- Confirm `feature/rental-os-v1a`, a clean tracked tree, and app-only changes.
- Record the existing staging Worker version; do not deploy merely to run acceptance.
- Run full local preflight before external tests.
- Stop on any Access regression, secret exposure, non-synthetic record, unexpected recipient, live-mode prefix, duplicate collection/send/refund, reconciliation mismatch, or destructive backup action.
- Never put secrets, raw secure-link tokens, customer addresses, full provider payloads, full payment identifiers, or account identifiers in evidence.

## Evidence record

For each case record: UTC timestamp, Arizona display timestamp where relevant, tester role, synthetic fixture code, sanitized expected result, sanitized observed result, `PASS`/`FAIL`/`BLOCKED`, and linked local screenshot/log filename. Evidence must identify the Worker version and migration set.

## Test cases

### Stripe 3DS

Use Stripe's official test-mode authentication-required payment method through the protected synthetic checkout. Verify authentication, signed-webhook reconciliation, exactly one collected ledger outcome, idempotent retry, safe cancel/failure, and no reservation-status transition caused by payment alone. Never record card data.

### Gmail provider delivery

Prepare one eligible synthetic communication and confirm the exact-recipient boundary before sending. Send once to the configured test recipient. Verify Gmail acceptance, one immutable delivery attempt, one audit event, and duplicate prevention. Record the subject/version and acceptance state, not message contents or provider tokens.

### Protected browser and Access

At desktop and 390px, traverse dashboard, schedule, reservations/detail, attention, customer preview, agreement, pickup/return inspection, deposit/payment, communications, and diagnostics. Check keyboard focus, overflow, validation, state feedback, Arizona time, and console errors.

In a signed-out isolated browser, ordinary HTML and API requests must redirect to or be denied by Cloudflare Access. A wrong Google account must be denied. The exact webhook path may accept only a signed POST; GET and unsigned POST must fail safely. Do not alter policy during testing.

### Backup and recovery

Use the ignored staging configuration with `npm run backup:export:staging -- --database=<staging-name> --config=wrangler.staging.local.jsonc`, then verify both the export and restorable artifact. Rehearse only in an isolated temporary recovery database when creation/deletion is explicitly authorized. Compare integrity, foreign keys, migrations, triggers, counts, synthetic markers, immutable records, and overlap enforcement. Never restore over staging.

### Synthetic reconciliation

Inventory `is_synthetic=1` records across every business table and reconcile shortened Stripe/Gmail test references. Confirm analytics excludes synthetic records by default. Classify fixtures as retained acceptance evidence or proposed cleanup; do not delete reservations or immutable audit evidence. Zero real-customer records is mandatory.

## Completion rule

Update evidence and machine-readable states only after direct observation. Calendar remains `DEFERRED`, not `PASS` or implemented. Counsel remains pending. The protected synthetic pilot gate may report `READY` only when every pilot-critical item passes. The separate public-launch gate must remain `NOT_READY` while counsel approval, controlled public wording, or any other public-launch requirement is blocked or unverified.
