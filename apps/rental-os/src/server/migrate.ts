import { openDatabase, migrate } from './db/database.js';
const db = openDatabase(process.env.DATABASE_URL);
migrate(db);
db.close();
console.log('Rental OS migrations are current.');
