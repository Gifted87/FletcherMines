import Image from "next/image";
import { ArrowRight, Calculator, CircleDollarSign, FileCheck, ShieldCheck } from "lucide-react";
import HashrateTerminal from "./HashrateTerminal";
import { getCurrentBatchFromDb } from "@/lib/networkData";
import { IMAGES } from "@/lib/images";

export default function Hero() {
  const currentBatch = getCurrentBatchFromDb();
  const claimed = ((currentBatch.claimedBlocks / currentBatch.totalBlocks) * 100).toFixed(1);

  return (
    <section className="hero" id="top">
      <div className="hero__bg">
        <Image src={IMAGES.heroDatacenter} alt="" fill priority sizes="100vw" />
      </div>
      <div className="hero__grid-pattern" aria-hidden="true" />

      <div className="container hero__inner">
        <div>
          <div className="hero__status">
            <span className="pulse-dot" />
            <span>
              {currentBatch.name} allocation live <strong>· {claimed}% claimed</strong>
            </span>
          </div>

          <h1>
            Institutional-Grade Mining Yields.
            <span className="accent">Locked. Predictable. Secure.</span>
          </h1>

          <p className="hero__sub">
            Purchase mining blocks, select your maturity term (14 to 180 days), with fixed daily yields
            from 10% to 20% per day. Limited allocation per batch.
          </p>

          <div className="hero__ctas">
            <a href="#next-drop" id="hero-view-drop" className="btn btn--primary btn--lg">
              View Next Drop <ArrowRight />
            </a>
            <a href="#calculator" id="hero-calculate" className="btn btn--ghost btn--lg">
              <Calculator /> Calculate Your Yield
            </a>
          </div>

          <div className="trust-badges">
            <span className="trust-badge">
              <CircleDollarSign /> USDT Supported
            </span>
            <span className="trust-badge">
              <ShieldCheck /> Manual Treasury Verification
            </span>
            <span className="trust-badge">
              <FileCheck /> Proof of Reserves
            </span>
          </div>
        </div>

        <HashrateTerminal />
      </div>
    </section>
  );
}
