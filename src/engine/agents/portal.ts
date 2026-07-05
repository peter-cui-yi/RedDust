import type { RedDustAgent } from "../types";
import { makeLLMAgent } from "./deepseek";
import { portalJson } from "./portalClient";

// Cross-model agents via the yi-zhan PORTAL (one OpenAI-compatible endpoint, many model families),
// fronting the SAME scaffold as the deepseek baseline so the only variable is the model. Adds diversity
// to the decorrelation / three-arm panels (a richer Figure-1). Agent id === portal model name. Requires
// GEMINI_BASE_URL + GEMINI_API_KEY (the portal creds). Reasoning models are handled in portalClient.
export const PORTAL_MODELS = ["claude-opus-4-8-thinking", "gemini-3.5-flash", "glm-5.2", "kimi-k2.6", "MiniMax-M2.7"];

export const portalAgents: RedDustAgent[] = PORTAL_MODELS.map((model) =>
  makeLLMAgent(model, (messages, maxTokens) => portalJson(model, messages, maxTokens))
);
