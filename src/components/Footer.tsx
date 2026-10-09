import { Mail, MapPin, Clock } from "lucide-react";
import Logo from "./Logo";

const COLS = [
  {
    title: "Platform",
    links: [
      ["Active Miners", "#miners"],
      ["Next Drop", "#next-drop"],
      ["ROI Calculator", "#calculator"],
      ["How It Works", "#platform"],
    ],
  },
  {
    title: "Company",
    links: [
      ["Security", "#security"],
      ["Proof of Reserves", "#security"],
      ["FAQ", "#faq"],
      ["Contact", "mailto:support@fletchermines.com"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Terms of Service", "/terms"],
      ["Privacy Policy", "/privacy"],
      ["Risk Disclosure", "/risk"],
      ["AML Policy", "/aml"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__about">
            <Logo />
            <p>
              Fletcher Mines operates physical cryptocurrency mining infrastructure and offers
              fixed-term mining blocks backed by deployed hardware capacity.
            </p>
            <div className="footer__contact">
              <a href="mailto:support@fletchermines.com">
                <Mail /> support@fletchermines.com
              </a>
              <span>
                <MapPin /> Facility operations & treasury desk
              </span>
              <span>
                <Clock /> Treasury desk: 08:00 – 22:00 UTC, daily
              </span>
            </div>
          </div>

          {COLS.map((col) => (
            <div className="footer__col" key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer__risk">
          <strong>Risk Disclosure.</strong> Purchasing mining blocks involves risk. Yields are fixed at
          the rate in effect when a block is purchased and are subject to the Terms of Service.
          Principal is locked for the selected maturity term. Digital asset values may fluctuate. Please
          read the full Risk Disclosure before purchasing.
        </div>

        <div className="footer__bottom">
          <span>&copy; 2026 Fletcher Mines. All rights reserved.</span>
          <div className="footer__bottom-links">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/risk">Risk Disclosure</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
