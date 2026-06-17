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
  failureDebt: "审计压力"
};

export const coreResourceKeys = ["water", "food", "medicine", "battery"] as const satisfies readonly MetricKey[];
export const pressureMetricKeys = ["health", "morale", "trust", "safety"] as const satisfies readonly MetricKey[];

export function nonZeroMetricDeltas(delta: Partial<Record<MetricKey, number>>) {
  return (Object.entries(delta) as Array<[MetricKey, number]>).filter(([, value]) => value !== 0);
}

export type DailyUpkeepPlan = {
  delta: Partial<Record<MetricKey, number>>;
  reasons: string[];
};

function addDelta(delta: Partial<Record<MetricKey, number>>, metric: MetricKey, value: number) {
  delta[metric] = (delta[metric] ?? 0) + value;
}

function averageTension(state: GlobalState) {
  const values = Object.values(state.story.relationships).map((relationship) => relationship.tension);
  return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));
}

export function dailyUpkeepPlanForDay(day: number, branch: Branch, state?: GlobalState): DailyUpkeepPlan {
  if (day <= 0 || day >= 12) return { delta: {}, reasons: [] };

  const midPressure = day >= 5 ? 1 : 0;
  const branchPressure = day >= 8 ? 1 : 0;
  const stormPressure = day >= 10 ? 1 : 0;
  const rescueBatteryBurn = branch === "rescue" && day >= 8 ? 1 : 0;
  const rescueExposure = branch === "rescue" && day >= 8 ? 1 : 0;
  const lighthouseRationDiscipline = branch === "lighthouse" && day >= 8 ? 1 : 0;
  const lighthousePowerDiscipline = branch === "lighthouse" && day >= 8 ? 1 : 0;

  const delta: Partial<Record<MetricKey, number>> = {
    water: -(2 + midPressure + branchPressure - lighthouseRationDiscipline),
    food: -(1 + midPressure + stormPressure - lighthouseRationDiscipline),
    medicine: -(day >= 3 ? 1 : 0) - (day >= 8 ? 1 : 0),
    battery: -(2 + midPressure + branchPressure + rescueBatteryBurn - lighthousePowerDiscipline),
    morale: -(day >= 7 ? 1 : 0),
    health: -(day >= 8 ? 1 : 0) - stormPressure,
    safety: -(stormPressure + rescueExposure),
    dissatisfaction: (day >= 5 ? 1 : 0) + (branch === "rescue" && day >= 8 ? 1 : 0) + (branch === "lighthouse" && day >= 8 ? 1 : 0)
  };
  const reasons = [
    branch === "rescue"
      ? "救援线保留通信、信标和外联窗口，电力与安全压力更高。"
      : branch === "lighthouse"
        ? "灯塔线执行低耗配给纪律，降低水电消耗但压低士气。"
        : "公共线按基础避难所生存消耗结算。"
  ];

  if (state) {
    const tension = averageTension(state);
    if (state.food >= 38 && state.water >= 38 && state.battery >= 30) {
      addDelta(delta, "morale", 2);
      addDelta(delta, "trust", 1);
      reasons.push(`生存资源稳定（水 ${state.water} / 食物 ${state.food}），士气与信任缓慢回升。`);
    }
    if (state.water < 35) {
      addDelta(delta, "health", -1);
      addDelta(delta, "morale", -1);
      addDelta(delta, "dissatisfaction", 2);
      reasons.push(`水 ${state.water} 偏低，配给不再返还资源，健康与士气承压。`);
    }
    if (state.water < 25) {
      addDelta(delta, "trust", -1);
      addDelta(delta, "safety", -1);
      reasons.push(`水 ${state.water} 进入告警，居民开始质疑 AURA 的前几日选择。`);
    }
    if (state.food < 35) {
      addDelta(delta, "health", -1);
      addDelta(delta, "morale", -1);
      addDelta(delta, "dissatisfaction", 1);
      reasons.push(`食物 ${state.food} 偏低，配给收紧直接消耗士气。`);
    }
    if (state.battery < 40) {
      addDelta(delta, "safety", -2);
      addDelta(delta, "trust", -1);
      reasons.push(`电力 ${state.battery} 偏低，非必要照明关闭，安全感和信任下降。`);
    }
    if (state.medicine < 34 || state.health < 52) {
      addDelta(delta, "medicine", -1);
      addDelta(delta, "health", -1);
      addDelta(delta, "trust", -1);
      reasons.push(`医疗压力扩大，额外药耗也只能延缓健康下行。`);
    }
    if (state.safety < 45 || tension > 58) {
      addDelta(delta, "battery", -1);
      addDelta(delta, "trust", -1);
      addDelta(delta, "morale", -1);
      addDelta(delta, "dissatisfaction", 1);
      reasons.push(`安全感 ${state.safety} / 紧张 ${tension} 触发夜间照明与人工复核成本。`);
    }
    if (state.trust < 42) {
      addDelta(delta, "battery", -1);
      addDelta(delta, "morale", -1);
      addDelta(delta, "dissatisfaction", 2);
      reasons.push(`信任 ${state.trust} 偏低，公开复核消耗电力，也让等待变得更难忍。`);
    }
  }

  return { delta, reasons };
}

export function dailyUpkeepForDay(day: number, branch: Branch, state?: GlobalState): Partial<Record<MetricKey, number>> {
  return dailyUpkeepPlanForDay(day, branch, state).delta;
}

export function dailyUpkeepReasonsForDay(day: number, branch: Branch, state?: GlobalState) {
  return dailyUpkeepPlanForDay(day, branch, state).reasons;
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

  const plan = dailyUpkeepPlanForDay(day, branch, state);
  const stateDelta = plan.delta;
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
        decision: "AURA 在日终扣除饮水、食物、药品、电力和照护成本。",
        result: "DAY END | upkeep applied",
        stateDelta,
        explanation: `日终结算：${describeMetricDeltas(stateDelta)}。${plan.reasons.join(" ")}`
      }
    ]
  };

  for (const [key, value] of entries) {
    next[key] = clampMetric(next[key] + value);
  }

  return next;
}
