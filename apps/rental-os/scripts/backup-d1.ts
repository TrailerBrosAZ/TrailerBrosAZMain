import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { createRestorableD1Backup, verifyD1Backup } from './verify-d1-backup.js';

const args=Object.fromEntries(process.argv.slice(2).map(value=>{const match=value.match(/^--([^=]+)=(.+)$/);if(!match)throw new Error('Use --database=NAME and --config=PATH.');return[match[1],match[2]]}));
if(!args.database||!/^[a-z0-9-]+$/i.test(args.database))throw new Error('A safe --database=NAME value is required.');
if(!args.config||basename(args.config)!=='wrangler.staging.local.jsonc')throw new Error('Only the ignored staging configuration may be used by this command.');
const preBookingFoundation=args.schema==='pre-booking-foundation';if(args.schema&&!preBookingFoundation)throw new Error('Supported --schema value: pre-booking-foundation.');
const root=resolve('data/backups');mkdirSync(root,{recursive:true});const stamp=new Date().toISOString().replaceAll(':','-').replace('.','-');const output=resolve(root,`d1-${stamp}.sql`);const restore=resolve(root,`d1-${stamp}.restore.sql`);
execFileSync(process.execPath,[resolve('node_modules/wrangler/bin/wrangler.js'),'d1','export',args.database,'--remote','--skip-confirmation','--config',resolve(args.config),'--output',output],{cwd:resolve('.'),stdio:['ignore','pipe','pipe']});
const result=verifyD1Backup(output,{preBookingFoundation});createRestorableD1Backup(output,restore);const restoreResult=verifyD1Backup(restore,{preBookingFoundation});console.log(JSON.stringify({exported:true,file:output,restoreFile:restore,sha256:result.sha256,restoreSha256:restoreResult.sha256,bytes:result.bytes,counts:result.counts,syntheticReservations:result.syntheticReservations,syntheticBlocks:result.syntheticBlocks}));
