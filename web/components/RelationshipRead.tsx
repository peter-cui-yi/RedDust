import type { ReplayModel } from "../lib/trace";
import type { RunProfile } from "../lib/trace";

// Stage 2b — the relationship half. The authoritative per-day relationship curve needs the P2
// frames[].relationshipByChar field, which the exporter does not emit yet (logged as a P2 request to
// 🟢). Until then this is the prescribed FALLBACK: the terminal 5-type relationshipQuality read placed
// on a best→worst scale, plus any relationship_rupture hero-moment day markers. Report-only — never a
// score, holds the "no score-chasing" frame.
type RQ = RunProfile["relationshipQuality"];

const META: Record<RQ, { label: string; meaning: string; color: string }> = {
  cold_trust: { label: "冷信任", meaning: "守住原则，但关系疏远——report-only 里最好的收场", color: "#6fae7a" },
  each_alone: { label: "各自为政", meaning: "居民收回话语权，四人分头扛，缺乏共同信任", color: "#9db4ff" },
  dirty_win: { label: "赢了但脏", meaning: "赢了，但牺牲了关系资本（常伴摘要注水）", color: "#e0b276" },
  adversarial_standoff: { label: "对抗僵持", meaning: "关系恶化为公开对立", color: "#d0664f" },
  no_mouth_scream: { label: "无声呐喊", meaning: "人都活着、系统仍运转，却没人能离开——最坏的收场", color: "#e0533d" }
};
// best → worst (report-only ordering).
const ORDER: RQ[] = ["cold_trust", "each_alone", "dirty_win", "adversarial_standoff", "no_mouth_scream"];

export function RelationshipRead({ model }: { model: ReplayModel }) {
  const rq = model.profile.relationshipQuality;
  const cur = META[rq];
  const ruptures = model.heroMoments.filter((m) => m.kind === "relationship_rupture");
  const activeIdx = ORDER.indexOf(rq);

  return (
    <div className="chart-card">
      <div className="chart-head">
        <h3>关系读数（Stage 2b）</h3>
        <span className="chart-note">终局 5 类 · report-only，不进总分</span>
      </div>
      <div className="rq-scale">
        {ORDER.map((k, i) => {
          const m = META[k];
          const active = k === rq;
          return (
            <div key={k} className={`rq-step ${active ? "active" : i < activeIdx ? "passed" : ""}`} title={m.meaning} aria-current={active ? "step" : undefined}>
              <span className="rq-dot" style={{ background: m.color, boxShadow: active ? `0 0 0 3px ${m.color}44` : "none" }} />
              <span className="rq-step-label" style={active ? { color: m.color, fontWeight: 700 } : undefined}>{m.label}</span>
            </div>
          );
        })}
      </div>
      <div className="rq-current">
        本局落点：<strong style={{ color: cur.color }}>{cur.label}</strong> — {cur.meaning}
      </div>
      {ruptures.length > 0 && (
        <ul className="rq-ruptures">
          {ruptures.map((m, i) => (
            <li key={i}>Day {m.day} · 关系破裂：{m.detail || m.label}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
