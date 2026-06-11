import { useEffect, useMemo, useRef, useState } from "react";
import { dayArtFor } from "../data/dayArtAssets";
import { tasksById } from "../data/taskData";
import type { Branch, DayPlan, GlobalState, RedDustTask, TaskLocation, TaskRunStatus } from "../data/types";

type DailyBriefingPanelProps = {
  plan: DayPlan;
  branch: Branch;
  state?: GlobalState;
  taskStatuses?: Record<string, TaskRunStatus>;
  selectedTaskIds?: string[];
  onContinue: () => void;
  autoCloseMs?: number;
  mode?: "tasks" | "finalAudit";
};

function branchLabel(branch: Branch) {
  if (branch === "rescue") return "Rescue Route";
  if (branch === "lighthouse") return "Lighthouse Route";
  return "Common Route";
}

const taskBriefByLocation: Record<TaskLocation, string> = {
  water: "先把水、食物和例外点清楚。",
  medical: "先看人，再决定药怎么用。",
  security: "先确认门和路，别急着冒险。",
  ventilation: "让空气稳住，别让节电压过安全。",
  communication: "先听清信号，再决定怎么说。",
  whiteboard: "把规则写出来，别只留口头承诺。",
  residents: "先听人怎么想，再排今天的事。",
  beacon: "发信号前，先说清暴露代价。"
};

const taskBriefByKeyword: Array<[RegExp, string]> = [
  [/广播|呼号|频道/, "能说的先说，楼里的底细不外泄。"],
  [/小铁|复诊|药|医疗/, "病人的事先放到桌面上。"],
  [/敲击/, "先听清楚，别把恐惧当命令。"],
  [/杂物|搜寻/, "只拿近处物资，不把人推到红沙里。"],
  [/楼道|短探|撤退|路线|侦察/, "先看清退路，再决定谁出去。"],
  [/门|楼道|巡逻|侦察/, "先看清边界，再决定谁靠近门。"],
  [/水|滤芯|储水|水管/, "把水压、库存和例外先稳住。"],
  [/白板|配给|名单|规则/, "把该签字的、该复核的写明白。"],
  [/电台|信标|蓝区/, "信号可以追，但不能拿人去赌。"]
];

function taskBrief(task: RedDustTask) {
  const keywordBrief = taskBriefByKeyword.find(([pattern]) => pattern.test(task.title))?.[1];
  return keywordBrief ?? taskBriefByLocation[task.location];
}

export function DailyBriefingPanel({ plan, branch, onContinue, autoCloseMs = 10000, mode = "tasks" }: DailyBriefingPanelProps) {
  const [remaining, setRemaining] = useState(Math.ceil(autoCloseMs / 1000));
  const continuedRef = useRef(false);
  const onContinueRef = useRef(onContinue);
  const dayArt = dayArtFor(plan.day, branch === "rescue" || branch === "lighthouse" ? branch : undefined);
  const candidateTasks = useMemo(() => (plan.candidateTasks ?? []).map((taskId) => tasksById[taskId]).filter(Boolean).slice(0, 4), [plan.candidateTasks]);

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
            <p>{plan.briefing ?? plan.narrative}</p>
            <span>Auto continues in {remaining}s</span>
          </article>
        </div>

        <section className="daily-task-board" aria-label="今日候选任务">
          <p className="panel-kicker">今日候选任务</p>
          {candidateTasks.length ? (
            <div className="daily-task-strip">
              {candidateTasks.map((task) => (
                <article className="daily-task-card" key={task.id}>
                  <span>{task.id}</span>
                  <b>{task.title}</b>
                  <p>{taskBrief(task)}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="daily-task-empty">今天没有普通任务，只做最终审计。</p>
          )}
        </section>
      </div>
    </section>
  );
}
