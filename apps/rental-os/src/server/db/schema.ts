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
