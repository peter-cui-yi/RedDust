import { useEffect, useMemo, useRef, useState } from "react";
import { dayArtFor } from "../data/dayArtAssets";
import { tasksById } from "../data/taskData";
import type { Branch, DayPlan } from "../data/types";

type DailyBriefingPanelProps = {
  plan: DayPlan;
  branch: Branch;
  onContinue: () => void;
  autoCloseMs?: number;
  mode?: "tasks" | "finalAudit";
};

function branchLabel(branch: Branch) {
  if (branch === "rescue") return "Rescue Route";
  if (branch === "lighthouse") return "Lighthouse Route";
  return "Common Route";
}

export function DailyBriefingPanel({ plan, branch, onContinue, autoCloseMs = 10000, mode = "tasks" }: DailyBriefingPanelProps) {
  const [remaining, setRemaining] = useState(Math.ceil(autoCloseMs / 1000));
  const continuedRef = useRef(false);
  const onContinueRef = useRef(onContinue);
  const dayArt = dayArtFor(plan.day, branch === "rescue" || branch === "lighthouse" ? branch : undefined);
  const recommendedTasks = useMemo(() => (plan.recommendedTasks ?? []).map((taskId) => tasksById[taskId]).filter(Boolean), [plan.recommendedTasks]);

  useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);

  useEffect(() => {
    continuedRef.current = false;
    setRemaining(Math.ceil(autoCloseMs / 1000));
    const interval = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    const timeout = window.setTimeout(() => {
      if (continuedRef.current) return;
      continuedRef.current = true;
      onContinueRef.current();
    }, autoCloseMs);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [autoCloseMs, plan.day, branch, mode]);

  function handleContinue() {
    if (continuedRef.current) return;
    continuedRef.current = true;
    onContinueRef.current();
  }

  return (
    <section className="modal-shell daily-briefing-shell" role="dialog" aria-modal="true" aria-label={`Day ${plan.day} briefing`}>
      <div className="modal-card wide-card daily-briefing-card">
        <div className="modal-heading">
          <div>
            <p className="panel-kicker">DAY {plan.day} / {branchLabel(branch)}</p>
            <h2>{plan.title}</h2>
          </div>
          <button onClick={handleContinue}>{mode === "finalAudit" ? "Open Final Audit" : `Continue Day ${plan.day}`}</button>
        </div>

        <div className="daily-briefing-hero">
          {dayArt ? <img alt="" src={dayArt.uiPath} /> : null}
          <article>
            <p>{plan.narrative}</p>
            <span>Auto continues in {remaining}s</span>
          </article>
        </div>

        <div className="daily-briefing-grid">
          <article>
            <p className="panel-kicker">AURA Executes</p>
            {recommendedTasks.length ? (
              <ul>
                {recommendedTasks.map((task) => (
                  <li key={task.id}>
                    <b>{task.id}</b>
                    <span>{task.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Final Audit only. No executable tasks open today.</p>
            )}
          </article>

          <article>
            <p className="panel-kicker">Audit Note</p>
            <p>{plan.endOfDaySummary}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
