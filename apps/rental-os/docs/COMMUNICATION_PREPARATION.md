# Deterministic communication preparation

Version 1C stores owner-created previews for six fixed templates: booking request received, agreement action needed, pickup inspection reminder, pickup instructions, return reminder, and deposit outcome.

Each preview records its reservation, template key/version, deterministic subject/body, preview/copy timestamps, owner actor, synthetic marker, and audit events. Missing customer names use a neutral `Trailer Bros customer` fallback. Pickup and return text is formatted in `America/Phoenix`.

Copying text is an explicit owner convenience only. The application does not send email or SMS, connect Gmail or Google Voice, or imply delivery. Template text requires business/legal review before customer use. Customer-facing delivery, opt-out handling, retries, bounce handling, and message retention remain public-launch blockers.
