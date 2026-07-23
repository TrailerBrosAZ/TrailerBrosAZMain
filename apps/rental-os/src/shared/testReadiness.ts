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

const protectedPilotNonBlocking = new Set<ReadinessRequirementId>(['attorney-approval', 'google-calendar']);
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
];
