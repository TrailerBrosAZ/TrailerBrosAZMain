CREATE TABLE `agreement_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agreement_id` integer NOT NULL,
	`document_hash` text NOT NULL,
	`renderer_version` text NOT NULL,
	`template_version` text NOT NULL,
	`content_type` text DEFAULT 'text/html' NOT NULL,
	`content_text` text NOT NULL,
	`generated_at` text NOT NULL,
	`is_synthetic` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`agreement_id`) REFERENCES `agreement_instances`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agreement_documents_document_hash_unique` ON `agreement_documents` (`document_hash`);
--> statement-breakpoint
CREATE TRIGGER agreement_documents_immutable_update BEFORE UPDATE ON agreement_documents BEGIN SELECT RAISE(ABORT,'SIGNED_DOCUMENT_IMMUTABLE'); END;
--> statement-breakpoint
CREATE TRIGGER agreement_documents_immutable_delete BEFORE DELETE ON agreement_documents BEGIN SELECT RAISE(ABORT,'SIGNED_DOCUMENT_IMMUTABLE'); END;
