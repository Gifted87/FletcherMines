export type DashboardTab =
  | "dashboard"
  | "buy-blocks"
  | "portfolio"
  | "wallet"
  | "daily-tasks"
  | "referrals"
  | "settings";

export interface DbUserRecord {
  id: number;
  email: string;
  username: string;
  referral_code: string;
  referred_by: string | null;
  usdt_balance: number;
  locked_balance: number;
  bonus_claimed: number;
  referral_count: number;
  referral_earnings: number;
  email_verified: number;
  two_factor_enabled: number;
  kyc_status: string;
  account_status: string;
  created_at: string;
}

export interface DbMiningBlockRecord {
  id: number;
  user_id: number;
  batch_name: string;
  block_count: number;
  total_invested: number;
  maturity_days: number;
  daily_rate_pct: number;
  daily_yield_usdt: number;
  accumulated_earnings: number;
  withdrawable_earnings: number;
  start_date: string;
  maturity_date: string;
  status: string;
}

export interface DbTransactionRecord {
  id: number;
  user_id: number;
  tx_hash: string;
  type: "deposit" | "block_purchase" | "daily_yield" | "referral_bonus" | "withdrawal";
  amount: number;
  currency: string;
  status: "completed" | "pending" | "failed" | "info_requested" | "rejected";
  description: string;
  created_at: string;
}

export interface DbDailyTaskRecord {
  id: number;
  user_id: number;
  task_date: string;
  task_type: string;
  streak_count: number;
  completed: number;
  reward_claimed: number;
  completed_at: string | null;
}

export interface DbBatchRecord {
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
}

export interface DbAnnouncementRecord {
  id: number;
  title: string;
  content: string;
  category: "drop" | "maintenance" | "treasury" | "security";
  urgency: "normal" | "high" | "critical";
  created_at: string;
}

export interface UserDashboardData {
  user: {
    id: number;
    email: string;
    username: string;
    referralCode: string;
    usdtBalance: number;
    lockedBalance: number;
    referralCount: number;
    referralEarnings: number;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    kycStatus: string;
    accountStatus: string;
  };
  metrics: {
    totalPortfolioValue: number;
    availableBalance: number;
    lockedBalance: number;
    totalEarnedSoFar: number;
    accumulatedMiningYield: number;
    referralEarningsTotal: number;
    bonusCredits: number;
    nextDayPayout: number;
    nextSettlementUtc: string;
    blocksOwned: number;
    projectedDailyReturn: number;
    totalInvested: number;
    activeContractsCount: number;
    nearestUnlockDays: number;
    nearestUnlockDate: string;
    nearestBatchName: string;
    maturityProgressPct: number;
  };
  earnings: {
    today: number;
    thisWeek: number;
    allTime: number;
    withdrawable: number;
    locked: number;
    chartSeries7D: Array<{ day: string; value: number }>;
    chartSeries30D: Array<{ day: string; value: number }>;
    chartSeriesAll: Array<{ day: string; value: number }>;
  };
  dailyTask: {
    completedToday: boolean;
    streakDays: number;
    taskDate: string;
    rewardDescription: string;
  };
  batchDrop: {
    batchName: string;
    hardwareModel: string;
    totalBlocks: number;
    claimedBlocks: number;
    remainingBlocks: number;
    pricePerBlock: number;
    minTermDays: number;
    percentClaimed: number;
    closesAt: string;
    closesInMs: number;
    status: string;
  };
  recentTransactions: Array<{
    id: string;
    txHash: string;
    type: "deposit" | "block_purchase" | "daily_yield" | "referral_bonus" | "withdrawal";
    amount: number;
    currency: string;
    status: "completed" | "pending" | "failed" | "info_requested" | "rejected";
    description: string;
    date: string;
  }>;
  activeBlocks: Array<{
    id: number;
    batchName: string;
    blockCount: number;
    totalInvested: number;
    maturityDays: number;
    dailyRatePct: number;
    dailyYieldUsdt: number;
    accumulatedEarnings: number;
    withdrawableEarnings: number;
    startDate: string;
    maturityDate: string;
    status: string;
    daysRemaining: number;
    progressPct: number;
  }>;
  announcements: Array<{
    id: number;
    title: string;
    content: string;
    category: string;
    urgency: string;
    date: string;
  }>;
}
