# Production readiness, threat model, and data map

## Secure-link threat model

The staging foundation stores only SHA-256 token hashes and a short non-secret fingerprint. A cryptographically random raw token is revealed once at creation, is reservation- and purpose-bound, expires, can be revoked or regenerated, is protected against replay, and is rate limited. Creation, revocation, regeneration, and use are audited. Staging links are synthetic-only and every route remains behind Cloudflare Access.

Before any link can become public, complete a separate customer-access security review: isolate customer token routes from owner APIs; preserve owner Access; require HTTPS and `no-store`; add bot/abuse controls and per-IP/token rate limits; use short purpose-specific TTLs; prevent referrer leakage; define revocation and incident procedures; test enumeration, replay, timing, fixation, cross-reservation access, expired tokens, logs, caches, and browser history; and obtain owner approval for public exposure. Raw tokens must never enter logs, analytics, audit payloads, backups, or support messages.

## Agreement and document limitations

Agreement snapshots and rendered HTML are deterministic and immutable after generation, with source/template/renderer versions, hashes, timestamps, consent evidence, signature evidence, pickup-condition choice, and audit events. The output is a synthetic print-ready foundation, not an attorney-approved final PDF, certified e-signature workflow, or guaranteed archival format.

Public use is blocked on Arizona attorney review of all legal text and acknowledgments; acceptance of the electronic-signature/evidence design; final PDF/PDF-A rendering and accessibility; signer identity and link controls; correction/re-sign rules; customer and owner delivery; seven-year retention; secure archive storage; and end-to-end acceptance evidence. A signed snapshot or document must never be overwritten.

## Customer-data inventory and retention map

| Data | Current purpose | Proposed retention / deletion decision before launch |
| --- | --- | --- |
| Customer name, email, phone, towing/qualification and trip details | Intent, reservation, agreement, reviewed owner operations | Define minimum operational retention, legal basis, correction/export/deletion handling, and access audit. |
| Reservation, blackout, quote, delivery snapshot, lifecycle and audit events | Authoritative availability and business record | Preserve required booking history; document exceptions and seven-year financial/legal retention boundary. |
| Agreement snapshots, signatures, hashes and artifacts | Contract evidence | Retain owner/customer copies for seven years; attorney and tax/accounting confirmation required. |
| Inspections, damage notes, deposit decisions and photo metadata | Condition and financial dispute evidence | Retain seven years where financial/inspection evidence applies; secure hosted photo storage is not implemented. |
| Driver-license photo (future only) | Identity verification | Never collected by the current app; delete raw image 90 days after undisputed completion when implemented. |
| Secure-link hashes/status and communication previews | Access control and owner workflow evidence | Define post-expiry cleanup/anonymization without removing required audit evidence. Raw tokens are never retained. |
| Payment/card data (future Stripe only) | Charges, deposits and refunds | Card data must remain with Stripe; store only necessary processor references and reconciliation records. |

Synthetic staging records remain explicitly marked and excluded from analytics by default. No real customer data is authorized for staging.

## Future Google Drive archive adapter

The future server-only adapter will accept an immutable artifact plus reservation reference, content hash, document type/version, and retention classification; create owner and customer archive copies in a least-privilege business folder; return only the minimum stable file reference; verify the uploaded hash; and emit an audit event. It must support idempotent retry, reconciliation, access review, retention holds, and a safe `NOT_ARCHIVED` failure state. Drive credentials remain secrets and file content/links must not be logged. No Drive connection exists in this checkpoint.

## Backup and recovery compatibility

D1 exports and restore rehearsals include reservations, intents/conversions, agreements/documents, condition records, secure-link hashes/status, communication previews, and audit events. Raw secure-link tokens are absent by design. Every migration requires a verified pre-migration export, isolated upgrade/restore rehearsal, aggregate/schema/foreign-key/overlap verification, and authenticated workflow smoke tests. Agreement-document immutability triggers and authoritative overlap triggers are recovery acceptance criteria.

Gmail readiness adds hashed OAuth state, encrypted token ciphertext/IV/key-version metadata, sanitized connection status, and delivery-attempt records. Backups must never contain the Worker encryption key; a restore is operationally useful only when the separately protected matching key is available. OAuth codes, raw tokens, client secrets, rendered message logs, and raw Google responses are prohibited from exports and diagnostics. Public customer sends remain blocked by legal/template approval, privacy and retention acceptance, production backup/monitoring, sender/OAuth verification, bounce/support procedures, and production acceptance testing.

## Remaining public-launch blockers

- Arizona attorney approval of agreement, cancellation, deposit, towing, privacy, electronic-signature, retention, and customer-facing terms.
- Public customer-access design and security testing for booking, agreement, inspection, and secure-link routes; owner APIs must remain separately protected.
- Stripe charges, security-deposit authorization/release/retain, refunds, idempotency, webhooks, reconciliation, failure recovery, and owner acceptance.
- Final agreement PDF/e-sign acceptance evidence, customer/owner delivery, and seven-year immutable archive.
- Reviewed email templates and reliable delivery/retry/bounce/audit behavior; no AI-generated transactional messages.
- Independent encrypted backup destination, daily automation, alerting, tested restore, owner-lockout recovery administrator, monitoring, incident drills, and production acceptance testing.
- Secure inspection-photo storage, malware/content controls, privacy/retention deletion, and dispute holds.
- Production-only Worker, D1, Access, secrets, DNS decision, migration/import controls, real-data validation, rollback window, and explicit owner go-live approval.

The public Trailer Bros website stays unchanged until a controlled rollout is separately approved.
