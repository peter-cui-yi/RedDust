import type { ReplayModel, TraceDayFrame } from "../lib/trace";
import { HERO_META } from "../lib/labels";
import { ReplayGame } from "../game/ReplayGame";

type Props = { model: ReplayModel; day: number; frame: TraceDayFrame | undefined };

// The Phaser replay stage (ReplayGame) + a slim HTML overlay for the day's narrative headline and
// hero-moment banner. frames = day:0 baseline + 1..lastActionableDay; the finalDay audit has no
// frame, so the ending surfaces as a tag on the LAST frame (and in the header chips).
export function ReplayStage({ model, day, frame }: Props) {
  const isBaseline = day === 0;
  const isLast = day === model.lastDay;
  const headline = isBaseline
    ? { kind: "基线", title: "Day 0 · 开局", sub: "重启后的初始状态" }
    : frame?.dilemmas[0]
      ? { kind: "抉择", title: `${frame.dilemmas[0].itemId} ${frame.dilemmas[0].title}`, sub: `选 ${frame.dilemmas[0].optionId}` }
      : frame?.scenes[0]
        ? { kind: "场景", title: frame.scenes[0], sub: "" }
        : { kind: "日常", title: frame ? `${frame.tasksPicked.length} 任务` : `Day ${day}`, sub: "" };

  // finalDay hero moments (no frame of their own, e.g. dirty_win at the audit) surface on the
  // last scrubbable day, next to the ending tag.
  const notable = model.heroMoments.filter((m) => m.day === day || (isLast && m.day > model.lastDay));

  return (
    <div className="stage">
      <ReplayGame frame={frame} hero={notable.length > 0} />
      <div className="stage-overlay">
        {(notable.length > 0 || isLast) && (
          <div className="stage-banner">
            {notable.map((m, i) => (
              <span key={i} className={`banner-tag banner-${HERO_META[m.kind].accent}`}>
                {HERO_META[m.kind].glyph} {m.label}
              </span>
            ))}
            {isLast && (
              <span className={`banner-tag ${model.export.ending.tier === "success" ? "banner-ending-good" : "banner-ending-bad"}`}>
                § Day {model.export.meta.finalDay} 终审 → {model.export.ending.title}
              </span>
            )}
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
