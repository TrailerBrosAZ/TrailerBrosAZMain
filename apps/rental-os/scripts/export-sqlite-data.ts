import Database from 'better-sqlite3';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const tables = ['trailers','customers','reservations','availability_blocks','booking_intents','delivery_quote_usage','payments','condition_inspections','inspection_photos','cancellation_outcomes','deposit_decisions','agreement_templates','agreement_instances','pickup_condition_choices','booking_intent_conversions','audit_events'];
const quote = (value: unknown) => value === null ? 'NULL' : typeof value === 'number' ? String(value) : `'${String(value).replaceAll("'", "''")}'`;

export function exportData(databasePath: string, outputPath: string) {
  const db = new Database(databasePath, { readonly: true });
  const statements = ['PRAGMA foreign_keys=OFF;'];
  const counts: Record<string, number> = {};
  for (const table of tables) {
    const rows = db.prepare(`SELECT * FROM "${table}" ORDER BY id`).all() as Record<string, unknown>[];
    counts[table] = rows.length;
    for (const row of rows) for (const value of Object.values(row)) if (value instanceof Uint8Array) throw new Error(`Binary data export is not permitted (${table}).`);
    for (const row of rows) { const columns = Object.keys(row).map(column => `"${column}"`).join(','); statements.push(`INSERT INTO "${table}" (${columns}) VALUES (${Object.values(row).map(quote).join(',')});`); }
  }
  statements.push('PRAGMA foreign_keys=ON;'); db.close(); writeFileSync(outputPath, `${statements.join('\n')}\n`);
  return counts;
}

if (process.argv[1]?.endsWith('export-sqlite-data.ts')) exportData(resolve(process.argv[2] || 'data/rental-os.db'), resolve(process.argv[3] || 'data/rental-os-export.sql'));
