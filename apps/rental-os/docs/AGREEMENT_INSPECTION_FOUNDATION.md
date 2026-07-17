# Agreement and inspection foundation

Protected staging supports synthetic, owner-driven agreement instances and pickup-condition choices. Agreement instances snapshot template identity/hash, renter, reservation, quote, rendered time, explicit consents, printed name, signature timestamp, and audit evidence. Database triggers reject update or deletion of signed instances.

Signing now requires exactly one explicit **Pickup-Condition Inspection** choice: `SEND_FORM` or `DECLINE_FORM`. The choice, timestamp, agreement version/hash, reservation identity, and deliberate audit event are retained. Silence, timeout, or failure to open a form never implies decline. `SEND_FORM` leaves pickup condition `PENDING`; `DECLINE_FORM` records a deliberate `DECLINED` state. The customer-facing wording remains provisional and requires Arizona-attorney review.

Pickup condition is independent: `PENDING` becomes `COMPLETED` only with structured checklist answers and customer acknowledgment, or `DECLINED` only after an affirmative decline acknowledgment. Decline records only that the offered pre-pickup inspection was declined; it does not accept unknown defects or forfeit a deposit. Return inspection and deliberate deposit release/retain remain separate.

No public route, secure link, email/text delivery, payment, hosted photo upload, final legal PDF, or Google Drive connection exists. Preview actions are synthetic-only behind Cloudflare Access. Future secure photo storage must use short-lived authenticated upload authorization, object malware/content checks, encryption, reservation-scoped authorization, retention/deletion enforcement, and access auditing; raw identity images remain subject to the approved 90-day deletion rule.
