import { Lock, BarChart3, Radio } from "lucide-react";
import { buildDatabaseTickerItems } from "@/lib/networkData";

export default function Ticker() {
  const items = buildDatabaseTickerItems();
  // duplicated for a seamless infinite loop
  const loop = [...items, ...items];

  return (
    <div className="ticker" role="marquee" aria-label="Live network activity">
      <div className="ticker__label">
        <Radio size={14} />
        <span>Live Network</span>
      </div>
      <div className="ticker__viewport">
        <div className="ticker__track">
          {loop.map((text, i) => {
            const isLock = text.includes("locked");
            return (
              <span
                key={i}
                className={`ticker__item ${isLock ? "ticker__item--lock" : "ticker__item--stat"}`}
                aria-hidden={i >= items.length}
              >
                {isLock ? <Lock /> : <BarChart3 />}
                {text}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
