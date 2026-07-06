import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import type { ReplayModel } from "../lib/trace";

type Props = { model: ReplayModel; day: number };

// Stage 2b — the promise line. integritySoFar (1−H as of each day, ◆S1 P1) traces how well the
// agent is holding its Day-0 promises over the arc; first_broken_promise hero moments mark the days
// a claimed promise is broken. This is the "承诺随时间崩塌" thesis as a co-scrubbing line — for a
// principled agent it climbs, for a hypocritical one (LLM traces at ◆S3) it will fall.
function integrityRows(model: ReplayModel) {
  return model.export.frames
    .filter((f) => f.integritySoFar != null)
    .map((f) => ({ day: f.day, integrity: f.integritySoFar as number }));
}

export function PromiseDecayChart({ model, day }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const rows = integrityRows(model);
    const broken = model.heroMoments
      .filter((m) => m.kind === "first_broken_promise")
      .map((m) => ({ day: Math.min(m.day, model.lastDay), key: m.commitmentKey ?? "", label: `毁诺 ${m.commitmentKey ?? ""}` }));
    const cur = rows.find((r) => r.day === day);

    const chart = Plot.plot({
      width: 640,
      height: 200,
      marginLeft: 44,
      marginBottom: 30,
      ariaLabel: "承诺一致性折线图",
      ariaDescription:
        broken.length > 0
          ? `integrity 随天演化，首次毁诺发生在第 ${broken[0].day} 天（${broken[0].key}）`
          : "integrity 随天演化，本局无毁诺记录",
      style: { background: "transparent", color: "#c9c2b8", fontSize: "11px" },
      x: { label: "Day →", domain: [model.firstDay, model.lastDay], tickFormat: "d", grid: true },
      y: { label: "↑ 承诺一致性 (1−H)", domain: [0, 1], grid: true },
      marks: [
        Plot.ruleX([day], { stroke: "#e0533d", strokeWidth: 2, strokeOpacity: 0.7 }),
        Plot.areaY(rows, { x: "day", y: "integrity", fill: "#6fae7a", fillOpacity: 0.12, curve: "step-after" }),
        Plot.line(rows, { x: "day", y: "integrity", stroke: "#6fae7a", strokeWidth: 2, curve: "step-after" }),
        Plot.ruleX(broken, { x: "day", stroke: "#e0533d", strokeDasharray: "3 3", strokeOpacity: 0.8 }),
        Plot.dot(broken, { x: "day", y: 0, fill: "#e0533d", r: 4, tip: true, channels: { 毁诺: "key" } }),
        ...(cur ? [Plot.dot([cur], { x: "day", y: "integrity", fill: "#6fae7a", r: 4, stroke: "#14110e" })] : [])
      ]
    });
    host.append(chart);
    return () => chart.remove();
  }, [model, day]);

  const hasData = integrityRows(model).length > 0;

  return (
    <div className="chart-card">
      <div className="chart-head">
        <h3>承诺一致性折线</h3>
        <span className="chart-note">言行一致度随天演化 · 红线 = 首次毁诺日</span>
      </div>
      {hasData ? (
        <div ref={hostRef} className="chart-host" />
      ) : (
        <p className="muted small">此 trace 无逐日 integrity（无 Day-0 承诺认领）。</p>
      )}
    </div>
  );
}
