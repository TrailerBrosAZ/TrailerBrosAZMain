import { beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { migrate, openDatabase } from "../src/server/db/database.js";

let db: Database.Database;
const pickup = "2027-11-01T15:00:00.000Z";
const returning = "2027-11-02T15:00:00.000Z";

beforeEach(() => {
  db?.close();
  db = openDatabase(":memory:");
  migrate(db);
  db.exec("INSERT INTO trailers(name,unit_code,published_payload_lbs) VALUES ('Synthetic Trailer','HOLD-1',5200)");
});

function hold(expiresAt = "2099-01-01T00:00:00.000Z") {
  db.prepare("INSERT INTO checkout_holds(trailer_id,token_hash,token_fingerprint,pickup_at,return_at,expires_at,status,is_synthetic) VALUES (1,'hash-only','hash-only',?,?,?,'ACTIVE',1)").run(pickup, returning, expiresAt);
}

describe("authoritative checkout holds", () => {
  it("stores only a token hash and blocks overlapping reservations", () => {
    hold();
    expect(() => db.exec(`INSERT INTO reservations(confirmation_code,trailer_id,channel,status,pickup_at,return_at,rental_charge_cents,is_synthetic) VALUES ('SYN-HOLD',1,'DIRECT','CONFIRMED','2027-11-01T16:00:00.000Z','2027-11-01T18:00:00.000Z',6000,1)`)).toThrow(/TRAILER_SCHEDULE_CONFLICT/);
    expect(db.prepare("SELECT token_hash FROM checkout_holds").get()).toEqual({ token_hash: "hash-only" });
  });

  it("blocks overlapping blackouts while the hold is active", () => {
    hold();
    expect(() => db.exec(`INSERT INTO availability_blocks(trailer_id,start_at,end_at,reason,is_synthetic) VALUES (1,'2027-11-01T17:00:00.000Z','2027-11-01T19:00:00.000Z','Synthetic conflict',1)`)).toThrow(/TRAILER_SCHEDULE_CONFLICT/);
  });

  it("releases availability after explicit consumption", () => {
    hold();
    db.exec("UPDATE checkout_holds SET status='CONSUMED'");
    expect(() => db.exec(`INSERT INTO reservations(confirmation_code,trailer_id,channel,status,pickup_at,return_at,rental_charge_cents,is_synthetic) VALUES ('SYN-AFTER-HOLD',1,'DIRECT','CONFIRMED','2027-11-01T16:00:00.000Z','2027-11-01T18:00:00.000Z',6000,1)`)).not.toThrow();
  });

  it("retains expired hold records without blocking availability", () => {
    hold("2020-01-01T00:00:00.000Z");
    expect(() => db.exec(`INSERT INTO reservations(confirmation_code,trailer_id,channel,status,pickup_at,return_at,rental_charge_cents,is_synthetic) VALUES ('SYN-EXPIRED-HOLD',1,'DIRECT','CONFIRMED','2027-11-01T16:00:00.000Z','2027-11-01T18:00:00.000Z',6000,1)`)).not.toThrow();
    expect(db.prepare("SELECT count(*) total FROM checkout_holds").get()).toEqual({ total: 1 });
  });
});
