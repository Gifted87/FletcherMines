const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "fletcher_mines.db");
console.log("Connecting to SQLite database at:", dbPath);
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// 1. Core tables
console.log("Creating/verifying tables...");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    referred_by TEXT,
    usdt_balance REAL DEFAULT 50.0,
    locked_balance REAL DEFAULT 0.0,
    bonus_claimed INTEGER DEFAULT 1,
    referral_count INTEGER DEFAULT 0,
    referral_earnings REAL DEFAULT 0.0,
    email_verified INTEGER DEFAULT 1,
    two_factor_enabled INTEGER DEFAULT 1,
    kyc_status TEXT DEFAULT 'verified',
    account_status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    used INTEGER DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS support_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS mining_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_name TEXT NOT NULL,
    hardware_model TEXT NOT NULL,
    total_blocks INTEGER NOT NULL,
    claimed_blocks INTEGER NOT NULL,
    price_per_block REAL NOT NULL,
    min_maturity_days INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    opens_at DATETIME NOT NULL,
    closes_at DATETIME NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mining_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    batch_name TEXT NOT NULL,
    block_count INTEGER NOT NULL,
    total_invested REAL NOT NULL,
    maturity_days INTEGER NOT NULL,
    daily_rate_pct REAL NOT NULL,
    daily_yield_usdt REAL NOT NULL,
    accumulated_earnings REAL DEFAULT 0.0,
    withdrawable_earnings REAL DEFAULT 0.0,
    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    maturity_date DATETIME NOT NULL,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tx_hash TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USDT',
    status TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS daily_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    task_date DATE NOT NULL,
    task_type TEXT DEFAULT 'hashrate_ping',
    streak_count INTEGER DEFAULT 1,
    completed INTEGER DEFAULT 0,
    reward_claimed INTEGER DEFAULT 0,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, task_date)
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'drop',
    urgency TEXT DEFAULT 'normal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Live Network Participants / Ledger (to replace ALL mockData on homepage too!)
  CREATE TABLE IF NOT EXISTS network_miners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    handle TEXT NOT NULL,
    verified INTEGER DEFAULT 1,
    amount REAL NOT NULL,
    term INTEGER NOT NULL,
    daily_rate REAL NOT NULL,
    daily_usd REAL NOT NULL,
    total_yield REAL NOT NULL,
    status TEXT DEFAULT 'Active',
    minutes_ago INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// 2. Migration for columns if users table existed prior
console.log("Checking columns on users table...");
const userColumns = db.prepare("PRAGMA table_info(users)").all();
const colNames = userColumns.map((c) => c.name);
const addCol = (col, typeDef) => {
  if (!colNames.includes(col)) {
    console.log(`Adding missing column ${col} to users table...`);
    db.exec(`ALTER TABLE users ADD COLUMN ${col} ${typeDef}`);
  }
};
addCol("locked_balance", "REAL DEFAULT 0.0");
addCol("email_verified", "INTEGER DEFAULT 1");
addCol("two_factor_enabled", "INTEGER DEFAULT 1");
addCol("kyc_status", "TEXT DEFAULT 'verified'");
addCol("account_status", "TEXT DEFAULT 'active'");

// 3. Seed Batch 05
const existingBatch = db.prepare("SELECT id FROM mining_batches WHERE batch_name = 'Batch 05'").get();
if (!existingBatch) {
  console.log("Seeding Batch 05...");
  const now = new Date();
  const closingTime = new Date(now.getTime() + 5025000);
  db.prepare(`
    INSERT INTO mining_batches (batch_name, hardware_model, total_blocks, claimed_blocks, price_per_block, min_maturity_days, status, opens_at, closes_at)
    VALUES ('Batch 05', 'Antminer S21 Pro (234 TH/s)', 1000, 887, 100.0, 14, 'active', ?, ?)
  `).run(now.toISOString(), closingTime.toISOString());
}

// 4. Seed Announcements
const announcementsCount = db.prepare("SELECT count(*) as count FROM announcements").get().count;
if (announcementsCount === 0) {
  console.log("Seeding announcements...");
  const insertAnn = db.prepare("INSERT INTO announcements (title, content, category, urgency) VALUES (?, ?, ?, ?)");
  insertAnn.run("Batch 05 Live Allocation", "Batch 05 hardware deployment live in Hall B. 88.7% claimed. Closes today.", "drop", "high");
  insertAnn.run("Daily Yield Settlement Automated", "Daily yields credited automatically at 00:00 UTC directly to available or locked ledger.", "treasury", "normal");
  insertAnn.run("Manual Treasury Verification SLA", "Manual deposit verification for TRC-20 and ERC-20 operating under 45-minute average turnaround.", "security", "normal");
}

// 5. Seed user Miner_4839
let defaultUser = db.prepare("SELECT id FROM users WHERE username = 'Miner_4839'").get();
if (!defaultUser) {
  console.log("Seeding default user Miner_4839...");
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync("Password123!", salt);
  const res = db.prepare(`
    INSERT INTO users (email, username, password_hash, referral_code, usdt_balance, locked_balance, bonus_claimed, referral_count, referral_earnings, email_verified, two_factor_enabled, kyc_status, account_status)
    VALUES ('miner4839@fletchermines.io', 'Miner_4839', ?, 'REF-84927', 1250.00, 5000.00, 1, 12, 600.00, 1, 1, 'verified', 'active')
  `).run(hash);
  defaultUser = { id: res.lastInsertRowid };
}

// 6. Ensure Miner_4839 has blocks
const userBlockCount = db.prepare("SELECT count(*) as count FROM mining_blocks WHERE user_id = ?").get(defaultUser.id).count;
if (userBlockCount === 0) {
  console.log("Seeding mining blocks for Miner_4839...");
  const now = new Date();
  const unlockDate1 = new Date(now.getTime() + 18 * 86400000);
  const unlockDate2 = new Date(now.getTime() + 32 * 86400000);

  db.prepare(`
    INSERT INTO mining_blocks (user_id, batch_name, block_count, total_invested, maturity_days, daily_rate_pct, daily_yield_usdt, accumulated_earnings, withdrawable_earnings, start_date, maturity_date, status)
    VALUES 
    (?, 'Batch 03', 25, 2500.00, 90, 16.0, 400.00, 720.00, 140.00, datetime('now', '-72 days'), ?, 'active'),
    (?, 'Batch 04', 25, 2500.00, 60, 14.0, 350.00, 520.00, 100.00, datetime('now', '-28 days'), ?, 'active')
  `).run(defaultUser.id, unlockDate1.toISOString(), defaultUser.id, unlockDate2.toISOString());
}

// 7. Ensure Miner_4839 has transactions
const userTxCount = db.prepare("SELECT count(*) as count FROM transactions WHERE user_id = ?").get(defaultUser.id).count;
if (userTxCount === 0) {
  console.log("Seeding transactions for Miner_4839...");
  const insTx = db.prepare(`
    INSERT INTO transactions (user_id, tx_hash, type, amount, currency, status, description, created_at)
    VALUES (?, ?, ?, ?, 'USDT', ?, ?, ?)
  `);
  insTx.run(defaultUser.id, "TX-DEP-99214", "deposit", 1000.00, "pending", "Manual USDT Deposit (TRC-20 Treasury Verification)", new Date(Date.now() - 35 * 60000).toISOString());
  insTx.run(defaultUser.id, "TX-YLD-88129", "daily_yield", 52.50, "completed", "00:00 UTC Mining Yield Settlement", new Date(Date.now() - 3 * 3600000).toISOString());
  insTx.run(defaultUser.id, "TX-BLK-77182", "block_purchase", 2500.00, "completed", "Mining Block Allocation (Batch 04 · 25 Blocks)", new Date(Date.now() - 28 * 86400000).toISOString());
  insTx.run(defaultUser.id, "TX-REF-55102", "referral_bonus", 50.00, "completed", "Referral Commission (Investor Satoshi_Alpha joined)", new Date(Date.now() - 2 * 86400000).toISOString());
  insTx.run(defaultUser.id, "TX-BON-00192", "referral_bonus", 50.00, "completed", "Welcome Allocation Voucher (#FM-50-PROMO)", new Date(Date.now() - 75 * 86400000).toISOString());
}

// 8. Ensure Miner_4839 has daily task
const todayStr = new Date().toISOString().split("T")[0];
const taskCount = db.prepare("SELECT count(*) as count FROM daily_tasks WHERE user_id = ? AND task_date = ?").get(defaultUser.id, todayStr).count;
if (taskCount === 0) {
  console.log("Seeding daily task for Miner_4839...");
  db.prepare(`
    INSERT INTO daily_tasks (user_id, task_date, task_type, streak_count, completed, reward_claimed)
    VALUES (?, ?, 'hashrate_ping', 4, 0, 0)
  `).run(defaultUser.id, todayStr);
}

// 9. Seed network_miners table for public live ledger
const minerCount = db.prepare("SELECT count(*) as count FROM network_miners").get().count;
if (minerCount === 0) {
  console.log("Seeding initial network_miners ledger...");
  const insertMiner = db.prepare(`
    INSERT INTO network_miners (handle, verified, amount, term, daily_rate, daily_usd, total_yield, status, minutes_ago)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialRows = [
    { handle: "0x8f2a…b39c", verified: 1, amount: 25000, term: 180, rate: 20, minutes: 2 },
    { handle: "Miner_9402", verified: 1, amount: 12000, term: 90, rate: 18, minutes: 6 },
    { handle: "0x3e1d…78a1", verified: 1, amount: 5000, term: 60, rate: 15, minutes: 11 },
    { handle: "Miner_1184", verified: 0, amount: 1500, term: 30, rate: 12, minutes: 15 },
    { handle: "0x44ab…91ec", verified: 1, amount: 50000, term: 180, rate: 20, minutes: 22 },
    { handle: "Miner_7721", verified: 1, amount: 8000, term: 90, rate: 18, minutes: 29 },
    { handle: "0xaa91…20bf", verified: 1, amount: 3500, term: 30, rate: 12, minutes: 35 },
    { handle: "Miner_3059", verified: 0, amount: 800, term: 14, rate: 10, minutes: 42 },
    { handle: "0x6f31…00da", verified: 1, amount: 15000, term: 180, rate: 20, minutes: 54 },
    { handle: "Miner_5512", verified: 1, amount: 4200, term: 60, rate: 15, minutes: 68 },
    { handle: "0x11ce…89aa", verified: 1, amount: 2500, term: 30, rate: 12, minutes: 82 },
    { handle: "Miner_8834", verified: 1, amount: 10000, term: 90, rate: 18, minutes: 95 },
  ];

  for (const row of initialRows) {
    const dailyUsd = Number(((row.amount * row.rate) / 100).toFixed(2));
    const totalYield = Number((dailyUsd * row.term).toFixed(2));
    insertMiner.run(row.handle, row.verified, row.amount, row.term, row.rate, dailyUsd, totalYield, "Active", row.minutes);
  }
}

console.log("Database initialized successfully!");
