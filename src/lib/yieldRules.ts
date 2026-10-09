/**
 * FLETCHER MINES INSTITUTIONAL PROTOCOL
 * Yield Calculation Rules & Tier Specifications
 * Fully deterministic smart contract yield rate schedule.
 */

export type Term = 14 | 30 | 60 | 90 | 180;

export interface YieldTier {
  term: Term;
  dailyRate: number; // fixed daily percentage
  label: string;
}

export const RATE_MAP: Record<Term, number> = {
  14: 10,
  30: 12,
  60: 15,
  90: 18,
  180: 20,
};

export const YIELD_TIERS: YieldTier[] = [
  { term: 14, dailyRate: 10, label: "Liquidity" },
  { term: 30, dailyRate: 12, label: "Standard" },
  { term: 60, dailyRate: 15, label: "Extended" },
  { term: 90, dailyRate: 18, label: "Quarterly" },
  { term: 180, dailyRate: 20, label: "Institutional" },
];

export const TERMS: Term[] = YIELD_TIERS.map((t) => t.term);

export function rateForTerm(term: Term): number {
  return RATE_MAP[term] ?? 10;
}

export function calculateYield(amount: number, term: Term) {
  const dailyRate = RATE_MAP[term] ?? 10;
  const dailyUsd = Number(((amount * dailyRate) / 100).toFixed(2));
  const totalYield = Number((dailyUsd * term).toFixed(2));
  const totalPayout = Number((amount + totalYield).toFixed(2));
  const roi = Number(((totalYield / amount) * 100).toFixed(1));

  return {
    dailyRate,
    dailyUsd,
    totalYield,
    totalPayout,
    roi,
  };
}
