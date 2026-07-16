CREATE TABLE `payment_ledger_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reservation_id` integer,
	`booking_intent_id` integer,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`provider` text DEFAULT 'MOCK' NOT NULL,
	`provider_payment_id` text,
	`provider_refund_id` text,
	`idempotency_key` text NOT NULL,
	`reason` text,
	`inspection_id` integer,
	`breakdown_json` text DEFAULT '{}' NOT NULL,
	`is_synthetic` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_ledger_idempotency_idx` ON `payment_ledger_entries` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `payment_webhook_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider_event_id` text NOT NULL,
	`event_type` text NOT NULL,
	`provider_payment_id` text,
	`processing_status` text NOT NULL,
	`sanitized_status` text NOT NULL,
	`payload_hash` text NOT NULL,
	`error_category` text,
	`provider_created_at` text NOT NULL,
	`processed_at` text,
	`is_synthetic` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_webhook_event_idx` ON `payment_webhook_events` (`provider_event_id`);
--> statement-breakpoint
CREATE TRIGGER payment_ledger_immutable_update BEFORE UPDATE ON payment_ledger_entries BEGIN SELECT RAISE(ABORT,'PAYMENT_LEDGER_IMMUTABLE'); END;
--> statement-breakpoint
CREATE TRIGGER payment_ledger_immutable_delete BEFORE DELETE ON payment_ledger_entries BEGIN SELECT RAISE(ABORT,'PAYMENT_LEDGER_IMMUTABLE'); END;
