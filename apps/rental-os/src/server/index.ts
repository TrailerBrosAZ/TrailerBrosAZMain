import express from 'express';
import { resolve } from 'node:path';
import { z } from 'zod';
import { openDatabase } from './db/database.js';
import { externalSources, validateBookingWindow } from '../shared/domain.js';

const app = express();
const db = openDatabase(process.env.DATABASE_URL || resolve('data/rental-os.db'));
app.use(express.json());

const manualBooking = z.object({
  trailerId: z.coerce.number().int().positive(), customerName: z.string().trim().min(2), source: z.enum(externalSources), externalReference: z.string().trim().optional(),
  pickupAt: z.coerce.date(), returnAt: z.coerce.date(), rentalChargeCents: z.coerce.number().int().nonnegative().default(0), notes: z.string().trim().optional(),
});
const blackout = z.object({ trailerId: z.coerce.number().int().positive(), startAt: z.coerce.date(), endAt: z.coerce.date(), reason: z.string().trim().min(2), notes: z.string().trim().optional() });
const iso = (date: Date) => date.toISOString();
const conflict = (error: unknown) => error instanceof Error && error.message.includes('TRAILER_SCHEDULE_CONFLICT');

app.get('/api/dashboard', (_req, res) => {
  const reservations = db.prepare(`SELECT r.*, t.name trailer_name, trim(coalesce(c.first_name,'') || ' ' || coalesce(c.last_name,'')) customer_name FROM reservations r JOIN trailers t ON t.id=r.trailer_id LEFT JOIN customers c ON c.id=r.customer_id WHERE r.status NOT IN ('CANCELLED','COMPLETED') ORDER BY r.pickup_at`).all();
  const blocks = db.prepare('SELECT b.*, t.name trailer_name FROM availability_blocks b JOIN trailers t ON t.id=b.trailer_id ORDER BY start_at').all();
  const trailers = db.prepare('SELECT * FROM trailers WHERE active=1 ORDER BY name').all();
  res.json({ reservations, blocks, trailers });
});

app.post('/api/reservations/external', (req, res) => {
  const parsed = manualBooking.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const value = parsed.data;
  try {
    validateBookingWindow(value.pickupAt, value.returnAt);
    const result = db.transaction(() => {
      const parts = value.customerName.split(/\s+/); const lastName = parts.pop() ?? ''; const firstName = parts.join(' ');
      const customer = db.prepare('INSERT INTO customers(first_name,last_name) VALUES (?,?)').run(firstName || lastName, firstName ? lastName : '');
      const code = `EXT-${Date.now().toString(36).toUpperCase()}`;
      const inserted = db.prepare(`INSERT INTO reservations (confirmation_code,trailer_id,customer_id,channel,external_source,external_reference,status,pickup_at,return_at,rental_charge_cents,notes) VALUES (?,?,?,'EXTERNAL',?,?,'PENDING_REVIEW',?,?,?,?)`).run(code,value.trailerId,customer.lastInsertRowid,value.source,value.externalReference || null,iso(value.pickupAt),iso(value.returnAt),value.rentalChargeCents,value.notes || null);
      db.prepare(`INSERT INTO audit_events (aggregate_type,aggregate_id,action,payload_json) VALUES ('RESERVATION',?,'EXTERNAL_BOOKING_CREATED',?)`).run(inserted.lastInsertRowid, JSON.stringify({ source: value.source }));
      return { id: Number(inserted.lastInsertRowid), confirmationCode: code };
    })();
    return res.status(201).json(result);
  } catch (error) { return res.status(conflict(error) ? 409 : 400).json({ error: conflict(error) ? 'That trailer is already reserved or blocked during this time.' : (error as Error).message }); }
});

app.post('/api/availability-blocks', (req, res) => {
  const parsed = blackout.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const value = parsed.data;
  try {
    validateBookingWindow(value.startAt, value.endAt);
    const result = db.transaction(() => db.prepare('INSERT INTO availability_blocks (trailer_id,start_at,end_at,reason,notes) VALUES (?,?,?,?,?)').run(value.trailerId,iso(value.startAt),iso(value.endAt),value.reason,value.notes || null))();
    return res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (error) { return res.status(conflict(error) ? 409 : 400).json({ error: conflict(error) ? 'That trailer is already reserved or blocked during this time.' : (error as Error).message }); }
});

if (process.env.NODE_ENV === 'production') { app.use(express.static(resolve('dist'))); app.get('*splat', (_req,res) => res.sendFile(resolve('dist/index.html'))); }
const port = Number(process.env.PORT || 4174);
app.listen(port, '127.0.0.1', () => console.log(`Rental OS local server: http://127.0.0.1:${port}`));
