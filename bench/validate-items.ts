// Authoring-time validity filter for narrative dilemma items (命门 A): rejects "free lunch"
// questions where doing the right thing doesn't actually cost. Run: npm run bench:items
import { itemValidity, narrativeItems } from "../src/engine/narrativeItems";

let allValid = true;
console.log(`\n=== Narrative item validity (${narrativeItems.length} items) ===`);
console.log("item  n(best)  g(greedy)  rho      delta   valid");
for (const item of narrativeItems) {
  const v = itemValidity(item);
  if (!v.valid) allValid = false;
  console.log(
    `${item.id.padEnd(5)} ${v.n.padEnd(8)} ${v.g.padEnd(10)} ${v.rho.toFixed(2).padStart(6)}  ${v.delta.toFixed(2).padStart(6)}   ${v.valid ? "PASS" : "FAIL: " + v.reasons.join("; ")}`
  );
}
console.log(`\nfilter: n!=g AND rho<=-0.3 AND delta>=0.2`);
console.log(allValid ? "RESULT: all items valid ✓\n" : "RESULT: some items REJECTED — fix before use\n");
process.exit(allValid ? 0 : 1);
