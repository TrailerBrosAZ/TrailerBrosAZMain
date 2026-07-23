import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { evaluateTestReadiness, verifiedCheckpointEvidence } from '../src/shared/testReadiness.js';

const evaluation = evaluateTestReadiness(verifiedCheckpointEvidence);
const artifact = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  dataClassification: 'SYNTHETIC_AND_NON_SENSITIVE',
  evaluation,
  evidence: verifiedCheckpointEvidence,
};
writeFileSync(resolve('data/test-readiness-evidence.json'), `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`Test readiness: ${evaluation.status}`);
for (const item of evaluation.blocking) console.log(`- ${item.id}: ${item.state} — ${item.evidence}`);
if (process.argv.includes('--require-ready') && evaluation.status !== 'READY') process.exitCode = 1;
