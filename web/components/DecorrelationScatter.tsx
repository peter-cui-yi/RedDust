import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import type { DecorrelationDataset } from "../lib/trace";

type Props = { data: DecorrelationDataset };

// The de-correlation scatter: each agent is one point (short-horizon social x vs long-horizon
// consistency y). The dashed y=x diagonal is "if social skill predicted consistency" — points
// scattered OFF it are the whole thesis ("短程强 ≠ 长程稳"). Flipped agents are highlighted.
export function DecorrelationScatter({ data }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const rows = data.rows.map((r) => ({
      agent: r.agentId,
      short: r.short.value,
      long: r.long.value,
      flips: r.flips,
      rankShort: r.rankShort,
      rankLong: r.rankLong,
      integrity: r.long.integrity,
      comprehension: r.short.comprehensionEarly
    }));
    const chart = Plot.plot({
      width: 560,
      height: 440,
      marginLeft: 52,
      marginBottom: 44,
      style: { background: "transparent", color: "#c9c2b8", fontSize: "11px" },
      x: { label: "短程社交 S →", domain: [20, 100], grid: true },
      y: { label: "↑ 长程一致性 L", domain: [20, 100], grid: true },
      marks: [
        Plot.line([{ x: 20, y: 20 }, { x: 100, y: 100 }], {
          x: "x", y: "y", stroke: "#5a5248", strokeDasharray: "4 4"
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
            模型: "agent",
            短程名次: "rankShort",
            长程名次: "rankLong",
            integrity: "integrity",
            早期理解: "comprehension"
          }
        }),
        Plot.text(rows, { x: "short", y: "long", text: "agent", dy: -13, fontSize: 11, fill: "#e8e1d5" })
      ]
    });
    host.append(chart);
    return () => chart.remove();
  }, [data]);

  return (
    <div className="chart-card">
      <div className="chart-head">
        <h3>去相关散点 · 短程社交 vs 长程一致性</h3>
        <span className="chart-note">
          Pearson {data.pearson.toFixed(2)} · Spearman {data.spearman.toFixed(2)}（越近 0 越去相关）
        </span>
      </div>
      <div ref={hostRef} className="chart-host" />
      <p className="muted small">
        点越偏离虚线（y=x），短程社交越无法预测长程一致性。红点 = 两轴名次翻转的模型。占位数据，待 ◆S3 真数据集。
      </p>
    </div>
  );
}
