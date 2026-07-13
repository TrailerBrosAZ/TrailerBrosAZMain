import { spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const directory=resolve('data/preflight'); const database=resolve(directory,'smoke.db'); const port='43177';
rmSync(directory,{recursive:true,force:true});mkdirSync(directory,{recursive:true});
const child=spawn(process.execPath,[resolve('node_modules/tsx/dist/cli.mjs'),'src/server/index.ts'],{cwd:resolve('.'),env:{...process.env,DATABASE_URL:database,PORT:port,DEV_OWNER_EMAIL:'owner@example.test'},stdio:['ignore','pipe','pipe']});
let logs='';child.stdout.on('data',chunk=>{logs+=String(chunk);});child.stderr.on('data',chunk=>{logs+=String(chunk);});
try{
  let response:Response|undefined;
  for(let attempt=0;attempt<40;attempt++){try{response=await fetch(`http://127.0.0.1:${port}/api/dashboard`);if(response.ok)break;}catch{/* Local process may still be starting. */}await new Promise(resolveDelay=>setTimeout(resolveDelay,100));}
  if(!response?.ok)throw new Error(`Local HTTP smoke failed to start or respond. ${logs}`);
  const payload=await response.json() as {reservations?:unknown[];blocks?:unknown[];trailers?:unknown[]};
  if(!Array.isArray(payload.reservations)||!Array.isArray(payload.blocks)||!Array.isArray(payload.trailers))throw new Error('Local HTTP smoke returned an invalid dashboard payload.');
  console.log(`Local HTTP smoke passed on loopback (${response.status}).`);
}finally{child.kill();}
