import db from "./db";

export interface AdminOverviewData {
  financials: {
    totalDeposits: number;
    activeLockedCapital: number;
    totalYieldPaid: number;
    treasuryReserves: number;
  };
  operations: {
    activeUsers24h: number;
    pendingDepositsCount: number;
    taskCompletionRatePct: number;
    totalHashratePH: number;
    facilityUptime: number;
  };
  liveEvents: Array<{
    id: number;
    eventType: string;
    userId: number | null;
    title: string;
    details: string;
    severity: string;
    createdAt: string;
  }>;
  systemState: {
    maintenanceMode: boolean;
    pauseWithdrawals: boolean;
    pauseDeposits: boolean;
    referralActive: boolean;
  };
}

export interface AdminDepositRecord {
  id: number;
  userId: number;
  username: string;
  email: string;
  txHash: string;
  amount: number;
  currency: string;
  network: string;
  receiptImage: string | null;
  status: "pending" | "completed" | "failed" | "info_requested";
  adminNote: string | null;
  createdAt: string;
}

export interface AdminUserRecord {
  id: number;
  username: string;
  email: string;
  usdtBalance: number;
  lockedBalance: number;
  totalBlocks: number;
  streakCount: number;
  kycStatus: string;
  accountStatus: string;
  referralCode: string;
  referralCount: number;
  createdAt: string;
}

export interface AdminBatchRecord {
  id: number;
  batchName: string;
  hardwareModel: string;
  totalBlocks: number;
  claimedBlocks: number;
  remainingBlocks: number;
  pricePerBlock: number;
  minMaturityDays: number;
  status: string;
  opensAt: string;
  closesAt: string;
  percentClaimed: number;
  revenueCollected: number;
}

// 1. Overview Cockpit Data
export function getAdminOverviewData(): AdminOverviewData {
  const depRow = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM transactions 
    WHERE type = 'deposit' AND status = 'completed'
  `).get() as { total: number };

  const lockedRow = db.prepare(`
    SELECT COALESCE(SUM(total_invested), 0) as total 
    FROM mining_blocks 
    WHERE status = 'active'
  `).get() as { total: number };

  const yieldRow = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM transactions 
    WHERE type = 'daily_yield' AND status = 'completed'
  `).get() as { total: number };

  const treasuryRow = db.prepare(`
    SELECT COALESCE(SUM(usdt_balance), 0) as total 
    FROM users
  `).get() as { total: number };

  const pendingCount = (db.prepare(`
    SELECT COUNT(*) as count 
    FROM transactions 
    WHERE type = 'deposit' AND (status = 'pending' OR status = 'info_requested')
  `).get() as { count: number }).count;

  const totalUsersCount = (db.prepare(`SELECT COUNT(*) as count FROM users`).get() as { count: number }).count;
  const todayStr = new Date().toISOString().split("T")[0];
  const completedTasksToday = (db.prepare(`
    SELECT COUNT(*) as count 
    FROM daily_tasks 
    WHERE task_date = ? AND completed = 1
  `).get(todayStr) as { count: number }).count;

  const taskRate = totalUsersCount > 0 ? Math.round((completedTasksToday / totalUsersCount) * 100) : 94;

  const events = db.prepare(`
    SELECT id, event_type as eventType, user_id as userId, title, details, severity, created_at as createdAt
    FROM system_events
    ORDER BY id DESC
    LIMIT 20
  `).all() as AdminOverviewData["liveEvents"];

  const settings = db.prepare(`
    SELECT maintenance_mode, pause_withdrawals, pause_deposits, referral_active 
    FROM system_settings 
    WHERE id = 1
  `).get() as {
    maintenance_mode: number;
    pause_withdrawals: number;
    pause_deposits: number;
    referral_active: number;
  } | undefined;

  return {
    financials: {
      totalDeposits: Number(depRow.total.toFixed(2)),
      activeLockedCapital: Number(lockedRow.total.toFixed(2)),
      totalYieldPaid: Number(yieldRow.total.toFixed(2)),
      treasuryReserves: Number(treasuryRow.total.toFixed(2)),
    },
    operations: {
      activeUsers24h: Math.max(1, totalUsersCount),
      pendingDepositsCount: pendingCount,
      taskCompletionRatePct: taskRate,
      totalHashratePH: 186.4,
      facilityUptime: 99.98,
    },
    liveEvents: events,
    systemState: {
      maintenanceMode: Boolean(settings?.maintenance_mode),
      pauseWithdrawals: Boolean(settings?.pause_withdrawals),
      pauseDeposits: Boolean(settings?.pause_deposits),
      referralActive: Boolean(settings?.referral_active ?? 1),
    },
  };
}

// 2. Deposit Verification Queue
export function getDepositQueue(): { pending: AdminDepositRecord[]; history: AdminDepositRecord[] } {
  const rows = db.prepare(`
    SELECT 
      t.id, t.user_id as userId, u.username, u.email,
      t.tx_hash as txHash, t.amount, t.currency,
      COALESCE(t.network, 'TRC20') as network,
      t.receipt_image as receiptImage,
      t.status, t.admin_note as adminNote,
      t.created_at as createdAt
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    WHERE t.type = 'deposit'
    ORDER BY t.id DESC
  `).all() as AdminDepositRecord[];

  return {
    pending: rows.filter((r) => r.status === "pending" || r.status === "info_requested"),
    history: rows.filter((r) => r.status !== "pending" && r.status !== "info_requested").slice(0, 50),
  };
}

export function approveDeposit(txId: number, adminNote?: string): boolean {
  const tx = db.prepare("SELECT * FROM transactions WHERE id = ?").get(txId) as {
    id: number;
    user_id: number;
    amount: number;
    status: string;
  } | undefined;

  if (!tx || (tx.status !== "pending" && tx.status !== "info_requested")) return false;

  const updateUser = db.prepare("UPDATE users SET usdt_balance = usdt_balance + ? WHERE id = ?");
  const updateTx = db.prepare("UPDATE transactions SET status = 'completed', admin_note = ? WHERE id = ?");
  const addEvent = db.prepare(`
    INSERT INTO system_events (event_type, user_id, title, details, severity)
    VALUES ('deposit_approved', ?, 'Deposit Approved', ?, 'info')
  `);

  const runTx = db.transaction(() => {
    updateUser.run(tx.amount, tx.user_id);
    updateTx.run(adminNote || "Approved by Administrator Desk", txId);
    addEvent.run(tx.user_id, `Manual deposit of ${tx.amount} USDT approved and credited to wallet.`);
  });

  runTx();
  return true;
}

export function rejectDeposit(txId: number, reason: string): boolean {
  const tx = db.prepare("SELECT * FROM transactions WHERE id = ?").get(txId) as {
    id: number;
    user_id: number;
    amount: number;
    status: string;
  } | undefined;

  if (!tx || (tx.status !== "pending" && tx.status !== "info_requested")) return false;

  const updateTx = db.prepare("UPDATE transactions SET status = 'failed', admin_note = ? WHERE id = ?");
  const addEvent = db.prepare(`
    INSERT INTO system_events (event_type, user_id, title, details, severity)
    VALUES ('deposit_rejected', ?, 'Deposit Rejected', ?, 'warning')
  `);

  const runTx = db.transaction(() => {
    updateTx.run(reason, txId);
    addEvent.run(tx.user_id, `Deposit request for ${tx.amount} USDT rejected. Reason: ${reason}`);
  });

  runTx();
  return true;
}

export function requestInfoDeposit(txId: number, prompt: string): boolean {
  const tx = db.prepare("SELECT * FROM transactions WHERE id = ?").get(txId) as {
    id: number;
    user_id: number;
    amount: number;
    status: string;
  } | undefined;

  if (!tx) return false;

  const updateTx = db.prepare("UPDATE transactions SET status = 'info_requested', admin_note = ? WHERE id = ?");
  const addEvent = db.prepare(`
    INSERT INTO system_events (event_type, user_id, title, details, severity)
    VALUES ('deposit_info_requested', ?, 'Deposit Proof Required', ?, 'warning')
  `);

  const runTx = db.transaction(() => {
    updateTx.run(prompt, txId);
    addEvent.run(tx.user_id, `Treasury requested additional proof for deposit #${txId}: ${prompt}`);
  });

  runTx();
  return true;
}

export function bulkApproveDeposits(txIds: number[]): number {
  let count = 0;
  for (const id of txIds) {
    if (approveDeposit(id, "Bulk approved by Administrator")) {
      count++;
    }
  }
  return count;
}

// 3. Manual Adjustment Tool
export function manualWalletAdjustment(
  userId: number,
  type: "credit" | "debit" | "bonus",
  amount: number,
  reason: string
): boolean {
  const user = db.prepare("SELECT id, username, usdt_balance FROM users WHERE id = ?").get(userId) as {
    id: number;
    username: string;
    usdt_balance: number;
  } | undefined;

  if (!user || amount <= 0) return false;

  const runTx = db.transaction(() => {
    const txHash = `TX-ADJ-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    if (type === "credit" || type === "bonus") {
      db.prepare("UPDATE users SET usdt_balance = usdt_balance + ? WHERE id = ?").run(amount, userId);
      db.prepare(`
        INSERT INTO transactions (user_id, tx_hash, type, amount, currency, status, description, admin_note)
        VALUES (?, ?, ?, ?, 'USDT', 'completed', ?, ?)
      `).run(
        userId,
        txHash,
        type === "bonus" ? "referral_bonus" : "deposit",
        amount,
        type === "bonus" ? `Administrative Bonus: ${reason}` : `Manual Treasury Credit: ${reason}`,
        reason
      );
    } else {
      const newBal = Math.max(0, user.usdt_balance - amount);
      db.prepare("UPDATE users SET usdt_balance = ? WHERE id = ?").run(newBal, userId);
      db.prepare(`
        INSERT INTO transactions (user_id, tx_hash, type, amount, currency, status, description, admin_note)
        VALUES (?, ?, 'withdrawal', ?, 'USDT', 'completed', ?, ?)
      `).run(userId, txHash, amount, `Manual Treasury Debit: ${reason}`, reason);
    }

    db.prepare(`
      INSERT INTO system_events (event_type, user_id, title, details, severity)
      VALUES ('manual_adjustment', ?, 'Manual Balance Adjustment', ?, 'info')
    `).run(userId, `Admin applied ${type.toUpperCase()} of ${amount} USDT to User #${userId} (${user.username}). Note: ${reason}`);
  });

  runTx();
  return true;
}

// 4. Drops & Inventory Management
export function getDropsList(): AdminBatchRecord[] {
  const batches = db.prepare(`
    SELECT * FROM mining_batches 
    ORDER BY id DESC
  `).all() as Array<{
    id: number;
    batch_name: string;
    hardware_model: string;
    total_blocks: number;
    claimed_blocks: number;
    price_per_block: number;
    min_maturity_days: number;
    status: string;
    opens_at: string;
    closes_at: string;
  }>;

  return batches.map((b) => {
    const remaining = Math.max(0, b.total_blocks - b.claimed_blocks);
    const pct = b.total_blocks > 0 ? Number(((b.claimed_blocks / b.total_blocks) * 100).toFixed(1)) : 0;
    const rev = Number((b.claimed_blocks * b.price_per_block).toFixed(2));
    return {
      id: b.id,
      batchName: b.batch_name,
      hardwareModel: b.hardware_model,
      totalBlocks: b.total_blocks,
      claimedBlocks: b.claimed_blocks,
      remainingBlocks: remaining,
      pricePerBlock: b.price_per_block,
      minMaturityDays: b.min_maturity_days,
      status: b.status,
      opensAt: b.opens_at,
      closesAt: b.closes_at,
      percentClaimed: pct,
      revenueCollected: rev,
    };
  });
}

export function createNewDrop(drop: {
  batchName: string;
  hardwareModel: string;
  totalBlocks: number;
  pricePerBlock: number;
  minMaturityDays: number;
  opensAt: string;
  closesAt: string;
  status?: string;
}): boolean {
  db.prepare(`
    INSERT INTO mining_batches (batch_name, hardware_model, total_blocks, claimed_blocks, price_per_block, min_maturity_days, status, opens_at, closes_at)
    VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?)
  `).run(
    drop.batchName,
    drop.hardwareModel,
    drop.totalBlocks,
    drop.pricePerBlock,
    drop.minMaturityDays,
    drop.status || "active",
    drop.opensAt,
    drop.closesAt
  );

  db.prepare(`
    INSERT INTO system_events (event_type, title, details, severity)
    VALUES ('drop_created', 'New Drop Scheduled', ?, 'info')
  `).run(`${drop.batchName} created with ${drop.totalBlocks} blocks at ${drop.pricePerBlock} USDT.`);

  return true;
}

export function updateDropStatus(batchId: number, action: "pause" | "resume" | "halt"): boolean {
  const newStatus = action === "pause" ? "paused" : action === "halt" ? "halted" : "active";
  db.prepare("UPDATE mining_batches SET status = ? WHERE id = ?").run(newStatus, batchId);
  db.prepare(`
    INSERT INTO system_events (event_type, title, details, severity)
    VALUES ('drop_status_change', 'Drop Status Changed', ?, 'warning')
  `).run(`Batch #${batchId} status transitioned to ${newStatus}.`);
  return true;
}

export function addSupplyToDrop(batchId: number, additionalBlocks: number): boolean {
  if (additionalBlocks <= 0) return false;
  db.prepare("UPDATE mining_batches SET total_blocks = total_blocks + ? WHERE id = ?").run(additionalBlocks, batchId);
  db.prepare(`
    INSERT INTO system_events (event_type, title, details, severity)
    VALUES ('drop_supply_added', 'Supply Injected', ?, 'info')
  `).run(`Added ${additionalBlocks} blocks to Batch #${batchId}.`);
  return true;
}

// 5. User Management ("God View")
export function getUsersDirectory(search?: string, filter?: string): AdminUserRecord[] {
  let query = `
    SELECT 
      u.id, u.username, u.email, u.usdt_balance as usdtBalance,
      u.locked_balance as lockedBalance, u.kyc_status as kycStatus,
      u.account_status as accountStatus, u.referral_code as referralCode,
      u.referral_count as referralCount, u.created_at as createdAt,
      COALESCE((SELECT SUM(block_count) FROM mining_blocks mb WHERE mb.user_id = u.id AND mb.status = 'active'), 0) as totalBlocks,
      COALESCE((SELECT streak_count FROM daily_tasks dt WHERE dt.user_id = u.id ORDER BY id DESC LIMIT 1), 0) as streakCount
    FROM users u
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (search) {
    query += ` AND (u.id LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.referral_code LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  if (filter === "high_rollers") {
    query += ` AND (u.usdt_balance + u.locked_balance >= 2000)`;
  } else if (filter === "frozen") {
    query += ` AND u.account_status = 'frozen'`;
  } else if (filter === "kyc_pending") {
    query += ` AND u.kyc_status = 'pending'`;
  } else if (filter === "failed_kyc") {
    query += ` AND (u.kyc_status = 'rejected' OR u.kyc_status = 'failed')`;
  } else if (filter === "pending_deposits") {
    query += ` AND EXISTS (SELECT 1 FROM transactions t WHERE t.user_id = u.id AND t.type = 'deposit' AND (t.status = 'pending' OR t.status = 'info_requested'))`;
  } else if (filter === "inactive_7d") {
    query += ` AND u.id NOT IN (SELECT DISTINCT user_id FROM daily_tasks WHERE completed = 1 AND task_date >= date('now', '-7 days'))`;
  }

  query += ` ORDER BY u.id ASC`;

  return db.prepare(query).all(...params) as AdminUserRecord[];
}

export function getUserDeepDive(userId: number) {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as Record<string, unknown> | undefined;
  if (!user) return null;

  const blocks = db.prepare(`
    SELECT * FROM mining_blocks WHERE user_id = ? ORDER BY id DESC
  `).all(userId);

  const transactions = db.prepare(`
    SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 50
  `).all(userId);

  const tasks = db.prepare(`
    SELECT * FROM daily_tasks WHERE user_id = ? ORDER BY id DESC LIMIT 14
  `).all(userId);

  const referrals = db.prepare(`
    SELECT id, username, email, created_at FROM users WHERE referred_by = ?
  `).all(user.referral_code as string);

  return {
    user,
    blocks,
    transactions,
    tasks,
    referrals,
  };
}

export function updateUserAccountStatus(userId: number, action: "freeze" | "unfreeze"): boolean {
  const status = action === "freeze" ? "frozen" : "active";
  db.prepare("UPDATE users SET account_status = ? WHERE id = ?").run(status, userId);
  db.prepare(`
    INSERT INTO system_events (event_type, user_id, title, details, severity)
    VALUES ('account_status', ?, 'Account Status Modified', ?, 'warning')
  `).run(userId, `User #${userId} account set to ${status}.`);
  return true;
}

export function forceUnlockMaturity(userId: number, blockId: number, reason: string): boolean {
  const block = db.prepare("SELECT * FROM mining_blocks WHERE id = ? AND user_id = ?").get(blockId, userId) as {
    total_invested: number;
    status: string;
  } | undefined;

  if (!block || block.status !== "active") return false;

  const runTx = db.transaction(() => {
    db.prepare("UPDATE mining_blocks SET status = 'matured' WHERE id = ?").run(blockId);
    db.prepare("UPDATE users SET usdt_balance = usdt_balance + ?, locked_balance = MAX(0, locked_balance - ?) WHERE id = ?")
      .run(block.total_invested, block.total_invested, userId);
    db.prepare(`
      INSERT INTO system_events (event_type, user_id, title, details, severity)
      VALUES ('force_unlock', ?, 'Force Maturity Unlock', ?, 'warning')
    `).run(userId, `Admin forced unlock on Block #${blockId} (${block.total_invested} USDT). Reason: ${reason}`);
  });

  runTx();
  return true;
}

export function resetDailyTask(userId: number, action: "complete" | "reset"): boolean {
  const todayStr = new Date().toISOString().split("T")[0];
  if (action === "complete") {
    db.prepare(`
      INSERT INTO daily_tasks (user_id, task_date, task_type, streak_count, completed, completed_at)
      VALUES (?, ?, 'hashrate_ping', 1, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, task_date) DO UPDATE SET completed = 1, completed_at = CURRENT_TIMESTAMP
    `).run(userId, todayStr);
  } else {
    db.prepare(`
      UPDATE daily_tasks SET streak_count = 0, completed = 0, completed_at = NULL 
      WHERE user_id = ? AND task_date = ?
    `).run(userId, todayStr);
  }
  return true;
}

export function initiateKycReview(userId: number): boolean {
  db.prepare("UPDATE users SET kyc_status = 'pending' WHERE id = ?").run(userId);
  db.prepare(`
    INSERT INTO system_events (event_type, user_id, title, details, severity)
    VALUES ('kyc_review', ?, 'KYC Review Queued', ?, 'info')
  `).run(userId, `User #${userId} moved to KYC audit queue.`);
  return true;
}

export function sendUserMessage(userId: number, message: string): boolean {
  db.prepare(`
    INSERT INTO system_events (event_type, user_id, title, details, severity)
    VALUES ('user_notice', ?, 'Direct Notice', ?, 'info')
  `).run(userId, `Admin notice to User #${userId}: ${message}`);
  return true;
}

// 6. Task Engine & Gamification Settings
export function getTaskEngineData() {
  const settings = db.prepare(`
    SELECT streak_mult_1_3, streak_mult_4_7, streak_mult_8_plus, streak_penalty, catchup_cost, task_mode
    FROM system_settings WHERE id = 1
  `).get() as Record<string, unknown>;

  const questions = db.prepare(`
    SELECT * FROM daily_task_questions ORDER BY id DESC
  `).all();

  const totalTasks = (db.prepare("SELECT COUNT(*) as count FROM daily_tasks").get() as { count: number }).count;
  const completedTasks = (db.prepare("SELECT COUNT(*) as count FROM daily_tasks WHERE completed = 1").get() as { count: number }).count;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 94;
  const dropOffRate = 100 - completionRate;

  return {
    settings,
    questions,
    analytics: {
      completionRate,
      averageSolveSeconds: 38,
      dropOffRate,
      totalPings: completedTasks,
    },
  };
}

export function deleteDailyTaskQuestion(questionId: number): boolean {
  db.prepare("DELETE FROM daily_task_questions WHERE id = ?").run(questionId);
  return true;
}

export function addFaq(question: string, answer: string, category: string = "general", sortOrder: number = 0): boolean {
  db.prepare("INSERT INTO faqs (question, answer, category, sort_order) VALUES (?, ?, ?, ?)").run(question, answer, category, sortOrder);
  return true;
}

export function deleteFaq(faqId: number): boolean {
  db.prepare("DELETE FROM faqs WHERE id = ?").run(faqId);
  return true;
}

export function updateTaskSettings(updates: {
  taskMode?: string;
  streakMult1_3?: number;
  streakMult4_7?: number;
  streakMult8Plus?: number;
  streakPenalty?: string;
  catchupCost?: number;
}) {
  db.prepare(`
    UPDATE system_settings SET
      task_mode = COALESCE(?, task_mode),
      streak_mult_1_3 = COALESCE(?, streak_mult_1_3),
      streak_mult_4_7 = COALESCE(?, streak_mult_4_7),
      streak_mult_8_plus = COALESCE(?, streak_mult_8_plus),
      streak_penalty = COALESCE(?, streak_penalty),
      catchup_cost = COALESCE(?, catchup_cost)
    WHERE id = 1
  `).run(
    updates.taskMode,
    updates.streakMult1_3,
    updates.streakMult4_7,
    updates.streakMult8Plus,
    updates.streakPenalty,
    updates.catchupCost
  );
  return true;
}

export function addDailyTaskQuestion(q: {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string;
}) {
  db.prepare(`
    INSERT INTO daily_task_questions (question_text, option_a, option_b, option_c, option_d, correct_option, explanation, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).run(q.questionText, q.optionA, q.optionB, q.optionC, q.optionD, q.correctOption, q.explanation);
  return true;
}

// 7. System Settings & CMS
export function getSystemSettingsData() {
  const settings = db.prepare("SELECT * FROM system_settings WHERE id = 1").get();
  const faqs = db.prepare("SELECT * FROM faqs ORDER BY sort_order ASC, id ASC").all();
  const announcements = db.prepare("SELECT * FROM announcements ORDER BY id DESC LIMIT 20").all();
  return { settings, faqs, announcements };
}

export function updateSystemSettings(updates: Record<string, unknown>) {
  const fields = Object.keys(updates);
  if (fields.length === 0) return true;

  const setClause = fields.map((f) => `${f} = ?`).join(", ");
  const values = Object.values(updates);
  db.prepare(`UPDATE system_settings SET ${setClause} WHERE id = 1`).run(...values);

  db.prepare(`
    INSERT INTO system_events (event_type, title, details, severity)
    VALUES ('settings_updated', 'System Settings Updated', ?, 'warning')
  `).run(`Updated system parameters: ${fields.join(", ")}`);

  return true;
}

export function broadcastAnnouncement(title: string, content: string, urgency: string, category: string) {
  db.prepare(`
    INSERT INTO announcements (title, content, category, urgency)
    VALUES (?, ?, ?, ?)
  `).run(title, content, category, urgency);

  db.prepare(`
    INSERT INTO system_events (event_type, title, details, severity)
    VALUES ('broadcast_alert', ?, ?, ?)
  `).run(`Broadcast: ${title}`, content, urgency === "critical" ? "warning" : "info");

  return true;
}
