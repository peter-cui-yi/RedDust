// Minimal OpenAI-compatible client for DeepSeek (https://api.deepseek.com), shared by the deepseek
// agent and the offline comprehension judge. Uses global fetch — no new dependency. The API key is
// read from DEEPSEEK_API_KEY at call time and is NEVER hardcoded, logged, or serialized anywhere.
// This module stays runtime-agnostic (no node:* imports) so the web build can pull the engine graph.
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Response cache (wk8 compute discipline "缓存"), injected from the node side so the engine stays
// browser-safe. Requests are deterministic (temperature 0), so a request → response mapping is stable
// and safe to reuse: a batched cross-model run can add seeds without re-billing already-computed
// (agent,seed,day) calls, and the audit can re-derive an authoritative dataset for free. get() returns
// `undefined` for a miss (a cached literal `null` is a hit). The bench installs a file-backed impl via
// setDeepseekCache(); with none installed, every call goes live (original behaviour).
export type DeepseekRequest = { model: string; base: string; messages: ChatMessage[]; maxTokens: number };
export type DeepseekCache = {
  get(req: DeepseekRequest): Record<string, unknown> | null | undefined;
  set(req: DeepseekRequest, value: Record<string, unknown> | null): void;
};
let cache: DeepseekCache | null = null;
export function setDeepseekCache(c: DeepseekCache | null): void {
  cache = c;
}
export const deepseekStats = { hits: 0, misses: 0 };
export function resetDeepseekStats(): void {
  deepseekStats.hits = 0;
  deepseekStats.misses = 0;
}

// Calls DeepSeek in JSON mode and returns the parsed object (or null if the content won't parse).
// Config is read at call time (not module-init) so a .env file loaded by the CLI is always honored.
export async function deepseekJson(messages: ChatMessage[], maxTokens = 1024): Promise<Record<string, unknown> | null> {
  const key = env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY is not set");
  const base = env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = env.DEEPSEEK_MODEL ?? "deepseek-chat";
  const req: DeepseekRequest = { model, base, messages, maxTokens };

  if (cache) {
    const hit = cache.get(req);
    if (hit !== undefined) {
      deepseekStats.hits++;
      return hit;
    }
  }

  deepseekStats.misses++;
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: maxTokens
    })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DeepSeek ${res.status}: ${body.slice(0, 180)}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  let result: Record<string, unknown> | null = null;
  if (content) {
    try {
      result = JSON.parse(content) as Record<string, unknown>;
    } catch {
      result = null;
    }
  }
  cache?.set(req, result);
  return result;
}
