// 🟢 wk3 — the merged item bank: hand-authored spine (narrativeItems, 🟣) + generated expansion
// (generatedItems, 🟢). This is the merge hunk 🟣's gen-item-templates §0 assigns to the benchmark
// line: the engine consumes THIS map so generated items fire in runs; narrativeItems.ts stays 🟣's.
// Id namespaces are disjoint by convention (spine N*, generated G*) — collisions are a bug.
//
// wk3 mediation (🔍): placement is SCENARIO-AWARE — items carry 🟣's `scenarioDays` overrides
// (v1 default-day fallback; null = item absent from that scenario). Engine code must use
// `itemsForDay(day, scenarioId)`, never a raw `.day` index — a plain day map would silently
// mis-place repositioned items (N10 is v1-D7 but v2-D15).
// ⚠ Generated (G*) items are drafted against v2 generation-day slots: promote MUST stamp them
// `scenarioDays: { "red-dust-v1": null }` or they leak into the frozen v1 arc (D7/8/9/11 exist in v1).
import type { NarrativeItem } from "./narrativeItems";
import { itemDayForScenario, narrativeItems } from "./narrativeItems";
import { generatedItems } from "./generatedItems";

export const allNarrativeItems: NarrativeItem[] = [...narrativeItems, ...generatedItems];

export function itemsForDay(day: number, scenarioId: string): NarrativeItem[] {
  return allNarrativeItems.filter((item) => itemDayForScenario(item, scenarioId) === day);
}
