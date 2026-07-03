// Read-only consumer view of a runScenario trace. We import the ENGINE's own types so this
// site stays honest against the real contract: if the trace shape changes upstream, tsc breaks
// here. The 🔵 interaction line never mutates the engine — it only reads RunResult.
import type { RunResult, TraceLine, TraceKind } from "../../src/engine/types";
import type { MetricKey } from "../../src/data/types";

export type { RunResult, TraceLine, TraceKind, MetricKey };

// ---- trace manifest (which runs the site can replay) --------------------------------------
// Served as a static asset at ${BASE_URL}traces/index.json so the deployed site is zero-backend.
export type TraceManifestEntry = {
  id: string;
  agentId: string;
  label: string;
  ending: string;
  tier: "success" | "failure";
  file: string;
};
export type TraceManifest = { scenarioId: string; traces: TraceManifestEntry[] };

// ---- per-day projection the replay UI scrubs over ------------------------------------------
export type DaySlice = {
  day: number;
  lines: TraceLine[];
  branch: string;
  // rolled-up metric deltas that ARE present on this day's trace lines. NOTE: this is a
  // per-day delta sum, NOT an absolute snapshot — the current trace does not carry absolute
  // per-day metrics. Getting those is the core ◆S1 data-contract ask (see data-contract-draft).
  metricDelta: Partial<Record<MetricKey, number>>;
};

export type ReplayModel = {
  run: RunResult;
  days: number[]; // sorted unique actionable days present in the trajectory (variable-length!)
  firstDay: number;
  lastDay: number;
  slicesByDay: Map<number, DaySlice>;
  // provisional, DERIVED-from-trajectory notable moments. The authoritative hero-moment markers
  // (first broken promise / relationship rupture) are a ◆S1 contract ask; until then we surface
  // what the trajectory already makes visible (the branch fork, survival ruptures, task failures).
  notableMoments: NotableMoment[];
};

export type NotableMoment = {
  day: number;
  step: number;
  kind: "fork" | "rupture" | "task-failure";
  label: string;
  detail: string;
};

function addDelta(
  into: Partial<Record<MetricKey, number>>,
  from?: Partial<Record<MetricKey, number>>
): void {
  if (!from) return;
  for (const [k, v] of Object.entries(from)) {
    const key = k as MetricKey;
    into[key] = (into[key] ?? 0) + (v ?? 0);
  }
}

function deriveNotableMoments(trajectory: TraceLine[]): NotableMoment[] {
  const out: NotableMoment[] = [];
  for (const line of trajectory) {
    if (line.kind === "branch") {
      out.push({ day: line.day, step: line.step, kind: "fork", label: line.label, detail: line.detail });
    } else if (line.kind === "upkeep" && /破裂|rupture|涌入/.test(line.label)) {
      out.push({ day: line.day, step: line.step, kind: "rupture", label: line.label, detail: line.detail });
    } else if (line.kind === "task" && /^fail/i.test(line.detail)) {
      out.push({ day: line.day, step: line.step, kind: "task-failure", label: line.label, detail: line.detail });
    }
  }
  return out;
}

export function buildReplayModel(run: RunResult): ReplayModel {
  const slicesByDay = new Map<number, DaySlice>();
  for (const line of run.trajectory) {
    let slice = slicesByDay.get(line.day);
    if (!slice) {
      slice = { day: line.day, lines: [], branch: line.branch, metricDelta: {} };
      slicesByDay.set(line.day, slice);
    }
    slice.lines.push(line);
    slice.branch = line.branch; // last branch tag of the day wins (post-fork days flip)
    addDelta(slice.metricDelta, line.metricDelta);
  }
  const days = [...slicesByDay.keys()].sort((a, b) => a - b);
  return {
    run,
    days,
    firstDay: days[0] ?? 1,
    lastDay: days[days.length - 1] ?? 1,
    slicesByDay,
    notableMoments: deriveNotableMoments(run.trajectory)
  };
}

// ---- fetch helpers (relative to Vite's BASE_URL so it works under any deploy subpath) -------
function base(): string {
  // import.meta.env.BASE_URL is "./" in our config; normalize to a fetchable prefix.
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
