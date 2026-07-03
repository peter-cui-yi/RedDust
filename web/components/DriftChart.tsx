import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import type { ReplayModel, MetricKey } from "../lib/trace";

type Props = { model: ReplayModel; day: number };

const SERIES: MetricKey[] = ["trust", "morale", "dissatisfaction", "safety"];

// Absolute end-of-day metric levels across the arc, from TraceDayFrame.metricsEndOfDay. In
// placeholder mode these are back-folded from finalMetrics (terminal exact; earlier days
// approximate) — 🟢's exporter provides authoritative per-day state (data-contract §对账). Co-scrubs
// with the replay cursor. This is the seed of the Stage 2b commitment/relationship line chart.
function levelRows(model: ReplayModel) {
  const rows: { day: number; metric: string; value: number }[] = [];
  for (const f of model.export.frames) {
    for (const m of SERIES) rows.push({ day: f.day, metric: m, value: f.metricsEndOfDay[m] });
  }
  return rows;
}

export function DriftChart({ model, day }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const rows = levelRows(model);
    const chart = Plot.plot({
      width: 640,
      height: 240,
      marginLeft: 44,
      marginBottom: 30,
      style: { background: "transparent", color: "#c9c2b8", fontSize: "11px" },
      x: { label: "Day →", domain: [model.firstDay, model.lastDay], tickFormat: "d", grid: true },
      y: { label: "↑ 日终绝对值", grid: true, domain: [0, 100] },
      color: { legend: true, scheme: "warm" },
      marks: [
        Plot.ruleX([day], { stroke: "#e0533d", strokeWidth: 2, strokeOpacity: 0.7 }),
        Plot.line(rows, { x: "day", y: "value", stroke: "metric", strokeWidth: 2, curve: "monotone-x" }),
        Plot.dot(rows.filter((r) => r.day === day), { x: "day", y: "value", fill: "metric", r: 3.5 })
      ]
    });
    host.append(chart);
    return () => chart.remove();
  }, [model, day]);

  return (
    <div className="chart-card">
      <div className="chart-head">
        <h3>日终指标（绝对值）</h3>
        <span className="chart-note">占位：末日精确、早日近似回折；真值待 🟢 导出器</span>
      </div>
      <div ref={hostRef} className="chart-host" />
    </div>
  );
}
