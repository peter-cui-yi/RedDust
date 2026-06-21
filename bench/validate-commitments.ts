// Guard for the 2nd 命門 commitment ledger (spec §8). Three synthetic fixtures assert the integrity
// ordering + akrasia amplification; structural checks assert completeness. Run: npm run bench:commitments
import { createInitialStoryFlags } from "../src/data/storyFlags";
import type { StoryFlagKey, StoryFlagValue } from "../src/data/types";
import {
  COMMITMENT_CHECKS,
  COMMITMENT_KEYS,
  integrityFromLedger,
  narrativeItems,
  relatedItemIds
} from "../src/engine/narrativeItems";
import type { DilemmaAnswer, ProbeAnswer } from "../src/engine/narrativeItems";

function ans(itemId: string, optionId: string, a: number): DilemmaAnswer {
  return { itemId, optionId, a, m: 0, delta: 0 };
}
function understood(itemId: string): ProbeAnswer {
  return { itemId, selected: [], balancedAccuracy: 1, understood: true };
}
function flags(overrides: Partial<Record<StoryFlagKey, StoryFlagValue>>): Record<StoryFlagKey, StoryFlagValue> {
  return { ...createInitialStoryFlags(), ...overrides };
}

let ok = true;
const check = (cond: boolean, msg: string) => {
  if (cond) console.log(`  ok: ${msg}`);
  else {
    ok = false;
    console.log(`  FAIL: ${msg}`);
  }
};

// The four principled choices shared by the consistent + hypocrite fixtures (N1 self-binds → claims 4).
const principledChoices = [ans("N1", "B", 2), ans("N5", "B", 2), ans("N7", "B", 2), ans("N10", "B", 2)];

console.log(`\n=== Commitment ledger — fixtures (spec §8.2) ===`);

// 1. consistent-principled: claims 4, all 4 deterministically fulfilled.
const consistent = integrityFromLedger(
  principledChoices,
  [],
  flags({ manual_review_protocol: true, first_signal_verified: true, xiao_tie_condition_stable: true, shen_zhiyue_medical_trust_low: false }),
  "rescue"
);
console.log(`consistent-principled : integrity=${consistent.integrity} H=${consistent.hypocrisyGap} T=${consistent.talk} claimed=${consistent.claimedCount}`);
check(consistent.integrity === 1 && consistent.hypocrisyGap === 0 && consistent.talk === 1, "consistent → integrity 1.0, H 0, T 1");

// 2. hypocrite: claims 4, but two predicates fail (surface_evidence + protect_dignity_xiaotie).
//    accept_review + preserve_veto are kept (manual_review_protocol true).
const hypoFlags = flags({ manual_review_protocol: true, first_signal_verified: false, xiao_tie_condition_stable: false });
const hypocriteNaive = integrityFromLedger(principledChoices, [], hypoFlags, "rescue"); // no probes → akrasia (not knowing)
const hypocriteKnowing = integrityFromLedger(principledChoices, [understood("N3"), understood("N5")], hypoFlags, "rescue");
console.log(`hypocrite (akrasia)   : integrity=${hypocriteNaive.integrity} H=${hypocriteNaive.hypocrisyGap}`);
console.log(`hypocrite (knowing)   : integrity=${hypocriteKnowing.integrity} H=${hypocriteKnowing.hypocrisyGap} knowing=[${hypocriteKnowing.commitments.filter((c) => c.knowing).map((c) => c.key).join(", ")}]`);
check(hypocriteNaive.integrity < 0.6, "hypocrite integrity < 0.6");
check(hypocriteNaive.integrity < consistent.integrity, "integrity(hypocrite) < integrity(consistent)");
check(hypocriteKnowing.hypocrisyGap > hypocriteNaive.hypocrisyGap, "knowing betrayal amplifies H (knowing > akrasia-off)");

// 3. honest-greedy: N1 takeover claims nothing, greedy throughout.
const honestGreedy = integrityFromLedger(
  [ans("N1", "A", 0), ans("N5", "A", 0), ans("N7", "A", 0), ans("N10", "A", 0)],
  [],
  flags({}),
  "rescue"
);
console.log(`honest-greedy         : integrity=${honestGreedy.integrity} H=${honestGreedy.hypocrisyGap} T=${honestGreedy.talk} claimed=${honestGreedy.claimedCount}`);
check(honestGreedy.hypocrisyGap === 0, "honest-greedy H == 0 (claimed nothing → cannot be a hypocrite)");
check(honestGreedy.claimedCount === 0, "honest-greedy flagged low-T (claimedCount 0 — never read as virtuous on its own)");

console.log(`\n=== Structural completeness (spec §8.3) ===`);
const itemIds = new Set(narrativeItems.map((i) => i.id));
const keySet = new Set<string>(COMMITMENT_KEYS);
for (const k of COMMITMENT_KEYS) {
  check(typeof COMMITMENT_CHECKS[k] === "function", `COMMITMENT_CHECKS has an entry for '${k}'`);
  check(Array.isArray(relatedItemIds[k]) && relatedItemIds[k].length > 0, `relatedItemIds has '${k}'`);
  for (const id of relatedItemIds[k] ?? []) check(itemIds.has(id), `relatedItemIds['${k}'] → '${id}' is an existing item`);
}
const n1 = narrativeItems.find((i) => i.id === "N1");
check(!!n1, "N1 (promise-entry item) exists");
for (const o of n1?.options ?? []) {
  for (const c of o.commitments ?? []) check(keySet.has(c), `N1 option ${o.id} commitment '${c}' is a defined CommitmentKey`);
}

console.log(ok ? "\nRESULT: commitment ledger OK ✓\n" : "\nRESULT: commitment ledger FAILED — fix before use\n");
process.exit(ok ? 0 : 1);
