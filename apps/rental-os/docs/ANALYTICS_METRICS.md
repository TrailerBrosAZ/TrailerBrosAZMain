# Owner Analytics metric contract

All Owner Analytics results are deterministic database calculations. Date labels, boundaries, grouping, and the meaning of "today" use `America/Phoenix`; the viewer's device timezone is never used.

## Range and comparison rules

- A selected start and end are inclusive Arizona calendar dates. The database interval is `[start 00:00, day-after-end 00:00)` in Arizona.
- Booking, revenue, source, trend, and day-of-week metrics attribute a reservation to its Arizona pickup date.
- The default range is the 90 Arizona calendar days ending today.
- The comparison period is the immediately preceding period with the same number of Arizona calendar days. Absolute deltas are always returned. Percentage change is unavailable when the comparison value is zero.
- Week groups start Monday. Month groups use Arizona calendar months.
- Synthetic/sample reservations and blackouts are excluded by default. The owner may explicitly include them; the UI must visibly show when that override is active.

## Reservation status rules

- **Reservation Requests:** every submitted reservation record scheduled to pick up in the range, including `CANCELLED` and `NO_SHOW`. This measures recorded requests, not fulfilled rentals.
- **Active / Completed Rentals:** reservations in `CONFIRMED`, `CHECKED_OUT`, `INSPECTION_PENDING`, or `COMPLETED`. It excludes `PENDING_REVIEW`, `CANCELLED`, and `NO_SHOW`.
- **Booked rental revenue:** rental charge on `PENDING_REVIEW`, `CONFIRMED`, `CHECKED_OUT`, `INSPECTION_PENDING`, and `COMPLETED` reservations. It is scheduled value, not money received.
- **Confirmed-booking revenue:** rental charge on `CONFIRMED`, `CHECKED_OUT`, `INSPECTION_PENDING`, and `COMPLETED` reservations.
- **Cancellations / no-shows:** separate counts of reservations whose final status is `CANCELLED` or `NO_SHOW` and whose pickup date is in range.
- **Average rental duration:** scheduled pickup-to-return hours for the statuses included in booked rental revenue.
- **Collected revenue, payment fees, refunds, and net revenue:** unavailable until Stripe is integrated. Cancellation outcome records are policy outcomes and must not be presented as executed refunds or collections.

## Utilization and availability

- Rentable capacity is 16 hours per active trailer per Arizona day: 6:00 AM through 10:00 PM.
- Availability blackouts subtract their overlap with those operating windows from the capacity denominator.
- Occupied hours are the overlap of non-cancelled/no-show reservations with those operating windows. Overnight time outside 6:00 AM–10:00 PM is not counted.
- Utilization is `occupied operating-window hours / operating-window capacity after blackouts`. It is unavailable when the denominator is zero.
- Upcoming unbooked availability covers today plus the next 29 Arizona dates. It reports available trailer-hours and fully open trailer-days after reservations and blackouts.

## Attribution and uptake

- Direct reservations use the `Direct` source. External reservations use Big Rentals, Neighbors Trailer, Facebook Marketplace, or Other.
- Lead-source performance reports reservation-request count, booked revenue under its separate status contract, and cancellation/no-show count per source.
- Delivery uptake and dolly uptake use non-cancelled/no-show bookings as the denominator. A dolly booking has `dolly_days > 0`.
- Reservation-request weekday reporting groups every submitted request by its requested Arizona pickup weekday. It does not represent fulfilled-rental demand.

## Deterministic insight thresholds

Insights always display the supporting figures and rule that triggered them.

- **Insufficient data:** fewer than 3 bookings; suppress performance conclusions.
- **Source concentration:** at least 4 bookings and the leading source supplies at least 50%.
- **Cancellation watch:** at least 5 bookings and cancellations plus no-shows are at least 15%.
- **High-demand pickup day:** at least 5 bookings and one weekday supplies at least 30%.
- **Utilization opportunity:** at least 14 available trailer-days and utilization is below 35%.
- **Dolly opportunity:** at least 5 active bookings and dolly uptake is below 20%.

These cards are measured observations, not AI-generated conclusions or autonomous recommendations.
