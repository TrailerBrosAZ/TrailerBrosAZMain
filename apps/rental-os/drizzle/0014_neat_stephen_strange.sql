CREATE TABLE `direct_checkout_agreements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`template_id` integer NOT NULL,
	`template_version` text NOT NULL,
	`template_hash` text NOT NULL,
	`renter_snapshot_json` text NOT NULL,
	`intent_snapshot_json` text NOT NULL,
	`quote_snapshot_json` text NOT NULL,
	`pickup_inspection_choice` text NOT NULL,
	`printed_name` text NOT NULL,
	`signed_at` text NOT NULL,
	`evidence_json` text NOT NULL,
	`is_synthetic` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `direct_checkout_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`template_id`) REFERENCES `agreement_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `direct_checkout_agreements_session_id_unique` ON `direct_checkout_agreements` (`session_id`);--> statement-breakpoint
CREATE TABLE `direct_checkout_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`intent_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`token_fingerprint` text NOT NULL,
	`csrf_hash` text NOT NULL,
	`state` text DEFAULT 'QUOTE_READY' NOT NULL,
	`quote_hash` text NOT NULL,
	`agreement_evidence_id` integer,
	`provider_payment_id` text,
	`reservation_id` integer,
	`communication_id` integer,
	`expires_at` text NOT NULL,
	`revoked_at` text,
	`abandoned_at` text,
	`completed_at` text,
	`last_transition_at` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_synthetic` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`intent_id`) REFERENCES `booking_intents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`communication_id`) REFERENCES `communication_records`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `direct_checkout_sessions_intent_id_unique` ON `direct_checkout_sessions` (`intent_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `direct_checkout_sessions_token_hash_unique` ON `direct_checkout_sessions` (`token_hash`);
--> statement-breakpoint
CREATE TRIGGER direct_checkout_agreement_immutable_update BEFORE UPDATE ON direct_checkout_agreements BEGIN SELECT RAISE(ABORT,'CHECKOUT_AGREEMENT_IMMUTABLE'); END;
--> statement-breakpoint
CREATE TRIGGER direct_checkout_agreement_immutable_delete BEFORE DELETE ON direct_checkout_agreements BEGIN SELECT RAISE(ABORT,'CHECKOUT_AGREEMENT_IMMUTABLE'); END;
