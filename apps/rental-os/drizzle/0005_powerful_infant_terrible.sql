CREATE TABLE `agreement_instances` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reservation_id` integer NOT NULL,
	`template_id` integer NOT NULL,
	`status` text DEFAULT 'NOT_SENT' NOT NULL,
	`template_version` text NOT NULL,
	`template_hash` text NOT NULL,
	`renter_snapshot_json` text NOT NULL,
	`reservation_snapshot_json` text NOT NULL,
	`quote_snapshot_json` text NOT NULL,
	`rendered_at` text NOT NULL,
	`electronic_consent_at` text,
	`terms_acknowledged_at` text,
	`driver_insurance_acknowledged_at` text,
	`inspection_opportunity_acknowledged_at` text,
	`signed_at` text,
	`printed_name` text,
	`signature_evidence_json` text,
	`is_synthetic` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`template_id`) REFERENCES `agreement_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `agreement_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`version` text NOT NULL,
	`source_manifest_version` text NOT NULL,
	`content_json` text NOT NULL,
	`content_hash` text NOT NULL,
	`legal_review_status` text DEFAULT 'ATTORNEY_REVIEW_REQUIRED' NOT NULL,
	`is_synthetic` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agreement_templates_version_unique` ON `agreement_templates` (`version`);--> statement-breakpoint
CREATE UNIQUE INDEX `agreement_templates_content_hash_unique` ON `agreement_templates` (`content_hash`);--> statement-breakpoint
CREATE TABLE `pickup_condition_choices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reservation_id` integer NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`checklist_json` text DEFAULT '{}' NOT NULL,
	`general_notes` text,
	`marked_damage_json` text DEFAULT '[]' NOT NULL,
	`customer_acknowledged_at` text,
	`decline_acknowledgment` text,
	`decided_at` text,
	`actor` text DEFAULT 'owner' NOT NULL,
	`is_synthetic` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pickup_condition_choices_reservation_id_unique` ON `pickup_condition_choices` (`reservation_id`);
--> statement-breakpoint
CREATE TRIGGER signed_agreement_immutable_update BEFORE UPDATE ON agreement_instances WHEN OLD.status='SIGNED' BEGIN SELECT RAISE(ABORT,'SIGNED_AGREEMENT_IMMUTABLE'); END;
--> statement-breakpoint
CREATE TRIGGER signed_agreement_immutable_delete BEFORE DELETE ON agreement_instances WHEN OLD.status='SIGNED' BEGIN SELECT RAISE(ABORT,'SIGNED_AGREEMENT_IMMUTABLE'); END;
