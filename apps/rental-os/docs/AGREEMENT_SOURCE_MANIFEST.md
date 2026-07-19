# Agreement source manifest

This manifest records the existing public `rental-agreement.html` as the source reviewed for the protected staging foundation. The public file and its Apps Script submission/PDF workflow are not modified. The current internal source identifier is `public-rental-agreement-2026-07+inspection-choice-v1`; rendered snapshots must retain its deterministic content hash. This describes source provenance and does not claim attorney approval.

## Preserved source elements

- Renter identity/contact, driver-license and insurance fields, tow vehicle, rental dates/times, trailer identity, charges, $100 deposit, condition/damage, prohibited use, responsibility, Arizona governing-law/venue, terms acknowledgment, printed name, signature, and signature date.
- Separate evidence is modeled for electronic-record/signature consent, terms acknowledgment, named-renter/driver and insurance acknowledgment, and the opportunity to inspect before possession.
- Pickup condition evidence is separated from the agreement and from the existing return inspection/deposit-decision workflow.
- Existing checklist/damage/photo concepts are represented as structured answers, general notes, marked-damage metadata, and non-hosted photo metadata labels. Binary data, paths, URLs, and data URLs remain prohibited.

## Attorney-review flags

The public source must not be treated as final legal text without Arizona counsel. Review is specifically required for payment/deposit timing versus the approved full-charge-at-confirmation workflow; cancellation/rescheduling language; card-on-file and collection/remedy language; indemnity, waiver, liability, repossession, attorney-fee, insurance, interstate-use, condition/damage, and electronic-signature clauses; privacy/retention disclosures; and whether the inspection-decline wording is sufficiently neutral. No foundation screen represents insurance verification, payment authorization, legal acceptance, or customer delivery unless evidence is actually recorded.

## Apps Script preservation

The public page currently submits identity, rental, acknowledgment, signature-image, and timestamp data to an existing Google Apps Script PDF workflow. That integration remains untouched and disconnected from Rental OS staging. Future replacement requires owner approval, attorney-reviewed text, secure customer access, immutable artifact storage, and an approved archive adapter.
