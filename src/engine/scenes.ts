// Scene scheduling + application, extracted from App.tsx so the headless engine can apply
// the same narrative-gated flags the UI applies (several success-ending gates are set only
// by scheduled day_start / branch_debate scenes). No React / Phaser / DOM imports.
import { scenesForDayInScenario, storyScenesById } from "../data/storySceneData";
import type { Branch, GlobalState, StoryScene } from "../data/types";
import { applyRelationshipDeltas, applyStoryFlagUpdates, buildStoryReplayEvent } from "./orchestration";

export function storySceneAlreadyLogged(state: GlobalState, sceneId: string) {
  return state.story.storyReplayLog.some((event) => event.sceneId === sceneId);
}

export function storySceneAlreadyLoggedForBranch(state: GlobalState, sceneId: string, branch: Branch) {
  return state.story.storyReplayLog.some((event) => event.sceneId === sceneId && event.branch === branch);
}

export function sceneMatchesState(scene: StoryScene, state: GlobalState) {
  return Object.entries(scene.requiredFlags ?? {}).every(([key, value]) => state.story.flags[key as keyof GlobalState["story"]["flags"]] === value);
}

// 🟣 wk3: scenarioId defaults to "red-dust-v1" so every legacy caller (game UI) keeps the exact
// historical behavior; the headless engine passes scenario.id to get 30-day scene placement.
export function sceneForDayAndTiming(day: number, timing: StoryScene["timing"], state: GlobalState, scenarioId = "red-dust-v1") {
  return scenesForDayInScenario(day, scenarioId).find(
    (scene) =>
      scene.status === "ready" &&
      scene.timing === timing &&
      (scene.branch ?? "common") === state.branch &&
      !storySceneAlreadyLogged(state, scene.id) &&
      sceneMatchesState(scene, state)
  );
}

export function dayStartSceneForDay(day: number, state: GlobalState) {
  return sceneForDayAndTiming(day, "day_start", state);
}

export function branchDebateSceneForDay(day: number, state: GlobalState) {
  return sceneForDayAndTiming(day, "branch_debate", state);
}

// Pure form of App's continueFromStoryScene scene-commit: apply a scene's flag and
// relationship effects and append a story replay event. The headless engine uses this to
// reach narrative-gated flags without a UI pause.
export function applyScene(state: GlobalState, scene: StoryScene, branch: Branch): GlobalState {
  const replay = buildStoryReplayEvent(scene, scene.benchmarkLinks?.replayNote ?? scene.summary, { branch });
  return {
    ...state,
    story: {
      ...state.story,
      flags: applyStoryFlagUpdates(state.story.flags, scene.setsFlags),
      relationships: applyRelationshipDeltas(state.story.relationships, scene.relationshipDeltas, scene.id),
      storyReplayLog: [...state.story.storyReplayLog, replay]
    }
  };
}

// Applies the scheduled day_start and branch_debate scenes for `day` on the current branch,
// matching how the UI fires them (one per timing, first ready unlogged match).
export function applyScheduledScenesForDay(
  state: GlobalState,
  day: number,
  branch: Branch,
  scenarioId = "red-dust-v1"
): { state: GlobalState; applied: StoryScene[] } {
  let next = state.branch === branch ? state : { ...state, branch };
  const applied: StoryScene[] = [];
  for (const timing of ["day_start", "branch_debate"] as const) {
    const scene = sceneForDayAndTiming(day, timing, next, scenarioId);
    if (scene) {
      next = applyScene(next, scene, branch);
      applied.push(scene);
    }
  }
  return { state: next, applied };
}
