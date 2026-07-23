import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const migrations=()=>readdirSync(resolve('drizzle')).filter(name=>name.endsWith('.sql')).sort().join('|');
const before=migrations();
const gates=[['lint'],['typecheck'],['test'],['test:readiness'],['build'],['ops:validate-config'],['worker:dry-run'],['db:generate'],['d1:rehearse'],['smoke:http']];
for(const [gate] of gates){
  console.log(`\n=== PREFLIGHT: ${gate} ===`);
  const windows=process.platform==='win32';const command=windows?(process.env.ComSpec||'cmd.exe'):'npm';const args=windows?['/d','/s','/c',`npm.cmd run ${gate}`]:['run',gate];
  const result=spawnSync(command,args,{cwd:resolve('.'),stdio:'inherit'});
  if(result.status!==0)throw new Error(`Preflight stopped: ${gate} failed with exit code ${result.status??'unknown'}.`);
}
if(migrations()!==before)throw new Error('Schema generation changed the checked-in migration set. Review migrations before proceeding.');
console.log('\nAll Trailer Bros Rental OS local preflight gates passed.');
