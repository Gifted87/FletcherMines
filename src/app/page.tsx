import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import MinersLedger from "@/components/MinersLedger";
import HowItWorks from "@/components/HowItWorks";
import RoiCalculator from "@/components/RoiCalculator";
import NextDrop from "@/components/NextDrop";
import Security from "@/components/Security";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import BonusNotification from "@/components/BonusNotification";
import { getNetworkMiners, getNetworkStats, getCurrentBatchFromDb } from "@/lib/networkData";

export default function Home() {
  const initialMiners = getNetworkMiners(100);
  const initialStats = getNetworkStats();
  const currentBatch = getCurrentBatchFromDb();

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Ticker />

        <section className="section" id="miners">
          <div className="container">
            <Reveal className="section-head">
              <div className="eyebrow">Active Mining Consortium</div>
              <h2 className="section-title">Live Network Participants</h2>
              <p className="section-sub">
                Real-time registry of how much participants are earning daily and how much capital is locked into current mining batches. Daily yields fixed from 10% to 20% based on maturity term.
              </p>
            </Reveal>
            <MinersLedger initialMiners={initialMiners} initialStats={initialStats} />
          </div>
        </section>

        <section className="section" id="calculator">
          <div className="container">
            <Reveal className="section-head section-head--center">
              <div className="eyebrow">ROI Calculator</div>
              <h2 className="section-title">Test-drive your fixed yield.</h2>
              <p className="section-sub">
                Fixed daily yields: 10% (14d), 12% (30d), 15% (60d), 18% (90d), and 20% (180d).
              </p>
            </Reveal>
            <Reveal delay={100}>
              <RoiCalculator />
            </Reveal>
          </div>
        </section>

        <HowItWorks />

        <NextDrop batch={currentBatch} />
        <Security />

        <section className="section" id="faq">
          <div className="container">
            <Reveal className="section-head section-head--center">
              <div className="eyebrow">FAQ</div>
              <h2 className="section-title">Frequently asked questions</h2>
            </Reveal>
            <Faq />
          </div>
        </section>

        <section className="section section--tight">
          <div className="container">
            <Reveal className="cta-band">
              <h2>Secure your allocation before the vault closes.</h2>
              <p>Create your account, fund your wallet and lock in a fixed daily rate in minutes.</p>
              <div className="hero__ctas">
                <a href="/signup" id="cta-create-account" className="btn btn--primary btn--lg">
                  Create Account <ArrowRight />
                </a>
                <a href="#next-drop" id="cta-view-drop" className="btn btn--ghost btn--lg">
                  View Next Drop
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
      <BonusNotification />
    </>
  );
}
