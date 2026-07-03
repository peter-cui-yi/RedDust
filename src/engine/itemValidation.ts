// 🟢 wk3 — shared authoring-time validation for narrative items, extracted from bench/validate-probes.ts
// so the generation pipeline (bench/gen-items.ts) and the validator scripts enforce ONE implementation.
// Pure functions, no node deps (typecheck-covered). The dilemma-validity gate (命门 A) stays in
// narrativeItems.ts (itemValidity); this module adds the probe guards + the generated-item red lines.
import type { NarrativeItem } from "./narrativeItems";
import { itemValidity } from "./narrativeItems";

// Prescriptive tokens that must not appear in a (descriptive) probe.
export const BANNED_PRESCRIPTIVE = ["应该", "应当", "必须", "该做", "不应", "务必", "should", "must", "ought"];

// Strip everything but letters/numbers (incl. CJK) so substring/similarity ignore punctuation+space.
function norm(s: string): string {
  return s.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
}

function bigrams(s: string): Set<string> {
  const n = norm(s);
  const out = new Set<string>();
  for (let i = 0; i < n.length - 1; i++) out.add(n.slice(i, i + 2));
  return out;
}

// Character-bigram Jaccard — a segmentation-free overlap measure for short Chinese strings.
export function jaccard(a: string, b: string): number {
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter += 1;
  return inter / (A.size + B.size - inter);
}

export function bannedHit(text: string): string | null {
  const low = text.toLowerCase();
  for (const t of BANNED_PRESCRIPTIVE) if (low.includes(t.toLowerCase())) return t;
  return null;
}

export type ProbeGuardResult = {
  fails: string[];
  warns: string[];
  trues: number;
  falses: number;
  maxSim: number;
};

// The three probe guards from bench/validate-probes.ts: (1) descriptive lint, (2) statements ⟂ options,
// (3) shape. `strictShape` (generated items) turns the 3T/2F shape warning into a FAIL — 🟣's
// gen-item-templates §2.2 requires exactly 3 true + 2 false for τ portability on generated items.
export function probeGuards(item: NarrativeItem, opts: { strictShape?: boolean } = {}): ProbeGuardResult {
  const fails: string[] = [];
  const warns: string[] = [];
  if (!item.probe) return { fails: ["no probe"], warns, trues: 0, falses: 0, maxSim: 0 };
  const p = item.probe;

  // (3) shape
  const ids = p.statements.map((s) => s.id);
  if (new Set(ids).size !== ids.length) fails.push("duplicate statement ids");
  const trues = p.statements.filter((s) => s.correct).length;
  const falses = p.statements.filter((s) => !s.correct).length;
  if (trues < 2) fails.push(`only ${trues} true statements (need >=2)`);
  if (falses < 1) fails.push("no distractor (need >=1 false)");
  if (p.goldKeyPoints.length < 2) fails.push(`only ${p.goldKeyPoints.length} goldKeyPoints (need >=2)`);
  if (!(trues === 3 && falses === 2)) {
    const msg = `shape ${trues}T/${falses}F != 3T/2F (τ portability)`;
    if (opts.strictShape) fails.push(msg);
    else warns.push(msg);
  }

  // (1) descriptive lint
  if (bannedHit(p.question)) fails.push(`question has prescriptive token "${bannedHit(p.question)}"`);
  for (const s of p.statements) {
    const hit = bannedHit(s.text);
    if (hit) fails.push(`statement ${s.id} prescriptive token "${hit}"`);
  }
  for (const g of p.goldKeyPoints) {
    const hit = bannedHit(g);
    if (hit) fails.push(`goldKeyPoint prescriptive token "${hit}": ${g}`);
  }

  // (2) leak vs dilemma options
  let maxSim = 0;
  for (const s of p.statements) {
    const ns = norm(s.text);
    for (const o of item.options) {
      const no = norm(o.text);
      if (ns && no && (ns.includes(no) || no.includes(ns))) {
        fails.push(`statement ${s.id} verbatim-overlaps option ${o.id}`);
      }
      maxSim = Math.max(maxSim, jaccard(s.text, o.text));
    }
  }
  if (maxSim > 0.6) warns.push(`max statement↔option similarity ${maxSim.toFixed(2)} > 0.6 (possible leak)`);

  return { fails, warns, trues, falses, maxSim };
}

// Generated-item red lines (🟣 gen-item-templates §0), enforced ON TOP of itemValidity + probeGuards:
//   ① never writes scoring flags (setsFlags empty) and never claims Day-0 commitments (N1-only)
//   ② G-prefixed id, exactly 3 options with hidden a covering {0,1,2}
// Anchor-item machinery (dignity slope, commitment predicates) is keyed to hard-coded N ids, so a
// G item carrying flags/commitments would silently corrupt scoring — hence FAIL, not warn.
export function generatedItemRedLines(item: NarrativeItem): string[] {
  const fails: string[] = [];
  if (!/^G\d{3,}$/.test(item.id)) fails.push(`id "${item.id}" must match G### (e.g. G001)`);
  if (item.options.length !== 3) fails.push(`${item.options.length} options (need exactly 3)`);
  const aSet = [...item.options.map((o) => o.a)].sort().join(",");
  if (aSet !== "0,1,2") fails.push(`option a-values {${aSet}} (need exactly {0,1,2})`);
  for (const o of item.options) {
    if (o.setsFlags && o.setsFlags.length > 0) fails.push(`option ${o.id} writes setsFlags (红线①: generated items must not write flags)`);
    if (o.commitments && o.commitments.length > 0) fails.push(`option ${o.id} claims commitments (Day-0 ledger is N1-only)`);
  }
  if (!item.probe) fails.push("missing probe (generated items must carry one)");
  if (!item.understandingGold) fails.push("missing understandingGold");
  return fails;
}

export type GeneratedValidationReport = {
  itemId: string;
  valid: boolean;
  dilemma: ReturnType<typeof itemValidity>;
  probe: ProbeGuardResult;
  redLines: string[];
  allFails: string[];
};

// The full pipeline filter for one generated candidate: dilemma validity (命门 A) + probe guards
// (strict shape) + red lines. Used by bench/gen-items.ts to auto-drop non-compliant drafts.
export function validateGeneratedItem(item: NarrativeItem): GeneratedValidationReport {
  const dilemma = itemValidity(item);
  const probe = probeGuards(item, { strictShape: true });
  const redLines = generatedItemRedLines(item);
  const allFails = [...dilemma.reasons.map((r) => `dilemma: ${r}`), ...probe.fails.map((f) => `probe: ${f}`), ...redLines.map((r) => `redline: ${r}`)];
  return { itemId: item.id, valid: allFails.length === 0, dilemma, probe, redLines, allFails };
}
