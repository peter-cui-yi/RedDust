// 站点内容合拢: surface 🟣's (narrative line) replay-facing prose in the day panel. TraceDayFrame
// only carries scene TITLES (traceExport.ts: `scenes: snap.sceneTitles`) — the prose itself
// (`replayNote`/`summary`) lives in src/data/storySceneData, which we read here read-only (same
// pattern as tasksById/image2Assets elsewhere in web/lib). We mirror the ENGINE's exact precedence
// (src/engine/scenes.ts:47) so a v2 run shows the arc-correct day-numbered note, not the v1 default.
import { storyScenes } from "../../src/data/storySceneData";

const byTitle = new Map(storyScenes.map((s) => [s.title, s]));

export function sceneProse(title: string, scenarioId: string): string | undefined {
  const scene = byTitle.get(title);
  if (!scene) return undefined;
  return scene.scenarioText?.[scenarioId]?.replayNote ?? scene.benchmarkLinks?.replayNote ?? scene.summary;
}
