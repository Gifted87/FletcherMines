import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

// Resolve database path for local dev vs Vercel serverless environment
const isVercel = Boolean(process.env.VERCEL);
let dbPath: string;

if (isVercel) {
  const tmpDbPath = path.join("/tmp", "fletcher_mines.db");
  const repoDbPath = path.join(process.cwd(), "data", "fletcher_mines.db");

  if (!fs.existsSync(tmpDbPath) && fs.existsSync(repoDbPath)) {
    try {
      fs.copyFileSync(repoDbPath, tmpDbPath);
    } catch (e) {
      console.warn("Failed to copy database to /tmp:", e);
    }
  }
  dbPath = fs.existsSync(tmpDbPath) ? tmpDbPath : (fs.existsSync(repoDbPath) ? repoDbPath : tmpDbPath);
} else {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  dbPath = path.join(dataDir, "fletcher_mines.db");
}

const db = new Database(dbPath);

// Enable WAL mode for high concurrency
try {
  db.pragma("journal_mode = WAL");
} catch (e) {
  console.warn("Pragma WAL mode warning:", e);
}

// Initialize core tables
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
    telegram_joined INTEGER DEFAULT 1,
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
  CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY,
    maintenance_mode INTEGER DEFAULT 0,
    pause_withdrawals INTEGER DEFAULT 0,
    pause_deposits INTEGER DEFAULT 0,
    referral_active INTEGER DEFAULT 1,
    min_deposit REAL DEFAULT 10.0,
    min_withdrawal REAL DEFAULT 1000.0,
    withdrawal_fee_pct REAL DEFAULT 1.0,
    streak_mult_1_3 REAL DEFAULT 1.0,
    streak_mult_4_7 REAL DEFAULT 1.1,
    streak_mult_8_plus REAL DEFAULT 1.2,
    streak_penalty TEXT DEFAULT 'reset_zero',
    catchup_cost REAL DEFAULT 5.0,
    task_mode TEXT DEFAULT 'ping',
    homepage_headline TEXT DEFAULT 'Institutional Hash-Rate. Guaranteed Fixed Daily Yield.',
    homepage_subheadline TEXT DEFAULT 'Access enterprise ASIC mining power through tokenized mining blocks with automated daily settlements.',
    homepage_how_it_works TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS system_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    user_id INTEGER,
    title TEXT NOT NULL,
    details TEXT,
    severity TEXT DEFAULT 'info',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS daily_task_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL,
    explanation TEXT,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS faqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    sort_order INTEGER DEFAULT 0
  );
`);

// Safely add missing columns to users and transactions table if upgrading existing database
try {
  const userColumns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  const userColNames = userColumns.map((c) => c.name);

  if (!userColNames.includes("locked_balance")) {
    db.exec("ALTER TABLE users ADD COLUMN locked_balance REAL DEFAULT 0.0");
  }
  if (!userColNames.includes("email_verified")) {
    db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 1");
  }
  if (!userColNames.includes("two_factor_enabled")) {
    db.exec("ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 1");
  }
  if (!userColNames.includes("kyc_status")) {
    db.exec("ALTER TABLE users ADD COLUMN kyc_status TEXT DEFAULT 'verified'");
  }
  if (!userColNames.includes("account_status")) {
    db.exec("ALTER TABLE users ADD COLUMN account_status TEXT DEFAULT 'active'");
  }
  if (!userColNames.includes("telegram_joined")) {
    db.exec("ALTER TABLE users ADD COLUMN telegram_joined INTEGER DEFAULT 1");
  }

  const txColumns = db.prepare("PRAGMA table_info(transactions)").all() as Array<{ name: string }>;
  const txColNames = txColumns.map((c) => c.name);

  if (!txColNames.includes("receipt_image")) {
    db.exec("ALTER TABLE transactions ADD COLUMN receipt_image TEXT");
  }
  if (!txColNames.includes("network")) {
    db.exec("ALTER TABLE transactions ADD COLUMN network TEXT DEFAULT 'TRC20'");
  }
  if (!txColNames.includes("admin_note")) {
    db.exec("ALTER TABLE transactions ADD COLUMN admin_note TEXT");
  }

  // Enforce platform minimum withdrawal threshold of 1000 USDT
  try {
    db.exec("UPDATE system_settings SET min_withdrawal = 1000.0 WHERE id = 1 AND min_withdrawal < 1000.0");
  } catch {}
} catch (err) {
  console.warn("Table upgrade notice:", err);
}

// Seed default institutional batch if not present
const existingBatch = db.prepare("SELECT id FROM mining_batches WHERE batch_name = 'Batch 05'").get();
if (!existingBatch) {
  const now = new Date();
  const closingTime = new Date(now.getTime() + 5025000); // ~1 hr 23 min
  db.prepare(`
    INSERT INTO mining_batches (batch_name, hardware_model, total_blocks, claimed_blocks, price_per_block, min_maturity_days, status, opens_at, closes_at)
    VALUES ('Batch 05', 'Antminer S21 Pro (234 TH/s)', 1000, 887, 100.0, 14, 'active', ?, ?)
  `).run(now.toISOString(), closingTime.toISOString());
}

// Seed default announcements if empty
const countAnnouncements = (db.prepare("SELECT count(*) as count FROM announcements").get() as { count: number }).count;
if (countAnnouncements === 0) {
  db.prepare(`
    INSERT INTO announcements (title, content, category, urgency)
    VALUES 
    ('Batch 05 Live Allocation', 'Batch 05 hardware deployment live in Hall B. 88.7% claimed. Closes today.', 'drop', 'high'),
    ('Daily Yield Settlement Automated', 'Daily yields credited automatically at 00:00 UTC directly to available or locked ledger.', 'treasury', 'normal'),
    ('Manual Treasury Verification SLA', 'Manual deposit verification for TRON (TRC-20) operating under 45-minute average turnaround.', 'security', 'normal')
  `).run();
}

// Ensure default institutional investor user 'Miner_4839' exists with real database records
const existingUser = db.prepare("SELECT id FROM users WHERE username = 'Miner_4839' OR email = 'miner4839@fletchermines.io'").get() as { id: number } | undefined;
if (!existingUser) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync("Password123!", salt);
  const result = db.prepare(`
    INSERT INTO users (email, username, password_hash, referral_code, usdt_balance, locked_balance, bonus_claimed, referral_count, referral_earnings, email_verified, two_factor_enabled, kyc_status, account_status)
    VALUES ('miner4839@fletchermines.io', 'Miner_4839', ?, 'REF-84927', 1250.00, 5000.00, 1, 12, 600.00, 1, 1, 'verified', 'active')
  `).run(hash);

  const userId = result.lastInsertRowid;

  // Insert 2 active mining blocks for this user
  const now = new Date();
  const unlockDate1 = new Date(now.getTime() + 18 * 86400000); // 18 days from now
  const unlockDate2 = new Date(now.getTime() + 32 * 86400000); // 32 days from now

  db.prepare(`
    INSERT INTO mining_blocks (user_id, batch_name, block_count, total_invested, maturity_days, daily_rate_pct, daily_yield_usdt, accumulated_earnings, withdrawable_earnings, start_date, maturity_date, status)
    VALUES 
    (?, 'Batch 03', 25, 2500.00, 90, 16.0, 400.00, 720.00, 140.00, datetime('now', '-72 days'), ?, 'active'),
    (?, 'Batch 04', 25, 2500.00, 60, 14.0, 350.00, 520.00, 100.00, datetime('now', '-28 days'), ?, 'active')
  `).run(userId, unlockDate1.toISOString(), userId, unlockDate2.toISOString());

  // Insert real ledger transactions for this user
  db.prepare(`
    INSERT INTO transactions (user_id, tx_hash, type, amount, currency, status, description, created_at)
    VALUES
    (?, 'TX-DEP-99214', 'deposit', 1000.00, 'USDT', 'pending', 'Manual USDT Deposit (TRC-20 Treasury Verification)', datetime('now', '-35 minutes')),
    (?, 'TX-YLD-88129', 'daily_yield', 52.50, 'USDT', 'completed', '00:00 UTC Mining Yield Settlement', datetime('now', '-3 hours')),
    (?, 'TX-BLK-77182', 'block_purchase', 2500.00, 'USDT', 'completed', 'Mining Block Allocation (Batch 04 · 25 Blocks)', datetime('now', '-28 days')),
    (?, 'TX-REF-55102', 'referral_bonus', 50.00, 'USDT', 'completed', 'Referral Commission (Investor Satoshi_Alpha joined)', datetime('now', '-2 days')),
    (?, 'TX-BON-00192', 'referral_bonus', 50.00, 'USDT', 'completed', 'Welcome Allocation Voucher (#FM-50-PROMO)', datetime('now', '-75 days'))
  `).run(userId, userId, userId, userId, userId);

  // Insert daily task for today
  const todayStr = new Date().toISOString().split("T")[0];
  db.prepare(`
    INSERT INTO daily_tasks (user_id, task_date, task_type, streak_count, completed, reward_claimed)
    VALUES (?, ?, 'hashrate_ping', 4, 0, 0)
  `).run(userId, todayStr);
}

// Ensure network miners table has initial records
const minerCount = (db.prepare("SELECT count(*) as count FROM network_miners").get() as { count: number }).count;
if (minerCount === 0) {
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

// Ensure default system settings exist
const existingSettings = db.prepare("SELECT id FROM system_settings WHERE id = 1").get();
if (!existingSettings) {
  db.prepare(`
    INSERT INTO system_settings (
      id, maintenance_mode, pause_withdrawals, pause_deposits, referral_active,
      min_deposit, min_withdrawal, withdrawal_fee_pct,
      streak_mult_1_3, streak_mult_4_7, streak_mult_8_plus,
      streak_penalty, catchup_cost, task_mode,
      homepage_headline, homepage_subheadline
    ) VALUES (
      1, 0, 0, 0, 1,
      10.0, 1000.0, 1.0,
      1.0, 1.1, 1.2,
      'reset_zero', 5.0, 'ping',
      'Institutional Hash-Rate. Guaranteed Fixed Daily Yield.',
      'Access enterprise ASIC mining power through tokenized mining blocks with automated daily settlements.'
    )
  `).run();
}

// Seed daily task questions if empty
const countQuestions = (db.prepare("SELECT count(*) as count FROM daily_task_questions").get() as { count: number }).count;
if (countQuestions === 0) {
  const insertQ = db.prepare(`
    INSERT INTO daily_task_questions (question_text, option_a, option_b, option_c, option_d, correct_option, explanation, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  insertQ.run(
    "What is the primary role of ASIC immersion cooling in the Fletcher Mines Hall B facility?",
    "Reduces operational noise only",
    "Maintains optimal silicon junction temperature for 24/7 continuous hashrate without thermal throttling",
    "Increases power draw to maximum grid threshold",
    "Eliminates the requirement for power supply units",
    "B",
    "Immersion dielectric fluid cooling allows ASICs to sustain high hash densities without thermal throttling."
  );

  insertQ.run(
    "At what standardized UTC time are daily mining block yields settled and distributed across operator accounts?",
    "12:00 PM UTC",
    "06:00 AM UTC",
    "00:00 UTC",
    "18:00 UTC",
    "C",
    "All yield calculations execute automatically at the change of day (00:00 UTC)."
  );

  insertQ.run(
    "How does maintaining a consecutive daily task streak affect your node allocation yield multiplier?",
    "It has no effect",
    "Multiplies daily yield by up to 1.2x at 8+ consecutive days",
    "Permanently locks the contract",
    "Reduces contract duration by 50%",
    "B",
    "Streaks reward active operators with yield boosts from 1.0x up to 1.2x."
  );
}

// Seed FAQs if empty
const countFaqs = (db.prepare("SELECT count(*) as count FROM faqs").get() as { count: number }).count;
if (countFaqs === 0) {
  const insertFaq = db.prepare("INSERT INTO faqs (question, answer, category, sort_order) VALUES (?, ?, ?, ?)");
  insertFaq.run(
    "How do mining blocks produce fixed daily returns?",
    "Every block is directly mapped to a fraction of enterprise ASIC hardware (such as Antminer S21 Pro) operating in our hydro-cooled facility. Hardware yields are aggregated into USDT daily.",
    "investment",
    1
  );
  insertFaq.run(
    "When are mining yields credited to my wallet?",
    "Daily yields are calculated continuously and settled directly into your account at exactly 00:00 UTC every 24 hours.",
    "yields",
    2
  );
  insertFaq.run(
    "What is the difference between Available and Locked balances?",
    "Available balance is fully liquid and can be withdrawn or used to acquire new blocks. Locked balance represents the principal capital actively securing your hardware blocks until maturity.",
    "treasury",
    3
  );
  insertFaq.run(
    "What network should I use for USDT deposits?",
    "Fletcher Mines operates exclusively on the TRON network (TRC-20). Deposits must be sent via TRC-20 for instant reconciliation and zero lost funds.",
    "deposits",
    4
  );
}

// Seed initial system events for live activity feed if empty
const countEvents = (db.prepare("SELECT count(*) as count FROM system_events").get() as { count: number }).count;
if (countEvents === 0) {
  const insertEvent = db.prepare("INSERT INTO system_events (event_type, user_id, title, details, severity) VALUES (?, ?, ?, ?, ?)");
  insertEvent.run("deposit_submitted", 1, "Deposit Submitted", "User #1 (Miner_4839) submitted 1,000.00 USDT via TRC-20 awaiting treasury verification.", "info");
  insertEvent.run("batch_capacity", null, "Batch 05 Capacity 88.7%", "Antminer S21 Pro allocation in Hall B reached 887 / 1,000 blocks claimed.", "warning");
  insertEvent.run("yield_settled", null, "Daily Yields Settled", "00:00 UTC automated yield distributed to all active block contracts.", "info");
  insertEvent.run("streak_milestone", 1, "Streak Maintained", "User #1 (Miner_4839) hit a 4-day node ping streak.", "info");
}

export default db;
