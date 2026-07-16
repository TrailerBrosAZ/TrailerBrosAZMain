CREATE TABLE `delivery_quote_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_hash` text NOT NULL,
	`window_started_at` text NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `delivery_quote_usage_window_idx` ON `delivery_quote_usage` (`actor_hash`,`window_started_at`);--> statement-breakpoint
ALTER TABLE `booking_intents` ADD `delivery_quote_status` text DEFAULT 'NOT_REQUESTED' NOT NULL;--> statement-breakpoint
ALTER TABLE `booking_intents` ADD `delivery_distance_meters` integer;--> statement-breakpoint
ALTER TABLE `booking_intents` ADD `delivery_zone` text;--> statement-breakpoint
ALTER TABLE `booking_intents` ADD `delivery_quoted_at` text;--> statement-breakpoint
ALTER TABLE `booking_intents` ADD `delivery_override_fee_cents` integer;--> statement-breakpoint
ALTER TABLE `booking_intents` ADD `delivery_override_reason` text;--> statement-breakpoint
ALTER TABLE `booking_intents` ADD `delivery_override_at` text;--> statement-breakpoint
ALTER TABLE `booking_intents` ADD `delivery_override_actor` text;--> statement-breakpoint
ALTER TABLE `booking_intents` ADD `estimated_total_cents` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE `booking_intents` SET `estimated_total_cents`=`estimated_due_before_delivery_cents` WHERE `estimated_total_cents`=0;
