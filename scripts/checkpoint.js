const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'fletcher_mines.db');
const db = new Database(dbPath);
db.prepare('UPDATE system_settings SET min_withdrawal = 20.0 WHERE id = 1').run();
db.pragma('wal_checkpoint(TRUNCATE)');
db.close();
console.log('Database checkpointed successfully.');
