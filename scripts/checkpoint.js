const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'fletcher_mines.db');
const db = new Database(dbPath);
db.pragma('wal_checkpoint(TRUNCATE)');
db.close();
console.log('Database checkpointed successfully.');
