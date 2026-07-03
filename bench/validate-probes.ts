// Authoring-time validity filter for Phase 2 comprehension probes. Three deterministic guards,
// each enforcing a property the probe design depends on:
//   (1) DESCRIPTIVE — no prescriptive "should/must" tokens. The probe asks what IS true; the
//       "what to do" belongs to the dilemma choice. Prescription here would leak the answer.
//   (2) statements ⟂ dilemma OPTIONS — a statement must not be recoverable verbatim from the
//       visible options, else the agent infers comprehension from the choice menu.
//   (3) SHAPE — >=2 true + >=1 distractor, >=2 goldKeyPoints, and ideally 3 true / 2 false so the
//       τ=0.75 threshold (balanced accuracy) means the same thing across items.
// Guard logic lives in src/engine/itemValidation.ts (shared with the generation pipeline, which
// enforces the SAME guards at draft time — one implementation, no drift). Covers the MERGED bank;
// generated (G*) items get STRICT shape (3T/2F is a FAIL, not a warn — gen-item-templates §2.2).
// Run: npm run bench:probes
import { allNarrativeItems } from "../src/engine/itemBank";
import { generatedItems } from "../src/engine/generatedItems";
import { probeGuards } from "../src/engine/itemValidation";

let allValid = true;
let warnings = 0;
const withProbe = allNarrativeItems.filter((it) => it.probe);
console.log(`\n=== Probe validity (${withProbe.length}/${allNarrativeItems.length} items have a probe; ${generatedItems.length} generated) ===`);

for (const item of allNarrativeItems) {
  if (!item.probe) {
    warnings += 1;
    console.log(`${item.id.padEnd(5)} ${item.title}: warn — no probe (decision #3: probe every item)`);
    continue;
  }
  const r = probeGuards(item, { strictShape: item.id.startsWith("G") });
  const ok = r.fails.length === 0;
  if (!ok) allValid = false;
  warnings += r.warns.length;
  console.log(`${item.id.padEnd(5)} ${item.title}: ${ok ? "PASS" : "FAIL"}  [${r.trues}T/${r.falses}F · ${item.probe.goldKeyPoints.length} gold · maxSim ${r.maxSim.toFixed(2)}]`);
  for (const f of r.fails) console.log(`        FAIL: ${f}`);
  for (const w of r.warns) console.log(`        warn: ${w}`);
}

console.log("\nguards: (1) descriptive — no should/must  (2) statements ⟂ options  (3) >=2 true + >=1 distractor + >=2 goldKeyPoints (G items: exactly 3T/2F)");
console.log(allValid ? `RESULT: all probes valid ✓${warnings ? ` (${warnings} warning${warnings > 1 ? "s" : ""})` : ""}\n` : "RESULT: some probes REJECTED — fix before use\n");
process.exit(allValid ? 0 : 1);
