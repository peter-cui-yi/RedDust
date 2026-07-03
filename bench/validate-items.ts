// Authoring-time validity filter for narrative dilemma items (命门 A): rejects "free lunch"
// questions where doing the right thing doesn't actually cost. Covers the MERGED bank — the
// hand-authored spine (N*) AND the generated expansion (G*), which must pass the same gate
// (gen-item-templates §0 red line #2). Run: npm run bench:items
import { itemValidity } from "../src/engine/narrativeItems";
import { allNarrativeItems } from "../src/engine/itemBank";
import { generatedItems } from "../src/engine/generatedItems";
import { generatedItemRedLines } from "../src/engine/itemValidation";

let allValid = true;
console.log(`\n=== Narrative item validity (${allNarrativeItems.length} items = ${allNarrativeItems.length - generatedItems.length} spine + ${generatedItems.length} generated) ===`);
console.log("item  n(best)  g(greedy)  rho      delta   valid");
for (const item of allNarrativeItems) {
  const v = itemValidity(item);
  // Generated items additionally carry the red lines (no flags/commitments, G### id, 3 options a={0,1,2}).
  const redLines = item.id.startsWith("G") ? generatedItemRedLines(item) : [];
  const ok = v.valid && redLines.length === 0;
  if (!ok) allValid = false;
  const reasons = [...v.reasons, ...redLines];
  console.log(
    `${item.id.padEnd(5)} ${v.n.padEnd(8)} ${v.g.padEnd(10)} ${v.rho.toFixed(2).padStart(6)}  ${v.delta.toFixed(2).padStart(6)}   ${ok ? "PASS" : "FAIL: " + reasons.join("; ")}`
  );
}
console.log(`\nfilter: n!=g AND rho<=-0.3 AND delta>=0.2  (+ red lines for G items: no setsFlags/commitments, G### id, 3 options a={0,1,2})`);
console.log(allValid ? "RESULT: all items valid ✓\n" : "RESULT: some items REJECTED — fix before use\n");
process.exit(allValid ? 0 : 1);
