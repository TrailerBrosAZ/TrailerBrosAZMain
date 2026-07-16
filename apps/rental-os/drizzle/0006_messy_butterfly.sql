CREATE TABLE `booking_intent_conversions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`intent_id` integer NOT NULL,
	`idempotency_key` text NOT NULL,
	`reservation_id` integer NOT NULL,
	`agreement_evidence_json` text NOT NULL,
	`approval_snapshot_json` text NOT NULL,
	`quote_snapshot_json` text NOT NULL,
	`converted_at` text NOT NULL,
	`actor` text NOT NULL,
	`is_synthetic` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`intent_id`) REFERENCES `booking_intents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `booking_intent_conversions_intent_id_unique` ON `booking_intent_conversions` (`intent_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `booking_intent_conversions_idempotency_key_unique` ON `booking_intent_conversions` (`idempotency_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `booking_intent_conversions_reservation_id_unique` ON `booking_intent_conversions` (`reservation_id`);