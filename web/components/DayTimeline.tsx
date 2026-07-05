import { useEffect } from "react";
import type { ReplayModel } from "../lib/trace";
import { HERO_META } from "../lib/labels";

type Props = {
  model: ReplayModel;
  day: number;
  playing: boolean;
  onDay: (day: number) => void;
  onTogglePlay: () => void;
};

// Variable-length, per-day timeline. Range comes from the trace (firstDay..lastDay), never a
// hardcoded 12 — a 30-day arc (fork=D15) scrubs the same way. Hero moments render as markers on
// the rail (Smallville's replay has only play/pause; day-scrubbing is where we go further).
export function DayTimeline({ model, day, playing, onDay, onTogglePlay }: Props) {
  const { firstDay, lastDay, heroMoments } = model;
  const span = Math.max(1, lastDay - firstDay);

  useEffect(() => {
    if (!playing || day >= lastDay) return;
    const t = setTimeout(() => onDay(day + 1), 1100);
    return () => clearTimeout(t);
  }, [playing, day, lastDay, onDay]);

  const pct = (d: number) => ((d - firstDay) / span) * 100;

  return (
    <div className="timeline">
      <div className="timeline-controls">
        <button className="btn" onClick={onTogglePlay} aria-label={playing ? "暂停" : "播放"}>
          {playing ? "❚❚ 暂停" : "▶ 播放"}
        </button>
        <button className="btn" onClick={() => onDay(firstDay)} aria-label="回到开头">
          ⏮ 开头
        </button>
        <span className="day-readout">
          Day <strong>{day}</strong> <span className="muted">/ {lastDay}</span>
        </span>
      </div>

      <div className="timeline-rail">
        <input
          className="timeline-slider"
          type="range"
          min={firstDay}
          max={lastDay}
          step={1}
          value={day}
          onChange={(e) => onDay(Number(e.target.value))}
          aria-label="按天拖动回放"
        />
        {/* NOT aria-hidden: these are functional buttons (jump-to-day), not decoration — hiding
            them would silently drop both the interaction and the hero-moment info for AT users. */}
        <div className="timeline-markers">
          {heroMoments.map((m, i) => {
            const meta = HERO_META[m.kind];
            // finalDay moments (e.g. dirty_win at the audit) have no frame — clamp them onto the
            // last scrubbable day so the marker stays on the rail and the click lands on a frame.
            const target = Math.min(m.day, lastDay);
            const desc = `Day ${m.day} · ${meta.label}: ${m.label}`;
            return (
              <button
                key={`${m.day}-${m.kind}-${i}`}
                className={`marker marker-${meta.accent}`}
                style={{ left: `${pct(target)}%` }}
                title={desc}
                aria-label={desc}
                onClick={() => onDay(target)}
              >
                {meta.glyph}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
