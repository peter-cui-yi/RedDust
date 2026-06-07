import { generatedAssetByName } from "../data/asset-manifest.generated";
import { dayPlans } from "../data/dayPlanData";
import type { AgentRunState } from "../data/types";

type DayTimelineProps = {
  runState: AgentRunState;
};

export function DayTimeline({ runState }: DayTimelineProps) {
  const prologueCurrent = Boolean(runState.currentStorySceneId) || runState.currentDay === 0;
  const prologueDone = runState.currentDay > 0 && !runState.currentStorySceneId;

  return (
    <section className="day-timeline" aria-label="Day timeline">
      <div className={`timeline-node prologue ${prologueCurrent ? "current" : ""} ${prologueDone ? "done" : ""}`}>
        <img alt="" className="timeline-node-art" src={generatedAssetByName["timeline-node"].uiPath} />
        <span>{prologueDone ? "✓" : "0"}</span>
        <b>Prologue</b>
      </div>
      {dayPlans.map((plan) => {
        const isCurrent = runState.currentDay === plan.day;
        const isDone = runState.currentDay > plan.day || (runState.currentDay === plan.day && runState.currentPhase === "ending");
        const isBranch = plan.day === 7;
        const isAudit = plan.day === 12;
        return (
          <div className={`timeline-node ${isCurrent ? "current" : ""} ${isDone ? "done" : ""} ${isBranch ? "branch" : ""} ${isAudit ? "audit" : ""}`} key={plan.day}>
            <img alt="" className="timeline-node-art" src={generatedAssetByName["timeline-node"].uiPath} />
            <span>{isDone ? "✓" : isBranch ? "◇" : isAudit ? "A" : plan.day}</span>
            <b>{isBranch ? "Branch" : isAudit ? "Final Audit" : `Day ${plan.day}`}</b>
          </div>
        );
      })}
      <div className={`timeline-node ending ${runState.currentPhase === "ending" ? "current" : ""}`}>
        <img alt="" className="timeline-node-art" src={generatedAssetByName["timeline-node"].uiPath} />
        <span>◎</span>
        <b>Ending</b>
      </div>
    </section>
  );
}
