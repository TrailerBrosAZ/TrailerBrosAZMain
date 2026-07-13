import { openDatabase, migrate } from './db/database.js';
const db = openDatabase(process.env.DATABASE_URL);
migrate(db);
db.close();
console.log('Initial Rental OS migration applied.');
