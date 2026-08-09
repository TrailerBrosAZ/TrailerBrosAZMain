# Agreement source manifest

## Active protected-staging source

- Version: `TB-RA-2026-08-v1`
- Legal status: `OWNER_DRAFT_ATTORNEY_REVIEW_PENDING`
- Canonical customer text: `src/legal/TB-RA-2026-08-v1.md`
- Runtime generated mirror: `src/legal/canonicalAgreement.generated.ts`
- Complete owner drafting/research record: `docs/legal-drafts/Trailer_Bros_Rental_Agreement_2026-08.md`
- Hash: SHA-256 of the canonical JSON template payload (`agreementTemplateHash`), including the exact canonical Markdown, version, status, structured clauses, and inspection-choice source.

Only the customer-facing section is present in the canonical source. Research, citations, drafting rationale, and the internal appendix are excluded from screens and executed documents. A drift test verifies the runtime mirror against the canonical Markdown.

## Output control

The customer review screen, direct-checkout evidence, reservation agreement instance, owner detail, and immutable PDF all carry the same template version and hash. `agreement-pdf-v1` creates a real PDF containing the complete canonical terms, transaction snapshot, acknowledgments, Arizona-aware acceptance instant, and drawn-signature evidence. The stored PDF bytes are immutable and retrieved by document ID. A new wording version cannot silently reuse an earlier signature; payment and final conversion fail closed when agreement evidence is not the active version/hash.

## Historical and legacy sources

- `../../../rental-agreement.html` is the legacy public form. It captures customer data, condition/ID photos, a canvas signature, and posts to the existing Google Apps Script workflow that historically generated/emailed a PDF. It remains untouched and is not the Rental OS source.
- No historical emailed PDF binary is stored in this Git repository. Existing executed Rental OS templates, instances, documents, hashes, and signatures remain unchanged and immutable.
- The full 2026-08 drafting file is retained internally without becoming contract output.

## Deliberately excluded legacy mechanics

Standalone driver-license/photo uploads, the legacy Apps Script submission, browser-side PDF/email claims, and fixed delivery zones are not carried into the new agreement. Pickup and return condition evidence remains a separate reservation-linked workflow. Hosted photo storage is still deferred.

## Release status

This agreement is an owner draft for protected synthetic staging. It is not represented as attorney-reviewed or attorney-approved. Attorney disposition, public wording reconciliation, production acceptance, and public activation remain required before customer launch.
