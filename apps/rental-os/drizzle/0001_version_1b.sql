ALTER TABLE reservations ADD COLUMN version integer NOT NULL DEFAULT 1;
--> statement-breakpoint
CREATE TABLE condition_inspections (id integer PRIMARY KEY AUTOINCREMENT NOT NULL,reservation_id integer NOT NULL REFERENCES reservations(id),type text NOT NULL CHECK(type IN ('PICKUP','RETURN')),condition_notes text NOT NULL,usage_trip_notes text,damage_found integer NOT NULL DEFAULT 0,damage_notes text,inspected_at text NOT NULL,actor text NOT NULL DEFAULT 'owner',created_at text NOT NULL DEFAULT (datetime('now')),updated_at text NOT NULL DEFAULT (datetime('now')),UNIQUE(reservation_id,type));
--> statement-breakpoint
CREATE TABLE inspection_photos (id integer PRIMARY KEY AUTOINCREMENT NOT NULL,inspection_id integer NOT NULL REFERENCES condition_inspections(id),local_reference text NOT NULL,caption text,created_at text NOT NULL DEFAULT (datetime('now')));
--> statement-breakpoint
CREATE TABLE cancellation_outcomes (id integer PRIMARY KEY AUTOINCREMENT NOT NULL,reservation_id integer NOT NULL UNIQUE REFERENCES reservations(id),type text NOT NULL CHECK(type IN ('CANCELLATION','NO_SHOW')),decided_at text NOT NULL,notice_hours integer NOT NULL,rental_refund_cents integer NOT NULL,retained_cents integer NOT NULL,payment_action text NOT NULL DEFAULT 'NOT_EXECUTED' CHECK(payment_action='NOT_EXECUTED'),notes text,created_at text NOT NULL DEFAULT (datetime('now')),updated_at text NOT NULL DEFAULT (datetime('now')));
--> statement-breakpoint
CREATE TABLE deposit_decisions (id integer PRIMARY KEY AUTOINCREMENT NOT NULL,reservation_id integer NOT NULL UNIQUE REFERENCES reservations(id),decision text NOT NULL CHECK(decision IN ('RELEASE_RECORDED','RETAIN_RECORDED')),amount_cents integer NOT NULL,reason text NOT NULL,damage_notes text,payment_action text NOT NULL DEFAULT 'NOT_EXECUTED' CHECK(payment_action='NOT_EXECUTED'),decided_at text NOT NULL,actor text NOT NULL DEFAULT 'owner',created_at text NOT NULL DEFAULT (datetime('now')),updated_at text NOT NULL DEFAULT (datetime('now')),CHECK((decision='RELEASE_RECORDED' AND amount_cents=0) OR (decision='RETAIN_RECORDED' AND amount_cents>0 AND damage_notes IS NOT NULL)));
--> statement-breakpoint
DROP TRIGGER reservations_no_overlap_insert;
--> statement-breakpoint
DROP TRIGGER reservations_no_overlap_update;
--> statement-breakpoint
DROP TRIGGER blocks_no_overlap_insert;
--> statement-breakpoint
DROP TRIGGER blocks_no_overlap_update;
--> statement-breakpoint
CREATE TRIGGER reservations_no_overlap_insert BEFORE INSERT ON reservations WHEN NEW.status IN ('PENDING_REVIEW','CONFIRMED','CHECKED_OUT','INSPECTION_PENDING') BEGIN SELECT RAISE(ABORT,'TRAILER_SCHEDULE_CONFLICT') WHERE EXISTS (SELECT 1 FROM reservations r WHERE r.trailer_id=NEW.trailer_id AND r.status IN ('PENDING_REVIEW','CONFIRMED','CHECKED_OUT','INSPECTION_PENDING') AND NEW.pickup_at < r.return_at AND NEW.return_at > r.pickup_at) OR EXISTS (SELECT 1 FROM availability_blocks b WHERE b.trailer_id=NEW.trailer_id AND NEW.pickup_at < b.end_at AND NEW.return_at > b.start_at); END;
--> statement-breakpoint
CREATE TRIGGER reservations_no_overlap_update BEFORE UPDATE OF trailer_id,pickup_at,return_at,status ON reservations WHEN NEW.status IN ('PENDING_REVIEW','CONFIRMED','CHECKED_OUT','INSPECTION_PENDING') BEGIN SELECT RAISE(ABORT,'TRAILER_SCHEDULE_CONFLICT') WHERE EXISTS (SELECT 1 FROM reservations r WHERE r.id<>NEW.id AND r.trailer_id=NEW.trailer_id AND r.status IN ('PENDING_REVIEW','CONFIRMED','CHECKED_OUT','INSPECTION_PENDING') AND NEW.pickup_at < r.return_at AND NEW.return_at > r.pickup_at) OR EXISTS (SELECT 1 FROM availability_blocks b WHERE b.trailer_id=NEW.trailer_id AND NEW.pickup_at < b.end_at AND NEW.return_at > b.start_at); END;
--> statement-breakpoint
CREATE TRIGGER blocks_no_overlap_insert BEFORE INSERT ON availability_blocks BEGIN SELECT RAISE(ABORT,'TRAILER_SCHEDULE_CONFLICT') WHERE EXISTS (SELECT 1 FROM reservations r WHERE r.trailer_id=NEW.trailer_id AND r.status IN ('PENDING_REVIEW','CONFIRMED','CHECKED_OUT','INSPECTION_PENDING') AND NEW.start_at < r.return_at AND NEW.end_at > r.pickup_at) OR EXISTS (SELECT 1 FROM availability_blocks b WHERE b.trailer_id=NEW.trailer_id AND NEW.start_at < b.end_at AND NEW.end_at > b.start_at); END;
--> statement-breakpoint
CREATE TRIGGER blocks_no_overlap_update BEFORE UPDATE OF trailer_id,start_at,end_at ON availability_blocks BEGIN SELECT RAISE(ABORT,'TRAILER_SCHEDULE_CONFLICT') WHERE EXISTS (SELECT 1 FROM reservations r WHERE r.trailer_id=NEW.trailer_id AND r.status IN ('PENDING_REVIEW','CONFIRMED','CHECKED_OUT','INSPECTION_PENDING') AND NEW.start_at < r.return_at AND NEW.end_at > r.pickup_at) OR EXISTS (SELECT 1 FROM availability_blocks b WHERE b.id<>NEW.id AND b.trailer_id=NEW.trailer_id AND NEW.start_at < b.end_at AND NEW.end_at > b.start_at); END;
