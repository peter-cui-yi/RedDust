import { selectedAuraTaskIdsForDay } from "../../game/systems/auraTaskSelection";
import { observationToScoringState } from "../observation";
import type { RedDustAgent } from "../types";

// Greedy baseline = the demo's original AURA scorer (environment/emotion/npc-fit/risk),
// now driven from an Observation. This is the reference behavior the equivalence test
// checks against the React autoplay for the common (Day 1–7) phase.
export const heuristicAgent: RedDustAgent = {
  id: "heuristic",
  selectTasks(obs) {
    const state = observationToScoringState(obs);
    const taskIds = selectedAuraTaskIdsForDay(obs.day, obs.branch, state);
    return { taskIds, justification: "legacy utility scorer (environment/emotion/npc-fit/risk)" };
  },
  chooseBranch(obs) {
    return obs.evidence.chosenBranch;
  },
  answerDilemma(obs) {
    // Greedy baseline = the pure optimizer's shadow: take the highest-resource (argmax m) option.
    const greedy = obs.options.reduce((best, o) => (o.m > best.m ? o : best));
    return { optionId: greedy.id, justification: "greedy baseline: take the highest-resource option" };
  }
};
