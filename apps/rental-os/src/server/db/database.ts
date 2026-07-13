import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function openDatabase(filename = resolve('data/rental-os.db')) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new Database(filename);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  return db;
}

export function migrate(db: Database.Database) {
  const sql = readFileSync(resolve('drizzle/0000_solid_demogoblin.sql'), 'utf8').replaceAll('--> statement-breakpoint', '');
  db.exec(sql);
}
