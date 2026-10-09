"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, Timer } from "lucide-react";
import { IMAGES } from "@/lib/images";

export interface BatchData {
  code: string;
  name: string;
  vaultLabel: string;
  totalBlocks: number;
  claimedBlocks: number;
  blockPriceUsdt: number;
  minTermDays: number;
  closesInMs: number;
  closesAt?: string;
}

const DEFAULT_BATCH: BatchData = {
  code: "05",
  name: "Batch 05",
  vaultLabel: "Antminer S21 Pro (234 TH/s) — Institutional Allocation",
  totalBlocks: 1000,
  claimedBlocks: 887,
  blockPriceUsdt: 100,
  minTermDays: 14,
  closesInMs: 5025000,
};

const pad = (n: number) => String(n).padStart(2, "0");

export default function NextDrop({ batch = DEFAULT_BATCH }: { batch?: BatchData }) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const claimed = batch.claimedBlocks;

  // countdown (time read only on the client to keep prerender stable)
  useEffect(() => {
    const deadline = Date.now() + batch.closesInMs;
    const tick = () => setRemainingMs(Math.max(0, deadline - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [batch.closesInMs]);

  const total = batch.totalBlocks;
  const pct = (claimed / total) * 100;
  const remaining = total - claimed;

  const s = remainingMs === null ? null : Math.floor(remainingMs / 1000);
  const cells: [string, string][] = [
    [s === null ? "--" : pad(Math.floor(s / 86400)), "Days"],
    [s === null ? "--" : pad(Math.floor((s % 86400) / 3600)), "Hours"],
    [s === null ? "--" : pad(Math.floor((s % 3600) / 60)), "Minutes"],
    [s === null ? "--" : pad(s % 60), "Seconds"],
  ];

  return (
    <section className="section section--tight" id="next-drop">
      <div className="container">
        <div className="drop">
          <div className="drop__bg">
            <Image src={IMAGES.dropHardware} alt="" fill sizes="100vw" />
          </div>
          <div className="drop__inner">
            <div>
              <span className="drop__tag">
                <Timer /> Allocation Closing
              </span>
              <h2>{batch.name} Allocation</h2>
              <div className="drop__vault">{batch.vaultLabel}</div>
              <p className="drop__copy">
                Due to hardware limitations, we only open a limited number of blocks per batch. Once
                the cap is reached, the vault closes until the next cycle.
              </p>
              <div className="drop__specs">
                <div className="drop__spec">
                  <span>Block Price</span>
                  <strong>${batch.blockPriceUsdt} USDT</strong>
                </div>
                <div className="drop__spec">
                  <span>Blocks Remaining</span>
                  <strong>{remaining}</strong>
                </div>
                <div className="drop__spec">
                  <span>Min. Term</span>
                  <strong>{batch.minTermDays} Days</strong>
                </div>
              </div>
            </div>

            <div>
              <div className="countdown" role="timer" aria-label="Time until batch closes">
                {cells.map(([v, unit]) => (
                  <div className="countdown__cell" key={unit}>
                    <div className="countdown__num">{v}</div>
                    <div className="countdown__unit">{unit}</div>
                  </div>
                ))}
              </div>

              <div className="alloc">
                <div className="alloc__head">
                  <span>Allocation Claimed</span>
                  <span className="num">
                    {claimed.toLocaleString("en-US")} / {total.toLocaleString("en-US")} blocks
                  </span>
                </div>
                <div className="alloc__bar">
                  <div className="alloc__fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="alloc__foot">
                  <span>{pct.toFixed(1)}% claimed</span>
                  <span className="warn">{(100 - pct).toFixed(1)}% remaining</span>
                </div>
              </div>

              <div className="drop__cta">
                <a href="/signup" id="drop-reserve" className="btn btn--primary btn--lg btn--block">
                  Reserve Your Allocation <ArrowRight />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
