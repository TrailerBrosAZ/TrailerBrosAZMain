CREATE TABLE `communication_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reservation_id` integer NOT NULL,
	`template_key` text NOT NULL,
	`template_version` text NOT NULL,
	`subject_text` text NOT NULL,
	`body_text` text NOT NULL,
	`status` text DEFAULT 'PREVIEWED' NOT NULL,
	`rendered_at` text NOT NULL,
	`copied_at` text,
	`actor` text NOT NULL,
	`is_synthetic` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON UPDATE no action ON DELETE no action
);
