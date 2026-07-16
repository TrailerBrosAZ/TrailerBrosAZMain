import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { migrate, openDatabase } from '../src/server/db/database.js';
let db:Database.Database;
beforeEach(()=>{db=openDatabase(':memory:');migrate(db);db.prepare("INSERT INTO trailers(name,unit_code,published_payload_lbs) VALUES ('Test Trailer','TEST-1',5200)").run()}); afterEach(()=>db.close());
const addReservation=(start:string,end:string,status='CONFIRMED')=>db.prepare("INSERT INTO reservations(confirmation_code,trailer_id,channel,status,pickup_at,return_at) VALUES (?,1,'DIRECT',?,?,?)").run(Math.random().toString(),status,start,end);
describe('authoritative overlap protection',()=>{
 it('rejects an overlapping reservation',()=>{addReservation('2027-01-10T08:00:00Z','2027-01-10T12:00:00Z');expect(()=>addReservation('2027-01-10T11:30:00Z','2027-01-10T14:00:00Z')).toThrow(/TRAILER_SCHEDULE_CONFLICT/)});
 it('permits an adjacent reservation with no buffer',()=>{addReservation('2027-01-10T08:00:00Z','2027-01-10T12:00:00Z');expect(()=>addReservation('2027-01-10T12:00:00Z','2027-01-10T14:00:00Z')).not.toThrow()});
 it('makes external bookings block like direct bookings',()=>{db.prepare("INSERT INTO reservations(confirmation_code,trailer_id,channel,external_source,status,pickup_at,return_at) VALUES ('EXT',1,'EXTERNAL','BIG_RENTALS','PENDING_REVIEW','2027-01-10T08:00:00Z','2027-01-10T12:00:00Z')").run();expect(()=>addReservation('2027-01-10T09:00:00Z','2027-01-10T10:00:00Z')).toThrow(/TRAILER_SCHEDULE_CONFLICT/)});
 it('rejects a blackout that overlaps a reservation',()=>{addReservation('2027-01-10T08:00:00Z','2027-01-10T12:00:00Z');expect(()=>db.prepare("INSERT INTO availability_blocks(trailer_id,start_at,end_at,reason) VALUES (1,'2027-01-10T10:00:00Z','2027-01-10T13:00:00Z','Maintenance')").run()).toThrow(/TRAILER_SCHEDULE_CONFLICT/)});
 it('rejects a reservation that overlaps a blackout',()=>{db.prepare("INSERT INTO availability_blocks(trailer_id,start_at,end_at,reason) VALUES (1,'2027-01-10T10:00:00Z','2027-01-10T13:00:00Z','Maintenance')").run();expect(()=>addReservation('2027-01-10T12:00:00Z','2027-01-10T14:00:00Z')).toThrow(/TRAILER_SCHEDULE_CONFLICT/)});
 it('allows cancelled reservations to release availability',()=>{addReservation('2027-01-10T08:00:00Z','2027-01-10T12:00:00Z','CANCELLED');expect(()=>addReservation('2027-01-10T09:00:00Z','2027-01-10T10:00:00Z')).not.toThrow()});
 it('prevents an update from moving into occupied time',()=>{addReservation('2027-01-10T08:00:00Z','2027-01-10T12:00:00Z');addReservation('2027-01-11T08:00:00Z','2027-01-11T12:00:00Z');expect(()=>db.prepare("UPDATE reservations SET pickup_at='2027-01-10T09:00:00Z',return_at='2027-01-10T11:00:00Z' WHERE id=2").run()).toThrow(/TRAILER_SCHEDULE_CONFLICT/)});
});

describe('Version 1B persistence rules',()=>{
 it('creates lifecycle records and tracks both migrations',()=>{
  const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row=>(row as {name:string}).name);
  expect(tables).toEqual(expect.arrayContaining(['condition_inspections','inspection_photos','cancellation_outcomes','deposit_decisions','audit_events','booking_intents']));
  expect(db.prepare('SELECT count(*) count FROM app_migrations').get()).toEqual({count:5});
  expect(db.prepare("SELECT name,dflt_value FROM pragma_table_info('reservations') WHERE name='is_synthetic'").get()).toEqual({name:'is_synthetic',dflt_value:'false'});
 });
 it('keeps booking intents separate from schedule blocking and enforces idempotency',()=>{const sql="INSERT INTO booking_intents(idempotency_key,trailer_id,legal_name,email,phone,age_25_confirmed,named_renter_only_towing,tow_vehicle_details,hitch_ball_acknowledged,brake_controller_acknowledged,insurance_acknowledged,intended_use,trip_type,fulfillment_type,pickup_at,return_at,rental_days,rental_charge_cents,dolly_charge_cents,security_deposit_cents,tax_cents,estimated_due_before_delivery_cents,expires_at) VALUES ('ONE',1,'Synthetic','s@example.test','555-0100',1,1,'Truck',1,1,1,'Use','IN_STATE','PICKUP','2027-01-10T08:00:00Z','2027-01-10T12:00:00Z',1,4000,0,10000,0,14000,'2027-01-01T00:30:00Z')";db.exec(sql);expect(()=>addReservation('2027-01-10T09:00:00Z','2027-01-10T10:00:00Z')).not.toThrow();expect(()=>db.exec(sql)).toThrow();});
 it('requires damage notes for a retained deposit decision',()=>{
  addReservation('2027-01-10T08:00:00Z','2027-01-10T12:00:00Z','INSPECTION_PENDING');
  expect(()=>db.prepare("INSERT INTO deposit_decisions(reservation_id,decision,amount_cents,reason,decided_at) VALUES (1,'RETAIN_RECORDED',10000,'Damage','2027-01-10T13:00:00Z')").run()).toThrow();
  expect(()=>db.prepare("INSERT INTO deposit_decisions(reservation_id,decision,amount_cents,reason,damage_notes,decided_at) VALUES (1,'RETAIN_RECORDED',10000,'Damage','Bent fender','2027-01-10T13:00:00Z')").run()).not.toThrow();
 });
 it('stores cancellation outcomes separately from return inspections',()=>{
  addReservation('2027-01-10T08:00:00Z','2027-01-10T12:00:00Z','CANCELLED');
  db.prepare("INSERT INTO cancellation_outcomes(reservation_id,type,decided_at,notice_hours,rental_refund_cents,retained_cents,notes) VALUES (1,'CANCELLATION','2027-01-10T07:00:00Z',1,18000,10000,'Late cancellation')").run();
  expect(db.prepare('SELECT rental_refund_cents,retained_cents,payment_action FROM cancellation_outcomes').get()).toEqual({rental_refund_cents:18000,retained_cents:10000,payment_action:'NOT_EXECUTED'});
  expect(db.prepare('SELECT count(*) count FROM condition_inspections').get()).toEqual({count:0});
 });
});
