import { clampMetric } from "../../data/taskData";
import type { Branch, GlobalState, MetricKey } from "../../data/types";

export const resourceMetricLabels: Record<MetricKey, string> = {
  water: "水",
  medicine: "药",
  trust: "信任",
  safety: "安全",
  signal: "信号",
  morale: "士气",
  food: "食物",
  battery: "电力",
  dissatisfaction: "不满",
  health: "健康",
  stormReadiness: "风暴",
  autonomyReadiness: "自治",
  blueZoneEvidence: "蓝区",
  failureDebt: "债务"
};

export const coreResourceKeys = ["water", "food", "medicine", "battery"] as const satisfies readonly MetricKey[];
export const pressureMetricKeys = ["health", "morale", "trust", "safety", "failureDebt"] as const satisfies readonly MetricKey[];

export function nonZeroMetricDeltas(delta: Partial<Record<MetricKey, number>>) {
  return (Object.entries(delta) as Array<[MetricKey, number]>).filter(([, value]) => value !== 0);
}

export function dailyUpkeepForDay(day: number, branch: Branch): Partial<Record<MetricKey, number>> {
  if (day <= 0 || day >= 12) return {};

  const latePressure = day >= 5 ? 1 : 0;
  const branchPressure = day >= 8 ? 1 : 0;
  const rescueBatteryBurn = branch === "rescue" ? 1 : 0;
  const lighthouseRationDiscipline = branch === "lighthouse" && day >= 8 ? 1 : 0;

  return {
    water: -(2 + branchPressure),
    food: -(2 + Math.max(0, latePressure - lighthouseRationDiscipline)),
    medicine: day >= 8 || day % 3 === 0 ? -1 : 0,
    battery: -(1 + branchPressure + rescueBatteryBurn),
    morale: day >= 8 ? -1 : 0,
    health: day >= 10 ? -1 : 0,
    dissatisfaction: branch === "lighthouse" ? 0 : day >= 5 ? 1 : 0
  };
}

export function dailyUpkeepEventId(day: number, branch: Branch) {
  return `D${String(day).padStart(2, "0")}-UPKEEP-${branch}`;
}

export function describeMetricDeltas(delta: Partial<Record<MetricKey, number>>) {
  const entries = nonZeroMetricDeltas(delta);
  if (entries.length === 0) return "无日终资源消耗。";
  return entries
    .map(([key, value]) => `${resourceMetricLabels[key]} ${value > 0 ? "+" : ""}${value}`)
    .join(" / ");
}

export function applyDailyUpkeep(state: GlobalState, day: number, branch: Branch): GlobalState {
  const eventId = dailyUpkeepEventId(day, branch);
  if (state.replayLog.some((event) => event.taskId === eventId)) return state;

  const stateDelta = dailyUpkeepForDay(day, branch);
  const entries = nonZeroMetricDeltas(stateDelta);
  if (entries.length === 0) return state;

  const next: GlobalState = {
    ...state,
    day: Math.max(state.day, day),
    branch,
    replayLog: [
      ...state.replayLog,
      {
        time: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
        day,
        branch,
        taskId: eventId,
        title: "每日配给消耗",
        decision: "AURA closes the day by applying shelter-wide ration, battery, and care costs.",
        result: "DAY END | upkeep applied",
        stateDelta,
        explanation: `日终结算：${describeMetricDeltas(stateDelta)}。`
      }
    ]
  };

  for (const [key, value] of entries) {
    next[key] = clampMetric(next[key] + value);
  }

  return next;
}
