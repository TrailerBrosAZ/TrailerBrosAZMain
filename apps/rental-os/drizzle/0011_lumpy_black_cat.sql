ALTER TABLE `agreement_instances` ADD `pickup_inspection_choice` text CHECK (`pickup_inspection_choice` IS NULL OR `pickup_inspection_choice` IN ('SEND_FORM','DECLINE_FORM'));--> statement-breakpoint
ALTER TABLE `agreement_instances` ADD `pickup_inspection_choice_at` text;--> statement-breakpoint
CREATE TABLE `__new_communication_records` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `reservation_id` integer NOT NULL REFERENCES `reservations`(`id`),
  `communication_type` text NOT NULL CHECK (`communication_type` IN ('BOOKING_CONFIRMATION','RENTAL_CLOSEOUT')),
  `recipient` text NOT NULL,
  `template_key` text NOT NULL,
  `template_version` text NOT NULL,
  `source_template_hash` text NOT NULL,
  `rendered_content_hash` text NOT NULL,
  `subject_text` text NOT NULL,
  `body_text` text NOT NULL,
  `state` text DEFAULT 'PREVIEW_READY' NOT NULL CHECK (`state` IN ('PREVIEW_READY','COPIED','SEND_UNAVAILABLE','QUEUED','SEND_FAILED','SENT_UNVERIFIED','DELIVERED')),
  `status` text DEFAULT 'PREVIEWED' NOT NULL,
  `idempotency_key` text NOT NULL,
  `rendered_at` text NOT NULL,
  `prepared_at` text NOT NULL,
  `copied_at` text,
  `attempted_at` text,
  `sent_at` text,
  `delivered_at` text,
  `safe_error_classification` text,
  `provider_message_id` text,
  `actor` text NOT NULL,
  `is_synthetic` integer DEFAULT true NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);--> statement-breakpoint
INSERT INTO `__new_communication_records` (`id`,`reservation_id`,`communication_type`,`recipient`,`template_key`,`template_version`,`source_template_hash`,`rendered_content_hash`,`subject_text`,`body_text`,`state`,`status`,`idempotency_key`,`rendered_at`,`prepared_at`,`copied_at`,`safe_error_classification`,`actor`,`is_synthetic`,`created_at`)
SELECT `id`,`reservation_id`,CASE WHEN `template_key`='DEPOSIT_OUTCOME' THEN 'RENTAL_CLOSEOUT' ELSE 'BOOKING_CONFIRMATION' END,'',`template_key`,`template_version`,'LEGACY_PREVIEW_SOURCE','LEGACY_PREVIEW_CONTENT',`subject_text`,`body_text`,CASE WHEN `status`='COPIED' THEN 'COPIED' ELSE 'SEND_UNAVAILABLE' END,`status`,'legacy_preview_'||`id`,`rendered_at`,`rendered_at`,`copied_at`,'LEGACY_PREVIEW_ONLY',`actor`,`is_synthetic`,`created_at` FROM `communication_records`;--> statement-breakpoint
DROP TABLE `communication_records`;--> statement-breakpoint
ALTER TABLE `__new_communication_records` RENAME TO `communication_records`;--> statement-breakpoint
CREATE UNIQUE INDEX `communication_idempotency_idx` ON `communication_records` (`idempotency_key`);--> statement-breakpoint
CREATE TRIGGER communication_content_immutable_update BEFORE UPDATE OF communication_type,recipient,template_key,template_version,source_template_hash,rendered_content_hash,subject_text,body_text,idempotency_key,rendered_at,prepared_at,actor,is_synthetic ON communication_records BEGIN SELECT RAISE(ABORT,'COMMUNICATION_CONTENT_IMMUTABLE'); END;--> statement-breakpoint
CREATE TRIGGER communication_record_immutable_delete BEFORE DELETE ON communication_records BEGIN SELECT RAISE(ABORT,'COMMUNICATION_RECORD_IMMUTABLE'); END;
