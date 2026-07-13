# Local operations runbook

All commands run from `apps/rental-os`. Use development sample data only.

## Start locally

```powershell
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://127.0.0.1:5173`. The loopback API listens on `127.0.0.1:4174` and supplies the development-only mock owner identity. Mock authorization cannot run in staging or production mode.

## Reset and seed local SQLite

Stop the local processes, delete only `apps/rental-os/data/rental-os.db`, `rental-os.db-shm`, and `rental-os.db-wal`, then run:

```powershell
npm run db:migrate
npm run db:seed
```

Never point `DATABASE_URL` at a production database. No production database exists in this checkpoint.

## Migration and recovery rehearsal

```powershell
npm run d1:rehearse
```

This creates disposable files under `data/rehearsal`, applies all migrations to fresh local D1, exports Version 1B-equivalent SQLite records, imports them, validates exact recovery values and inspection-photo metadata, and confirms the D1 overlap trigger rejects and rolls back a conflicting write.

To create a development-data SQL export manually:

```powershell
npx tsx scripts/export-sqlite-data.ts data/rental-os.db data/rental-os-export.sql
```

The export is data-only. It excludes migration internals and rejects binary values. Treat exports as private owner records and do not commit them.

## Full local release gate

```powershell
npm run preflight
```

Preflight fails immediately on lint, type checking, tests, client build, Worker dry-run, schema validation, D1 recovery rehearsal, or loopback HTTP smoke failure.
