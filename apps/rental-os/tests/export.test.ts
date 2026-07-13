import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { exportData } from '../scripts/export-sqlite-data.js';
import { migrate, openDatabase } from '../src/server/db/database.js';

let directory=''; afterEach(()=>{if(directory)rmSync(directory,{recursive:true,force:true});});
describe('SQLite recovery export',()=>{
 it('preserves escaped values and metadata without exporting migration internals',()=>{directory=mkdtempSync(join(tmpdir(),'rental-os-export-'));const source=join(directory,'source.db');const output=join(directory,'data.sql');const db=openDatabase(source);migrate(db);db.exec("INSERT INTO trailers(name,unit_code,published_payload_lbs) VALUES ('Owner''s trailer','UNIT',5200); INSERT INTO audit_events(aggregate_type,aggregate_id,action,payload_json) VALUES ('TEST',1,'RECOVERY','{\"note\":\"owner''s\"}')");db.close();const counts=exportData(source,output);const sql=readFileSync(output,'utf8');expect(counts).toMatchObject({trailers:1,audit_events:1});expect(sql).toContain("Owner''s trailer");expect(sql).not.toContain('app_migrations');expect(sql).not.toContain('sqlite_sequence');});
});
