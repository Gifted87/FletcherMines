"use client";

import { useState } from "react";
import { ArrowRight, Award } from "lucide-react";
import { YIELD_TIERS, calculateYield } from "@/lib/yieldRules";

const MIN = 100;
const MAX = 100_000;
const STEP = 100;
const QUICK = [500, 2_500, 10_000, 50_000];

const fmt = (n: number | undefined | null, d = 2) =>
  (n ?? 0).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export default function RoiCalculator() {
  const [amount, setAmount] = useState(5_000);
  const [tierIdx, setTierIdx] = useState(3); // 90 days

  const tier = YIELD_TIERS[tierIdx];
  const calc = calculateYield(amount, tier.term);
  const daily = calc.dailyUsd;
  const totalYield = calc.totalYield;
  const payout = calc.totalPayout;
  const roi = calc.roi;

  const amountFill = ((amount - MIN) / (MAX - MIN)) * 100;
  const termFill = (tierIdx / (YIELD_TIERS.length - 1)) * 100;

  return (
    <div className="card calc">
      <div className="calc__inputs">
        <div className="field">
          <div className="field__head">
            <label className="field__label" htmlFor="calc-amount">
              Investment Amount
            </label>
            <span className="field__value">
              ${fmt(amount, 0)}
              <small>USDT</small>
            </span>
          </div>
          <input
            id="calc-amount"
            className="range"
            type="range"
            min={MIN}
            max={MAX}
            step={STEP}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{ ["--fill" as string]: `${amountFill}%` }}
          />
          <div className="range__ticks">
            <span>$100</span>
            <span>$100,000</span>
          </div>
          <div className="quick-amounts">
            {QUICK.map((q) => (
              <button
                key={q}
                id={`calc-quick-${q}`}
                type="button"
                className={`chip ${amount === q ? "is-active" : ""}`}
                onClick={() => setAmount(q)}
              >
                ${q.toLocaleString("en-US")}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <div className="field__head">
            <label className="field__label" htmlFor="calc-term">
              Maturity Term
            </label>
            <span className="field__value">
              {tier.term}
              <small>Days</small>
            </span>
          </div>
          <input
            id="calc-term"
            className="range"
            type="range"
            min={0}
            max={YIELD_TIERS.length - 1}
            step={1}
            value={tierIdx}
            onChange={(e) => setTierIdx(Number(e.target.value))}
            style={{ ["--fill" as string]: `${termFill}%` }}
          />
          <div className="range__ticks">
            {YIELD_TIERS.map((t, i) => (
              <button
                key={t.term}
                type="button"
                className={i === tierIdx ? "is-active" : ""}
                onClick={() => setTierIdx(i)}
              >
                {t.term}D
              </button>
            ))}
          </div>
        </div>

        <div className="tier-info">
          <Award />
          <p>
            <strong>{tier.label} Tier ({tier.term} Days)</strong> — Fixed yield of{" "}
            <strong>{tier.dailyRate}% / day</strong> for {tier.term} days ({tier.dailyRate * tier.term}% total return).
          </p>
        </div>
      </div>

      <div className="calc__outputs">
        <div className="out-daily-strip">
          <span className="out-daily-strip__label">Daily Earning</span>
          <span className="out-daily-strip__value">${fmt(daily)} / day</span>
        </div>
        <div className="out-main__label">Total Projected Earnings ({tier.term} Days)</div>
        <div className="out-main__value">
          ${fmt(totalYield)}
          <small>USDT</small>
        </div>

        <div className="out-rows">
          <div className="out-row">
            <span>Daily Return Rate</span>
            <span className="num">{tier.dailyRate}% / day</span>
          </div>
          <div className="out-row">
            <span>Daily Earning</span>
            <span className="num">${fmt(daily)} / day</span>
          </div>
          <div className="out-row">
            <span>Total Earnings ({tier.term} Days)</span>
            <span className="num">${fmt(totalYield)}</span>
          </div>
          <div className="out-row">
            <span>Total Return</span>
            <span className="num">+{fmt(roi, 1)}%</span>
          </div>
          <div className="out-row out-row--total">
            <span>Total Payout (Capital + Return)</span>
            <span className="num">${fmt(payout)}</span>
          </div>
        </div>

        <a
          id="calc-lock-in"
          href={`/signup?amount=${amount}&term=${tier.term}`}
          className="btn btn--primary btn--lg btn--block"
        >
          Lock In This Rate <ArrowRight />
        </a>
        <p className="calc__disclaimer">
          Fixed daily yields: 10% (14d), 12% (30d), 15% (60d), 18% (90d), and 20% (180d). Settled daily at 00:00 UTC.
        </p>
      </div>
    </div>
  );
}
