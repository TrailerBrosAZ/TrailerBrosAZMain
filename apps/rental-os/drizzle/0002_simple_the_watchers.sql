ALTER TABLE `availability_blocks` ADD `is_synthetic` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `reservations` ADD `is_synthetic` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `reservations` SET `is_synthetic`=1 WHERE `confirmation_code` LIKE 'DEV-%';--> statement-breakpoint
INSERT INTO `audit_events` (`aggregate_type`,`aggregate_id`,`action`,`actor`,`payload_json`)
SELECT 'RESERVATION',r.id,'SYNTHETIC_DATA_MARKED','owner-intelligence-migration','{"synthetic":true,"reason":"Existing development seed"}'
FROM `reservations` r WHERE r.`confirmation_code` LIKE 'DEV-%'
AND NOT EXISTS (SELECT 1 FROM `audit_events` a WHERE a.`aggregate_type`='RESERVATION' AND a.`aggregate_id`=r.id AND a.`action`='SYNTHETIC_DATA_MARKED');
