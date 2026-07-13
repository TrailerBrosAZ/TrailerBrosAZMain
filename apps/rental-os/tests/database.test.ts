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
