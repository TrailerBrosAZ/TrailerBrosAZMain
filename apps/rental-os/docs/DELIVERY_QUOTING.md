# Delivery quoting

Delivery quoting is a protected-staging, server-only design. It uses one Google Routes API `computeRoutes` request with address waypoints and requests only `routes.distanceMeters`. No map, route geometry, origin, or exact mileage is returned to the customer. The hidden origin and credential are Worker secrets and must never be placed in source, D1, logs, fixtures, documentation values, or browser code.

## Rules and persistence

- Zone 1: 0–10 road miles, $20.
- Zone 2: over 10–20 road miles, $40.
- Zone 3: over 20–35 road miles, $60.
- Over 35 road miles is unavailable for online delivery.
- Routing failure is retained as `ROUTING_UNAVAILABLE`, with no fee, for owner review.
- Intent submission always recalculates server-side and stores the status, exact distance for the owner, zone, fee, and timestamp as a snapshot.
- Delivery remains `REVIEW_REQUIRED`, never blocks availability, and never guarantees delivery. A future conversion or payment attempt must revalidate the calendar transactionally.
- Override columns are reserved for a future owner workflow. That workflow must require a reason and audit event; it is not enabled in this checkpoint.

The quote endpoint allows 20 requests per authenticated owner per UTC hour. The browser calls it only after an explicit button press and disables the button while a request is running. Configure a Google daily quota of 100 Compute Routes requests for staging and review usage before raising it. A billing budget is an alert, not a spending cap.

## Secure setup (owner action; not performed by this checkpoint)

1. In Google Cloud Console, create or select a dedicated **Trailer Bros Rental OS** project.
2. Open **Billing** and link the project to a billing account. Then open **APIs & Services → Library** and enable only **Routes API**. Geocoding API is not required because Routes accepts address waypoints.
3. In **Billing → Budgets & alerts**, create a small project-scoped monthly budget suitable for staging and add alert thresholds at 50%, 80%, and 100%. Budget alerts do not stop charges.
4. In **Google Maps Platform → Quotas**, select Routes API and set the Compute Routes daily quota to 100 requests. If the console exposes a per-minute editable quota, set it to 20 requests per minute.
5. In **APIs & Services → Credentials**, create an API key. Under API restrictions choose **Restrict key**, select only **Routes API**, and save. Cloudflare Workers do not have a fixed outbound IP suitable for an IP application restriction; the API restriction, Worker secret storage, app throttle, and Google quota are the controls for this pilot.
6. In the existing staging Worker dashboard, open **Settings → Variables and Secrets**. Add encrypted secrets named `GOOGLE_MAPS_API_KEY` and `DELIVERY_ORIGIN`, entering their values directly in the dashboard. Do not place either value in chat, a local env file, Wrangler configuration, source control, logs, or D1.
7. After explicit deployment approval, deploy the existing Worker code and run the protected owner acceptance test. Do not create a public route or weaken Cloudflare Access.

No API, billing, credential, or secret is enabled by this code-only checkpoint.
