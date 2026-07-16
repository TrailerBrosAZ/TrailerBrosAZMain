# Agreement rendering foundation

The owner-only staging application can render a signed synthetic agreement snapshot into deterministic, print-ready HTML. The immutable document includes the source template version and attorney-review flag, renter/reservation/quote snapshots, explicit acknowledgment timestamps, signature evidence, and pickup-condition choice. It records a SHA-256 content hash, renderer version, generation time, and audit event.

The database rejects update or deletion of generated documents. Repeated generation is idempotent and returns the existing artifact. The protected download uses `no-store` and `nosniff` headers.

This is not an attorney-approved final agreement, a hosted PDF, customer delivery, e-sign integration, or archive. PDF/A generation, secure object storage, Google Drive archival, retention automation, and attorney acceptance remain launch blockers.
