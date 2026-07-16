# Secure-link architecture foundation

Protected staging supports synthetic, reservation-specific one-time links for agreement signing, pickup inspection, and return inspection. The owner may generate, revoke, or regenerate a link and inspect its status. The raw 256-bit token is returned only by the creation/regeneration response and displayed once; only its SHA-256 hash and a non-secret fingerprint are stored.

All routes remain behind Cloudflare Access. There is no public customer route, Access bypass, message delivery, or real-data use. Link consumption is a protected synthetic rehearsal that records one successful use, rejects replay, expiry, and revocation, and never performs the future agreement or inspection action itself.

Issuance is limited to five attempts per reservation and purpose per hour. Protected use attempts are limited to twenty per owner identity per hour. Regeneration revokes the prior record and creates a new independent token. Every lifecycle action creates an audit event without recording raw tokens.

Before any public access, the design still requires a separate customer authentication/session boundary, edge abuse controls, CSRF review, redacted request logging, privacy/retention approval, incident alerting, and production security testing. Cloudflare Access must not be bypassed during the staging foundation.
