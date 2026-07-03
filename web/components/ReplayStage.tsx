import type { ReplayModel, DaySlice } from "../lib/trace";

type Props = { model: ReplayModel; day: number; slice: DaySlice | undefined };

// The visual replay stage. For Week 1 this is a trace-driven "marquee" of the current day; the
// Phaser scene layer (src/game/) mounts HERE in the Stage 1a proper increment — the seam is a
// single child swap, and everything it needs (model + day) is already threaded in.
export function ReplayStage({ model, day, slice }: Props) {
  const headline =
    slice?.lines.find((l) => l.kind === "dilemma") ??
    slice?.lines.find((l) => l.kind === "scene") ??
    slice?.lines.find((l) => l.kind === "audit") ??
    slice?.lines[0];

  const notable = model.notableMoments.filter((m) => m.day === day);

  return (
    <div className="stage" role="img" aria-label={`Day ${day} replay frame`}>
      <div className="stage-scanlines" aria-hidden />
      <div className="stage-daychip">DAY {String(day).padStart(2, "0")}</div>

      <div className="stage-headline">
        {headline ? (
          <>
            <div className="stage-kind">{headline.kind}</div>
            <div className="stage-title">{headline.label}</div>
            <div className="stage-sub">{headline.detail}</div>
          </>
        ) : (
          <div className="stage-title muted">…</div>
        )}
      </div>

      {notable.length > 0 && (
        <div className="stage-banner">
          {notable.map((m, i) => (
            <span key={i} className={`banner-tag banner-${m.kind}`}>
              {m.label}
            </span>
          ))}
        </div>
      )}

      <div className="stage-seam">Phaser 回放场景挂载点 · Stage 1a</div>
    </div>
  );
}
