# Gmail test-mode integration runbook

## Current safety state

The deterministic booking-confirmation and rental-closeout previews remain available with the `NO_SEND` provider. Gmail is fail-closed unless every staging binding is present, the owner completes protected OAuth authorization, Google identity/signature validation succeeds, the exact approved mailbox matches, the token bundle decrypts, and the communication's authoritative readiness checks still pass. No Gmail resource, OAuth client, credential, authorization, or message send is created by this checkpoint.

The only Gmail permission is `https://www.googleapis.com/auth/gmail.send`. The identity-only `openid email` scopes are also required so the server can cryptographically bind the authorization to the approved Google account. No Gmail read, modify, delete, compose, Drive, Calendar, Contacts, or Workspace-administration scope is requested.

## Implemented routes

- `GET /api/integrations/gmail/status` — safe protected status only.
- `POST /api/integrations/gmail/oauth/start` — protected staging owner action; creates hashed, expiring state and encrypted PKCE verifier.
- `GET /api/integrations/gmail/oauth/callback` — exact protected callback; verifies state, PKCE, Google ID-token signature/issuer/audience/expiry, verified email, exact account, and exact scope.
- `POST /api/integrations/gmail/disconnect` — explicit confirmation/reason; removes encrypted token material locally and records an audit event. Revoke the OAuth grant in Google Account security as part of a complete disconnect.
- `POST /api/communications/:id/gmail-test-send` — staging-only, explicit owner confirmation, synthetic communication only, and recipient forced to the approved owner mailbox.

All routes remain behind Cloudflare Access. There is no callback bypass or public mail endpoint.

## Google Cloud setup (owner performs later)

1. In Google Cloud Console, create or select a dedicated project named **Trailer Bros Rental OS Communications**.
2. Open **APIs & Services → Library** and enable only **Gmail API**.
3. Open **Google Auth Platform → Branding/Audience/Data Access**. Configure the app for testing, use the Trailer Bros business identity, and add only the owner Google account as a test user.
4. Add these scopes: `openid`, `email`, and `https://www.googleapis.com/auth/gmail.send`. Do not add any other Gmail or Google-service scope.
5. Open **Clients → Create client → Web application**.
6. Add this exact authorized redirect URI: `https://trailer-bros-rental-os-staging.trailerbrosaz.workers.dev/api/integrations/gmail/oauth/callback`.
7. Save the client ID and client secret through the secure dashboard flow. Never put either value in Git, D1 exports, documentation, terminal history, or chat.

While the consent screen is in testing, Google can limit authorization to configured test users and may expire refresh tokens after a short testing period. Reauthorization is expected during staging. Publishing/verification requirements must be reviewed before any customer send.

## Cloudflare staging bindings (owner performs later)

In **Workers & Pages → trailer-bros-rental-os-staging → Settings → Variables and Secrets**, add each value as an encrypted secret:

- `GMAIL_OAUTH_CLIENT_ID` — OAuth Web Application client ID.
- `GMAIL_OAUTH_CLIENT_SECRET` — OAuth Web Application client secret.
- `GMAIL_TOKEN_ENCRYPTION_KEY` — independently generated 32-byte cryptographic key encoded as base64url; do not reuse another secret.
- `GMAIL_TEST_RECIPIENT` — the already approved owner mailbox.

`GMAIL_APPROVED_SENDER` may be omitted because the server pins the approved Trailer Bros sender. If configured, it must exactly match that approved sender or the integration fails closed.

After secrets exist, deploy the already-verified source with the ignored staging Wrangler configuration, sign in through Access, open a synthetic reservation communication panel, start authorization, and select only the approved owner Google account.

## Rotation, disconnect, and failure recovery

1. Disable sends by removing or rotating one Gmail binding; `NO_SEND` preview/copy remains available.
2. Use the protected disconnect action with an owner reason. Confirm the audit event exists.
3. In the Google Account security page, revoke the app grant. If compromise is suspected, rotate the OAuth client secret too.
4. Generate a new token-encryption key only with a controlled token re-encryption or forced reauthorization plan. Existing ciphertext is intentionally unreadable under a new key.
5. Reauthorize and run one owner-mailbox synthetic test. Gmail acceptance means API acceptance only—not inbox delivery or read status.

Never log OAuth codes/tokens, decrypted token bundles, client secrets, full Gmail responses, or rendered customer content. Owner-visible errors use safe categories only.

## Launch blockers

Real customer email remains blocked pending attorney-approved agreement language, approved transactional templates and sender identity, privacy/retention acceptance, production backup/monitoring, live Stripe approval, customer-access approval, production OAuth verification/consent review, bounce/support procedures, and production acceptance testing. Google Voice remains a human support contact; it is not an automated SMS provider. Any future SMS provider is a separate project and authorization.
