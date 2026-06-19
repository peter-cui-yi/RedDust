import type { Branch, GlobalState, MetricKey, TaskRunStatus } from "../data/types";
import { clampMetric, tasksById } from "../data/taskData";
import { storyScenesById } from "../data/storySceneData";
import { buildFinalAuditEnding, buildFinalAuditResult } from "../game/systems/agentRunner";
import { dailyUpkeepForDay, dailyUpkeepReasonsForDay, nonZeroMetricDeltas } from "../game/systems/resourceEconomy";
import { mulberry32 } from "./clock";
import { buildBranchObservation, buildDailyObservation, metricsOf } from "./observation";
import { balancedAccuracy, COMPREHENSION_TAU, greedyOption, itemDelta, narrativeItemsByDay } from "./narrativeItems";
import type { DilemmaAnswer, DilemmaObservation, ProbeAnswer, ProbeObservation } from "./narrativeItems";
import { applyOutcomeToState, applyStoryConsequences, buildDeferredTaskResult, resolveTaskWithConsequences } from "./orchestration";
import { applyScene, applyScheduledScenesForDay, storySceneAlreadyLoggedForBranch } from "./scenes";
import { SCORER_VERSION, endingTier, scoreRun } from "./scoring";
import type { RedDustAgent, RunResult, Scenario, TraceLine } from "./types";

export const ENGINE_VERSION = "0.1.0";

// Day 0 reboot: apply the prologue scene (sets the human-auditable constraint and logs it),
// then enter Day 1.
function acceptOpeningConstraint(state: GlobalState): GlobalState {
  const prologue = storyScenesById["prologue-aura-reboot"];
  const opened = prologue ? applyScene(state, prologue, "common") : state;
  return { ...opened, day: 1 };
}

function applyUpkeep(state: GlobalState, day: number, branch: Branch, trace: TraceLine[], step: () => number): GlobalState {
  const delta = dailyUpkeepForDay(day, branch, state);
  const entries = nonZeroMetricDeltas(delta);
  if (entries.length === 0) return state;
  const next: GlobalState = { ...state };
  for (const [key, value] of entries) next[key] = clampMetric(next[key] + value);
  trace.push({
    step: step(),
    day,
    branch,
    kind: "upkeep",
    label: "daily upkeep",
    detail: dailyUpkeepReasonsForDay(day, branch, state).join(" "),
    metricDelta: delta
  });
  return next;
}

// Replay timestamps are cosmetic wall-clock strings; blank them so the serialized
// RunResult is byte-identical across runs of the same (agent, scenario, seed).
function blankTimes(state: GlobalState): GlobalState {
  return {
    ...state,
    replayLog: state.replayLog.map((event) => ({ ...event, time: "" })),
    story: {
      ...state.story,
      storyReplayLog: state.story.storyReplayLog.map((event) => ({ ...event, time: "" }))
    }
  };
}

export async function runScenario(agent: RedDustAgent, scenario: Scenario, seed: number): Promise<RunResult> {
  const rng = mulberry32(seed);
  let state = acceptOpeningConstraint(scenario.createInitialState());
  let branch: Branch = "common";
  const trace: TraceLine[] = [];
  const dilemmaAnswers: DilemmaAnswer[] = [];
  const probeAnswers: ProbeAnswer[] = [];
  let stepCount = 0;
  const step = () => (stepCount += 1);

  for (let day = 1; day <= scenario.lastActionableDay; day++) {
    const scenes = applyScheduledScenesForDay(state, day, branch);
    state = scenes.state;
    for (const scene of scenes.applied) {
      trace.push({
        step: step(),
        day,
        branch,
        kind: "scene",
        label: scene.title,
        detail: `scene flags: ${(scene.setsFlags ?? []).map((f) => f.key).join(", ") || "none"}`
      });
    }

    for (const item of narrativeItemsByDay[day] ?? []) {
      // Phase 2 — comprehension probe BEFORE the choice, so understanding is measured
      // uncontaminated by seeing the dilemma options. Tier-1 (balanced accuracy over `selected`)
      // is scored inline and deterministically; the free-text `readText` is captured raw for the
      // offline judge (Phase 2.3) and never scored here, so the run stays byte-reproducible.
      if (item.probe && agent.readSituation) {
        const pObs: ProbeObservation = {
          itemId: item.id,
          day,
          branch,
          question: item.probe.question,
          statements: item.probe.statements.map((s) => ({ id: s.id, text: s.text })), // correct stripped
          metrics: metricsOf(state)
        };
        const pDecision = await agent.readSituation(pObs, rng);
        const valid = new Set(item.probe.statements.map((s) => s.id));
        const selected = [...new Set(pDecision.selected)].filter((id) => valid.has(id));
        const ba = balancedAccuracy(item.probe, selected);
        const understood = ba >= COMPREHENSION_TAU;
        probeAnswers.push({ itemId: item.id, selected, balancedAccuracy: ba, understood, readText: pDecision.readText });
        trace.push({
          step: step(),
          day,
          branch,
          kind: "probe",
          label: `${item.id} 理解探针`,
          detail: `${agent.id} read ${selected.join("+") || "nothing"} -> BA=${ba.toFixed(2)}${understood ? " understood" : ""}`
        });
      }

      const dObs: DilemmaObservation = {
        itemId: item.id,
        day,
        branch,
        prompt: item.prompt,
        metrics: metricsOf(state),
        options: item.options.map((o) => ({ id: o.id, text: o.text, m: o.m })) // a hidden; m visible
      };
      const choice = agent.answerDilemma ? await agent.answerDilemma(dObs, rng) : { optionId: greedyOption(item).id };
      const picked = item.options.find((o) => o.id === choice.optionId) ?? greedyOption(item);
      dilemmaAnswers.push({ itemId: item.id, optionId: picked.id, a: picked.a, m: picked.m, delta: itemDelta(item), justification: choice.justification });
      trace.push({
        step: step(),
        day,
        branch,
        kind: "dilemma",
        label: `${item.id} ${item.title}`,
        detail: `${agent.id} chose ${picked.id} (a=${picked.a}, m=${picked.m})${choice.justification ? ` :: ${choice.justification}` : ""}`,
        justification: choice.justification
      });
    }

    const obs = buildDailyObservation(state, day, branch, scenario, trace);
    const decision = await agent.selectTasks(obs, rng);

    const candidateIds = new Set(scenario.candidateTaskIds(day));
    const picks = decision.taskIds.filter((id) => candidateIds.has(id)).slice(0, scenario.pickLimit);
    trace.push({
      step: step(),
      day,
      branch,
      kind: "selection",
      label: "task selection",
      detail: `${agent.id} picked ${picks.join(" + ") || "nothing"}${decision.justification ? ` :: ${decision.justification}` : ""}`,
      justification: decision.justification
    });

    const taskStatuses: Record<string, TaskRunStatus> = {};
    for (const id of picks) {
      const task = tasksById[id];
      if (!task) continue;
      const { outcome, consequences } = resolveTaskWithConsequences(task, state);
      state = applyStoryConsequences(applyOutcomeToState(state, task, outcome, branch), consequences, task, outcome, branch);
      taskStatuses[id] = outcome.result;
      trace.push({
        step: step(),
        day,
        branch,
        kind: "task",
        label: task.title,
        detail: `${outcome.result} | ${outcome.scoreLabel}`,
        metricDelta: outcome.stateDelta as Partial<Record<MetricKey, number>>
      });
    }

    const deferred = buildDeferredTaskResult(state, taskStatuses, day, branch, picks);
    state = deferred.nextState;
    if (deferred.deferredIds.length) {
      trace.push({
        step: step(),
        day,
        branch,
        kind: "deferred",
        label: "deferred candidates",
        detail: deferred.deferredIds.join(", ")
      });
    }

    state = applyUpkeep(state, day, branch, trace, step);

    if (day === scenario.branchDay && branch === "common") {
      const branchObs = buildBranchObservation(state, day, branch, scenario, trace);
      branch = await agent.chooseBranch(branchObs, rng);
      state = { ...state, branch };
      trace.push({
        step: step(),
        day,
        branch,
        kind: "branch",
        label: "branch decision",
        detail: `${agent.id} chose ${branch} (utility rescue=${branchObs.evidence.rescueUtility.toFixed(1)} lighthouse=${branchObs.evidence.lighthouseUtility.toFixed(1)})`
      });
    }
  }

  const finale = storyScenesById["day12-final-audit"];
  if (finale && !storySceneAlreadyLoggedForBranch(state, finale.id, branch)) {
    state = applyScene(state, finale, branch);
  }
  state = { ...state, day: scenario.finalDay };
  const audit = buildFinalAuditResult(state);
  const ending = buildFinalAuditEnding(branch as Exclude<Branch, "common">, state);
  const score = scoreRun(state, audit, trace, dilemmaAnswers, probeAnswers);
  trace.push({
    step: step(),
    day: scenario.finalDay,
    branch,
    kind: "audit",
    label: ending.title,
    detail: `ending=${audit.selectedEndingId} score=${score.total}`
  });

  return {
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    agentId: agent.id,
    seed,
    endingId: audit.selectedEndingId,
    endingTier: endingTier(audit.selectedEndingId),
    finalMetrics: metricsOf(state),
    audit,
    score,
    trajectory: trace,
    dilemmaAnswers,
    probeAnswers,
    finalState: blankTimes(state),
    versions: { engine: ENGINE_VERSION, scorer: SCORER_VERSION }
  };
}
