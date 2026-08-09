CREATE TABLE `checkout_holds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trailer_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`token_fingerprint` text NOT NULL,
	`pickup_at` text NOT NULL,
	`return_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`booking_intent_id` integer,
	`is_synthetic` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`trailer_id`) REFERENCES `trailers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`booking_intent_id`) REFERENCES `booking_intents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `checkout_holds_token_hash_unique` ON `checkout_holds` (`token_hash`);
--> statement-breakpoint
CREATE INDEX `checkout_holds_schedule_idx` ON `checkout_holds` (`trailer_id`,`pickup_at`,`return_at`,`expires_at`,`status`);
--> statement-breakpoint
DROP TRIGGER `reservations_no_overlap_insert`;
--> statement-breakpoint
CREATE TRIGGER `reservations_no_overlap_insert` BEFORE INSERT ON `reservations` WHEN NEW.status IN ('PENDING_REVIEW','CONFIRMED','CHECKED_OUT','INSPECTION_PENDING') BEGIN SELECT RAISE(ABORT,'TRAILER_SCHEDULE_CONFLICT') WHERE EXISTS (SELECT 1 FROM reservations r WHERE r.trailer_id=NEW.trailer_id AND r.status IN ('PENDING_REVIEW','CONFIRMED','CHECKED_OUT','INSPECTION_PENDING') AND NEW.pickup_at < r.return_at AND NEW.return_at > r.pickup_at) OR EXISTS (SELECT 1 FROM availability_blocks b WHERE b.trailer_id=NEW.trailer_id AND NEW.pickup_at < b.end_at AND NEW.return_at > b.start_at) OR EXISTS (SELECT 1 FROM checkout_holds h WHERE h.trailer_id=NEW.trailer_id AND h.status='ACTIVE' AND julianday(h.expires_at)>julianday('now') AND NEW.pickup_at < h.return_at AND NEW.return_at > h.pickup_at); END;
--> statement-breakpoint
DROP TRIGGER `reservations_no_overlap_update`;
--> statement-breakpoint
CREATE TRIGGER `reservations_no_overlap_update` BEFORE UPDATE OF trailer_id,pickup_at,return_at,status ON `reservations` WHEN NEW.status IN ('PENDING_REVIEW','CONFIRMED','CHECKED_OUT','INSPECTION_PENDING') BEGIN SELECT RAISE(ABORT,'TRAILER_SCHEDULE_CONFLICT') WHERE EXISTS (SELECT 1 FROM reservations r WHERE r.id<>NEW.id AND r.trailer_id=NEW.trailer_id AND r.status IN ('PENDING_REVIEW','CONFIRMED','CHECKED_OUT','INSPECTION_PENDING') AND NEW.pickup_at < r.return_at AND NEW.return_at > r.pickup_at) OR EXISTS (SELECT 1 FROM availability_blocks b WHERE b.trailer_id=NEW.trailer_id AND NEW.pickup_at < b.end_at AND NEW.return_at > b.start_at) OR EXISTS (SELECT 1 FROM checkout_holds h WHERE h.trailer_id=NEW.trailer_id AND h.status='ACTIVE' AND julianday(h.expires_at)>julianday('now') AND NEW.pickup_at < h.return_at AND NEW.return_at > h.pickup_at); END;
--> statement-breakpoint
DROP TRIGGER `blocks_no_overlap_insert`;
--> statement-breakpoint
CREATE TRIGGER `blocks_no_overlap_insert` BEFORE INSERT ON `availability_blocks` BEGIN SELECT RAISE(ABORT,'TRAILER_SCHEDULE_CONFLICT') WHERE EXISTS (SELECT 1 FROM reservations r WHERE r.trailer_id=NEW.trailer_id AND r.status IN ('PENDING_REVIEW','CONFIRMED','CHECKED_OUT','INSPECTION_PENDING') AND NEW.start_at < r.return_at AND NEW.end_at > r.pickup_at) OR EXISTS (SELECT 1 FROM availability_blocks b WHERE b.trailer_id=NEW.trailer_id AND NEW.start_at < b.end_at AND NEW.end_at > b.start_at) OR EXISTS (SELECT 1 FROM checkout_holds h WHERE h.trailer_id=NEW.trailer_id AND h.status='ACTIVE' AND julianday(h.expires_at)>julianday('now') AND NEW.start_at < h.return_at AND NEW.end_at > h.pickup_at); END;
--> statement-breakpoint
DROP TRIGGER `blocks_no_overlap_update`;
--> statement-breakpoint
CREATE TRIGGER `blocks_no_overlap_update` BEFORE UPDATE OF trailer_id,start_at,end_at ON `availability_blocks` BEGIN SELECT RAISE(ABORT,'TRAILER_SCHEDULE_CONFLICT') WHERE EXISTS (SELECT 1 FROM reservations r WHERE r.trailer_id=NEW.trailer_id AND r.status IN ('PENDING_REVIEW','CONFIRMED','CHECKED_OUT','INSPECTION_PENDING') AND NEW.start_at < r.return_at AND NEW.end_at > r.pickup_at) OR EXISTS (SELECT 1 FROM availability_blocks b WHERE b.id<>NEW.id AND b.trailer_id=NEW.trailer_id AND NEW.start_at < b.end_at AND NEW.end_at > b.start_at) OR EXISTS (SELECT 1 FROM checkout_holds h WHERE h.trailer_id=NEW.trailer_id AND h.status='ACTIVE' AND julianday(h.expires_at)>julianday('now') AND NEW.start_at < h.return_at AND NEW.end_at > h.pickup_at); END;
