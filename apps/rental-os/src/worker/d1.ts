import type { DatabasePort, SqlStatement, SqlValue } from '../server/db/port.js';

export type D1Result = { results?: unknown[]; meta: { changes?: number; last_row_id?: number } };
export type D1Statement = { bind(...values: SqlValue[]): D1Statement; all<T>(): Promise<D1Result & { results: T[] }>; first<T>(): Promise<T | null>; run(): Promise<D1Result> };
export type D1DatabaseLike = { prepare(sql: string): D1Statement; batch(statements: D1Statement[]): Promise<D1Result[]> };

export function createD1DatabasePort(database: D1DatabaseLike): DatabasePort {
  const prepared = (sql: string, params: SqlValue[] = []) => database.prepare(sql).bind(...params);
  return {
    async all<T extends Record<string, unknown>>(sql: string, params: SqlValue[] = []) { const result = await prepared(sql, params).all<T>(); return result.results as T[]; },
    async first<T extends Record<string, unknown>>(sql: string, params: SqlValue[] = []) { return (await prepared(sql, params).first<T>()) ?? undefined; },
    async run(sql: string, params: SqlValue[] = []) { const result = await prepared(sql, params).run(); return { changes: result.meta.changes ?? 0, lastRowId: result.meta.last_row_id }; },
    async batch(statements: SqlStatement[]) { const results = await database.batch(statements.map(statement => prepared(statement.sql, statement.params))); return results.map(result => ({ changes: result.meta.changes ?? 0, lastRowId: result.meta.last_row_id })); },
  };
}
