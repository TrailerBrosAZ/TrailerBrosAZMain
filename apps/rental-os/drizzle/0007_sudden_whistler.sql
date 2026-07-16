CREATE TABLE `secure_link_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_hash` text NOT NULL,
	`window_started_at` text NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `secure_link_attempt_window_idx` ON `secure_link_attempts` (`actor_hash`,`window_started_at`);--> statement-breakpoint
CREATE TABLE `secure_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reservation_id` integer NOT NULL,
	`purpose` text NOT NULL,
	`token_hash` text NOT NULL,
	`token_fingerprint` text NOT NULL,
	`expires_at` text NOT NULL,
	`revoked_at` text,
	`used_at` text,
	`use_count` integer DEFAULT 0 NOT NULL,
	`last_used_at` text,
	`created_by` text NOT NULL,
	`is_synthetic` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `secure_links_token_hash_unique` ON `secure_links` (`token_hash`);