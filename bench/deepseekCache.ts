// Node-backed file cache for DeepSeek requests (wk8 compute discipline). Kept on the bench side so the
// engine's deepseekClient stays runtime-agnostic (no node:* imports). Install with setDeepseekCache().
// Keyed by sha256(model + base + messages + maxTokens) → any prompt difference misses. Stored under
// .bench/ (gitignored). Holds prompts + model outputs (already the dataset content); never the API key.
// DEEPSEEK_NO_CACHE=1 disables reuse (fetches live), letting an audit verify the cache against the API.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { DeepseekCache, DeepseekRequest } from "../src/engine/agents/deepseekClient";

const CACHE_DIR = ".bench/deepseek-cache";
const keyOf = (req: DeepseekRequest) => createHash("sha256").update(JSON.stringify(req)).digest("hex");

export const fileCache: DeepseekCache = {
  get(req) {
    const f = `${CACHE_DIR}/${keyOf(req)}.json`;
    if (!existsSync(f)) return undefined; // undefined = miss; a cached literal null is a hit
    return JSON.parse(readFileSync(f, "utf8")) as Record<string, unknown> | null;
  },
  set(req, value) {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(`${CACHE_DIR}/${keyOf(req)}.json`, JSON.stringify(value));
  }
};
