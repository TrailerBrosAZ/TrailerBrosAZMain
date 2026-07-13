CREATE TABLE `audit_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`aggregate_type` text NOT NULL,
	`aggregate_id` integer NOT NULL,
	`action` text NOT NULL,
	`actor` text DEFAULT 'owner' NOT NULL,
	`payload_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `audit_event_identity_idx` ON `audit_events` (`id`,`aggregate_type`);--> statement-breakpoint
CREATE TABLE `availability_blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trailer_id` integer NOT NULL,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`reason` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`trailer_id`) REFERENCES `trailers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text,
	`phone` text,
	`date_of_birth` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reservation_id` integer NOT NULL,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`processor` text DEFAULT 'DEVELOPMENT' NOT NULL,
	`external_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`confirmation_code` text NOT NULL,
	`trailer_id` integer NOT NULL,
	`customer_id` integer,
	`channel` text NOT NULL,
	`external_source` text,
	`external_reference` text,
	`status` text NOT NULL,
	`pickup_at` text NOT NULL,
	`return_at` text NOT NULL,
	`rental_charge_cents` integer DEFAULT 0 NOT NULL,
	`dolly_days` integer DEFAULT 0 NOT NULL,
	`renter_age` integer,
	`named_renter_will_tow` integer DEFAULT true NOT NULL,
	`interstate_use` integer DEFAULT false NOT NULL,
	`interstate_approved` integer DEFAULT false NOT NULL,
	`international_use` integer DEFAULT false NOT NULL,
	`delivery_requested` integer DEFAULT false NOT NULL,
	`delivery_distance_miles` integer,
	`delivery_approved` integer DEFAULT false NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`trailer_id`) REFERENCES `trailers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reservations_confirmation_code_unique` ON `reservations` (`confirmation_code`);--> statement-breakpoint
CREATE TABLE `trailers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`unit_code` text NOT NULL,
	`published_payload_lbs` integer NOT NULL,
	`plate_verified` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trailers_unit_code_unique` ON `trailers` (`unit_code`);
--> statement-breakpoint
CREATE TRIGGER reservations_no_overlap_insert BEFORE INSERT ON reservations WHEN NEW.status IN ('PENDING_REVIEW','PENDING_AGREEMENT','PENDING_PAYMENT','CONFIRMED','PICKED_UP','RETURNED_PENDING_INSPECTION') BEGIN SELECT RAISE(ABORT,'TRAILER_SCHEDULE_CONFLICT') WHERE EXISTS (SELECT 1 FROM reservations r WHERE r.trailer_id=NEW.trailer_id AND r.status IN ('PENDING_REVIEW','PENDING_AGREEMENT','PENDING_PAYMENT','CONFIRMED','PICKED_UP','RETURNED_PENDING_INSPECTION') AND NEW.pickup_at < r.return_at AND NEW.return_at > r.pickup_at) OR EXISTS (SELECT 1 FROM availability_blocks b WHERE b.trailer_id=NEW.trailer_id AND NEW.pickup_at < b.end_at AND NEW.return_at > b.start_at); END;
--> statement-breakpoint
CREATE TRIGGER reservations_no_overlap_update BEFORE UPDATE OF trailer_id,pickup_at,return_at,status ON reservations WHEN NEW.status IN ('PENDING_REVIEW','PENDING_AGREEMENT','PENDING_PAYMENT','CONFIRMED','PICKED_UP','RETURNED_PENDING_INSPECTION') BEGIN SELECT RAISE(ABORT,'TRAILER_SCHEDULE_CONFLICT') WHERE EXISTS (SELECT 1 FROM reservations r WHERE r.id<>NEW.id AND r.trailer_id=NEW.trailer_id AND r.status IN ('PENDING_REVIEW','PENDING_AGREEMENT','PENDING_PAYMENT','CONFIRMED','PICKED_UP','RETURNED_PENDING_INSPECTION') AND NEW.pickup_at < r.return_at AND NEW.return_at > r.pickup_at) OR EXISTS (SELECT 1 FROM availability_blocks b WHERE b.trailer_id=NEW.trailer_id AND NEW.pickup_at < b.end_at AND NEW.return_at > b.start_at); END;
--> statement-breakpoint
CREATE TRIGGER blocks_no_overlap_insert BEFORE INSERT ON availability_blocks BEGIN SELECT RAISE(ABORT,'TRAILER_SCHEDULE_CONFLICT') WHERE EXISTS (SELECT 1 FROM reservations r WHERE r.trailer_id=NEW.trailer_id AND r.status IN ('PENDING_REVIEW','PENDING_AGREEMENT','PENDING_PAYMENT','CONFIRMED','PICKED_UP','RETURNED_PENDING_INSPECTION') AND NEW.start_at < r.return_at AND NEW.end_at > r.pickup_at) OR EXISTS (SELECT 1 FROM availability_blocks b WHERE b.trailer_id=NEW.trailer_id AND NEW.start_at < b.end_at AND NEW.end_at > b.start_at); END;
--> statement-breakpoint
CREATE TRIGGER blocks_no_overlap_update BEFORE UPDATE OF trailer_id,start_at,end_at ON availability_blocks BEGIN SELECT RAISE(ABORT,'TRAILER_SCHEDULE_CONFLICT') WHERE EXISTS (SELECT 1 FROM reservations r WHERE r.trailer_id=NEW.trailer_id AND r.status IN ('PENDING_REVIEW','PENDING_AGREEMENT','PENDING_PAYMENT','CONFIRMED','PICKED_UP','RETURNED_PENDING_INSPECTION') AND NEW.start_at < r.return_at AND NEW.end_at > r.pickup_at) OR EXISTS (SELECT 1 FROM availability_blocks b WHERE b.id<>NEW.id AND b.trailer_id=NEW.trailer_id AND NEW.start_at < b.end_at AND NEW.end_at > b.start_at); END;
