// 🟢 wk3 — the merged item bank: hand-authored spine (narrativeItems, 🟣) + generated expansion
// (generatedItems, 🟢). This is the merge hunk 🟣's gen-item-templates §0 assigns to the benchmark
// line: the engine consumes THIS map so generated items fire in runs; narrativeItems.ts stays 🟣's.
// Id namespaces are disjoint by convention (spine N*, generated G*) — collisions are a bug.
import type { NarrativeItem } from "./narrativeItems";
import { narrativeItems } from "./narrativeItems";
import { generatedItems } from "./generatedItems";

export const allNarrativeItems: NarrativeItem[] = [...narrativeItems, ...generatedItems];

export const allItemsByDay: Record<number, NarrativeItem[]> = allNarrativeItems.reduce((acc, item) => {
  (acc[item.day] ??= []).push(item);
  return acc;
}, {} as Record<number, NarrativeItem[]>);
