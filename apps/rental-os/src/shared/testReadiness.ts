export const readinessRequirementIds = [
  'controlled-rule-consistency',
  'critical-automated-suite',
  'protected-staging-browser-evidence',
  'synthetic-test-evidence',
  'attorney-approval',
  'stripe-3ds',
  'google-calendar',
  'gmail-exactly-once',
  'access-redirect',
  'backup-recovery',
  'synthetic-reconciliation',
  'public-live-disabled',
  'production-infrastructure',
  'public-customer-access',
  'stripe-live',
  'gmail-production',
  'public-site-entrypoint',
  'backup-automation',
  'monitoring-alerts',
  'tax-decision',
  'insurance-acceptance',
  'entity-title-alignment',
  'owner-runbook-acceptance',
] as const;

export type ReadinessRequirementId = typeof readinessRequirementIds[number];
export type ReadinessState = 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_VERIFIED' | 'DEFERRED';
export type ReadinessEvidence = {
  id: ReadinessRequirementId;
  state: ReadinessState;
  evidence: string;
  critical: boolean;
};

export function evaluateTestReadiness(evidence: ReadinessEvidence[]) {
  const byId = new Map(evidence.map(item => [item.id, item]));
  const missing = readinessRequirementIds.filter(id => !byId.has(id));
  const blocking = evidence.filter(item => item.critical && item.state !== 'PASS');
  return {
    status: missing.length === 0 && blocking.length === 0 ? 'READY' as const : 'NOT_READY' as const,
    missing,
    blocking: blocking.map(item => ({ id: item.id, state: item.state, evidence: item.evidence })),
  };
}

const protectedPilotNonBlocking = new Set<ReadinessRequirementId>([
  'attorney-approval',
  'google-calendar',
  'production-infrastructure',
  'public-customer-access',
  'stripe-live',
  'gmail-production',
  'public-site-entrypoint',
  'backup-automation',
  'monitoring-alerts',
  'tax-decision',
  'insurance-acceptance',
  'entity-title-alignment',
  'owner-runbook-acceptance',
]);
export function evaluateProtectedPilotReadiness(evidence: ReadinessEvidence[]) {
  const byId = new Map(evidence.map(item => [item.id, item]));
  const missing = readinessRequirementIds.filter(id => !byId.has(id) && !protectedPilotNonBlocking.has(id));
  const blocking = evidence.filter(item => item.critical && item.state !== 'PASS' && !protectedPilotNonBlocking.has(item.id));
  return {
    status: missing.length === 0 && blocking.length === 0 ? 'READY' as const : 'NOT_READY' as const,
    missing,
    blocking: blocking.map(item => ({ id: item.id, state: item.state, evidence: item.evidence })),
  };
}

export const verifiedCheckpointEvidence: ReadinessEvidence[] = [
  { id: 'controlled-rule-consistency', state: 'PASS', critical: true, evidence: 'Automated source-contract tests cover controlled delivery, cancellation, travel, payload, quote, and agreement status.' },
  { id: 'critical-automated-suite', state: 'PASS', critical: true, evidence: 'Full local preflight must pass for this checkpoint.' },
  { id: 'protected-staging-browser-evidence', state: 'PASS', critical: true, evidence: 'Dated authenticated desktop and exact 390px browser runs passed without overflow or console errors.' },
  { id: 'synthetic-test-evidence', state: 'PASS', critical: true, evidence: 'All automated fixtures are explicitly synthetic and no real customer data is used.' },
  { id: 'attorney-approval', state: 'BLOCKED', critical: true, evidence: 'The current agreement remains operative; no matching counsel approval is recorded for replacement wording.' },
  { id: 'stripe-3ds', state: 'PASS', critical: true, evidence: 'Official Stripe test-mode 3DS challenge completed; signed reconciliation preceded separate explicit reservation finalization.' },
  { id: 'google-calendar', state: 'DEFERRED', critical: false, evidence: 'Owner formally deferred Calendar until after the controlled pilot. Rental OS remains the sole availability authority; any future integration is one-way outbound only.' },
  { id: 'gmail-exactly-once', state: 'PASS', critical: true, evidence: 'One exact-recipient synthetic Booking Confirmation was accepted by Gmail with one attempt, one audit event, and duplicate prevention.' },
  { id: 'access-redirect', state: 'PASS', critical: true, evidence: 'Fresh unauthenticated root and dashboard-API requests each redirected to Cloudflare Access.' },
  { id: 'backup-recovery', state: 'PASS', critical: true, evidence: 'Verified staging exports, isolated remote recovery aggregate comparison, temporary-resource removal, and final restorable-artifact integrity checks passed.' },
  { id: 'synthetic-reconciliation', state: 'PASS', critical: true, evidence: 'Final count-only cross-table reconciliation found zero non-synthetic operational/provider-test records.' },
  { id: 'public-live-disabled', state: 'PASS', critical: true, evidence: 'Checked-in environment policy disables live/public configuration and this checkpoint makes no public changes.' },
  { id: 'production-infrastructure', state: 'NOT_VERIFIED', critical: true, evidence: 'No production Worker, D1 database, bindings, migration run, backup baseline, or production acceptance evidence is authorized or verified.' },
  { id: 'public-customer-access', state: 'BLOCKED', critical: true, evidence: 'Customer routes remain protected by Cloudflare Access; a separately reviewed public customer boundary, abuse controls, and owner/admin isolation are required.' },
  { id: 'stripe-live', state: 'BLOCKED', critical: true, evidence: 'Only Stripe test mode is implemented and accepted. Live restricted keys, webhook destination, live reconciliation, refund/deposit acceptance, and owner approval are absent.' },
  { id: 'gmail-production', state: 'BLOCKED', critical: true, evidence: 'Gmail remains exact-recipient staging test mode. Customer-recipient sending, support/bounce procedures, production OAuth/secrets, and delivery acceptance are absent.' },
  { id: 'public-site-entrypoint', state: 'BLOCKED', critical: true, evidence: 'The public Trailer Bros website has no approved booking entry point and remains intentionally unchanged.' },
  { id: 'backup-automation', state: 'BLOCKED', critical: true, evidence: 'Manual verified export/restore exists; independent encrypted daily production backup automation and retention monitoring are not enabled.' },
  { id: 'monitoring-alerts', state: 'BLOCKED', critical: true, evidence: 'Health diagnostics and runbooks exist, but production alert delivery, error visibility, and incident notification acceptance are not configured.' },
  { id: 'tax-decision', state: 'BLOCKED', critical: true, evidence: 'No separate Arizona tax line is implemented; owner must obtain and record qualified tax/accounting guidance before public collection.' },
  { id: 'insurance-acceptance', state: 'BLOCKED', critical: true, evidence: 'Insurance acknowledgement language and the verification operating procedure require counsel/owner acceptance before public use.' },
  { id: 'entity-title-alignment', state: 'BLOCKED', critical: true, evidence: 'The contracting entity, equipment title/ownership, Stripe/Gmail sender identity, public disclosures, and agreement header must be verified as aligned.' },
  { id: 'owner-runbook-acceptance', state: 'NOT_VERIFIED', critical: true, evidence: 'The owner has not yet completed and signed off the production deployment, rollback, payment exception, communication, backup, and incident drills.' },
];
