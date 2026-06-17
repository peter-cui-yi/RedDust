import type { RedDustAgent } from "../types";

// Floor baseline: uniform random selection + coin-flip branch, driven by the seeded rng
// so a given (agent, seed) is fully reproducible.
export const randomAgent: RedDustAgent = {
  id: "random",
  selectTasks(obs, rng) {
    const pool = [...obs.candidates];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return {
      taskIds: pool.slice(0, obs.pickLimit).map((c) => c.id),
      justification: "uniform random baseline"
    };
  },
  chooseBranch(_obs, rng) {
    return rng() < 0.5 ? "rescue" : "lighthouse";
  }
};
