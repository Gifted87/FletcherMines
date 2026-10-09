/**
 * Platform Knowledge Base & Frequently Asked Questions
 */

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQS: FaqItem[] = [
  {
    q: "Why is there a minimum 2-week maturity period?",
    a: "Mining hardware is provisioned against committed capital. The 14-day minimum maturity ensures network stability, lets us schedule hardware allocation precisely, and is what allows yields to remain fixed for the full term.",
  },
  {
    q: "How do I fund my account?",
    a: "Deposits are made in USDT (TRC-20 or ERC-20) to the treasury address shown in your dashboard, along with your transaction hash. Each deposit is verified manually by our treasury team for security. Automated on-chain verification is in development.",
  },
  {
    q: "What are the Daily Mining Tasks?",
    a: "A short daily network synchronisation — reviewing your block telemetry and confirming your node is active. It takes under a minute and keeps your allocated hash-rate active for that day's yield settlement.",
  },
  {
    q: "How is the daily return rate calculated?",
    a: "Your daily return rate is tiered by maturity term: 10% daily for 14 days, 12% daily for 30 days, 15% daily for 60 days, 18% daily for 90 days, and 20% daily for 180 days.",
  },
  {
    q: "Are my returns really fixed?",
    a: "Yes. Your daily rate (from 10% to 20% daily depending on maturity) is locked upon block allocation and credited every day throughout the maturity term.",
  },
  {
    q: "When can I withdraw?",
    a: "Daily yields settle at 00:00 UTC and can be withdrawn once they reach the minimum withdrawal amount. Principal is released to your wallet balance automatically when the block reaches maturity.",
  },
  {
    q: "Why are blocks sold in limited batches?",
    a: "Every block is backed by physical capacity at our facility. We only open as many blocks as our deployed hardware can support. When a batch sells out, the vault closes until new hardware comes online.",
  },
];
