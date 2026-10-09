import Image from "next/image";
import { Lock, ShieldCheck, Server, Vault, FileCheck, CircleCheck, MapPin } from "lucide-react";
import Reveal from "./Reveal";
import { IMAGES } from "@/lib/images";

const POINTS = [
  {
    icon: Lock,
    title: "Maturity Lock-Up",
    body: "Fixed terms let us provision hardware precisely against committed capital — the reason yields can stay fixed and liquidity stays stable for every participant.",
  },
  {
    icon: ShieldCheck,
    title: "Manual Treasury Verification",
    body: "Every deposit is checked on-chain by our treasury team before it is credited, preventing spoofed transactions and fraud during the platform's early phase.",
  },
  {
    icon: Server,
    title: "Physical Mining Backing",
    body: "Each block corresponds to real deployed capacity at our facility. Batches are capped by hardware — we never sell more hash-rate than we run.",
  },
  {
    icon: Vault,
    title: "Segregated Cold Treasury",
    body: "Client principal is held in segregated cold storage, separate from operating funds, with multi-party approval required for every outbound transfer.",
  },
];

const RESERVES = [62, 68, 71, 78, 84, 91, 100];
const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

export default function Security() {
  return (
    <section className="section" id="security">
      <div className="container security">
        <Reveal>
          <div className="eyebrow">Security &amp; Transparency</div>
          <h2 className="section-title">Why your funds are safe.</h2>
          <p className="section-sub">
            Every control on this platform exists to protect committed capital and keep fixed yields
            sustainable for the full term.
          </p>
          <div className="sec-list">
            {POINTS.map((p) => (
              <div className="sec-item" key={p.title}>
                <span className="sec-item__icon">
                  <p.icon />
                </span>
                <div>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="audit" delay={150}>
          <div className="audit__photo">
            <Image src={IMAGES.auditServers} alt="Server racks at the mining facility" fill sizes="(max-width: 960px) 100vw, 50vw" />
            <span className="audit__photo-tag">
              <MapPin /> Facility inspection · Hall B · Oct 2026
            </span>
          </div>
          <div className="card audit__panel">
            <div className="audit__head">
              <span className="audit__title">
                <FileCheck /> Treasury Audit
              </span>
              <span className="badge">
                <span className="pulse-dot" /> Verified
              </span>
            </div>

            <div className="audit__kpis">
              <div className="audit__kpi">
                <span>Reserve Ratio</span>
                <strong className="ok">1.24x</strong>
              </div>
              <div className="audit__kpi">
                <span>Cold Storage</span>
                <strong>92.6%</strong>
              </div>
              <div className="audit__kpi">
                <span>Last Audit</span>
                <strong>01 Oct</strong>
              </div>
            </div>

            <div className="bars">
              <div className="bars__head">
                <span>Reserves (USDT, indexed)</span>
                <span>+61% 6M</span>
              </div>
              <div className="bars__row">
                {RESERVES.map((v, i) => (
                  <div className="bars__col" key={MONTHS[i]}>
                    <div
                      className="bars__bar"
                      style={{ height: `${v}%`, transitionDelay: `${300 + i * 80}ms` }}
                    />
                    <span>{MONTHS[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="audit__log">
              {[
                ["Proof of reserves published", "01 Oct 2026"],
                ["Facility power audit completed", "24 Sep 2026"],
                ["Hardware inventory reconciled", "15 Sep 2026"],
              ].map(([label, date]) => (
                <div className="audit__log-row" key={label}>
                  <span className="left">
                    <CircleCheck /> {label}
                  </span>
                  <span className="num">{date}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
