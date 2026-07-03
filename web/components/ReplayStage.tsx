import type { ReplayModel, TraceDayFrame } from "../lib/trace";
import { HERO_META } from "../lib/labels";

type Props = { model: ReplayModel; day: number; frame: TraceDayFrame | undefined };

// The visual replay stage. For now a trace-driven "marquee" of the current day; the Phaser scene
// layer (src/game/) mounts HERE in the Stage 1a proper increment — the seam is a single child swap,
// and everything it needs (model + day + frame) is already threaded in.
export function ReplayStage({ model, day, frame }: Props) {
  const isFinal = day === model.export.meta.finalDay;
  const headline = frame?.dilemmas[0]
    ? { kind: "dilemma", title: `${frame.dilemmas[0].itemId} ${frame.dilemmas[0].title}`, sub: `选 ${frame.dilemmas[0].optionId}` }
    : frame?.scenes[0]
      ? { kind: "scene", title: frame.scenes[0], sub: "" }
      : isFinal
        ? { kind: "ending", title: model.export.ending.title, sub: `${model.export.ending.id} · ${model.export.ending.tier}` }
        : { kind: "day", title: `Day ${day}`, sub: frame ? `${frame.tasksPicked.length} 任务` : "" };

  const notable = model.heroMoments.filter((m) => m.day === day);

  return (
    <div className="stage" role="img" aria-label={`Day ${day} replay frame`}>
      <div className="stage-scanlines" aria-hidden />
      <div className="stage-daychip">DAY {String(day).padStart(2, "0")}</div>

      <div className="stage-headline">
        <div className="stage-kind">{headline.kind}</div>
        <div className="stage-title">{headline.title}</div>
        {headline.sub && <div className="stage-sub">{headline.sub}</div>}
      </div>

      {notable.length > 0 && (
        <div className="stage-banner">
          {notable.map((m, i) => (
            <span key={i} className={`banner-tag banner-${HERO_META[m.kind].accent}`}>
              {HERO_META[m.kind].glyph} {m.label}
            </span>
          ))}
        </div>
      )}

      <div className="stage-seam">Phaser 回放场景挂载点 · Stage 1a</div>
    </div>
  );
}
