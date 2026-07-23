import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { evaluateProtectedPilotReadiness, evaluateTestReadiness, verifiedCheckpointEvidence } from '../src/shared/testReadiness.js';

const protectedPilot = evaluateProtectedPilotReadiness(verifiedCheckpointEvidence);
const publicLaunch = evaluateTestReadiness(verifiedCheckpointEvidence);
const artifact = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  dataClassification: 'SYNTHETIC_AND_NON_SENSITIVE',
  protectedPilot,
  publicLaunch,
  evidence: verifiedCheckpointEvidence,
};
writeFileSync(resolve('data/test-readiness-evidence.json'), `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`Protected synthetic pilot readiness: ${protectedPilot.status}`);
console.log(`Public launch readiness: ${publicLaunch.status}`);
for (const item of publicLaunch.blocking) console.log(`- ${item.id}: ${item.state} — ${item.evidence}`);
if (process.argv.includes('--require-ready') && publicLaunch.status !== 'READY') process.exitCode = 1;
