import { openDatabase } from './db/database.js';

const db = openDatabase(process.env.DATABASE_URL);
const trailer = db.prepare('SELECT id FROM trailers WHERE unit_code = ?').get('UTX-14') as { id: number } | undefined;
if (!trailer) {
  db.prepare('INSERT INTO trailers (name, unit_code, published_payload_lbs, plate_verified) VALUES (?, ?, ?, ?)').run('14 ft Tandem Axle Utility Trailer', 'UTX-14', 5200, 0);
}
const trailerId = (db.prepare('SELECT id FROM trailers WHERE unit_code = ?').get('UTX-14') as { id: number }).id;
const count = (db.prepare('SELECT count(*) AS total FROM reservations').get() as { total: number }).total;
if (count === 0) {
  const addCustomer = db.prepare('INSERT INTO customers (first_name,last_name,email,phone) VALUES (?,?,?,?)');
  const addReservation = db.prepare(`INSERT INTO reservations (confirmation_code,trailer_id,customer_id,channel,external_source,status,pickup_at,return_at,rental_charge_cents,renter_age,notes,is_synthetic) VALUES (?,?,?,?,?,?,?,?,?,?,?,1)`);
  const addAudit = db.prepare(`INSERT INTO audit_events(aggregate_type,aggregate_id,action,actor,payload_json) VALUES ('RESERVATION',?,'SYNTHETIC_DATA_MARKED','development-seed','{"synthetic":true,"reason":"Development sample seed"}')`);
  const samples = [
    ['Maria','Santos','maria@example.test','480-555-0101','DEV-1001','DIRECT',null,'CONFIRMED','2027-03-12T08:00:00-07:00','2027-03-14T18:00:00-07:00',12000,34,'Development sample only; agreement and payment workflows not captured'],
    ['Jordan','Lee','jordan@example.test','480-555-0102','DEV-1002','EXTERNAL','BIG_RENTALS','PENDING_REVIEW','2027-03-18T07:30:00-07:00','2027-03-19T17:00:00-07:00',6000,29,'Verify external reference and qualification'],
    ['Avery','Cole','avery@example.test','480-555-0103','DEV-1003','EXTERNAL','FACEBOOK_MARKETPLACE','CONFIRMED','2027-03-25T09:00:00-07:00','2027-03-27T19:30:00-07:00',12000,41,'Manual marketplace booking'],
  ];
  for (const row of samples) {
    const customer = addCustomer.run(row[0],row[1],row[2],row[3]);
    const reservation=addReservation.run(row[4],trailerId,customer.lastInsertRowid,...row.slice(5));
    addAudit.run(reservation.lastInsertRowid);
  }
}
db.close();
console.log('Development sample data ready.');
