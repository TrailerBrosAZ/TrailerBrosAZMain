# Agreement source and change log

## TB-RA-2026-08-v1

Introduced the owner-draft 2026-08 agreement as the single protected-staging agreement source. The full supplied drafting/research file is preserved under `docs/legal-drafts/`; only its `CUSTOMER-FACING AGREEMENT` section is in `src/legal/TB-RA-2026-08-v1.md` and runtime output.

Implemented changes:

- Replaced the former `public-rental-agreement-2026-07+controlled-preview-v2` runtime clauses for new acceptances only.
- Preserved immutable historical templates, agreement instances, signed evidence, and documents.
- Added complete canonical terms to the review screen and deterministic PDF, with version/hash provenance and drawn-signature evidence.
- Changed delivery to $2.50 per one-way road mile, rounding road distance up before multiplication. Routing failure remains owner review; overrides require an existing reason/audit trail.
- Changed late cancellation/no-show calculation to the lesser of $100 or scheduled base rent; deposit and unearned add-ons/delivery are refundable when possession never transfers.
- Kept condition records and photos separate from the executed agreement; no driver-license image is embedded.
- Kept legal status fail-closed as `OWNER_DRAFT_ATTORNEY_REVIEW_PENDING` and public launch not ready.

Any substantive wording change requires a new version/hash and renewed acceptance. Draft/incomplete evidence from an older version cannot proceed to payment or confirmation. No signed record is updated in place.
