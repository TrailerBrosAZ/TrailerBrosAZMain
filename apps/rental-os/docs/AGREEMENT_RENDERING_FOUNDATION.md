# Agreement rendering foundation

The owner-only staging application renders a signed synthetic agreement snapshot into a deterministic PDF. The immutable document includes canonical source version `TB-RA-2026-08-v1`, its SHA-256 source hash, owner-draft/attorney-review status, renter/reservation/quote snapshots, explicit acknowledgment timestamps, drawn signature evidence, and pickup-condition choice. It records a PDF SHA-256 content hash, renderer version, generation time, and audit event.

The database rejects update or deletion of generated documents. Repeated generation is idempotent and returns the existing artifact. The protected download uses `no-store` and `nosniff` headers.

This is not an attorney-approved final agreement, a hosted PDF, customer delivery, e-sign integration, or archive. PDF/A generation, secure object storage, Google Drive archival, retention automation, and attorney acceptance remain launch blockers.
