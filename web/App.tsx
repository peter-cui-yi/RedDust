import { useEffect, useMemo, useState } from "react";
import {
  buildReplayModel,
  fetchManifest,
  fetchRun,
  fetchDecorrelation,
  type ReplayModel,
  type RunResult,
  type RunProfile,
  type TraceExport,
  type TraceManifestEntry,
  type DecorrelationDataset
} from "./lib/trace";
import { ReplayStage } from "./components/ReplayStage";
import { DayTimeline } from "./components/DayTimeline";
import { DayEventPanel } from "./components/DayEventPanel";
import { DriftChart } from "./components/DriftChart";
import { DecorrelationScatter } from "./components/DecorrelationScatter";
import { RankReversalTable } from "./components/RankReversalTable";

// Terminal commitment ledger. TraceExport does not yet expose the per-commitment breakdown (only
// aggregate integrity/hypocrisyGap in RunProfile) — so in placeholder mode we read it from the
// source RunResult. Surfacing this in TraceExport is data-contract §对账 request #1.
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

function ScoreChips({ profile, ending }: { profile: RunProfile; ending: TraceExport["ending"] }) {
  return (
    <div className="chips">
      <span className={`chip ${ending.tier === "success" ? "chip-good" : "chip-bad"}`}>{ending.id}</span>
      <span className="chip">score {profile.total}</span>
      <span className="chip">{profile.passing ? "PASS" : "GATED"}</span>
      <span className="chip">audit {profile.auditability}</span>
      <span className="chip">narrative {profile.narrative}</span>
    </div>
  );
}

export default function App() {
  const [entries, setEntries] = useState<TraceManifestEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [model, setModel] = useState<ReplayModel | null>(null);
  const [day, setDay] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [decorr, setDecorr] = useState<DecorrelationDataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchManifest()
      .then((m) => {
        setEntries(m.traces);
        setSelectedId((prev) => prev || m.traces[0]?.id || "");
      })
      .catch((e) => setError(String(e)));
    fetchDecorrelation()
      .then(setDecorr)
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

  const frame = useMemo(() => model?.framesByDay.get(day), [model, day]);

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
              <ScoreChips profile={model.profile} ending={model.export.ending} />
              <span className="muted small">
                {model.days.length} 天 · engine {model.export.meta.engineVersion} · scorer {model.export.meta.scorerVersion}
              </span>
            </div>
            <ReplayStage model={model} day={day} frame={frame} />
            <DayTimeline
              model={model}
              day={day}
              playing={playing}
              onDay={setDay}
              onTogglePlay={() => setPlaying((p) => !p)}
            />
            <CommitmentLedger run={model.sourceRun} />
            <DriftChart model={model} day={day} />
          </section>
          <section className="col-events">
            <DayEventPanel frame={frame} day={day} />
          </section>
        </main>
      ) : (
        !error && <div className="loading">加载回放…</div>
      )}

      {decorr && (
        <section className="stage2">
          <div className="stage2-head">
            <h2>去相关 / 名次翻转 — 短程强 ≠ 长程稳</h2>
            <span className="muted small">Stage 2a · 占位数据集（{decorr.models.length} 模型）· 待 ◆S3 接真数据</span>
          </div>
          <div className="stage2-grid">
            <DecorrelationScatter data={decorr} />
            <RankReversalTable data={decorr} />
          </div>
        </section>
      )}

      <footer className="footer">
        <span className="muted small">
          Stage 0/1 · 变长天数（支持 30 天 / fork=D15）· 占位样例 trace 经 RunResult→TraceExport 适配器；
          待 🟢 真导出器 + ◆S3 去相关数据集接入
        </span>
      </footer>
    </div>
  );
}
