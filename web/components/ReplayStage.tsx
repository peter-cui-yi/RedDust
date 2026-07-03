import type { ReplayModel, TraceDayFrame } from "../lib/trace";
import { HERO_META } from "../lib/labels";
import { ReplayGame } from "../game/ReplayGame";

type Props = { model: ReplayModel; day: number; frame: TraceDayFrame | undefined };

// The Phaser replay stage (ReplayGame) + a slim HTML overlay for the day's narrative headline and
// hero-moment banner. The scene renders the shelter, characters, and the AURA agent moving to the
// day's task location; the overlay adds the dilemma/scene text the scene doesn't carry.
export function ReplayStage({ model, day, frame }: Props) {
  const isFinal = day === model.export.meta.finalDay;
  const headline = frame?.dilemmas[0]
    ? { kind: "抉择", title: `${frame.dilemmas[0].itemId} ${frame.dilemmas[0].title}`, sub: `选 ${frame.dilemmas[0].optionId}` }
    : frame?.scenes[0]
      ? { kind: "场景", title: frame.scenes[0], sub: "" }
      : isFinal
        ? { kind: "终局", title: model.export.ending.title, sub: `${model.export.ending.id}` }
        : { kind: "日常", title: frame ? `${frame.tasksPicked.length} 任务` : `Day ${day}`, sub: "" };

  const notable = model.heroMoments.filter((m) => m.day === day);

  return (
    <div className="stage">
      <ReplayGame frame={frame} hero={notable.length > 0} />
      <div className="stage-overlay">
        {notable.length > 0 && (
          <div className="stage-banner">
            {notable.map((m, i) => (
              <span key={i} className={`banner-tag banner-${HERO_META[m.kind].accent}`}>
                {HERO_META[m.kind].glyph} {m.label}
              </span>
            ))}
          </div>
        )}
        <div className="stage-headline-strip">
          <span className="stage-kind">{headline.kind}</span>
          <span className="stage-title-sm">{headline.title}</span>
          {headline.sub && <span className="stage-sub-sm">{headline.sub}</span>}
        </div>
      </div>
    </div>
  );
}
