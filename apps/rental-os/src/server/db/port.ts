export type SqlValue = string | number | null;
export type SqlStatement = { sql: string; params?: SqlValue[] };
export type RunResult = { changes: number; lastRowId?: number };

export interface DatabasePort {
  all<T extends Record<string, unknown> = Record<string, unknown>>(sql: string, params?: SqlValue[]): Promise<T[]>;
  first<T extends Record<string, unknown> = Record<string, unknown>>(sql: string, params?: SqlValue[]): Promise<T | undefined>;
  run(sql: string, params?: SqlValue[]): Promise<RunResult>;
  batch(statements: SqlStatement[]): Promise<RunResult[]>;
}
