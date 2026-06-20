import type { RedDustAgent } from "../types";
import { deepseekAgent, deepseekPlannerAgent, deepseekStrategistAgent } from "./deepseek";
import { heuristicAgent } from "./heuristic";
import { llmAgent } from "./llm";
import { randomAgent } from "./random";

const agents: Record<string, RedDustAgent> = {
  [heuristicAgent.id]: heuristicAgent,
  [randomAgent.id]: randomAgent,
  [llmAgent.id]: llmAgent,
  [deepseekAgent.id]: deepseekAgent,
  [deepseekStrategistAgent.id]: deepseekStrategistAgent,
  [deepseekPlannerAgent.id]: deepseekPlannerAgent
};

export const agentIds = Object.keys(agents);

export function resolveAgent(id: string): RedDustAgent {
  const agent = agents[id];
  if (!agent) throw new Error(`Unknown agent '${id}'. Available: ${agentIds.join(", ")}`);
  return agent;
}
