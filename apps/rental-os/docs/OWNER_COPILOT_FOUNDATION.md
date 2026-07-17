# Owner Operations Copilot Foundation

This protected owner-only console is deterministic software, not GPT. It converts a narrow command set into read-only answers or structured drafts. A draft never writes until the owner presses the confirmation control. Confirmed writes call the same authenticated reservation or blackout API used by the normal owner interface, so Arizona-time validation, overlap protection, audit events, lifecycle rules, and payment safeguards remain authoritative.

## Operations assistance checkpoint

The console exposes plain-English priorities for reservation and review-required intent records, with direct navigation to the authoritative detail screen. It supports read-only availability checks, attention and requirement lists, monthly-summary navigation, cancellation outcome calculations, delivery-review assistance, and six guided playbooks: cancellation/no-show, reschedule/conflict, pickup/return inspection, deposit decision, delivery review, and agreement/signature/inspection decline.

Only blackout and external-booking drafts can mutate state, and both require the visible owner confirmation control before calling the existing API. Policy answers use the checked-in rules and never execute payment, sign an agreement, approve delivery, infer an acknowledgment, or alter a lifecycle state. Ambiguous or prohibited requests return a safe refusal.

## Future GPT tool contract

- Approved read tools: daily operations, attention queue, upcoming schedule, reservation requirement status, and aggregate analytics.
- Approved draft tools: blackout draft, external-booking draft, reschedule draft, and owner follow-up draft.
- Confirmation-required write tools: only a validated draft with a short-lived server confirmation reference may call an existing owner API. Every result must be audited.
- Prohibited: direct D1 access, arbitrary SQL, Stripe credentials or API calls, refunds, payment-state claims, agreement signing, customer communication, authentication changes, Access changes, secret access, public-route creation, file access, and autonomous execution.
- Data minimization: send only fields required by the selected tool; analytics use aggregates; omit license/identity artifacts, card data, signatures, inspection photos, raw audit payloads, secrets, and unrelated customer records.
- Retention: do not retain model prompts or responses beyond the approved operational audit summary without a documented policy and owner approval.
- Audit: record actor, approved tool, sanitized arguments, draft hash, confirmation, result, and model/template version. Never store chain-of-thought or credentials.
- Prompt injection: customer text, notes, imported content, and tool output are untrusted data. They may not alter tool permissions, confirmation requirements, system rules, or allowed data fields.
- Connection gate: no OpenAI key, model request, external transfer, or GPT label may be enabled until privacy, cost, evaluation, retention, and failure-mode acceptance is approved.
