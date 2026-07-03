// Read-only consumer view. We consume 🟢's authoritative TraceExport schema (src/engine/contracts.ts)
// via the client-side adapter in ./contract. Until 🟢's real exporter ships, the fixtures are raw
// RunResult JSON (`npm run bench` output) and the adapter converts them to TraceExport shape.
import type { RunResult, TraceLine, TraceKind } from "../../src/engine/types";
import type { MetricKey } from "../../src/data/types";
import type { TraceExport, TraceDayFrame, HeroMoment, RunProfile, DecorrelationDataset } from "./contract";
import { runResultToTraceExport } from "./contract";

export type { RunResult, TraceLine, TraceKind, MetricKey };
export type { TraceExport, TraceDayFrame, HeroMoment, RunProfile, DecorrelationDataset, DecorrelationRow } from "./contract";

// ---- trace manifest (which runs the site can replay) --------------------------------------
export type TraceManifestEntry = {
  id: string;
  agentId: string;
  label: string;
  ending: string;
  tier: "success" | "failure";
  file: string;
};
export type TraceManifest = { scenarioId: string; traces: TraceManifestEntry[] };

// ---- the replay model the UI scrubs over ---------------------------------------------------
export type ReplayModel = {
  export: TraceExport; // authoritative-shaped data the components consume
  sourceRun: RunResult; // placeholder-mode source; used ONLY for the terminal commitment ledger,
  //                       which the current TraceExport does not yet expose (data-contract §对账 req#1).
  days: number[];
  firstDay: number;
  lastDay: number;
  framesByDay: Map<number, TraceDayFrame>;
  heroMoments: HeroMoment[];
  profile: RunProfile;
};

export function buildReplayModel(run: RunResult): ReplayModel {
  const exp = runResultToTraceExport(run);
  const framesByDay = new Map<number, TraceDayFrame>();
  for (const f of exp.frames) framesByDay.set(f.day, f);
  const days = exp.frames.map((f) => f.day);
  return {
    export: exp,
    sourceRun: run,
    days,
    firstDay: days[0] ?? 1,
    lastDay: days[days.length - 1] ?? exp.meta.finalDay,
    framesByDay,
    heroMoments: exp.heroMoments,
    profile: exp.profile
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

export async function fetchRun(file: string): Promise<RunResult> {
  const res = await fetch(`${base()}traces/${file}`);
  if (!res.ok) throw new Error(`trace fetch failed (${file}): ${res.status}`);
  return res.json();
}

export async function fetchDecorrelation(): Promise<DecorrelationDataset> {
  const res = await fetch(`${base()}decorrelation/placeholder.json`);
  if (!res.ok) throw new Error(`decorrelation fetch failed: ${res.status}`);
  return res.json();
}
