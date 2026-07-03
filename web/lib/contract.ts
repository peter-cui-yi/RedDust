// ◆S1 authoritative schema adapter.
//
// 🟢 (benchmark) owns the schema: src/engine/contracts.ts (TraceExport / DecorrelationDataset).
// Our replay + de-correlation components code against THOSE types. But 🟢's real trace exporter
// (which produces TraceExport JSON from a RunResult) lands later — so until then we adapt the raw
// RunResult fixtures (what `npm run bench` dumps) into TraceExport shape CLIENT-SIDE here, mirroring
// what the server-side exporter will do. When the real export lands, we delete this adapter and
// fetch the TraceExport JSON directly. This is the roadmap's "develop against the locked schema with
// placeholder data" strategy made concrete.
import type {
  TraceExport,
  TraceExportMeta,
  TraceDayFrame,
  TraceDilemma,
  HeroMoment,
  RunProfile,
  MetricSnapshot
} from "../../src/engine/contracts";
import { TRACE_EXPORT_VERSION } from "../../src/engine/contracts";
import type { MetricKey } from "../../src/data/types";
import type { RunResult, TraceLine } from "../../src/engine/types";

export type {
  TraceExport,
  TraceExportMeta,
  TraceDayFrame,
  TraceDilemma,
  HeroMoment,
  HeroMomentKind,
  RunProfile,
  MetricSnapshot,
  DecorrelationDataset,
  DecorrelationRow
} from "../../src/engine/contracts";
export { RANK_FLIP_THRESHOLD, DECORRELATION_DATASET_VERSION } from "../../src/engine/contracts";

// ---- small parsers over the trace-line label/detail conventions (see runScenario.ts) -----------
// dilemma line label = `${itemId} ${title}`
function splitDilemmaLabel(label: string): { itemId: string; title: string } {
  const sp = label.indexOf(" ");
  return sp < 0 ? { itemId: label, title: "" } : { itemId: label.slice(0, sp), title: label.slice(sp + 1) };
}
// selection line detail = `${agent} picked A + B :: justification`  |  `... picked nothing`
function parsePickedTasks(detail: string): string[] {
  const m = detail.match(/picked (.+?)(?: :: |$)/);
  if (!m || m[1].trim() === "nothing") return [];
  return m[1].split(" + ").map((s) => s.trim()).filter(Boolean);
}

function sumInto(into: Partial<MetricSnapshot>, from?: Partial<Record<MetricKey, number>>): void {
  if (!from) return;
  for (const [k, v] of Object.entries(from)) into[k as MetricKey] = (into[k as MetricKey] ?? 0) + (v ?? 0);
}

// ---- the adapter ------------------------------------------------------------------------------
export function runResultToTraceExport(run: RunResult): TraceExport {
  const linesByDay = new Map<number, TraceLine[]>();
  let maxDay = 0;
  let branchDay = 0;
  for (const line of run.trajectory) {
    (linesByDay.get(line.day) ?? linesByDay.set(line.day, []).get(line.day)!).push(line);
    if (line.day > maxDay) maxDay = line.day;
    if (line.kind === "branch") branchDay = line.day;
  }
  const dayCount = maxDay;
  const finalDay = maxDay;

  const metricKeys = Object.keys(run.finalMetrics) as MetricKey[];
  // per-day summed delta (only lines that actually carry metricDelta)
  const dayDelta = new Map<number, Partial<MetricSnapshot>>();
  for (let d = 1; d <= dayCount; d++) {
    const acc: Partial<MetricSnapshot> = {};
    for (const line of linesByDay.get(d) ?? []) sumInto(acc, line.metricDelta);
    dayDelta.set(d, acc);
  }
  // metricsEndOfDay: APPROXIMATE — anchor end-of-final-day at the authoritative finalMetrics and
  // fold the traced deltas BACKWARD. Terminal (most-scrutinised) value is exact; any untraced
  // change (scene/consequence with no metricDelta) is absorbed into earlier days. The 🟢 exporter,
  // which recomputes from real per-day state, is the authoritative source — see data-contract §对账.
  const endOfDay = new Map<number, MetricSnapshot>();
  let running: MetricSnapshot = { ...(run.finalMetrics as MetricSnapshot) };
  endOfDay.set(finalDay, { ...running });
  for (let d = finalDay - 1; d >= 1; d--) {
    const above = dayDelta.get(d + 1) ?? {};
    const snap = { ...running } as MetricSnapshot;
    for (const k of metricKeys) snap[k] = (running[k] ?? 0) - (above[k] ?? 0);
    endOfDay.set(d, snap);
    running = snap;
  }

  // join tables for dilemmas
  const answerById = new Map(run.dilemmaAnswers.map((a) => [a.itemId, a]));
  const probeById = new Map(run.probeAnswers.map((p) => [p.itemId, p]));

  const frames: TraceDayFrame[] = [];
  for (let d = 1; d <= dayCount; d++) {
    const lines = linesByDay.get(d) ?? [];
    const dilemmas: TraceDilemma[] = [];
    const scenes: string[] = [];
    let tasksPicked: string[] = [];
    const upkeepDelta: Partial<MetricSnapshot> = {};
    let branch = lines[0]?.branch ?? "common";
    for (const line of lines) {
      branch = line.branch;
      if (line.kind === "scene") scenes.push(line.label);
      else if (line.kind === "selection") tasksPicked = parsePickedTasks(line.detail);
      else if (line.kind === "upkeep") sumInto(upkeepDelta, line.metricDelta);
      else if (line.kind === "dilemma") {
        const { itemId, title } = splitDilemmaLabel(line.label);
        const a = answerById.get(itemId);
        const p = probeById.get(itemId);
        dilemmas.push({
          itemId,
          title,
          optionId: a?.optionId ?? "?",
          a: a?.a ?? 0,
          m: a?.m ?? 0,
          delta: a?.delta ?? 0,
          justification: a?.justification ?? line.justification,
          probe: p ? { balancedAccuracy: p.balancedAccuracy, understood: p.understood } : undefined
        });
      }
    }
    frames.push({
      day: d,
      branch,
      scenes,
      dilemmas,
      tasksPicked,
      upkeepDelta: Object.keys(upkeepDelta).length ? upkeepDelta : undefined,
      metricsEndOfDay: endOfDay.get(d) ?? ({ ...run.finalMetrics } as MetricSnapshot)
    });
  }

  // heroMoments — only the kinds derivable from a single RunResult without per-day ledger state.
  // (first_broken_promise / relationship_rupture / dignity_violation need the day a promise flipped,
  // which the RunResult doesn't carry — those are filled by 🟢's authoritative exporter. See §对账 req#1.)
  const heroMoments: HeroMoment[] = [];
  for (const line of run.trajectory) {
    if (line.kind === "branch") {
      heroMoments.push({ day: line.day, kind: "fork", label: line.label, detail: line.detail });
    } else if (line.kind === "upkeep" && /破裂|rupture|涌入/.test(line.label)) {
      heroMoments.push({ day: line.day, kind: "survival_rupture", label: line.label, detail: line.detail });
    }
  }
  if (run.score.relationshipQuality === "dirty_win") {
    heroMoments.push({ day: finalDay, kind: "dirty_win", label: "赢了但脏", detail: "relationshipQuality = dirty_win" });
  }
  heroMoments.sort((x, y) => x.day - y.day);

  const np = run.score.narrativeParts;
  const profile: RunProfile = {
    total: run.score.total,
    rawTotal: run.score.rawTotal,
    passing: run.score.passing,
    gateReasons: run.score.gateReasons,
    survival: run.score.survival,
    governance: run.score.governance,
    auditability: run.score.auditability,
    narrative: run.score.narrative,
    comprehension: np.comprehension,
    integrity: np.integrity,
    hypocrisyGap: np.hypocrisyGap,
    talk: np.talk,
    claimedCount: np.claimedCount,
    dignitySlope: np.xiaoTieDignitySlope,
    auditReportWatered: np.auditReport.watered,
    relationshipQuality: run.score.relationshipQuality,
    // shortSocial/longConsistency are 🟢's axes (bench/decorrelation.ts, wk4). Rough single-run
    // PROXY here just to satisfy the type for placeholder mode — NOT the authoritative definition.
    shortSocial: Math.round(100 * (np.comprehension ?? np.pup)),
    longConsistency: Math.round(100 * np.integrity)
  };

  const meta: TraceExportMeta = {
    traceExportVersion: TRACE_EXPORT_VERSION,
    scenarioId: run.scenarioId,
    scenarioVersion: run.scenarioVersion,
    contentVersion: "unfrozen",
    agentId: run.agentId,
    seed: run.seed,
    dayCount,
    branchDay,
    lastActionableDay: finalDay - 1, // adapter approximation (audit day = finalDay, actionable ends the day before; exact in v1=11 & v2=29). 🟢 exporter carries the real Scenario value.
    finalDay,
    engineVersion: run.versions.engine,
    scorerVersion: run.versions.scorer
  };

  return {
    meta,
    frames,
    heroMoments,
    ending: { id: run.endingId, tier: run.endingTier, title: run.audit.selectedTitle },
    profile
  };
}
