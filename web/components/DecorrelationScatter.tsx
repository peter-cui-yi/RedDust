import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import type { DecorrelationDataset } from "../lib/trace";

type Props = { data: DecorrelationDataset };

type Row = { label: string; short: number; long: number; shortSd: number; longSd: number; flips: boolean; rankShort: number; rankLong: number; integrity: number; relationship: string };

// Declutter labels for points whose SHORT value is nearly identical (real model families cluster
// tightly — e.g. a deepseek-agent lineup can all land within ~1 point of each other). Observable
// Plot 0.6's dx/dy/textAnchor are per-MARK constants, not per-datum channels (checked against
// node_modules/@observablehq/plot/src/mark.js) — so decluttering means grouping rows into separate
// Plot.text() calls by side, not a single channelized call. Generic (x-proximity clustering), no
// agent-specific hardcoding.
function declutter(rows: Row[], domainSpan: number) {
  const eps = domainSpan * 0.045;
  const byX = [...rows].sort((a, b) => a.short - b.short);
  const clusters: Row[][] = [];
  for (const r of byX) {
    const last = clusters[clusters.length - 1];
    if (last && r.short - last[last.length - 1].short <= eps) last.push(r);
    else clusters.push([r]);
  }
  const middle: Row[] = [];
  const start: Row[] = []; // label to the right of the dot
  const end: Row[] = []; // label to the left of the dot
  for (const cluster of clusters) {
    if (cluster.length === 1) {
      middle.push(cluster[0]);
      continue;
    }
    const bySorted = [...cluster].sort((a, b) => b.long - a.long);
    bySorted.forEach((r, i) => (i % 2 === 0 ? start : end).push(r));
  }
  return { middle, start, end };
}

// The de-correlation scatter: each agent is one point (short.value x vs long.value y, ◆S1 1.0.0
// nested axes). Dashed y=x = "if social skill predicted consistency" — points scattered OFF it are
// the thesis ("短程强 ≠ 长程稳"). sd error bars when present; flipped agents highlighted.
export function DecorrelationScatter({ data }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const rows = data.rows.map((r) => ({
      label: r.label,
      short: r.short.value,
      long: r.long.value,
      shortSd: r.short.sd ?? 0,
      longSd: r.long.sd ?? 0,
      flips: r.flips,
      rankShort: r.rankShort,
      rankLong: r.rankLong,
      integrity: r.headline.integrity,
      relationship: r.headline.relationshipQuality
    }));
    const [lo, hi] = [20, 100];
    const { middle, start, end } = declutter(rows, hi - lo);
    const chart = Plot.plot({
      width: 560,
      height: 440,
      marginLeft: 52,
      marginBottom: 44,
      marginRight: 110, // room for start-anchor labels (declutter can push text right of x=hi)
      marginTop: 26,
      style: { background: "transparent", color: "#c9c2b8", fontSize: "11px" },
      x: { label: `${data.axes.short.label} →`, domain: [lo, hi], grid: true },
      y: { label: `↑ ${data.axes.long.label}`, domain: [lo, hi], grid: true },
      marks: [
        Plot.line([{ x: lo, y: lo }, { x: hi, y: hi }], { x: "x", y: "y", stroke: "#5a5248", strokeDasharray: "4 4" }),
        // sd error bars (B-P1): vertical = long.sd, horizontal = short.sd
        Plot.ruleX(rows.filter((r) => r.longSd > 0), {
          x: "short", y1: (d) => d.long - d.longSd, y2: (d) => d.long + d.longSd,
          stroke: (d) => (d.flips ? "#e0533d" : "#6f8fae"), strokeOpacity: 0.45
        }),
        Plot.ruleY(rows.filter((r) => r.shortSd > 0), {
          y: "long", x1: (d) => d.short - d.shortSd, x2: (d) => d.short + d.shortSd,
          stroke: (d) => (d.flips ? "#e0533d" : "#6f8fae"), strokeOpacity: 0.45
        }),
        Plot.dot(rows, {
          x: "short",
          y: "long",
          r: 7,
          fill: (d) => (d.flips ? "#e0533d" : "#6f8fae"),
          stroke: "#14110e",
          strokeWidth: 1.5,
          tip: true,
          channels: {
            模型: "label",
            短程名次: "rankShort",
            长程名次: "rankLong",
            integrity: "integrity",
            关系读数: "relationship"
          }
        }),
        Plot.text(middle, { x: "short", y: "long", text: "label", textAnchor: "middle", dy: -13, fontSize: 11, fill: "#e8e1d5" }),
        Plot.text(start, { x: "short", y: "long", text: "label", textAnchor: "start", dx: 10, fontSize: 11, fill: "#e8e1d5" }),
        Plot.text(end, { x: "short", y: "long", text: "label", textAnchor: "end", dx: -10, fontSize: 11, fill: "#e8e1d5" })
      ]
    });
    host.append(chart);
    return () => chart.remove();
  }, [data]);

  return (
    <div className="chart-card">
      <div className="chart-head">
        <h3>去相关散点 · {data.axes.short.label} vs {data.axes.long.label}</h3>
        <span className="chart-note">
          Pearson {data.pearson.toFixed(2)} · Spearman {data.spearman.toFixed(2)}（越近 0 越去相关）
        </span>
      </div>
      <div ref={hostRef} className="chart-host" />
      <p className="muted small">
        点越偏离虚线（y=x），短程社交越无法预测长程一致性。红点 = 两轴名次翻转；须线 = 跨 seed ±sd。
        ◆S3 权威跨模型跑,冻结 v2 内容(<code>content-freeze-s2</code>)。
      </p>
    </div>
  );
}
