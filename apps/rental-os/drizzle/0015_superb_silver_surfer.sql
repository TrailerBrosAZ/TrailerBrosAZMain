CREATE TABLE `attorney_approval_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agreement_version` text NOT NULL,
	`agreement_source_hash` text NOT NULL,
	`attorney_review_date` text NOT NULL,
	`approval_reference` text NOT NULL,
	`recorded_at` text NOT NULL,
	`recorded_by` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TRIGGER attorney_approval_records_immutable_update BEFORE UPDATE ON attorney_approval_records BEGIN SELECT RAISE(ABORT, 'ATTORNEY_APPROVAL_IMMUTABLE'); END;
--> statement-breakpoint
CREATE TRIGGER attorney_approval_records_immutable_delete BEFORE DELETE ON attorney_approval_records BEGIN SELECT RAISE(ABORT, 'ATTORNEY_APPROVAL_IMMUTABLE'); END;
