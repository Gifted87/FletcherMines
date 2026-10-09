"use client";

import { useEffect, useState } from "react";
import { Gift, X, ArrowRight, Sparkles, Users } from "lucide-react";

export default function BonusNotification() {
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    // Show popup after 1.5s delay
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (closed) return null;

  return (
    <aside
      className={`bonus-popup ${visible ? "is-visible" : ""}`}
      role="dialog"
      aria-labelledby="bonus-title"
      aria-describedby="bonus-desc"
    >
      <button
        type="button"
        className="bonus-popup__close"
        aria-label="Close notification"
        onClick={() => {
          setVisible(false);
          setTimeout(() => setClosed(true), 350);
        }}
      >
        <X size={16} />
      </button>

      <div className="bonus-popup__glow" aria-hidden="true" />

      <div className="bonus-popup__header">
        <div className="bonus-popup__icon-wrap">
          <Gift size={20} className="bonus-popup__icon" />
          <span className="bonus-popup__pulse" aria-hidden="true" />
        </div>
        <div>
          <span className="bonus-popup__tag">
            <Sparkles size={11} /> Limited Welcome Incentive
          </span>
          <h4 id="bonus-title" className="bonus-popup__title">
            Get 50 USDT on Sign-Up
          </h4>
        </div>
      </div>

      <p id="bonus-desc" className="bonus-popup__body">
        Register your miner account and receive an instant <strong>50 USDT</strong> welcome bonus, plus an additional <strong>50 USDT</strong> for each referral who joins.
      </p>

      <div className="bonus-popup__perks">
        <div className="bonus-popup__perk">
          <span className="num">+50 USDT</span>
          <span>Sign-Up Bonus</span>
        </div>
        <div className="bonus-popup__perk">
          <Users size={13} className="perk-icon" />
          <span className="num">+50 USDT</span>
          <span>Per Referral</span>
        </div>
      </div>

      <div className="bonus-popup__actions">
        <a
          href="/signup?bonus=50usdt"
          id="bonus-claim-cta"
          className="btn btn--primary btn--sm bonus-popup__btn"
        >
          Claim 50 USDT Now <ArrowRight size={14} />
        </a>
      </div>
    </aside>
  );
}
