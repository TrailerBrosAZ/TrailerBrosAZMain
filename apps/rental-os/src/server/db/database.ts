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
  const hasReservations = Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='reservations'").get());
  db.exec('CREATE TABLE IF NOT EXISTS app_migrations (name text PRIMARY KEY NOT NULL, applied_at text NOT NULL DEFAULT (datetime(\'now\')))');
  if (hasReservations && !db.prepare('SELECT 1 FROM app_migrations WHERE name=?').get('0000_solid_demogoblin.sql')) db.prepare('INSERT INTO app_migrations(name) VALUES (?)').run('0000_solid_demogoblin.sql');
  for (const name of ['0000_solid_demogoblin.sql', '0001_version_1b.sql']) {
    if (db.prepare('SELECT 1 FROM app_migrations WHERE name=?').get(name)) continue;
    const sql = readFileSync(resolve(`drizzle/${name}`), 'utf8').replaceAll('--> statement-breakpoint', '');
    db.transaction(() => { db.exec(sql); db.prepare('INSERT INTO app_migrations(name) VALUES (?)').run(name); })();
  }
}
