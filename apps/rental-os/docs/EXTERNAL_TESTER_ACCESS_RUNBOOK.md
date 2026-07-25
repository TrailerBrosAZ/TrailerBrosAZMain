# External tester Access runbook

## Security model

External testing is protected staging only. The owner retains the existing owner policy. Each tester is admitted by exact email in two independent fail-closed controls:

1. Cloudflare Access application policy: an `Allow` policy containing individually specified email addresses and the existing Google identity provider.
2. Worker configuration: `ALLOWED_TESTER_EMAILS`, a comma-separated exact-email allowlist stored only in the ignored staging configuration/dashboard variable.

The Worker classifies those identities as `external-tester`. They may load only `/customer-preview`, required private static assets, and `/api/customer-preview/*`. Dashboard, health, owner APIs, repository, database, Stripe Dashboard, Google, Cloudflare administration, and other routes remain denied. Do not add `Everyone`, a domain-wide rule, One-time PIN, a Bypass rule, or a wildcard exception.

## Add one tester

1. Obtain the tester's email privately and confirm it is the exact email on a Google identity they control. Do not put it in Git, documentation, issue text, or chat logs.
2. In Cloudflare Zero Trust, open **Access controls → Applications**, then the existing Rental OS staging self-hosted application.
3. Preserve the existing owner `Allow` policy unchanged.
4. Add or edit a separate policy named `Temporary external usability testers`.
5. Set action to `Allow`; set a short session duration appropriate for the batch (recommended: 8 hours).
6. Add one **Include → Emails** rule per exact tester email. Keep Google as the only accepted identity provider. Review the policy preview.
7. Verify there is no `Everyone`, email-domain, Login Methods/One-time PIN, Bypass, or broad hostname/path policy. Because Access evaluates Allow/Block policies in order and stops on the first match, preserve the owner policy and ensure no earlier rule unintentionally blocks or broadens the tester.
8. In the existing staging Worker's settings, update the non-secret variable `ALLOWED_TESTER_EMAILS` to the comma-separated exact tester list. Do not change `ALLOWED_OWNER_EMAIL`, Access issuer/audience, secrets, routes, or bindings.
9. Deploy the already verified staging source/config only to the existing staging Worker. Record the Worker version and tester batch ID; do not record tester emails in committed evidence.
10. In an isolated signed-out browser, verify:
    - listed tester reaches `/customer-preview`;
    - listed tester receives `403` at `/`, `/schedule`, `/booking-intents`, `/api/dashboard`, and `/api/health`;
    - an unlisted identity is denied by Access;
    - the owner still reaches owner routes;
    - authenticated responses remain `private, no-store`.
11. Send the tester only the exact `/customer-preview` link, the brief, and the script.

## Revoke one tester

1. Remove the exact email from the `Temporary external usability testers` Access policy and save.
2. Remove the exact email from `ALLOWED_TESTER_EMAILS` and deploy the existing staging Worker configuration.
3. In **Access controls → Settings → Session management**, revoke that user's active Access session when immediate termination is required. Removing an email prevents new authorization; session revocation closes the remaining session window.
4. Verify the removed identity is denied and the owner remains allowed.
5. Reconcile the tester batch using the cleanup procedure below.

## Batch reconciliation and cleanup

1. Export and verify staging D1 before cleanup.
2. Inventory records created during the batch by time window and `is_synthetic=1`: intents, conversions, reservations, agreements/documents, secure links, inspections, payment ledger/webhooks, communications/delivery attempts, and audit events.
3. Reconcile Stripe test objects and Gmail test attempts using shortened references only. Confirm no live-mode object, non-test recipient, or non-synthetic business record exists.
4. Preserve immutable reservation, payment, agreement, and audit evidence. Never delete reservations to make the batch look clean.
5. Expire/revoke unused secure links. Classify non-immutable disposable fixtures for a separately reviewed cleanup action; do not improvise direct D1 deletes.
6. Confirm analytics still excludes synthetic records by default and authoritative availability contains no unintended active synthetic reservation/block.
7. Record counts and exceptions without tester email, synthetic personal fields, raw tokens, addresses, secrets, or full provider identifiers.

Tester completion never changes public-launch readiness. Public launch remains `NOT_READY` until all independent legal, security, payment, communication, backup, public wording, and production gates pass.
