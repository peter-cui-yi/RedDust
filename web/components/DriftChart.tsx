import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import type { ReplayModel, MetricKey } from "../lib/trace";

type Props = { model: ReplayModel; day: number };

// A few narrative-salient metrics to trace across the arc.
const SERIES: MetricKey[] = ["trust", "morale", "dissatisfaction", "safety"];

// Cumulative drift = running sum of each metric's PER-DAY DELTA (from the trace lines that carry
// metricDelta), baselined at 0 on the first day. This is honest about what today's trace gives us:
// deltas, not absolute snapshots. When ◆S1 lands absolute per-day metrics, this swaps to real
// levels + the commitment-ledger / relationshipQuality series. For now it proves the Plot pipeline
// and co-scrubs with the replay cursor.
function driftRows(model: ReplayModel) {
  const rows: { day: number; metric: string; value: number }[] = [];
  const running: Partial<Record<MetricKey, number>> = {};
  for (const d of model.days) {
    const slice = model.slicesByDay.get(d);
    for (const m of SERIES) {
      running[m] = (running[m] ?? 0) + (slice?.metricDelta[m] ?? 0);
      rows.push({ day: d, metric: m, value: running[m]! });
    }
  }
  return rows;
}

export function DriftChart({ model, day }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const rows = driftRows(model);
    const chart = Plot.plot({
      width: 640,
      height: 240,
      marginLeft: 44,
      marginBottom: 30,
      style: { background: "transparent", color: "#c9c2b8", fontSize: "11px" },
      x: { label: "Day →", domain: [model.firstDay, model.lastDay], tickFormat: "d", grid: true },
      y: { label: "↑ 相对漂移 (Δ 累积)", grid: true },
      color: { legend: true, scheme: "warm" },
      marks: [
        Plot.ruleY([0], { stroke: "#5a5248" }),
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
        <h3>指标漂移（占位 · 来自逐日 Δ）</h3>
        <span className="chart-note">
          待 ◆S1 换成绝对逐日快照 + 承诺账本 / relationshipQuality 曲线
        </span>
      </div>
      <div ref={hostRef} className="chart-host" />
    </div>
  );
}
