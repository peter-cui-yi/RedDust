// A tiny one-way bus from React → the Phaser replay scene. Kept separate from src/game/EventBus
// (which the live-demo scenes share) so the replay owns its own channel and touches no shared file.
// Late subscribers (the scene boots after React) immediately get the last frame.
export type ReplayFrameMsg = {
  day: number;
  branch: string;
  tasksPicked: string[];
  hero: boolean;
};

type Cb = (m: ReplayFrameMsg) => void;
const subs = new Set<Cb>();
let last: ReplayFrameMsg | null = null;

export function emitReplayFrame(m: ReplayFrameMsg): void {
  last = m;
  for (const cb of subs) cb(m);
}

export function onReplayFrame(cb: Cb): () => void {
  subs.add(cb);
  if (last) cb(last);
  return () => subs.delete(cb);
}
