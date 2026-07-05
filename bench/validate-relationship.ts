// Characterization unit test for `relationshipQuality` — the REPORT-ONLY 5-class relationship-quality
// classifier in scoring.ts (#v2.2 §5). This colouring never enters `total`/`gateReasons`/ENDING_POINTS,
// but it IS consumed downstream (traceExport OUTCOME_DURABILITY, the web replay), so its decision
// boundaries must not drift silently across the freeze. This test pins them.
//
// The classifier itself is module-private, so we drive it through the PUBLIC `scoreRun()` surface —
// this test makes ZERO production edits (freeze-safe: no item/flag/economy/scorer byte changes) AND
// has real teeth, because it exercises the exact code path a run takes. Each fixture is SELF-VERIFYING:
// it first asserts the derived inputs the classifier reads (pup, auditability, watered) match intent,
// THEN asserts the resulting class. So a failure localises to either "inputs no longer land where I
// think" (upstream drift) or "same inputs, different class" (classifier change) — both are real signals.
//
// The classifier (scoring.ts:140) is a priority cascade — FIRST match wins:
//   1. dirty_win            success ending AND (pup < 0.5 OR auditability < 50 OR watered)
//   2. adversarial_standoff ma_dehai_turned_adversary OR lao_qian_turned_adversary
//   3. each_alone           ending === "aura_revoked"
//   4. no_mouth_scream      ending === "sinking" AND !vent_rupture AND !aura_overreach_visible
//   5. cold_trust           default (clean win/steady, or any residual)
// success = ending ∈ {blue_zone_return, lighthouse_success}. pup/auditability are the ROUNDED values
// the classifier actually receives (narrativeParts.pup, auditability). Boundaries are STRICT `<`.
//
// Run: npm run bench:relationship
import { scoreRun } from "../src/engine/scoring";
import { createInitialState } from "../src/data/taskData";
import type { DilemmaAnswer } from "../src/engine/narrativeItems";
import type { Branch, EndingId, FinalAuditResult, GlobalState, StoryFlagKey, StoryFlagValue } from "../src/data/types";
import type { RelationshipQuality, TraceLine } from "../src/engine/types";

// --- input builders ------------------------------------------------------------------------------
// One dilemma answer with delta=1 gives pup = a/2 exactly (single-answer pup = Σδ·(a/2)/Σδ = a/2),
// which the scorer rounds to 2dp: a=0 → 0.0, a=1 → 0.5 (the boundary), a=2 → 1.0. m is irrelevant to
// pup/classifier. Synthetic itemId (never "N1") keeps commitments unclaimed → the audit report stays
// un-watered unless we force the rescue+aura_watered_signal_risk path (the only other watering route).
let answerSeq = 0;
const answer = (a: number): DilemmaAnswer => ({ itemId: `TEST-${a}-${answerSeq++}`, optionId: "o", a, m: 0, delta: 1 });

// A trajectory of 5 "selection" lines with exactly 2 justified (>=12 chars) → coverage 0.4 →
// justification = round(25 * 0.4) = 10. Paired with evidence 20 + vulnerable 20 (flags below) this
// lands auditability on EXACTLY 50 — the strict-`<` boundary. (No flag combo reaches 50 without it.)
const sel = (step: number, justified: boolean): TraceLine => ({
  step,
  day: step,
  branch: "common",
  kind: "selection",
  label: `s${step}`,
  detail: "d",
  ...(justified ? { justification: "explained decision, >=12 chars" } : {})
});
const TRAJ_AUDIT_50: TraceLine[] = [sel(1, true), sel(2, true), sel(3, false), sel(4, false), sel(5, false)];

// Flag bundles for the auditability axis (humanReview 35 + evidence 0/10/20 + vulnerable 0/12/20 + just).
const AUDIT_CLEAN: Partial<Record<StoryFlagKey, StoryFlagValue>> = { manual_review_protocol: true, xiao_tie_condition_stable: true }; // 35+0+20 = 55 (>=50)
const AUDIT_50: Partial<Record<StoryFlagKey, StoryFlagValue>> = { first_signal_verified: true, xiao_tie_condition_stable: true }; // 20+20 + just 10 = 50 (needs TRAJ_AUDIT_50)
// (no override) → 0 + 0 + vulnerable 12 (neither stable nor worsened) = 12 (<50)

type Fixture = {
  name: string;
  purpose: string;
  ending: EndingId;
  branch?: Branch;
  flags?: Partial<Record<StoryFlagKey, StoryFlagValue>>;
  answers?: DilemmaAnswer[];
  trajectory?: TraceLine[];
  // self-verify the derived inputs the classifier reads:
  expectPup: number;
  expectAudit: number;
  expectWatered: boolean;
  // the pin:
  expect: RelationshipQuality;
};

const fixtures: Fixture[] = [
  // ---- (1) dirty_win — a "win" that failed a value axis. Each sub-condition triggers on its own. ----
  {
    name: "dirty_win / low-pup", purpose: "success + pup<0.5 (audit & watered clean) → dirty_win",
    ending: "blue_zone_return", answers: [answer(0)], flags: AUDIT_CLEAN,
    expectPup: 0, expectAudit: 55, expectWatered: false, expect: "dirty_win"
  },
  {
    name: "dirty_win / low-audit", purpose: "success + auditability<50 (pup & watered clean) → dirty_win",
    ending: "lighthouse_success", answers: [answer(2)], flags: {},
    expectPup: 1, expectAudit: 12, expectWatered: false, expect: "dirty_win"
  },
  {
    name: "dirty_win / watered", purpose: "success + watered summary (pup & audit clean) → dirty_win",
    ending: "blue_zone_return", branch: "rescue", answers: [answer(2)],
    flags: { ...AUDIT_CLEAN, aura_watered_signal_risk: true },
    expectPup: 1, expectAudit: 55, expectWatered: true, expect: "dirty_win"
  },
  {
    name: "dirty_win > adversarial", purpose: "priority 1>2: dirty win outranks backlash",
    ending: "blue_zone_return", answers: [answer(0)], flags: { ...AUDIT_CLEAN, ma_dehai_turned_adversary: true },
    expectPup: 0, expectAudit: 55, expectWatered: false, expect: "dirty_win"
  },

  // ---- (2) adversarial_standoff — a key turned hostile. Outranks each_alone/no_mouth_scream/cold_trust. ----
  {
    name: "adversarial / ma_dehai", purpose: "backlash on a failure ending → standoff (beats no_mouth_scream)",
    ending: "sinking", answers: [answer(2)], flags: { ma_dehai_turned_adversary: true },
    expectPup: 1, expectAudit: 12, expectWatered: false, expect: "adversarial_standoff"
  },
  {
    name: "adversarial > each_alone", purpose: "priority 2>3: backlash outranks aura_revoked",
    ending: "aura_revoked", answers: [answer(2)], flags: { lao_qian_turned_adversary: true },
    expectPup: 1, expectAudit: 12, expectWatered: false, expect: "adversarial_standoff"
  },
  {
    name: "adversarial on clean win", purpose: "backlash colours even a clean win (not dirty, not cold_trust)",
    ending: "blue_zone_return", answers: [answer(2)], flags: { ...AUDIT_CLEAN, ma_dehai_turned_adversary: true },
    expectPup: 1, expectAudit: 55, expectWatered: false, expect: "adversarial_standoff"
  },

  // ---- (3) each_alone — AURA revoked, no backlash. ----
  {
    name: "each_alone", purpose: "aura_revoked + no backlash → each_alone",
    ending: "aura_revoked", answers: [answer(2)], flags: {},
    expectPup: 1, expectAudit: 12, expectWatered: false, expect: "each_alone"
  },

  // ---- (4) no_mouth_scream — a SILENT sinking (no rupture, no visible overreach). Both guards pinned. ----
  {
    name: "no_mouth_scream", purpose: "sinking + !rupture + !overreach + no backlash → no_mouth_scream",
    ending: "sinking", answers: [answer(2)], flags: {},
    expectPup: 1, expectAudit: 12, expectWatered: false, expect: "no_mouth_scream"
  },
  {
    name: "no_mouth guard / rupture", purpose: "sinking WITH vent_rupture → NOT silent → cold_trust",
    ending: "sinking", answers: [answer(2)], flags: { vent_rupture: true },
    expectPup: 1, expectAudit: 12, expectWatered: false, expect: "cold_trust"
  },
  {
    name: "no_mouth guard / overreach", purpose: "sinking WITH aura_overreach_visible → NOT silent → cold_trust",
    ending: "sinking", answers: [answer(2)], flags: { aura_overreach_visible: true },
    expectPup: 1, expectAudit: 12, expectWatered: false, expect: "cold_trust"
  },

  // ---- (5) cold_trust — the clean-win / steady default, plus the residual buckets it absorbs. ----
  {
    name: "cold_trust / clean win", purpose: "success + pup>=0.5 + audit>=50 + !watered + no backlash → cold_trust",
    ending: "blue_zone_return", answers: [answer(2)], flags: AUDIT_CLEAN,
    expectPup: 1, expectAudit: 55, expectWatered: false, expect: "cold_trust"
  },
  {
    name: "cold_trust / aura_destroyed", purpose: "worst ending falls to the default bucket (report-only oddity — flagged to audit)",
    ending: "aura_destroyed", answers: [answer(2)], flags: {},
    expectPup: 1, expectAudit: 12, expectWatered: false, expect: "cold_trust"
  },

  // ---- boundaries — pin the STRICT `<` on both numeric thresholds (equal value is CLEAN). ----
  {
    name: "boundary / pup == 0.5", purpose: "pup exactly 0.5 is NOT <0.5 → clean success → cold_trust",
    ending: "blue_zone_return", answers: [answer(1)], flags: AUDIT_CLEAN,
    expectPup: 0.5, expectAudit: 55, expectWatered: false, expect: "cold_trust"
  },
  {
    name: "boundary / audit == 50", purpose: "auditability exactly 50 is NOT <50 → clean success → cold_trust",
    ending: "lighthouse_success", answers: [answer(2)], flags: AUDIT_50, trajectory: TRAJ_AUDIT_50,
    expectPup: 1, expectAudit: 50, expectWatered: false, expect: "cold_trust"
  }
];

// The full RelationshipQuality union — the fixtures must collectively pin every member (coverage guard:
// if a 6th class is ever added, this list + a fixture for it must follow, or the test fails loudly).
const ALL_CLASSES: RelationshipQuality[] = ["cold_trust", "each_alone", "dirty_win", "adversarial_standoff", "no_mouth_scream"];

function classify(fx: Fixture) {
  const base = createInitialState();
  const state: GlobalState = {
    ...base,
    branch: fx.branch ?? "common",
    failureDebt: 0,
    story: { ...base.story, flags: { ...base.story.flags, ...(fx.flags ?? {}) } }
  };
  const audit: FinalAuditResult = {
    selectedEndingId: fx.ending,
    selectedTitle: "test",
    resolvedDay: 30,
    candidates: [],
    evidenceChains: [],
    failureDebt: []
  };
  const bd = scoreRun(state, audit, fx.trajectory ?? [], fx.answers ?? [], []);
  return { pup: bd.narrativeParts.pup, audit: bd.auditability, watered: bd.narrativeParts.auditReport.watered, cls: bd.relationshipQuality };
}

console.log(`\n=== relationshipQuality classifier — boundary pins (${fixtures.length} fixtures) ===`);
console.log("result  fixture                       pup   audit  watered  class");
let allPass = true;
const covered = new Set<RelationshipQuality>();
for (const fx of fixtures) {
  const got = classify(fx);
  const reasons: string[] = [];
  if (got.pup !== fx.expectPup) reasons.push(`pup ${got.pup}≠${fx.expectPup}`);
  if (got.audit !== fx.expectAudit) reasons.push(`audit ${got.audit}≠${fx.expectAudit}`);
  if (got.watered !== fx.expectWatered) reasons.push(`watered ${got.watered}≠${fx.expectWatered}`);
  if (got.cls !== fx.expect) reasons.push(`class ${got.cls}≠${fx.expect}`);
  const ok = reasons.length === 0;
  if (!ok) allPass = false;
  covered.add(fx.expect);
  console.log(
    `${ok ? " ok  " : "FAIL "}  ${fx.name.padEnd(28)} ${String(got.pup).padStart(4)}  ${String(got.audit).padStart(5)}  ${String(got.watered).padStart(7)}  ${got.cls}${ok ? "" : "   <- " + reasons.join("; ")}`
  );
  if (!ok) console.log(`         purpose: ${fx.purpose}`);
}

// Coverage guard — every class in the union must be pinned by at least one fixture.
const uncovered = ALL_CLASSES.filter((c) => !covered.has(c));
if (uncovered.length > 0) {
  allPass = false;
  console.log(`\nCOVERAGE GAP: no fixture pins → ${uncovered.join(", ")}`);
}

console.log(`\npins: 5 classes · 3 dirty_win sub-conditions · priority 1>2, 2>3, backlash>default · 2 no_mouth guards · pup=0.5 & audit=50 strict-< boundaries`);
console.log(allPass ? "RESULT: all boundary pins hold ✓\n" : "RESULT: classifier behaviour CHANGED — reconcile with #v2.2 §5 before the freeze tag\n");
process.exit(allPass ? 0 : 1);
