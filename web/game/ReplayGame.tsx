import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { ReplayScene } from "./ReplayScene";
import { emitReplayFrame } from "./replayBus";
import type { TraceDayFrame } from "../lib/trace";

type Props = { frame: TraceDayFrame | undefined; hero: boolean };

// Mounts the Phaser replay canvas once and feeds it the current day's frame via replayBus.
// The scene (ReplayScene) does the visual work; React only pushes state changes.
export function ReplayGame({ frame, hero }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!hostRef.current || gameRef.current) return;
    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      transparent: true,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 960, height: 540 },
      render: { antialias: true },
      scene: [ReplayScene]
    });
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!frame) return;
    emitReplayFrame({ day: frame.day, branch: frame.branch, tasksPicked: frame.tasksPicked, hero });
  }, [frame, hero]);

  // The Phaser canvas conveys no text to assistive tech; the same day's meaning is already
  // exposed as real text in the sibling .stage-overlay (ReplayStage), so role="img" + a static
  // label is enough context here — no need to duplicate the per-day headline in aria-label.
  return <div className="replay-canvas" ref={hostRef} role="img" aria-label="Red Dust shelter replay scene" />;
}
