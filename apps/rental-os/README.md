# Trailer Bros Rental OS — Version 1A

Owner-facing local development checkpoint. This application is isolated from the production GitHub Pages site and does not connect to Stripe, email, SMS, Google Calendar, or Google Drive.

## Included

- Responsive operations dashboard, upcoming schedule, summary metrics, and attention queue
- Manual external bookings for Big Rentals, Neighbors Trailer, Facebook Marketplace, and Other
- Manual availability blackouts
- SQLite persistence with Drizzle schema and a checked-in SQL migration
- Database triggers that reject overlapping active reservations and blackouts on inserts and updates
- Reservation lifecycle, cancellation, renter qualification, and operating-window rules with automated tests
- Development-only sample data

The published payload capacity is recorded as 5,200 lb with `plate_verified = false` until physically verified. Times are stored as ISO timestamps. The local owner interface enforces Arizona operating hours and 30-minute increments.

## Local setup

Requires Node.js 20.19+ or 22.12+.

```powershell
cd apps/rental-os
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://127.0.0.1:5173`. The API listens only on `127.0.0.1:4174`. Sample identities use the reserved `.test` domain and dates in 2027.

To reset local data, remove `data/rental-os.db*`, then run migration and seed again. Never use real customer information in this checkpoint.

## Verification

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run db:generate
```

`db:generate` should report that the checked-in schema has no new changes. Database overlap tests cover reservation-to-reservation, external-to-direct, blackout-to-reservation, reservation-to-blackout, adjacency, cancellation release, and conflicting updates.

## Architecture and safety

- `src/client`: React/Vite owner interface
- `src/server`: local Express API, database setup, migration, and seed commands
- `src/shared`: pure business rules shared by the application and tests
- `src/server/db/schema.ts`: typed Drizzle schema
- `drizzle`: auditable SQL migrations, including authoritative schedule-conflict triggers
- `tests`: business-rule and database enforcement tests

SQLite serializes writes. Overlap triggers run inside the same write transaction as each insert/update, preventing two committed records from claiming the same trailer time. Endpoint transactions also keep customer, reservation, and audit creation atomic.

This is not production-ready authentication or payment infrastructure. Payment records are modeled, but the only permitted processor value for this checkpoint is development data. Future Stripe, immutable agreement PDF, archive, fixed-template email, and calendar-copy integrations remain intentionally unimplemented.
