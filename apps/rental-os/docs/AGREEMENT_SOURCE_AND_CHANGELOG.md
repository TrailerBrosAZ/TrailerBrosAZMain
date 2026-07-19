# Agreement source and change log

## Provenance

The foundation was derived from the existing repository public source `rental-agreement.html`; that production file and its Google Apps Script/PDF workflow remain untouched. The internal source identifier is `public-rental-agreement-2026-07+inspection-choice-v1`. The canonical source object and pickup-condition choice wording live in `src/shared/agreement.ts`. Agreement instances store the template version/hash and immutable renter, reservation/intent, and quote snapshots. Deterministic rendered output separately records renderer version, generated timestamp, and content hash.

This manifest does not assert that the source is attorney-approved.

## Retained from the existing source

- Renter and contact details; trailer and rental-period details.
- Charges, $100 deposit, towing and insurance responsibilities, use restrictions, condition/damage concepts, indemnity/liability, default/remedies, Arizona law/venue, and electronic signature concepts.
- Printed name, signature evidence, signature date/timestamp, and customer acknowledgments.
- Public Apps Script workflow remains preserved but disconnected from Rental OS staging.

## Moved into structured evidence

- Electronic consent, terms acknowledgment, towing/insurance acknowledgment, and inspection opportunity each have distinct timestamps.
- Renter, reservation/intent, and quote facts are immutable JSON snapshots rather than inferred later from mutable records.
- Pickup-condition choice is an explicit enumerated value with a timestamp.
- Signed rendering provenance is a version/hash/timestamp/audit chain.
- Payment and deposit claims depend on authoritative ledger/inspection records rather than agreement text alone.

## Added by the foundation

- Explicit `SEND_FORM` and `DECLINE_FORM` pickup-condition choices, both flagged for Arizona attorney review.
- Opaque, hashed, expiring, revocable secure-link records for future agreement/inspection access; raw tokens are not retained.
- Deterministic print-ready rendering and document hash.
- Fail-closed attorney-approval release record tied to exact agreement source version and hash.
- Separate protected synthetic direct-checkout agreement evidence; it does not create public signing authority.

## Missing or deferred

- Final attorney-approved legal text and documented counsel disposition.
- Approved public customer authentication/access and e-sign acceptance design.
- Immutable PDF generation/owner and customer copies, secure primary storage, and Google Drive secondary archive.
- Reviewed delivery of agreement links and copies; bounce/failure handling and customer support process.
- Live Stripe terms and operational acceptance; production privacy, retention, backup, monitoring, and incident controls.
- Secure hosted inspection-photo storage and final raw driver-license workflow.

## Placeholders and non-claims

- Legal status remains `ATTORNEY_REVIEW_REQUIRED` until the exact source passes the release gate.
- Secure links remain synthetic and Access-protected; placeholders in communication previews are not customer delivery.
- Insurance acknowledgment is owner/customer-recorded evidence, not verification.
- Stripe test records are not live payment or customer funds.
- Local photo references are metadata labels only; no image upload or archive is implied.

## Change-control rule

Any material agreement wording or source-object change requires a new version, new canonical hash, updated manifest/changelog, regression tests, and renewed attorney approval. An earlier approval record must not release a changed version. Signed agreement instances and approval records are never overwritten; corrections create new versioned records and audit history.
