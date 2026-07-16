import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const timestamps = { createdAt: text('created_at').notNull().default(sql`(datetime('now'))`), updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`) };

export const trailers = sqliteTable('trailers', {
  id: integer('id').primaryKey({ autoIncrement: true }), name: text('name').notNull(), unitCode: text('unit_code').notNull().unique(),
  publishedPayloadLbs: integer('published_payload_lbs').notNull(), plateVerified: integer('plate_verified', { mode: 'boolean' }).notNull().default(false), active: integer('active', { mode: 'boolean' }).notNull().default(true), ...timestamps,
});
export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }), firstName: text('first_name').notNull(), lastName: text('last_name').notNull(), email: text('email'), phone: text('phone'), dateOfBirth: text('date_of_birth'), ...timestamps,
});
export const reservations = sqliteTable('reservations', {
  id: integer('id').primaryKey({ autoIncrement: true }), confirmationCode: text('confirmation_code').notNull().unique(), trailerId: integer('trailer_id').notNull().references(() => trailers.id), customerId: integer('customer_id').references(() => customers.id),
  channel: text('channel', { enum: ['DIRECT', 'EXTERNAL'] }).notNull(), externalSource: text('external_source', { enum: ['BIG_RENTALS', 'NEIGHBORS_TRAILER', 'FACEBOOK_MARKETPLACE', 'OTHER'] }), externalReference: text('external_reference'), status: text('status').notNull(),
  pickupAt: text('pickup_at').notNull(), returnAt: text('return_at').notNull(), rentalChargeCents: integer('rental_charge_cents').notNull().default(0), dollyDays: integer('dolly_days').notNull().default(0),
  isSynthetic: integer('is_synthetic', { mode: 'boolean' }).notNull().default(false),
  renterAge: integer('renter_age'), namedRenterWillTow: integer('named_renter_will_tow', { mode: 'boolean' }).notNull().default(true), interstateUse: integer('interstate_use', { mode: 'boolean' }).notNull().default(false), interstateApproved: integer('interstate_approved', { mode: 'boolean' }).notNull().default(false), internationalUse: integer('international_use', { mode: 'boolean' }).notNull().default(false),
  deliveryRequested: integer('delivery_requested', { mode: 'boolean' }).notNull().default(false), deliveryDistanceMiles: integer('delivery_distance_miles'), deliveryApproved: integer('delivery_approved', { mode: 'boolean' }).notNull().default(false), notes: text('notes'), version: integer('version').notNull().default(1), ...timestamps,
});
export const availabilityBlocks = sqliteTable('availability_blocks', {
  id: integer('id').primaryKey({ autoIncrement: true }), trailerId: integer('trailer_id').notNull().references(() => trailers.id), startAt: text('start_at').notNull(), endAt: text('end_at').notNull(), reason: text('reason').notNull(), notes: text('notes'), isSynthetic: integer('is_synthetic', { mode: 'boolean' }).notNull().default(false), ...timestamps,
});
export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }), reservationId: integer('reservation_id').notNull().references(() => reservations.id), kind: text('kind', { enum: ['RENTAL_CHARGE', 'SECURITY_DEPOSIT_AUTHORIZATION', 'REFUND', 'FORFEITURE'] }).notNull(), status: text('status', { enum: ['PENDING', 'SUCCEEDED', 'FAILED', 'AUTHORIZED', 'RELEASED', 'REFUNDED'] }).notNull(), amountCents: integer('amount_cents').notNull(), processor: text('processor').notNull().default('DEVELOPMENT'), externalId: text('external_id'), ...timestamps,
});
export const auditEvents = sqliteTable('audit_events', {
  id: integer('id').primaryKey({ autoIncrement: true }), aggregateType: text('aggregate_type').notNull(), aggregateId: integer('aggregate_id').notNull(), action: text('action').notNull(), actor: text('actor').notNull().default('owner'), payloadJson: text('payload_json').notNull().default('{}'), createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (table) => [uniqueIndex('audit_event_identity_idx').on(table.id, table.aggregateType)]);

export const conditionInspections = sqliteTable('condition_inspections', {
  id: integer('id').primaryKey({ autoIncrement: true }), reservationId: integer('reservation_id').notNull().references(() => reservations.id), type: text('type', { enum: ['PICKUP', 'RETURN'] }).notNull(), conditionNotes: text('condition_notes').notNull(), usageTripNotes: text('usage_trip_notes'), damageFound: integer('damage_found', { mode: 'boolean' }).notNull().default(false), damageNotes: text('damage_notes'), inspectedAt: text('inspected_at').notNull(), actor: text('actor').notNull().default('owner'), ...timestamps,
});
export const inspectionPhotos = sqliteTable('inspection_photos', {
  id: integer('id').primaryKey({ autoIncrement: true }), inspectionId: integer('inspection_id').notNull().references(() => conditionInspections.id), localReference: text('local_reference').notNull(), caption: text('caption'), createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
export const cancellationOutcomes = sqliteTable('cancellation_outcomes', {
  id: integer('id').primaryKey({ autoIncrement: true }), reservationId: integer('reservation_id').notNull().references(() => reservations.id).unique(), type: text('type', { enum: ['CANCELLATION', 'NO_SHOW'] }).notNull(), decidedAt: text('decided_at').notNull(), noticeHours: integer('notice_hours').notNull(), rentalRefundCents: integer('rental_refund_cents').notNull(), retainedCents: integer('retained_cents').notNull(), paymentAction: text('payment_action').notNull().default('NOT_EXECUTED'), notes: text('notes'), ...timestamps,
});
export const depositDecisions = sqliteTable('deposit_decisions', {
  id: integer('id').primaryKey({ autoIncrement: true }), reservationId: integer('reservation_id').notNull().references(() => reservations.id).unique(), decision: text('decision', { enum: ['RELEASE_RECORDED', 'RETAIN_RECORDED'] }).notNull(), amountCents: integer('amount_cents').notNull(), reason: text('reason').notNull(), damageNotes: text('damage_notes'), paymentAction: text('payment_action').notNull().default('NOT_EXECUTED'), decidedAt: text('decided_at').notNull(), actor: text('actor').notNull().default('owner'), ...timestamps,
});

export const bookingIntents = sqliteTable('booking_intents', {
  id: integer('id').primaryKey({ autoIncrement: true }), idempotencyKey: text('idempotency_key').notNull(), trailerId: integer('trailer_id').notNull().references(() => trailers.id), status: text('status', { enum: ['SUBMITTED','REVIEW_REQUIRED','EXPIRED','CONVERTED'] }).notNull().default('SUBMITTED'),
  legalName: text('legal_name').notNull(), email: text('email').notNull(), phone: text('phone').notNull(), age25Confirmed: integer('age_25_confirmed', { mode: 'boolean' }).notNull(), namedRenterOnlyTowing: integer('named_renter_only_towing', { mode: 'boolean' }).notNull(),
  towVehicleDetails: text('tow_vehicle_details').notNull(), hitchBallAcknowledged: integer('hitch_ball_acknowledged', { mode: 'boolean' }).notNull(), brakeControllerAcknowledged: integer('brake_controller_acknowledged', { mode: 'boolean' }).notNull(), insuranceAcknowledged: integer('insurance_acknowledged', { mode: 'boolean' }).notNull(), intendedUse: text('intended_use').notNull(),
  tripType: text('trip_type', { enum: ['IN_STATE','INTERSTATE'] }).notNull(), interstateDetails: text('interstate_details'), interstateApprovalRequired: integer('interstate_approval_required', { mode: 'boolean' }).notNull().default(false), fulfillmentType: text('fulfillment_type', { enum: ['PICKUP','DELIVERY'] }).notNull(), deliveryAddress: text('delivery_address'), deliveryApprovalRequired: integer('delivery_approval_required', { mode: 'boolean' }).notNull().default(false),
  pickupAt: text('pickup_at').notNull(), returnAt: text('return_at').notNull(), dollyRequested: integer('dolly_requested', { mode: 'boolean' }).notNull().default(false), rentalDays: integer('rental_days').notNull(), rentalChargeCents: integer('rental_charge_cents').notNull(), dollyChargeCents: integer('dolly_charge_cents').notNull(), securityDepositCents: integer('security_deposit_cents').notNull(), deliveryChargeCents: integer('delivery_charge_cents'), deliveryQuoteStatus: text('delivery_quote_status', { enum: ['NOT_REQUESTED','AVAILABLE','OUT_OF_AREA','ROUTING_UNAVAILABLE'] }).notNull().default('NOT_REQUESTED'), deliveryDistanceMeters: integer('delivery_distance_meters'), deliveryZone: text('delivery_zone', { enum: ['ZONE_1','ZONE_2','ZONE_3'] }), deliveryQuotedAt: text('delivery_quoted_at'), deliveryOverrideFeeCents: integer('delivery_override_fee_cents'), deliveryOverrideReason: text('delivery_override_reason'), deliveryOverrideAt: text('delivery_override_at'), deliveryOverrideActor: text('delivery_override_actor'), taxCents: integer('tax_cents').notNull().default(0), estimatedDueBeforeDeliveryCents: integer('estimated_due_before_delivery_cents').notNull(), estimatedTotalCents: integer('estimated_total_cents').notNull().default(0),
  exceptionsJson: text('exceptions_json').notNull().default('[]'), expiresAt: text('expires_at').notNull(), isSynthetic: integer('is_synthetic', { mode: 'boolean' }).notNull().default(true), ...timestamps,
}, (table) => [uniqueIndex('booking_intent_idempotency_idx').on(table.idempotencyKey)]);

export const bookingIntentConversions = sqliteTable('booking_intent_conversions', {
  id: integer('id').primaryKey({ autoIncrement: true }), intentId: integer('intent_id').notNull().references(() => bookingIntents.id).unique(), idempotencyKey: text('idempotency_key').notNull().unique(), reservationId: integer('reservation_id').notNull().references(() => reservations.id).unique(), agreementEvidenceJson: text('agreement_evidence_json').notNull(), approvalSnapshotJson: text('approval_snapshot_json').notNull(), quoteSnapshotJson: text('quote_snapshot_json').notNull(), convertedAt: text('converted_at').notNull(), actor: text('actor').notNull(), isSynthetic: integer('is_synthetic', { mode: 'boolean' }).notNull().default(true), createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const deliveryQuoteUsage = sqliteTable('delivery_quote_usage', {
  id: integer('id').primaryKey({ autoIncrement: true }), actorHash: text('actor_hash').notNull(), windowStartedAt: text('window_started_at').notNull(), requestCount: integer('request_count').notNull().default(0), createdAt: text('created_at').notNull().default(sql`(datetime('now'))`), updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, table => [uniqueIndex('delivery_quote_usage_window_idx').on(table.actorHash, table.windowStartedAt)]);

export const agreementTemplates = sqliteTable('agreement_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }), version: text('version').notNull().unique(), sourceManifestVersion: text('source_manifest_version').notNull(), contentJson: text('content_json').notNull(), contentHash: text('content_hash').notNull().unique(), legalReviewStatus: text('legal_review_status').notNull().default('ATTORNEY_REVIEW_REQUIRED'), isSynthetic: integer('is_synthetic', { mode: 'boolean' }).notNull().default(true), createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
export const agreementInstances = sqliteTable('agreement_instances', {
  id: integer('id').primaryKey({ autoIncrement: true }), reservationId: integer('reservation_id').notNull().references(() => reservations.id), templateId: integer('template_id').notNull().references(() => agreementTemplates.id), status: text('status', { enum: ['NOT_SENT','OPENED','SIGNED','EXPIRED'] }).notNull().default('NOT_SENT'), templateVersion: text('template_version').notNull(), templateHash: text('template_hash').notNull(), renterSnapshotJson: text('renter_snapshot_json').notNull(), reservationSnapshotJson: text('reservation_snapshot_json').notNull(), quoteSnapshotJson: text('quote_snapshot_json').notNull(), renderedAt: text('rendered_at').notNull(), electronicConsentAt: text('electronic_consent_at'), termsAcknowledgedAt: text('terms_acknowledged_at'), driverInsuranceAcknowledgedAt: text('driver_insurance_acknowledged_at'), inspectionOpportunityAcknowledgedAt: text('inspection_opportunity_acknowledged_at'), signedAt: text('signed_at'), printedName: text('printed_name'), signatureEvidenceJson: text('signature_evidence_json'), isSynthetic: integer('is_synthetic', { mode: 'boolean' }).notNull().default(true), ...timestamps,
});
export const agreementDocuments = sqliteTable('agreement_documents', {
  id: integer('id').primaryKey({ autoIncrement: true }), agreementId: integer('agreement_id').notNull().references(() => agreementInstances.id), documentHash: text('document_hash').notNull().unique(), rendererVersion: text('renderer_version').notNull(), templateVersion: text('template_version').notNull(), contentType: text('content_type').notNull().default('text/html'), contentText: text('content_text').notNull(), generatedAt: text('generated_at').notNull(), isSynthetic: integer('is_synthetic', { mode: 'boolean' }).notNull().default(true), createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
export const pickupConditionChoices = sqliteTable('pickup_condition_choices', {
  id: integer('id').primaryKey({ autoIncrement: true }), reservationId: integer('reservation_id').notNull().references(() => reservations.id).unique(), status: text('status', { enum: ['PENDING','COMPLETED','DECLINED'] }).notNull().default('PENDING'), checklistJson: text('checklist_json').notNull().default('{}'), generalNotes: text('general_notes'), markedDamageJson: text('marked_damage_json').notNull().default('[]'), customerAcknowledgedAt: text('customer_acknowledged_at'), declineAcknowledgment: text('decline_acknowledgment'), decidedAt: text('decided_at'), actor: text('actor').notNull().default('owner'), isSynthetic: integer('is_synthetic', { mode: 'boolean' }).notNull().default(true), ...timestamps,
});

export const secureLinks = sqliteTable('secure_links', {
  id: integer('id').primaryKey({ autoIncrement: true }), reservationId: integer('reservation_id').notNull().references(() => reservations.id), purpose: text('purpose', { enum: ['AGREEMENT_SIGNING','PICKUP_INSPECTION','RETURN_INSPECTION'] }).notNull(), tokenHash: text('token_hash').notNull().unique(), tokenFingerprint: text('token_fingerprint').notNull(), expiresAt: text('expires_at').notNull(), revokedAt: text('revoked_at'), usedAt: text('used_at'), useCount: integer('use_count').notNull().default(0), lastUsedAt: text('last_used_at'), createdBy: text('created_by').notNull(), isSynthetic: integer('is_synthetic', { mode: 'boolean' }).notNull().default(true), ...timestamps,
});

export const secureLinkAttempts = sqliteTable('secure_link_attempts', {
  id: integer('id').primaryKey({ autoIncrement: true }), actorHash: text('actor_hash').notNull(), windowStartedAt: text('window_started_at').notNull(), attemptCount: integer('attempt_count').notNull().default(0), ...timestamps,
}, table => [uniqueIndex('secure_link_attempt_window_idx').on(table.actorHash, table.windowStartedAt)]);
