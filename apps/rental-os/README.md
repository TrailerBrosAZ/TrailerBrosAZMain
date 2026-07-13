# Trailer Bros Rental OS — Version 1C protected-staging checkpoint

Owner-facing Rental OS with local development support and a protected Cloudflare staging deployment using synthetic data only. The application remains isolated from the production GitHub Pages site and does not connect to Stripe, email, SMS, Google Calendar, or Google Drive.

## Included

- Responsive operations dashboard, upcoming schedule, summary metrics, and attention queue
- Owner-only Analytics route with Arizona-aware date and comparison controls, deterministic metric contracts, explainable threshold insights, and synthetic-data exclusion by default
- Actionable dashboard shortcuts and an accessible Needs Attention drawer with direct reservation links
- Manual external bookings for Big Rentals, Neighbors Trailer, Facebook Marketplace, and Other
- Manual availability blackouts
- Owner-controlled reservation edit/reschedule and lifecycle actions
- Pickup and return condition inspections with notes, damage documentation, and preserved local-only photo metadata. Hosted photo attachments are disabled; secure photo storage belongs to a later phase.
- Auditable cancellation/no-show outcomes and deliberate post-return deposit decisions; no payment actions execute
- Reservation/source filters, blackout edit/delete controls, and reservation audit history
- SQLite persistence with Drizzle schema and a checked-in SQL migration
- Database triggers that reject overlapping active reservations and blackouts on inserts and updates
- Reservation lifecycle, cancellation, renter qualification, and operating-window rules with automated tests
- Development-only sample data
- Explicit `is_synthetic` classification and audit events for seed and staging-QA reservations and blackouts

The published payload capacity is recorded as 5,200 lb with `plate_verified = false` until physically verified. Instants are stored as ISO timestamps while owner-entered and displayed booking times are interpreted explicitly in `America/Phoenix`. The owner interface enforces Arizona operating hours and 30-minute increments.

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

See [Local operations](docs/LOCAL_OPERATIONS.md) for reset, seed, export/import, D1 recovery rehearsal, and the single fail-fast preflight command. See [Protected staging operations](docs/PHASE3_READINESS.md) for the private-by-design staging controls and production prerequisites. Protected staging is configured separately from source control; production remains unconfigured and must not be improvised.

See the [analytics metric contract](docs/ANALYTICS_METRICS.md) for exact status, revenue, utilization, comparison, Arizona-boundary, and insufficient-data definitions. See the [Rental OS roadmap](docs/ROADMAP.md) for the approved priority order and later financial-data and private-analyst phases.

To reset local data, remove `data/rental-os.db*`, then run migration and seed again. Never use real customer information in this checkpoint.

## Verification

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run db:generate
npm run d1:rehearse
npm run worker:dry-run
npm run preflight
```

Database tests cover reservation-to-reservation, external-to-direct, blackout-to-reservation, reservation-to-blackout, adjacency, cancellation release, conflicting updates, Version 1B lifecycle tables, and deposit/cancellation record constraints.

## Architecture and safety

- `src/client`: React/Vite owner interface
- `src/server/api.ts`: portable Web Request/Response routes shared by local Node and Cloudflare Worker adapters
- `src/server/index.ts`: loopback-only Node development adapter backed by local SQLite
- `src/worker`: Cloudflare Worker entry and D1 database adapter
- `src/shared`: pure business rules shared by the application and tests
- `src/server/db/schema.ts`: typed Drizzle schema
- `drizzle`: auditable SQL migrations, including authoritative schedule-conflict triggers
- `tests`: business-rule and database enforcement tests

SQLite and D1 run the checked-in overlap triggers inside atomic write batches, preventing two committed records from claiming the same trailer time. `wrangler.jsonc` has local development values and deliberately unusable staging/production placeholders; it contains no real account IDs, database IDs, hostnames, credentials, or secrets. The approved staging bindings live in an ignored local configuration file and are not committed. `npm run d1:rehearse` applies all migrations to fresh local D1 and imports an existing SQLite data set while checking preservation of reservations, blackouts, audit events, and inspection-photo metadata.

Local authorization uses a development-only mock owner identity supplied by the loopback adapter. Protected staging verifies Cloudflare Access JWT issuer, audience, signature, and the exact approved owner identity; mock authorization fails closed outside development. Staging uses a separate Worker and D1 database with synthetic data only. No production Worker, database, hostname, customer access, or production configuration has been created.

This is not production-ready authentication or payment infrastructure. Cancellation and deposit decisions are explicitly owner-recorded placeholders with `payment_action = NOT_EXECUTED`. Future Stripe, immutable agreement PDF, archive, fixed-template email, and calendar-copy integrations remain intentionally unimplemented.
