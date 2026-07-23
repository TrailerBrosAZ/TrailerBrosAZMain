# Protected staging acceptance test plan

All records must be synthetic. Ordinary app/API routes remain behind Cloudflare Access; only the separately approved exact Stripe webhook POST route may bypass Access and must verify its signature. Run against the existing staging Worker/D1 only. Capture sanitized timestamps, states, counts, and version identifiers—never secrets, raw tokens, addresses, full provider payloads, or customer data.

| Area | Required cases | Acceptance criteria | Evidence method |
|---|---|---|---|
| Direct checkout | happy path; duplicate tabs; refresh/resume/replay; expiry | server-authoritative quote/qualification/agreement/payment/availability; idempotent outcome; expiry never deletes audit record | automated API tests + protected browser |
| Availability | concurrent reservation/block race; stale intent | one transaction wins; authoritative overlap constraint rejects the other; intents never block | concurrency/API tests + D1 query counts |
| Qualification | age/towing/hitch/brake/insurance; interstate; international | invalid is rejected; delivery/interstate is nonblocking review; international rejected | API tests |
| Secure links | agreement/pickup/return authorization, expiry, revocation, replay, cross-session | opaque hash at rest; wrong reservation/session denied; revoked/expired/replayed token denied | secure-link tests + protected browser |
| Stripe test | success, decline, retry, 3DS, webhook order/duplicate/signature | ledger reconciles once; browser success does not confirm; refunds bounded; unsupported/invalid rejected | signed fixtures + Stripe test acceptance |
| Conversion | payment ledger and reservation conversion | atomic, idempotent, fresh revalidation; rollback leaves no partial booking | database/API tests |
| Google Calendar | formally deferred for the initial controlled pilot | not a launch dependency; Rental OS remains the sole authority; no Calendar-to-Rental-OS writes | owner decision record + post-pilot roadmap |
| Delivery | 10/20/35 boundaries, out-of-area, routing failure/privacy | $20/$40/$60; safe fallback; customer never receives distance/origin/route/map | automated Routes fixtures + protected staging |
| Gmail | exact test recipient, accepted, duplicate/retry | only configured owner test recipient; one immutable attempt/audit; no false “sent” state | provider acceptance + database evidence |
| Owner controls | lifecycle/payment/agreement/inspection bypass attempts | server authorization and transition rules reject invalid/stale action; audit all accepted writes | API tests + protected browser |
| UI | desktop and 390px; keyboard/focus; console | no blocking layout or accessibility defects; no unexpected console errors | browser screenshots/checklist |
| Access | unauthenticated and wrong account | ordinary routes redirect/deny; webhook exception remains exact path+POST and signature-gated | isolated HTTP/browser checks |
| Recovery | export, verify, restore; all current tables | verified export; isolated restore preserves counts, hashes, idempotency, audit, synthetic markers | rehearsal tooling |
| Cleanup | reconcile all fixtures | inventory synthetic records/provider objects; retain audit evidence or delete only by approved fixture procedure | post-test reconciliation report |

Critical failures stop the run. Never “pass” an unavailable integration; record `NOT VERIFIED` or `BLOCKED`.

## Remaining protected-staging execution order

1. Record the current Worker version and an authenticated `/api/health` result without secrets or identifiers.
2. Run Stripe test-mode 3DS with one synthetic eligible reservation. Capture only shortened test references, final ledger state, signed webhook reconciliation, idempotency result, and confirmation that payment did not cause a reservation-state transition.
3. Send exactly one prepared synthetic communication to the configured exact test recipient. Capture Gmail acceptance state, one delivery-attempt row, one audit event, and duplicate-send rejection.
4. Run authenticated desktop and 390px browser paths for dashboard, schedule, reservation detail, attention, customer preview, agreement, inspection, payment, and communications. Record screenshots, visible failures, and console-error count.
5. In a signed-out browser context, request the dashboard and an ordinary API route. Record Access redirect/denial. Confirm only the exact signed Stripe webhook POST exception behaves differently.
6. Export staging D1 with the ignored staging configuration, verify it, restore into an isolated temporary rehearsal database only when authorized, verify integrity/triggers/counts, and remove only that temporary resource.
7. Inventory and reconcile synthetic intents, reservations, agreements, secure links, inspections, ledger/webhooks, communications, Gmail attempts, audits, and shortened provider test references. Retain immutable audit evidence.
8. Update the evidence only from observed results, regenerate machine-readable evidence, rerun full preflight, and keep readiness fail-closed while counsel or any critical acceptance item is pending.
