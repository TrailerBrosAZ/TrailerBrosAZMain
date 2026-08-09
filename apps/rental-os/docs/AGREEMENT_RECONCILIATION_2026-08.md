# Agreement reconciliation - TB-RA-2026-08-v1

| Area | Legacy/public source | Prior Rental OS | 2026-08 disposition |
|---|---|---|---|
| Identity, equipment, dates, charges | Form fields and Apps Script payload | Immutable JSON snapshots | Retained and expanded into Booking Summary |
| Drawn signature | Canvas PNG posted by browser | Normalized pointer points + hash | Retained; rendered as signature evidence in PDF |
| Photos / condition | ID and damage uploads embedded in form workflow | Separate inspection records and metadata | Removed from agreement; preserve reservation-linked condition evidence; no standalone ID image |
| Contract language | `rental-agreement.html` | Hand-copied abbreviated clauses | Replaced for new acceptance by canonical customer section only |
| Payload | Legacy/prior conflict included 5,800 lb | Staging trailer data 5,200 lb | 7,000 GVWR, about 1,800 empty, 5,200 payload |
| Delivery | Public tier/fixed-fee wording | $20/$40/$60 zones to 35 miles | $2.50 per one-way road mile; raw road distance rounded up; routing failure requires review |
| Cancellation/no-show | Public wording conflicted | Flat $100 retention plus rental refund outcome | Lesser of $100 or base rent; refund deposit and unearned delivery/add-ons when no possession |
| Deposit | $100 with broad card-on-file language | Ledger + inspection decision | $100 security, not liability cap/cancellation fee; release/retention depends on authoritative records |
| Payment channels | Apps Script / historical manual workflow | Stripe test foundation | Agreement permits approved provider, same-day accepted method, or marketplace processor; no unsupported card-on-file claim |
| Authorized driver/towing | Named renter and towing fields | Qualification acknowledgments | Retained and expanded; written approval required for additional driver |
| Interstate/international | Arizona/written approval language | Owner review; international rejected | Prior written approval; no travel outside United States |
| Damage/theft/accidents/impound | Broad liability and fixed replacement value | Inspections, deposit and audit | Revised to actual, reasonable, non-duplicative loss; fixed replacement value removed |
| Insurance/indemnity | Broad transfer wording | Acknowledgment placeholder | Revised disclosures and causation-limited indemnity; no false verification |
| Privacy/retention/e-sign | Sparse | Audit, hashes, immutable records | Added explicit electronic records, evidence, privacy/retention and notice provisions |
| PDF/email/archive | Apps Script historically generated/emailed PDF | Immutable HTML document; deterministic email previews | Real deterministic PDF stored immutably; protected synthetic Booking Confirmation requires and attaches that exact PDF; public delivery and external archive remain release blockers |

## Unresolved release items

Arizona attorney review, public FAQ/form reconciliation, production PDF storage/backup acceptance, secure hosted condition-photo storage, customer-recipient delivery approval, and live operational acceptance remain open. The protected staging implementation does not claim those are complete.
