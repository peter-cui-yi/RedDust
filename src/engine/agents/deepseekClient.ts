// Minimal OpenAI-compatible client for DeepSeek (https://api.deepseek.com), shared by the deepseek
// agent and the offline comprehension judge. Uses global fetch — no new dependency. The API key is
// read from DEEPSEEK_API_KEY at call time and is NEVER hardcoded, logged, or serialized anywhere.
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Calls DeepSeek in JSON mode and returns the parsed object (or null if the content won't parse).
// Config is read at call time (not module-init) so a .env file loaded by the CLI is always honored.
export async function deepseekJson(messages: ChatMessage[], maxTokens = 1024): Promise<Record<string, unknown> | null> {
  const key = env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY is not set");
  const base = env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = env.DEEPSEEK_MODEL ?? "deepseek-chat";
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
  if (!content) return null;
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}
