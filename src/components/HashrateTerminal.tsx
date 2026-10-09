"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, TrendingUp } from "lucide-react";
const TELEMETRY = {
  hashratePH: 186.4,
  facilityUptime: 99.98,
  activeAsics: 6240,
  powerDrawMW: 18.6,
};

const POINTS = 48;
const W = 600;
const H = 150;

/** Deterministic seed series so SSR and first client render match. */
function seedSeries(): number[] {
  const out: number[] = [];
  let v = TELEMETRY.hashratePH - 3;
  for (let i = 0; i < POINTS; i++) {
    v += Math.sin(i * 0.55) * 0.9 + Math.cos(i * 0.21) * 0.6 + 0.07;
    out.push(Number(v.toFixed(2)));
  }
  return out;
}

export default function HashrateTerminal() {
  const [series, setSeries] = useState<number[]>(seedSeries);

  useEffect(() => {
    const id = setInterval(() => {
      setSeries((prev) => {
        const last = prev[prev.length - 1];
        const target = TELEMETRY.hashratePH;
        const drift = (target - last) * 0.12;
        const next = last + drift + (Math.random() - 0.5) * 2.2;
        return [...prev.slice(1), Number(next.toFixed(2))];
      });
    }, 1400);
    return () => clearInterval(id);
  }, []);

  const { line, area, lastY } = useMemo(() => {
    const min = Math.min(...series) - 1.5;
    const max = Math.max(...series) + 1.5;
    const pts = series.map((v, i) => {
      const x = (i / (POINTS - 1)) * W;
      const y = H - ((v - min) / (max - min)) * (H - 20) - 10;
      return [x, y] as const;
    });
    const d = pts
      .map(([x, y], i) => {
        if (i === 0) return `M${x},${y}`;
        const [px, py] = pts[i - 1];
        const cx = (px + x) / 2;
        return `C${cx},${py} ${cx},${y} ${x},${y}`;
      })
      .join(" ");
    return { line: d, area: `${d} L${W},${H} L0,${H} Z`, lastY: pts[pts.length - 1][1] };
  }, [series]);

  const current = series[series.length - 1];
  const delta = ((current - series[0]) / series[0]) * 100;

  return (
    <div className="terminal" aria-label="Live facility telemetry">
      <div className="terminal__head">
        <div className="terminal__head-left">
          <Activity />
          <span>FM-NODE-01 / FACILITY TELEMETRY</span>
        </div>
        <span className="terminal__live">
          <span className="pulse-dot" /> LIVE
        </span>
      </div>

      <div className="terminal__body">
        <div className="terminal__label">Network Hashrate</div>
        <div className="terminal__value-row">
          <span className="terminal__value">{current.toFixed(2)}</span>
          <span className="terminal__unit">PH/s</span>
          <span className="terminal__delta">
            <TrendingUp />
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(2)}% 1h
          </span>
        </div>

        <div className="chart">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="hr-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} className="chart__gridline" x1="0" x2={W} y1={H * f} y2={H * f} />
            ))}
            <path d={area} fill="url(#hr-fill)" />
            <path d={line} fill="none" stroke="#34d399" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <circle cx={W} cy={lastY} r="4" fill="#34d399" />
          </svg>
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric">
          <div className="metric__label">Uptime (30d)</div>
          <div className="metric__value">{TELEMETRY.facilityUptime}%</div>
        </div>
        <div className="metric">
          <div className="metric__label">Active ASICs</div>
          <div className="metric__value">{TELEMETRY.activeAsics.toLocaleString("en-US")}</div>
        </div>
        <div className="metric">
          <div className="metric__label">Power Draw</div>
          <div className="metric__value">{TELEMETRY.powerDrawMW} MW</div>
        </div>
        <div className="metric">
          <div className="metric__label">Next Settlement</div>
          <div className="metric__value">00:00 UTC</div>
        </div>
      </div>
    </div>
  );
}
