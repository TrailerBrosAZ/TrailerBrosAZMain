import Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const requiredTables=['trailers','customers','reservations','availability_blocks','payments','audit_events','condition_inspections','inspection_photos','cancellation_outcomes','deposit_decisions','booking_intents'];
const requiredTriggers=['reservations_no_overlap_insert','reservations_no_overlap_update','blocks_no_overlap_insert','blocks_no_overlap_update'];
const forbidden=/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----|(?:client_secret|api[_-]?token|access_aud|access_team_domain)\s*[=:]/i;

export type BackupVerification={sha256:string;bytes:number;tableCount:number;triggerCount:number;counts:Record<string,number>;syntheticReservations:number;syntheticBlocks:number};
const restoreOrder=['d1_migrations','trailers','customers','reservations','availability_blocks','booking_intents','delivery_quote_usage','payments','audit_events','condition_inspections','inspection_photos','cancellation_outcomes','deposit_decisions'];
const quote=(value:unknown)=>{if(value===null)return'NULL';if(typeof value==='number')return String(value);if(Buffer.isBuffer(value))throw new Error('Binary backup values require a separately reviewed storage design.');return`'${String(value).replaceAll("'","''")}'`};

export function createRestorableD1Backup(input:string,output:string){
  const db=new Database(':memory:');
  try{db.pragma('foreign_keys = OFF');db.exec(readFileSync(resolve(input),'utf8'));const present=(db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as {name:string}[]).map(row=>row.name);const unknown=present.filter(name=>!restoreOrder.includes(name));if(unknown.length)throw new Error(`Backup contains unrecognized tables: ${unknown.join(', ')}.`);const schema=restoreOrder.filter(name=>present.includes(name)).map(name=>(db.prepare("SELECT sql FROM sqlite_schema WHERE type='table' AND name=?").get(name) as {sql:string}).sql+';');const inserts=restoreOrder.filter(name=>present.includes(name)).flatMap(name=>(db.prepare(`SELECT * FROM "${name}"`).all() as Record<string,unknown>[]).map(row=>`INSERT INTO "${name}" (${Object.keys(row).map(key=>`"${key}"`).join(',')}) VALUES (${Object.values(row).map(quote).join(',')});`));const finishing=(db.prepare("SELECT sql FROM sqlite_schema WHERE type IN ('index','trigger') AND sql IS NOT NULL ORDER BY type,name").all() as {sql:string}[]).map(row=>row.sql+';');writeFileSync(resolve(output),['PRAGMA defer_foreign_keys=TRUE;',...schema,...inserts,...finishing].join('\n'));}finally{db.close()}
}

export function verifyD1Backup(file:string,options:{preBookingFoundation?:boolean}={}):BackupVerification{
  const sql=readFileSync(resolve(file),'utf8');
  if(forbidden.test(sql))throw new Error('Backup contains configuration or credential-shaped content.');
  const db=new Database(':memory:');
  try{
    db.pragma('foreign_keys = OFF');
    db.exec(sql);
    db.pragma('foreign_keys = ON');
    if((db.pragma('integrity_check',{simple:true}) as string)!=='ok')throw new Error('SQLite integrity check failed.');
    if((db.pragma('foreign_key_check') as unknown[]).length)throw new Error('Foreign-key verification failed.');
    const names=(db.prepare("SELECT name FROM sqlite_schema WHERE type='table'").all() as {name:string}[]).map(row=>row.name);
    const triggers=(db.prepare("SELECT name FROM sqlite_schema WHERE type='trigger'").all() as {name:string}[]).map(row=>row.name);
    const expectedTables=options.preBookingFoundation?requiredTables.filter(name=>name!=='booking_intents'):requiredTables;const missingTables=expectedTables.filter(name=>!names.includes(name));const missingTriggers=requiredTriggers.filter(name=>!triggers.includes(name));
    if(missingTables.length||missingTriggers.length)throw new Error(`Backup schema is incomplete (${missingTables.length} tables, ${missingTriggers.length} triggers missing).`);
    const counts=Object.fromEntries(expectedTables.map(name=>[name,Number((db.prepare(`SELECT count(*) total FROM ${name}`).get() as {total:number}).total)]));
    return{sha256:createHash('sha256').update(sql).digest('hex'),bytes:Buffer.byteLength(sql),tableCount:expectedTables.length,triggerCount:requiredTriggers.length,counts,syntheticReservations:Number((db.prepare('SELECT count(*) total FROM reservations WHERE is_synthetic=1').get() as {total:number}).total),syntheticBlocks:Number((db.prepare('SELECT count(*) total FROM availability_blocks WHERE is_synthetic=1').get() as {total:number}).total)};
  }finally{db.close()}
}

if(import.meta.url===pathToFileURL(process.argv[1]||'').href){
  const file=process.argv[2];if(!file)throw new Error('Usage: npm run backup:verify -- <path-to-export.sql> [--pre-booking-foundation]');
  const result=verifyD1Backup(file,{preBookingFoundation:process.argv.includes('--pre-booking-foundation')});console.log(JSON.stringify({verified:true,...result}));
}
