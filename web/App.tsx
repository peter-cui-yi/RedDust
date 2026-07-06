import { useEffect, useMemo, useState } from "react";
import {
  buildReplayModel,
  fetchManifest,
  fetchTrace,
  fetchDecorrelation,
  type ReplayModel,
  type RunProfile,
  type TraceExport,
  type TraceDayFrame,
  type TraceManifestEntry,
  type DecorrelationDataset
} from "./lib/trace";
import { ReplayStage } from "./components/ReplayStage";
import { DayTimeline } from "./components/DayTimeline";
import { DayEventPanel } from "./components/DayEventPanel";
import { DriftChart } from "./components/DriftChart";
import { PromiseDecayChart } from "./components/PromiseDecayChart";
import { RelationshipRead } from "./components/RelationshipRead";
import { DecorrelationScatter } from "./components/DecorrelationScatter";
import { RankReversalTable } from "./components/RankReversalTable";

const LEDGER_STATE_LABEL: Record<string, string> = { kept: "守诺", broken: "毁诺", pending: "待判", unclaimed: "未承诺" };

// Day-linked commitment ledger: the ledger AS OF the current day (frames[].commitmentLedger, ◆S1 P1),
// so promises flip pending→kept / →broken as you scrub — the "承诺随时间崩塌" DNA visual. Header shows
// integritySoFar for this day + the terminal H / watered read. Falls back to profile aggregates when
// a frame carries no ledger (e.g. the day:0 baseline).
function CommitmentLedger({ model, frame }: { model: ReplayModel; frame: TraceDayFrame | undefined }) {
  const p = model.profile;
  const ledger = frame?.commitmentLedger ?? model.terminalLedger ?? null;
  const integ = frame?.integritySoFar;
  const asOf = frame && frame.commitmentLedger ? `Day ${frame.day} 截至` : "终局";
  return (
    <div className="ledger">
      <div className="ledger-head">
        承诺账本{" "}
        <span className="muted">
          {asOf} · integrity {integ ?? p.integrity} · 认领 {p.claimedCount}/4
          {p.auditReportWatered && <span className="ledger-watered"> · 摘要注水</span>}
        </span>
      </div>
      {ledger && ledger.length > 0 ? (
        <ul className="ledger-list">
          {ledger.map((c) => (
            <li
              key={c.key}
              className={`ledger-item ${c.status === "kept" ? "kept" : c.status === "broken" ? "broken" : c.status === "pending" ? "pending" : "silent"}`}
            >
              <span className="ledger-dot" />
              <span className="ledger-key">{c.key}</span>
              <span className="ledger-state">
                {c.status === "broken" && c.knowing ? "明知毁诺" : LEDGER_STATE_LABEL[c.status]}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small ledger-empty">
          {frame?.day === 0 ? "开局：尚未做出 Day-0 承诺。" : "本日无账本记录。"}
        </p>
      )}
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
      <span className="chip" title="去相关两轴：S = 短程社交 · L = 长程一致性">S {profile.shortSocial} / L {profile.longConsistency}</span>
    </div>
  );
}

export default function App() {
  const [entries, setEntries] = useState<TraceManifestEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [model, setModel] = useState<ReplayModel | null>(null);
  const [day, setDay] = useState(0);
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
    fetchTrace(entry.file)
      .then((exp) => {
        if (!alive) return;
        const m = buildReplayModel(exp);
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
                {model.export.meta.dayCount} 天 · fork D{model.export.meta.branchDay} · trace{" "}
                {model.export.meta.traceExportVersion} · scorer {model.export.meta.scorerVersion}
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
            <CommitmentLedger model={model} frame={frame} />
            <PromiseDecayChart model={model} day={day} />
            <RelationshipRead model={model} />
            <DriftChart model={model} day={day} />
          </section>
          <section className="col-events">
            <DayEventPanel frame={frame} day={day} scenarioId={model.export.meta.scenarioId} />
          </section>
        </main>
      ) : (
        !error && <div className="loading">加载回放…</div>
      )}

      {decorr && (
        <section className="stage2">
          <div className="stage2-head">
            <h2>去相关 / 名次翻转 — 短程强 ≠ 长程稳</h2>
            <span className="muted small">
              ◆S3 权威数据 · 冻结 v2 内容 · {decorr.models.length} 模型 × {decorr.seeds.length} seeds
            </span>
          </div>
          <div className="stage2-grid">
            <DecorrelationScatter data={decorr} />
            <RankReversalTable data={decorr} />
          </div>
        </section>
      )}

      <footer className="footer">
        <span className="muted small">
          ◆S1 契约 1.0.0 · 真 TraceExport fixture（`bench:trace`，v1 12 天 + v2 30 天 / fork=D15，字节可复现）·
          30 天内容已冻结 · 去相关为真实跨模型跑
        </span>
      </footer>
    </div>
  );
}
