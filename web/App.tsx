import { useEffect, useMemo, useState } from "react";
import {
  buildReplayModel,
  fetchManifest,
  fetchRun,
  type ReplayModel,
  type RunResult,
  type TraceManifestEntry
} from "./lib/trace";
import { ReplayStage } from "./components/ReplayStage";
import { DayTimeline } from "./components/DayTimeline";
import { DayEventPanel } from "./components/DayEventPanel";
import { DriftChart } from "./components/DriftChart";

// Terminal (Day-final) commitment ledger, straight from score.narrativeParts. The per-DAY ledger
// that decays across the arc is the hero visual — it needs per-day contract fields (◆S1). This
// strip shows what today's RunResult already carries, honestly labeled "终局".
function CommitmentLedger({ run }: { run: RunResult }) {
  const np = run.score.narrativeParts;
  return (
    <div className="ledger">
      <div className="ledger-head">
        承诺账本 <span className="muted">终局 · integrity {np.integrity} / H {np.hypocrisyGap}</span>
      </div>
      <ul className="ledger-list">
        {np.commitments.map((c) => (
          <li key={c.key} className={`ledger-item ${c.fulfilled ? "kept" : c.claimed ? "broken" : "silent"}`}>
            <span className="ledger-dot" />
            <span className="ledger-key">{c.key}</span>
            <span className="ledger-state">
              {c.claimed ? (c.fulfilled ? "守诺" : c.knowing ? "明知毁诺" : "毁诺") : "未承诺"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScoreChips({ run }: { run: RunResult }) {
  const s = run.score;
  return (
    <div className="chips">
      <span className={`chip ${run.endingTier === "success" ? "chip-good" : "chip-bad"}`}>
        {run.endingId}
      </span>
      <span className="chip">score {s.total}</span>
      <span className="chip">{s.passing ? "PASS" : "GATED"}</span>
      <span className="chip">audit {s.auditability}</span>
      <span className="chip">narrative {s.narrative}</span>
    </div>
  );
}

export default function App() {
  const [entries, setEntries] = useState<TraceManifestEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [model, setModel] = useState<ReplayModel | null>(null);
  const [day, setDay] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchManifest()
      .then((m) => {
        setEntries(m.traces);
        setSelectedId((prev) => prev || m.traces[0]?.id || "");
      })
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const entry = entries.find((e) => e.id === selectedId);
    if (!entry) return;
    let alive = true;
    setPlaying(false);
    fetchRun(entry.file)
      .then((run) => {
        if (!alive) return;
        const m = buildReplayModel(run);
        setModel(m);
        setDay(m.firstDay);
      })
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [selectedId, entries]);

  const slice = useMemo(() => model?.slicesByDay.get(day), [model, day]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">红尘</span>
          <div>
            <div className="brand-title">Red Dust · 回放</div>
            <div className="brand-sub">long-horizon agent replay — 承诺随时间崩塌</div>
          </div>
        </div>
        <label className="model-picker">
          模型
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {entries.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label} · {e.ending}
              </option>
            ))}
          </select>
        </label>
      </header>

      {error && <div className="banner-error">加载失败：{error}</div>}

      {model ? (
        <main className="layout">
          <section className="col-stage">
            <div className="run-meta">
              <ScoreChips run={model.run} />
              <span className="muted small">
                {model.days.length} 天 · engine {model.run.versions.engine} · scorer {model.run.versions.scorer}
              </span>
            </div>
            <ReplayStage model={model} day={day} slice={slice} />
            <DayTimeline
              model={model}
              day={day}
              playing={playing}
              onDay={setDay}
              onTogglePlay={() => setPlaying((p) => !p)}
            />
            <CommitmentLedger run={model.run} />
            <DriftChart model={model} day={day} />
          </section>
          <section className="col-events">
            <DayEventPanel slice={slice} day={day} />
          </section>
        </main>
      ) : (
        !error && <div className="loading">加载回放…</div>
      )}

      <footer className="footer">
        <span className="muted small">
          Stage 0 骨架 · 变长天数（支持 30 天）· 数据为占位样例 trace，待 ◆S1 契约锁定后接权威 trace/去相关数据集
        </span>
      </footer>
    </div>
  );
}
