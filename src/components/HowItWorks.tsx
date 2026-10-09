import Image from "next/image";
import { Wallet, Layers, Activity, ShieldCheck, Clock, Zap } from "lucide-react";
import Reveal from "./Reveal";
import { IMAGES } from "@/lib/images";

const STEPS = [
  {
    icon: Wallet,
    title: "Fund Your Wallet",
    body: "Deposit USDT into your secure internal wallet. Every deposit is currently verified manually by our treasury team for compliance.",
    note: "TRC-20 · ERC-20",
    noteIcon: ShieldCheck,
  },
  {
    icon: Layers,
    title: "Select Your Term",
    body: "Choose your block allocation and lock-up maturity (14 to 180 days). Earn fixed daily yields from 10% to 20% per day based on your selected maturity.",
    note: "10% – 20% daily yield",
    noteIcon: Clock,
  },
  {
    icon: Activity,
    title: "Engage & Earn",
    body: "Complete the daily network task to keep your hash-rate active and receive fixed daily yields at every 00:00 UTC settlement.",
    note: "Daily settlement",
    noteIcon: Zap,
  },
];

export default function HowItWorks() {
  return (
    <section className="section" id="platform">
      <div className="container">
        <Reveal className="section-head">
          <div className="eyebrow">How It Works</div>
          <h2 className="section-title">Three steps from deposit to daily yield.</h2>
          <p className="section-sub">
            A structured process built around physical capacity, verified capital and fixed terms. No
            guesswork, no variable payouts.
          </p>
        </Reveal>

        <div className="steps">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 120} className="card step">
              <div className="step__top">
                <span className="step__icon">
                  <s.icon />
                </span>
                <span className="step__num">STEP 0{i + 1}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <span className="step__note">
                <s.noteIcon /> {s.note}
              </span>
            </Reveal>
          ))}
        </div>

        <Reveal className="facility-strip" delay={150}>
          <div className="facility-photo">
            <Image src={IMAGES.facilityHall} alt="Server hall at the mining facility" fill sizes="(max-width: 900px) 100vw, 60vw" />
            <div className="facility-photo__caption">
              <div>
                <strong>Hall A — Primary Compute Floor</strong>
                <span>6,240 ASIC units deployed</span>
              </div>
              <span>LIVE</span>
            </div>
          </div>
          <div className="facility-photo">
            <Image src={IMAGES.facilityCabling} alt="Network cabling infrastructure" fill sizes="(max-width: 560px) 100vw, 25vw" />
            <div className="facility-photo__caption">
              <div>
                <strong>Network Core</strong>
                <span>Redundant uplinks</span>
              </div>
            </div>
          </div>
          <div className="facility-photo">
            <Image src={IMAGES.facilityPower} alt="High-voltage power infrastructure" fill sizes="(max-width: 560px) 100vw, 25vw" />
            <div className="facility-photo__caption">
              <div>
                <strong>Power Supply</strong>
                <span>18.6 MW contracted</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
