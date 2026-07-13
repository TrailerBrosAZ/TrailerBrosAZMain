import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';
import { handleApiRequest } from './api.js';
import { createLocalDatabasePort, migrate, openDatabase } from './db/database.js';

const db = openDatabase(process.env.DATABASE_URL || resolve('data/rental-os.db')); migrate(db);
const ownerEmail = process.env.DEV_OWNER_EMAIL || 'owner@example.test';
const environment = { ENVIRONMENT: 'development' as const, AUTH_MODE: 'mock' as const, ALLOWED_OWNER_EMAIL: ownerEmail, DB: createLocalDatabasePort(db) };
const port = Number(process.env.PORT || 4174);
const server = createServer(async (incoming, outgoing) => {
  try {
    const headers = new Headers(); for (const [name, value] of Object.entries(incoming.headers)) if (value) headers.set(name, Array.isArray(value) ? value.join(', ') : value); headers.set('x-dev-owner-email', ownerEmail);
    const body = incoming.method === 'GET' || incoming.method === 'HEAD' ? undefined : Readable.toWeb(incoming) as ReadableStream;
    const request = new Request(`http://127.0.0.1:${port}${incoming.url || '/'}`, { method: incoming.method, headers, body, duplex: body ? 'half' : undefined } as RequestInit);
    const response = await handleApiRequest(request, environment); outgoing.writeHead(response.status, Object.fromEntries(response.headers)); outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) { console.error(error); outgoing.writeHead(500, { 'content-type': 'application/json' }); outgoing.end(JSON.stringify({ error: 'Local server error.' })); }
});
server.listen(port, '127.0.0.1', () => console.log(`Rental OS local server: http://127.0.0.1:${port}`));
