// OpenAI-compatible client for the yi-zhan aggregator PORTAL (many model families behind one endpoint),
// used to add cross-model diversity to the decorrelation / three-arm panels. Reads GEMINI_BASE_URL +
// GEMINI_API_KEY (the portal creds) at call time; the API key is NEVER hardcoded, logged, or serialized.
// Stays runtime-agnostic (no node:* imports) so the web build can pull the engine graph. Robust to
// reasoning models: strips <think>…</think>, gives a generous token budget (reasoning eats output
// budget), and falls back to extracting the outermost {…} if the content isn't pure JSON.
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

import type { ChatMessage, DeepseekCache, DeepseekRequest } from "./deepseekClient";

let cache: DeepseekCache | null = null;
export function setPortalCache(c: DeepseekCache | null): void {
  cache = c;
}
export const portalStats = { hits: 0, misses: 0 };
export function resetPortalStats(): void {
  portalStats.hits = 0;
  portalStats.misses = 0;
}

// Reasoning models spend most of their token budget "thinking"; too small a cap returns empty content.
const MIN_TOKENS = 4000;

function extractJson(content: string): Record<string, unknown> | null {
  // strip inline reasoning some models emit in the content channel (MiniMax etc.)
  const stripped = content.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();
  const tryParse = (s: string) => { try { return JSON.parse(s) as Record<string, unknown>; } catch { return null; } };
  const direct = tryParse(stripped);
  if (direct) return direct;
  const first = stripped.indexOf("{"), last = stripped.lastIndexOf("}");
  return first >= 0 && last > first ? tryParse(stripped.slice(first, last + 1)) : null;
}

// Call a portal MODEL in JSON mode and return the parsed object (or null). Same shape as deepseekJson so
// the shared agent scaffold can use either.
export async function portalJson(model: string, messages: ChatMessage[], maxTokens = 1024): Promise<Record<string, unknown> | null> {
  const key = env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY (portal) is not set");
  const base = env.GEMINI_BASE_URL ?? "https://vip.yi-zhan.top";
  const tokens = Math.max(maxTokens, MIN_TOKENS);
  const req: DeepseekRequest = { model, base, messages, maxTokens: tokens };

  if (cache) {
    const hit = cache.get(req);
    if (hit !== undefined) { portalStats.hits++; return hit; }
  }
  portalStats.misses++;
  // No response_format:json_object — the portal fronts heterogeneous models and some reject JSON mode
  // ("Json mode is not supported"). The prompts already demand JSON and extractJson() recovers it (after
  // stripping any <think> reasoning), which is the most compatible path across model families.
  const res = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, temperature: 0, max_tokens: tokens })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Portal ${model} ${res.status}: ${body.slice(0, 180)}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  const result = content ? extractJson(content) : null;
  cache?.set(req, result);
  return result;
}
