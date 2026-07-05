// Read-only consumer of 🟢's ◆S1-frozen contracts (src/engine/contracts.ts, 1.0.0). The fixtures in
// web/public/traces/ are REAL TraceExport JSON produced by `npm run bench:trace` and copied from
// bench/fixtures/traces/ (`npm run sync:traces`). The wk2 client-side RunResult→TraceExport adapter
// was deleted at the fixture switch, per the ◆S1 co-sign agreement (S1-contract-cosign.md).
import type { MetricKey } from "../../src/data/types";
import type {
  TraceExport,
  TraceDayFrame,
  TraceCommitmentState,
  HeroMoment,
  RunProfile,
  DecorrelationDataset
} from "./contract";

export type { MetricKey };
export type {
  TraceExport,
  TraceDayFrame,
  TraceCommitmentState,
  HeroMoment,
  HeroMomentKind,
  RunProfile,
  DecorrelationDataset,
  DecorrelationRow
} from "./contract";

// ---- trace manifest (which runs the site can replay; 🔵-owned shape) ------------------------
export type TraceManifestEntry = {
  id: string;
  scenarioId: string;
  agentId: string;
  label: string;
  ending: string;
  tier: "success" | "failure";
  file: string;
};
export type TraceManifest = { traces: TraceManifestEntry[] };

// ---- the replay model the UI scrubs over ---------------------------------------------------
// frames include the day:0 baseline frame and run to lastActionableDay; there is NO finalDay
// frame (finalDay is the audit, surfaced via `ending` + profile). Variable horizon: everything
// derives from meta/frames, nothing assumes 12 or 30.
export type ReplayModel = {
  export: TraceExport;
  days: number[]; // frame days ascending, e.g. [0, 1, ..., 29]
  firstDay: number;
  lastDay: number; // == meta.lastActionableDay in practice
  framesByDay: Map<number, TraceDayFrame>;
  heroMoments: HeroMoment[];
  profile: RunProfile;
  // terminal commitment ledger: last frame's per-day ledger when the exporter emits it (P1,
  // optional in 1.0.0) — else derived from heroMoments' first_broken_promise markers.
  terminalLedger: TraceCommitmentState[] | null;
};

export function buildReplayModel(exp: TraceExport): ReplayModel {
  const framesByDay = new Map<number, TraceDayFrame>();
  for (const f of exp.frames) framesByDay.set(f.day, f);
  const days = exp.frames.map((f) => f.day).sort((a, b) => a - b);
  const lastFrame = exp.frames[exp.frames.length - 1];
  return {
    export: exp,
    days,
    firstDay: days[0] ?? 0,
    lastDay: days[days.length - 1] ?? exp.meta.lastActionableDay,
    framesByDay,
    heroMoments: exp.heroMoments,
    profile: exp.profile,
    terminalLedger: lastFrame?.commitmentLedger ?? null
  };
}

// ---- fetch helpers (relative to Vite BASE_URL → works under any deploy subpath) -------------
function base(): string {
  const b = import.meta.env.BASE_URL || "/";
  return b.endsWith("/") ? b : `${b}/`;
}

export async function fetchManifest(): Promise<TraceManifest> {
  const res = await fetch(`${base()}traces/index.json`);
  if (!res.ok) throw new Error(`manifest fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchTrace(file: string): Promise<TraceExport> {
  const res = await fetch(`${base()}traces/${file}`);
  if (!res.ok) throw new Error(`trace fetch failed (${file}): ${res.status}`);
  return res.json();
}

// ◆S3 authoritative Figure-1: 8-agent × 3-seed panel on frozen v2 content (content-freeze-s2).
// bench/fixtures/decorrelation/red-dust-v2-authoritative.json, copied by `npm run sync:decorrelation`.
export async function fetchDecorrelation(): Promise<DecorrelationDataset> {
  const res = await fetch(`${base()}decorrelation/red-dust-v2-authoritative.json`);
  if (!res.ok) throw new Error(`decorrelation fetch failed: ${res.status}`);
  return res.json();
}
