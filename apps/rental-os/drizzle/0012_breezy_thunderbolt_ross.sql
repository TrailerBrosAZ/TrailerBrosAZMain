CREATE TABLE `gmail_connections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_email` text NOT NULL,
	`sender_email` text NOT NULL,
	`google_subject_hash` text NOT NULL,
	`encrypted_token_bundle` text NOT NULL,
	`token_iv` text NOT NULL,
	`key_version` text NOT NULL,
	`granted_scope` text NOT NULL,
	`status` text NOT NULL,
	`authorized_at` text NOT NULL,
	`token_expires_at` text NOT NULL,
	`disconnected_at` text,
	`safe_error_classification` text,
	`is_synthetic` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gmail_delivery_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`communication_id` integer NOT NULL,
	`attempt_number` integer NOT NULL,
	`idempotency_key` text NOT NULL,
	`stable_message_id` text NOT NULL,
	`state` text NOT NULL,
	`provider_message_id` text,
	`safe_error_classification` text,
	`attempted_at` text NOT NULL,
	`completed_at` text,
	`actor` text NOT NULL,
	`is_synthetic` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`communication_id`) REFERENCES `communication_records`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gmail_delivery_idempotency_idx` ON `gmail_delivery_attempts` (`idempotency_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `gmail_delivery_attempt_idx` ON `gmail_delivery_attempts` (`communication_id`,`attempt_number`);--> statement-breakpoint
CREATE TABLE `gmail_oauth_states` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`state_hash` text NOT NULL,
	`verifier_ciphertext` text NOT NULL,
	`verifier_iv` text NOT NULL,
	`key_version` text NOT NULL,
	`redirect_uri` text NOT NULL,
	`expires_at` text NOT NULL,
	`consumed_at` text,
	`created_by` text NOT NULL,
	`is_synthetic` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gmail_oauth_state_hash_idx` ON `gmail_oauth_states` (`state_hash`);