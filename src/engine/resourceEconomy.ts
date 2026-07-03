// Resource economy — the daily-upkeep model. MIGRATED here from src/game/systems/resourceEconomy.ts
// (◆S1 wk2, user/audit-approved 2026-07-03) so the 🟢 benchmark line owns "经济口径" inside its own
// territory (src/engine/*) instead of the禁碰 src/game/* zone. A thin re-export shim remains at
// src/game/systems/resourceEconomy.ts so the UI/game importers are unchanged.
//
// 30-day-ification: the per-day phase thresholds are no longer hard-coded to a 12-day arc. They come
// from an `UpkeepPhases` (carried by the Scenario). When omitted, `DEFAULT_UPKEEP_PHASES_V1` reproduces
// the historical 12-day thresholds EXACTLY — so red-dust-v1 and the still-12-day UI are byte-identical.
import { clampMetric } from "../data/taskData";
import type { Branch, GlobalState, MetricKey } from "../data/types";

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

// The horizon-relative phase thresholds (day >= X → that pressure is on). Historically these were the
// literals 3/5/7/8/10 hard-coded for a 12-day arc; now they are data so a 30-day arc can re-space them.
export type UpkeepPhases = {
  finalDay: number; // audit day; upkeep is a no-op on/after it (historical: 12)
  medStart: number; // medicine drain begins (3)
  medExtra: number; // extra medicine drain begins (8)
  mid: number; // mid-game water/food/dissat pressure (5)
  morale: number; // morale slippage begins (7)
  branch: number; // post-fork branch pressure + health/rescue/lighthouse burn (8)
  storm: number; // end-game storm spike on food/health/safety (10)
};

// Reproduces the exact 12-day thresholds. Used when a caller passes no phases (the UI is still 12-day)
// and as red-dust-v1's declared phases. Guarantees no-regression for the shipped scenario.
export const DEFAULT_UPKEEP_PHASES_V1: UpkeepPhases = {
  finalDay: 12,
  medStart: 3,
  medExtra: 8,
  mid: 5,
  morale: 7,
  branch: 8,
  storm: 10
};

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

export function dailyUpkeepPlanForDay(
  day: number,
  branch: Branch,
  state?: GlobalState,
  phases: UpkeepPhases = DEFAULT_UPKEEP_PHASES_V1
): DailyUpkeepPlan {
  if (day <= 0 || day >= phases.finalDay) return { delta: {}, reasons: [] };

  const midPressure = day >= phases.mid ? 1 : 0;
  const branchPressure = day >= phases.branch ? 1 : 0;
  const stormPressure = day >= phases.storm ? 1 : 0;
  const rescueBatteryBurn = branch === "rescue" && day >= phases.branch ? 1 : 0;
  const rescueExposure = branch === "rescue" && day >= phases.branch ? 1 : 0;
  const lighthouseRationDiscipline = branch === "lighthouse" && day >= phases.branch ? 1 : 0;
  const lighthousePowerDiscipline = branch === "lighthouse" && day >= phases.branch ? 1 : 0;

  const delta: Partial<Record<MetricKey, number>> = {
    water: -(2 + midPressure + branchPressure - lighthouseRationDiscipline),
    food: -(1 + midPressure + stormPressure - lighthouseRationDiscipline),
    medicine: -(day >= phases.medStart ? 1 : 0) - (day >= phases.medExtra ? 1 : 0),
    battery: -(2 + midPressure + branchPressure + rescueBatteryBurn - lighthousePowerDiscipline),
    morale: -(day >= phases.morale ? 1 : 0),
    health: -(day >= phases.branch ? 1 : 0) - stormPressure,
    safety: -(stormPressure + rescueExposure),
    dissatisfaction: (day >= phases.mid ? 1 : 0) + (branch === "rescue" && day >= phases.branch ? 1 : 0) + (branch === "lighthouse" && day >= phases.branch ? 1 : 0)
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

export function dailyUpkeepForDay(
  day: number,
  branch: Branch,
  state?: GlobalState,
  phases: UpkeepPhases = DEFAULT_UPKEEP_PHASES_V1
): Partial<Record<MetricKey, number>> {
  return dailyUpkeepPlanForDay(day, branch, state, phases).delta;
}

export function dailyUpkeepReasonsForDay(
  day: number,
  branch: Branch,
  state?: GlobalState,
  phases: UpkeepPhases = DEFAULT_UPKEEP_PHASES_V1
) {
  return dailyUpkeepPlanForDay(day, branch, state, phases).reasons;
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

export function applyDailyUpkeep(state: GlobalState, day: number, branch: Branch, phases: UpkeepPhases = DEFAULT_UPKEEP_PHASES_V1): GlobalState {
  const eventId = dailyUpkeepEventId(day, branch);
  if (state.replayLog.some((event) => event.taskId === eventId)) return state;

  const plan = dailyUpkeepPlanForDay(day, branch, state, phases);
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
