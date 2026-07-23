export const readinessRequirementIds = [
  'controlled-rule-consistency',
  'critical-automated-suite',
  'protected-staging-browser-evidence',
  'synthetic-test-evidence',
  'attorney-approval',
  'stripe-3ds',
  'google-calendar',
  'gmail-exactly-once',
  'public-live-disabled',
] as const;

export type ReadinessRequirementId = typeof readinessRequirementIds[number];
export type ReadinessState = 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_VERIFIED';
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

export const verifiedCheckpointEvidence: ReadinessEvidence[] = [
  { id: 'controlled-rule-consistency', state: 'PASS', critical: true, evidence: 'Automated source-contract tests cover controlled delivery, cancellation, travel, payload, quote, and agreement status.' },
  { id: 'critical-automated-suite', state: 'PASS', critical: true, evidence: 'Full local preflight must pass for this checkpoint.' },
  { id: 'protected-staging-browser-evidence', state: 'NOT_VERIFIED', critical: true, evidence: 'A dated authenticated desktop/mobile execution record is required.' },
  { id: 'synthetic-test-evidence', state: 'PASS', critical: true, evidence: 'All automated fixtures are explicitly synthetic and no real customer data is used.' },
  { id: 'attorney-approval', state: 'BLOCKED', critical: true, evidence: 'The current agreement remains operative; no matching counsel approval is recorded for replacement wording.' },
  { id: 'stripe-3ds', state: 'NOT_VERIFIED', critical: true, evidence: '3DS behavior has not been independently exercised in this checkpoint.' },
  { id: 'google-calendar', state: 'BLOCKED', critical: true, evidence: 'No Google Calendar adapter exists in the repository.' },
  { id: 'gmail-exactly-once', state: 'NOT_VERIFIED', critical: true, evidence: 'External Gmail acceptance was not repeated; existing exact-recipient controls remain covered by automated tests.' },
  { id: 'public-live-disabled', state: 'PASS', critical: true, evidence: 'Checked-in environment policy disables live/public configuration and this checkpoint makes no public changes.' },
];
