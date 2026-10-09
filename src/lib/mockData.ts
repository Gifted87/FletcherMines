/**
 * DEPRECATED & REPLACED BY DIRECT SQLITE DATABASE ENGINE
 * -----------------------------------------------------------------------------
 * All mock data has been completely eliminated from the Fletcher Mines platform.
 * Every single number, balance, contract, ledger row, and batch is queried from
 * and committed to the SQLite database (data/fletcher_mines.db via better-sqlite3).
 *
 * 1. Database Connection & Schema: src/lib/db.ts
 * 2. Authenticated Dashboard Data: src/lib/dashboardData.ts
 * 3. Network Ledger & Telemetry:  src/lib/networkData.ts
 * 4. Yield Schedule & Formulas:   src/lib/yieldRules.ts
 * 5. Platform Knowledgebase:       src/lib/faqs.ts
 *
 * Zero mock placeholders remain. All mutations execute atomic SQL transactions.
 * -----------------------------------------------------------------------------
 */

export * from "./yieldRules";
export * from "./faqs";
export * from "./networkData";
