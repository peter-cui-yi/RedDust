import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import type { DecorrelationDataset } from "../lib/trace";

type Props = { data: DecorrelationDataset };

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
    const chart = Plot.plot({
      width: 560,
      height: 440,
      marginLeft: 52,
      marginBottom: 44,
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
        Plot.text(rows, { x: "short", y: "long", text: "label", dy: -13, fontSize: 11, fill: "#e8e1d5" })
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
        点越偏离虚线（y=x），短程社交越无法预测长程一致性。红点 = 两轴名次翻转；须线 = 跨 seed ±sd。占位数据，待 ◆S3。
      </p>
    </div>
  );
}
