import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { DatabasePort, SqlStatement, SqlValue } from './port.js';

export function openDatabase(filename = resolve('data/rental-os.db')) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new Database(filename);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  return db;
}

export function createLocalDatabasePort(db: Database.Database): DatabasePort {
  const values = (params: SqlValue[] = []) => params;
  const run = (statement: SqlStatement) => {
    const result = db.prepare(statement.sql).run(...values(statement.params));
    return { changes: result.changes, lastRowId: Number(result.lastInsertRowid) };
  };
  return {
    async all<T extends Record<string, unknown>>(sql: string, params: SqlValue[] = []) { return db.prepare(sql).all(...values(params)) as T[]; },
    async first<T extends Record<string, unknown>>(sql: string, params: SqlValue[] = []) { return db.prepare(sql).get(...values(params)) as T | undefined; },
    async run(sql: string, params: SqlValue[] = []) { return run({ sql, params }); },
    async batch(statements: SqlStatement[]) { return db.transaction(() => statements.map(run))(); },
  };
}

export function migrate(db: Database.Database) {
  const hasReservations = Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='reservations'").get());
  db.exec('CREATE TABLE IF NOT EXISTS app_migrations (name text PRIMARY KEY NOT NULL, applied_at text NOT NULL DEFAULT (datetime(\'now\')))');
  if (hasReservations && !db.prepare('SELECT 1 FROM app_migrations WHERE name=?').get('0000_solid_demogoblin.sql')) db.prepare('INSERT INTO app_migrations(name) VALUES (?)').run('0000_solid_demogoblin.sql');
  for (const name of ['0000_solid_demogoblin.sql', '0001_version_1b.sql', '0002_simple_the_watchers.sql', '0003_polite_tarot.sql', '0004_smart_lord_tyger.sql', '0005_powerful_infant_terrible.sql', '0006_messy_butterfly.sql', '0007_sudden_whistler.sql', '0008_amusing_killmonger.sql', '0009_numerous_cloak.sql', '0010_sleepy_cammi.sql', '0011_lumpy_black_cat.sql', '0012_breezy_thunderbolt_ross.sql', '0013_outgoing_randall_flagg.sql']) {
    if (db.prepare('SELECT 1 FROM app_migrations WHERE name=?').get(name)) continue;
    const sql = readFileSync(resolve(`drizzle/${name}`), 'utf8').replaceAll('--> statement-breakpoint', '');
    db.transaction(() => { db.exec(sql); db.prepare('INSERT INTO app_migrations(name) VALUES (?)').run(name); })();
  }
}
