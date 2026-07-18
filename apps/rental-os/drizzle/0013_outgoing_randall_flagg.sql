ALTER TABLE `communication_records` ADD `body_html` text DEFAULT '' NOT NULL;--> statement-breakpoint
DROP TRIGGER `communication_content_immutable_update`;--> statement-breakpoint
CREATE TRIGGER communication_content_immutable_update BEFORE UPDATE OF communication_type,recipient,template_key,template_version,source_template_hash,rendered_content_hash,subject_text,body_text,body_html,idempotency_key,rendered_at,prepared_at,actor,is_synthetic ON communication_records BEGIN SELECT RAISE(ABORT,'COMMUNICATION_CONTENT_IMMUTABLE'); END;
