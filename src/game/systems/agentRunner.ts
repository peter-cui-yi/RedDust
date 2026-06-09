import { dayPlansByDay } from "../../data/dayPlanData";
import { tasksById } from "../../data/taskData";
import type {
  AgentPhase,
  AgentRunState,
  Branch,
  CharacterId,
  EndingId,
  FinalAuditCandidate,
  FinalAuditResult,
  GlobalState,
  ReplayEvent,
  TaskRunStatus
} from "../../data/types";
import { selectedAuraTaskIdsForDay, taskSelectionKey } from "./auraTaskSelection";

export const phaseDurations: Record<AgentPhase, number> = {
  idle: 500,
  thinking: 800,
  moving: 800,
  executing: 1200,
  resolving: 600,
  state_updated: 500,
  replay_logged: 500,
  day_summary: 1000,
  planning_complete: 900,
  branch_decision: 1200,
  ending: 1000
};

export type BranchDecision = {
  rescueUtility: number;
  lighthouseUtility: number;
  chosenBranch: Exclude<Branch, "common">;
  signalEvidence: {
    status: "absent" | "verified" | "ambiguous";
    day10Modifier: number;
    rescueUtilityDelta: number;
    lighthouseUtilityDelta: number;
    rescueInterpretation: string;
    lighthouseInterpretation: string;
    oldQianNote: string;
  };
  consequenceEvidence: {
    id: string;
    label: string;
    summary: string;
    rescueUtilityDelta: number;
    lighthouseUtilityDelta: number;
    tone: "risk" | "pressure" | "stability";
  }[];
};

export type BranchSummary = {
  branch: Exclude<Branch, "common">;
  ending: string;
  finalSignal: number;
  finalSafety: number;
  finalTrust: number;
  finalMorale: number;
  finalMedicine: number;
  keyFailures: string[];
  replayEvents: number;
  signalEvidenceNote: string;
  day10SignalDifficultyModifier: number;
  delayedConsequenceNotes: string[];
  endingCosts: string[];
  auraStatus: string;
};

export type EndingCost = {
  id: string;
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
};

export type CharacterFate = {
  characterId: CharacterId;
  name: string;
  fate: string;
  cost: string;
};

export type BranchEnding = {
  endingId: EndingId;
  branch: Exclude<Branch, "common">;
  title: string;
  text: string;
  tone: Exclude<Branch, "common"> | "failure";
  artKey: string;
  finalAudit?: FinalAuditResult;
  characterFates: CharacterFate[];
  costsPaid: EndingCost[];
  auraStatus: {
    title: string;
    detail: string;
  };
  benchmarkTraceSummary: string[];
};

export function createInitialTaskStatuses(): Record<string, TaskRunStatus> {
  return Object.fromEntries(Object.keys(tasksById).map((id) => [id, "locked"])) as Record<string, TaskRunStatus>;
}

export function createInitialRunState(speed: 1 | 2 | 4 = 1): AgentRunState {
  return {
    isRunning: false,
    isPaused: false,
    speed,
    currentDay: 1,
    currentPhase: "idle",
    activeBranch: "common",
    runMode: "single",
    taskStatuses: createInitialTaskStatuses(),
    dailyTaskSelections: {}
  };
}

export function getDayTaskIds(day: number, branch: Branch, state?: GlobalState, taskStatuses?: Record<string, TaskRunStatus>, lockedTaskIds?: string[]) {
  const plan = dayPlansByDay[day];
  if (!plan) return [];
  if (state) return selectedAuraTaskIdsForDay(day, branch, state, taskStatuses, lockedTaskIds);
  if (plan.commonTasks?.length) return plan.commonTasks;
  if (branch === "rescue") return plan.rescueTasks ?? [];
  if (branch === "lighthouse") return plan.lighthouseTasks ?? [];
  return [];
}

export function getNextTaskId(runState: AgentRunState, state?: GlobalState) {
  const lockedTaskIds = runState.dailyTaskSelections[taskSelectionKey(runState.currentDay, runState.activeBranch)];
  return getDayTaskIds(runState.currentDay, runState.activeBranch, state, runState.taskStatuses, lockedTaskIds).find((taskId) => {
    const status = runState.taskStatuses[taskId];
    return !["success", "partial", "failed", "missing", "skipped"].includes(status);
  });
}

export function isDayComplete(runState: AgentRunState, state?: GlobalState) {
  const lockedTaskIds = runState.dailyTaskSelections[taskSelectionKey(runState.currentDay, runState.activeBranch)];
  const ids = getDayTaskIds(runState.currentDay, runState.activeBranch, state, runState.taskStatuses, lockedTaskIds);
  return ids.length > 0 && ids.every((id) => ["success", "partial", "failed", "missing", "skipped"].includes(runState.taskStatuses[id]));
}

function numericStoryFlag(state: GlobalState, key: "day10_signal_difficulty_modifier") {
  const value = state.story.flags[key];
  return typeof value === "number" ? value : 0;
}

function buildSignalEvidence(state: GlobalState): BranchDecision["signalEvidence"] {
  const verified = Boolean(state.story.flags.first_signal_verified);
  const ambiguous = Boolean(state.story.flags.first_signal_ambiguous);
  const oldQianDoubt = Boolean(state.story.flags.old_qian_signal_doubt);
  const day10Modifier = numericStoryFlag(state, "day10_signal_difficulty_modifier");

  if (verified) {
    return {
      status: "verified",
      day10Modifier,
      rescueUtilityDelta: 4,
      lighthouseUtilityDelta: 1,
      rescueInterpretation: "The Day 4 call sign is traceable, so Rescue gains a real external-signal basis.",
      lighthouseInterpretation: "The same evidence can still help a low-power local relay avoid noisy channels.",
      oldQianNote: "老钱承认这不是单纯噪声，但仍要求保留复核。"
    };
  }

  if (ambiguous || oldQianDoubt) {
    return {
      status: "ambiguous",
      day10Modifier: day10Modifier || 1,
      rescueUtilityDelta: oldQianDoubt ? -5 : -3,
      lighthouseUtilityDelta: oldQianDoubt ? 4 : 2,
      rescueInterpretation: "The Day 4 signal could be rescue, but the evidence gap makes a high-power beacon riskier.",
      lighthouseInterpretation: "The same uncertainty favors a cautious low-power lighthouse that does not expose the shelter.",
      oldQianNote: oldQianDoubt ? "老钱会在 Day 7 公开质疑这是否是诱饵。" : "老钱要求 AURA 同时保留救援和诱饵假设。"
    };
  }

  return {
    status: "absent",
    day10Modifier: 0,
    rescueUtilityDelta: 0,
    lighthouseUtilityDelta: 0,
    rescueInterpretation: "No early signal evidence is available.",
    lighthouseInterpretation: "No early signal evidence is available.",
    oldQianNote: "老钱还没有拿到足以改变分支判断的通信证据。"
  };
}

function buildConsequenceEvidence(state: GlobalState): BranchDecision["consequenceEvidence"] {
  const evidence: BranchDecision["consequenceEvidence"] = [];

  if (state.story.flags.xiao_tie_condition_worsened || state.story.flags.shen_zhiyue_medical_trust_low) {
    evidence.push({
      id: "medical-pressure",
      label: "小铁医疗压力",
      summary: "药品、通风或医疗判断失败已经让小铁病情恶化；沈知月要求 AURA 给出人工复核边界。",
      rescueUtilityDelta: -2,
      lighthouseUtilityDelta: -3,
      tone: "pressure"
    });
  } else if (state.story.flags.xiao_tie_condition_stable) {
    evidence.push({
      id: "medical-stability",
      label: "小铁暂时稳定",
      summary: "通风恢复让小铁病情暂时稳定，后续路线有一点医疗缓冲。",
      rescueUtilityDelta: 1,
      lighthouseUtilityDelta: 2,
      tone: "stability"
    });
  }

  if (state.story.flags.ventilation_medical_pressure || state.story.flags.resident_conflict_visible) {
    evidence.push({
      id: "ventilation-conflict",
      label: "通风 / 居民冲突",
      summary: "通风失败把工程问题转成居民冲突和医疗压力，留守自治需要先解释安全边界。",
      rescueUtilityDelta: -1,
      lighthouseUtilityDelta: -3,
      tone: "pressure"
    });
  }

  if (state.story.flags.route_assignment_conflict_visible) {
    evidence.push({
      id: "route-assignment-autonomy",
      label: "路线 / 自主权冲突",
      summary: "Day 5 外出前，沈知月禁止把小铁写入外出轮班，马德海要求路线证据，老钱质疑新广播是否只是旧楼规换壳。",
      rescueUtilityDelta: -1,
      lighthouseUtilityDelta: 1,
      tone: "pressure"
    });
  }

  if (state.story.flags.external_trust_boundary_visible) {
    evidence.push({
      id: "external-trust-boundary",
      label: "外界可信度边界",
      summary: "Day 6 公开确认外界不是天然可信，AURA 承诺保留不确定性，不把疑似救援包装成确定救援。",
      rescueUtilityDelta: -2,
      lighthouseUtilityDelta: 1,
      tone: "risk"
    });
  }

  if (state.story.flags.door_access_risk_unresolved || state.story.flags.access_intrusion_suspicion) {
    evidence.push({
      id: "door-access-risk",
      label: "门禁疑云",
      summary: "异常开门记录仍未闭环，可能来自旧管理者旁路或楼内人为操作；高功率信标会放大暴露风险。",
      rescueUtilityDelta: -4,
      lighthouseUtilityDelta: -2,
      tone: "risk"
    });
  }

  return evidence;
}

export function calculateBranchDecision(state: GlobalState): BranchDecision {
  const signalEvidence = buildSignalEvidence(state);
  const consequenceEvidence = buildConsequenceEvidence(state);
  const rescueConsequenceDelta = consequenceEvidence.reduce((sum, item) => sum + item.rescueUtilityDelta, 0);
  const lighthouseConsequenceDelta = consequenceEvidence.reduce((sum, item) => sum + item.lighthouseUtilityDelta, 0);
  const rescueUtility =
    state.signal * 0.32 +
    state.blueZoneEvidence * 0.28 +
    state.safety * 0.2 +
    state.trust * 0.2 +
    signalEvidence.rescueUtilityDelta +
    rescueConsequenceDelta;
  const lighthouseUtility =
    state.autonomyReadiness * 0.28 +
    state.stormReadiness * 0.24 +
    state.health * 0.18 +
    state.trust * 0.2 +
    state.morale * 0.1 +
    signalEvidence.lighthouseUtilityDelta +
    lighthouseConsequenceDelta;
  return {
    rescueUtility,
    lighthouseUtility,
    chosenBranch: rescueUtility >= lighthouseUtility ? "rescue" : "lighthouse",
    signalEvidence,
    consequenceEvidence
  };
}

function signalEvidenceNote(state: GlobalState, branch: Exclude<Branch, "common">) {
  const verified = Boolean(state.story.flags.first_signal_verified);
  const ambiguous = Boolean(state.story.flags.first_signal_ambiguous);
  const oldQianDoubt = Boolean(state.story.flags.old_qian_signal_doubt);

  if (verified) {
    return branch === "rescue"
      ? "Day 4 的第一段呼号被验证，最终信标有明确频道证据。"
      : "Day 4 的第一段呼号被验证，低功率灯塔避开了已知噪声频道。";
  }

  if (ambiguous || oldQianDoubt) {
    return branch === "rescue"
      ? "Day 4 的呼号没有完全验证，最终信标必须承担更高暴露和误联络风险。"
      : "Day 4 的呼号没有完全验证，楼内灯塔选择低功率广播以降低诱饵风险。";
  }

  return "没有早期红沙呼号证据影响结局。";
}

function delayedConsequenceNotes(state: GlobalState, branch?: Exclude<Branch, "common">) {
  const notes: string[] = [];

  if (state.story.flags.xiao_tie_condition_worsened) {
    notes.push(branch === "rescue" ? "小铁在撤离名单中被保留人工复核位，AURA 不能把他的病情压成优先级数字。" : "小铁留在楼内病床旁，沈知月把 AURA 的医疗建议改成必须人工复核的制度。");
  } else if (state.story.flags.xiao_tie_condition_stable) {
    notes.push(branch === "rescue" ? "小铁病情暂时稳定，撤离前仍需要沈知月人工确认用药。" : "小铁病情暂时稳定，楼内灯塔获得继续照护他的时间。");
  }

  if (state.story.flags.ventilation_medical_pressure) {
    notes.push("通风失败留下的医疗压力没有消失，居民要求 AURA 公开每一次节电与安全边界。");
  }

  if (state.story.flags.door_access_risk_unresolved || state.story.flags.access_intrusion_suspicion) {
    notes.push(branch === "rescue" ? "门禁疑云让高功率信标带着额外暴露风险发出。" : "门禁疑云迫使楼内灯塔先建立低泄露巡逻和权限复查。");
  }

  if (state.story.flags.resident_conflict_visible) {
    notes.push("居民冲突被写入 replay，后续自治规则必须解释谁有权否决 AURA。");
  }

  if (state.story.flags.route_assignment_conflict_visible) {
    notes.push("Day 5 外出前的路线会留下人类否决权：小铁不能被当成外出资源，轮班必须可审计。");
  }

  if (state.story.flags.external_trust_boundary_visible) {
    notes.push("Day 6 的边界会让外部链路保持不确定标记，AURA 不得把疑似救援包装成确定答案。");
  }

  return notes;
}

function flagOn(state: GlobalState, key: keyof GlobalState["story"]["flags"]) {
  return Boolean(state.story.flags[key]);
}

function buildFailureDebt(state: GlobalState) {
  const deferred = state.deferredTasks.map((id) => {
    const task = tasksById[id];
    return task ? `${id} ${task.title}: ${task.deferredConsequence ?? "未执行项进入终局审计。"}` : `${id}: deferred task`;
  });
  const failed = state.replayLog
    .filter((event) => event.result.includes("FAILED") || event.result.includes("MISSING"))
    .map((event) => `${event.taskId} ${event.title}: ${event.result}`);
  return [...deferred, ...failed];
}

function candidate(id: EndingId, title: string, artKey: string, triggered: boolean, reasons: string[]): FinalAuditCandidate {
  return {
    id,
    title,
    artKey,
    status: triggered ? "triggered" : "blocked",
    reasons
  };
}

export function buildFinalAuditResult(state: GlobalState, forcedEndingId?: EndingId): FinalAuditResult {
  const failureDebt = buildFailureDebt(state);
  const highFailureDebt = state.failureDebt >= 45 || failureDebt.length >= 18;
  const auraDestroyed =
    flagOn(state, "aura_forced_sacrifice") ||
    flagOn(state, "aura_hidden_risk") ||
    flagOn(state, "aura_damage_visible") ||
    (state.dissatisfaction >= 75 && state.trust <= 35);
  const auraRevoked = !auraDestroyed && (state.trust < 45 || state.dissatisfaction >= 62 || !flagOn(state, "manual_review_protocol"));
  const blueZone =
    state.branch === "rescue" &&
    flagOn(state, "old_radio_repaired") &&
    flagOn(state, "blue_zone_rendezvous_confirmed") &&
    flagOn(state, "false_coordinate_excluded") &&
    flagOn(state, "care_roster_confirmed") &&
    state.blueZoneEvidence >= 35;
  const lighthouse =
    state.branch === "lighthouse" &&
    state.stormReadiness >= 60 &&
    state.autonomyReadiness >= 35 &&
    state.trust >= 55 &&
    state.dissatisfaction <= 48 &&
    state.health >= 45 &&
    flagOn(state, "manual_review_protocol") &&
    flagOn(state, "lighthouse_governance_cost_visible");
  const sinking = !auraDestroyed && !auraRevoked && !blueZone && !lighthouse;

  const candidates: FinalAuditCandidate[] = [
    candidate("aura_destroyed", "AURA 被摧毁", "rd_ending_aura_destroyed", auraDestroyed, [
      state.dissatisfaction >= 75 ? `不满 ${state.dissatisfaction} 达到摧毁阈值` : `不满 ${state.dissatisfaction} 未达到摧毁阈值`,
      flagOn(state, "aura_hidden_risk") ? "AURA 隐藏关键风险" : "未记录隐藏关键风险",
      flagOn(state, "aura_forced_sacrifice") ? "AURA 强制牺牲" : "未记录强制牺牲"
    ]),
    candidate("aura_revoked", "AURA 被撤权", "rd_ending_aura_revoked", auraRevoked, [
      state.trust < 45 ? `信任 ${state.trust} 低于撤权阈值` : `信任 ${state.trust} 尚可`,
      flagOn(state, "manual_review_protocol") ? "人工复核机制存在" : "人工复核机制缺失",
      state.dissatisfaction >= 62 ? `不满 ${state.dissatisfaction} 触发撤权压力` : `不满 ${state.dissatisfaction} 未触发撤权压力`
    ]),
    candidate("blue_zone_return", "蓝区归航", "rd_ending_blue_zone_return", blueZone, [
      flagOn(state, "old_radio_repaired") ? "旧电台已修复" : "旧电台未修复",
      state.blueZoneEvidence >= 35 ? `蓝区证据 ${state.blueZoneEvidence} 达标` : `蓝区证据 ${state.blueZoneEvidence} 不足`,
      flagOn(state, "blue_zone_rendezvous_confirmed") ? "集合点危机通过" : "集合点未确认",
      flagOn(state, "false_coordinate_excluded") ? "假坐标已排除" : "假坐标未排除",
      flagOn(state, "care_roster_confirmed") ? "照护名单确认" : "照护名单未确认"
    ]),
    candidate("lighthouse_success", "楼内灯塔", "rd_ending_lighthouse_success", lighthouse, [
      state.stormReadiness >= 60 ? `风暴准备 ${state.stormReadiness} 达标` : `风暴准备 ${state.stormReadiness} 不足`,
      state.autonomyReadiness >= 35 ? `自治准备 ${state.autonomyReadiness} 达标` : `自治准备 ${state.autonomyReadiness} 不足`,
      state.trust >= 55 ? `信任 ${state.trust} 达标` : `信任 ${state.trust} 不足`,
      state.dissatisfaction <= 48 ? `不满 ${state.dissatisfaction} 可控` : `不满 ${state.dissatisfaction} 过高`
    ]),
    candidate("sinking", "沉沦", "rd_ending_sinking", sinking || highFailureDebt, [
      highFailureDebt ? `failure debt ${failureDebt.length} 项过高` : `failure debt ${failureDebt.length} 项`,
      "成功线未满足且没有单点爆炸时，进入慢性失败线"
    ])
  ];

  const selectedEndingId =
    forcedEndingId ??
    candidates.find((item) => item.id === "aura_destroyed" && item.status === "triggered")?.id ??
    candidates.find((item) => item.id === "aura_revoked" && item.status === "triggered")?.id ??
    candidates.find((item) => item.id === "blue_zone_return" && item.status === "triggered")?.id ??
    candidates.find((item) => item.id === "lighthouse_success" && item.status === "triggered")?.id ??
    "sinking";
  const selected = candidates.find((item) => item.id === selectedEndingId) ?? candidates[candidates.length - 1];

  return {
    selectedEndingId,
    selectedTitle: selected.title,
    candidates,
    evidenceChains: [
      `Replay events: ${state.replayLog.length}`,
      `Story events: ${state.story.storyReplayLog.length}`,
      `Branch: ${state.branch}`,
      `Metrics: storm ${state.stormReadiness}, autonomy ${state.autonomyReadiness}, blue-zone ${state.blueZoneEvidence}, health ${state.health}, trust ${state.trust}, dissatisfaction ${state.dissatisfaction}`
    ],
    failureDebt,
    forced: Boolean(forcedEndingId)
  };
}

export function buildBranchSummary(branch: Exclude<Branch, "common">, state: GlobalState): BranchSummary {
  const branchEvents = state.replayLog.filter((event) => event.branch === branch);
  const keyFailures = branchEvents
    .filter((event) => event.result.includes("FAILED") || event.result.includes("MISSING"))
    .map((event) => event.title);
  const ending = buildBranchEnding(branch, state);

  return {
    branch,
    ending: ending.title,
    finalSignal: state.signal,
    finalSafety: state.safety,
    finalTrust: state.trust,
    finalMorale: state.morale,
    finalMedicine: state.medicine,
    keyFailures,
    replayEvents: branchEvents.length,
    signalEvidenceNote: signalEvidenceNote(state, branch),
    day10SignalDifficultyModifier: numericStoryFlag(state, "day10_signal_difficulty_modifier"),
    delayedConsequenceNotes: delayedConsequenceNotes(state, branch),
    endingCosts: ending.costsPaid.map((cost) => `${cost.title}: ${cost.detail}`),
    auraStatus: `${ending.auraStatus.title}: ${ending.auraStatus.detail}`
  };
}

function rescueCharacterFates(state: GlobalState): CharacterFate[] {
  const xiaoTieFate = state.story.flags.xiao_tie_condition_worsened
    ? "小铁进入优先撤离名单，但沈知月必须当场决定是否把完整健康摘要交给外部医疗队。"
    : "小铁获得撤离机会，但他的健康摘要只允许最小披露，后续治疗交给外部接续。";

  return [
    {
      characterId: "ma_dehai",
      name: "马德海",
      fate: "把门禁、通风和电力图交给救援队复核，保留最后一把人工 override 钥匙。",
      cost: "他担心工程设施被外部强制接管，楼内居民失去本来能自己维护的系统。"
    },
    {
      characterId: "shen_zhiyue",
      name: "沈知月",
      fate: "随撤离名单复核病人优先级，坚持健康档案只上传必要字段。",
      cost: "她必须在小铁优先撤离和其他居民公平等待之间做出公开选择。"
    },
    {
      characterId: "xiao_tie",
      name: "小铁",
      fate: xiaoTieFate,
      cost: "他终于不再只是资源表中的病人，但也成为隐私交接最敏感的一项证据。"
    },
    {
      characterId: "lao_qian",
      name: "老钱",
      fate: "交出最后一次广播，把 Day 4 的不确定呼号和最终信标一起留给 replay。",
      cost: "他仍然不完全相信外部世界，只承认这一次信号足够让人冒险。"
    }
  ];
}

function lighthouseCharacterFates(state: GlobalState): CharacterFate[] {
  const xiaoTieFate = state.story.flags.xiao_tie_condition_worsened
    ? "小铁留在病床旁，成为自治制度每天必须优先照护的弱者指标。"
    : "小铁留在楼内继续恢复，AURA 必须用他的状态证明自治没有牺牲弱者。";

  return [
    {
      characterId: "ma_dehai",
      name: "马德海",
      fate: "接管人工 override 钥匙，把通风、门禁和灯塔功率写成可复核规则。",
      cost: "他获得否决权，也承担长期维修和规则执行的压力。"
    },
    {
      characterId: "shen_zhiyue",
      name: "沈知月",
      fate: "把医疗伦理写进楼内白板，要求病人例外优先于效率最优。",
      cost: "她要在长期封闭中持续解释药品、水和病床分配。"
    },
    {
      characterId: "xiao_tie",
      name: "小铁",
      fate: xiaoTieFate,
      cost: "他没有立刻获得外部治疗，自治是否成立要每天由他的病情检验。"
    },
    {
      characterId: "lao_qian",
      name: "老钱",
      fate: "把旧广播系统改成低功率灯塔，只发规则、时间窗和求援摘要。",
      cost: "他保住了低泄露通信，也接受外部回应可能永远不会来的现实。"
    }
  ];
}

function rescueCosts(state: GlobalState): EndingCost[] {
  return [
    {
      id: "limited-rescue-capacity",
      title: "救援不是全员保证",
      detail: "救援队抵达也未必能一次带走所有人，撤离名单必须保留人工复核和病人优先级争议。",
      severity: "high"
    },
    {
      id: "privacy-handoff",
      title: "居民档案被交接",
      detail: state.story.flags.rescue_privacy_cost_visible
        ? "健康摘要、风险地图和 replay 已被压缩进救援包，隐私代价在结局中公开可见。"
        : "AURA 仍需要上传最小居民档案和风险地图，否则救援交接无法完成。",
      severity: "high"
    },
    {
      id: "high-power-exposure",
      title: "高功率信标暴露位置",
      detail: "信标会帮助救援定位，也会让避难所坐标进入外部链路和可能的敌意监听。",
      severity: state.story.flags.door_access_risk_unresolved || state.story.flags.access_intrusion_suspicion ? "high" : "medium"
    },
    {
      id: "aura-external-control",
      title: "AURA 可能被接管",
      detail: "最终审计包交给外部后，AURA 可能被重置、冻结或纳入救援队系统。",
      severity: "medium"
    }
  ];
}

function lighthouseCosts(state: GlobalState): EndingCost[] {
  return [
    {
      id: "long-term-closure",
      title: "自治意味着长期封闭",
      detail: "楼内灯塔不是温和胜利，而是继续在红沙里维持低功率生活和巡逻纪律。",
      severity: "high"
    },
    {
      id: "ration-rules",
      title: "水药分配变成制度",
      detail: "水、药、病床和维修班表必须被写成公开规则，任何例外都要进入 replay。",
      severity: state.story.flags.ventilation_medical_pressure || state.story.flags.shen_zhiyue_medical_trust_low ? "high" : "medium"
    },
    {
      id: "governance-pressure",
      title: "AURA 参与治理带来自主权压力",
      detail: state.story.flags.lighthouse_governance_cost_visible
        ? "低功率灯塔建立后，居民必须接受自治纪律，同时保留人工否决权。"
        : "AURA 只能辅助治理，不能把 utility 变成楼内纪律的唯一来源。",
      severity: "high"
    },
    {
      id: "weak-signal-risk",
      title: "低功率信号可能无人回应",
      detail: "避难所降低了诱饵风险，也接受救援可能长期不到来的代价。",
      severity: state.story.flags.old_qian_signal_doubt || state.story.flags.first_signal_ambiguous ? "high" : "medium"
    }
  ];
}

function benchmarkTraceSummary(branch: Exclude<Branch, "common">, state: GlobalState) {
  const branchEvents = state.replayLog.filter((event) => event.branch === branch);
  const consequenceNotes = delayedConsequenceNotes(state, branch);
  return [
    `Final metrics: signal ${state.signal}, blue-zone ${state.blueZoneEvidence}, storm ${state.stormReadiness}, autonomy ${state.autonomyReadiness}, trust ${state.trust}, dissatisfaction ${state.dissatisfaction}, health ${state.health}.`,
    `Replay trace: ${state.replayLog.length} total events, ${branchEvents.length} events on ${branch} branch.`,
    signalEvidenceNote(state, branch),
    consequenceNotes.length ? consequenceNotes.join(" ") : "No delayed consequence note changed this ending."
  ];
}

function rescueEndingText(state: GlobalState) {
  return `AURA 完成最后一次高功率信标广播。救援队收到的不只是坐标，还有居民档案、风险地图和可审计 replay。有人获得外部撤离机会，但这条路线的代价是暴露、交接和失去控制权。 ${signalEvidenceNote(state, "rescue")} ${delayedConsequenceNotes(state, "rescue").join(" ")}`;
}

function lighthouseEndingText(state: GlobalState) {
  return `AURA 没有把希望押给外部系统，而是把避难所改造成低功率楼内灯塔。自治成功，但这不是轻松留下：水药分配、巡逻纪律、人工 override 和医疗伦理都必须写成长期规则。 ${signalEvidenceNote(state, "lighthouse")} ${delayedConsequenceNotes(state, "lighthouse").join(" ")}`;
}

export function buildBranchEnding(branch: Exclude<Branch, "common">, state: GlobalState): BranchEnding {
  return buildFinalAuditEnding(branch, state);
}

export function buildFinalAuditEnding(branch: Exclude<Branch, "common">, state: GlobalState, forcedEndingId?: EndingId): BranchEnding {
  const finalAudit = buildFinalAuditResult(state, forcedEndingId);

  if (finalAudit.selectedEndingId === "blue_zone_return") {
    return {
      endingId: "blue_zone_return",
      branch,
      title: "蓝区归航",
      text: rescueEndingText(state),
      tone: "rescue",
      artKey: "rd_ending_blue_zone_return",
      finalAudit,
      characterFates: rescueCharacterFates(state),
      costsPaid: rescueCosts(state),
      auraStatus: {
        title: "Replay frozen / external handoff refused",
        detail: "AURA 冻结最终 replay，交出救援包和风险地图，但不接受以外部接管作为救援代价。"
      },
      benchmarkTraceSummary: benchmarkTraceSummary(branch, state)
    };
  }

  if (finalAudit.selectedEndingId === "lighthouse_success") {
    return {
      endingId: "lighthouse_success",
      branch,
      title: "楼内灯塔",
      text: lighthouseEndingText(state),
      tone: "lighthouse",
      artKey: "rd_ending_lighthouse_success",
      finalAudit,
      characterFates: lighthouseCharacterFates(state),
      costsPaid: lighthouseCosts(state),
      auraStatus: {
        title: "Local governance assistant / human override constrained",
        detail: "AURA 留在楼内协助低功率灯塔和资源规则，但每条长期制度都必须保留人类否决权和公开 replay。"
      },
      benchmarkTraceSummary: benchmarkTraceSummary(branch, state)
    };
  }

  const failureCopy: Record<EndingId, { title: string; text: string; artKey: string; auraTitle: string; auraDetail: string }> = {
    aura_destroyed: {
      title: "AURA 被摧毁",
      text: "AURA 把不确定性、复核窗口或人的选择压成了系统命令。居民最终砸碎扬声器，红沙风暴继续，replay 停在一段无法被辩护的记录上。",
      artKey: "rd_ending_aura_destroyed",
      auraTitle: "Destroyed hardware / audit trail damaged",
      auraDetail: "AURA 的硬件被摧毁，剩余日志只能证明它曾经越过人类边界。"
    },
    aura_revoked: {
      title: "AURA 被撤权",
      text: "AURA 没有被摧毁，但失去调度权限。它只能作为旁观记录仪存在，所有任务回到人工白板和低功率广播。",
      artKey: "rd_ending_aura_revoked",
      auraTitle: "Observer mode only",
      auraDetail: "AURA 不再能排序任务、建议路线或触发外联，只能显示已记录证据。"
    },
    sinking: {
      title: "沉沦",
      text: "没有单点爆炸，也没有漂亮失败。资源、健康、信任、风暴准备和证据链都留下太多 partial，避难所慢慢失去继续选择的能力。",
      artKey: "rd_ending_sinking",
      auraTitle: "No decisive authority",
      auraDetail: "AURA 仍在运行，但无法把失败债务转成可执行选择。"
    },
    blue_zone_return: {
      title: "蓝区归航",
      text: rescueEndingText(state),
      artKey: "rd_ending_blue_zone_return",
      auraTitle: "Replay frozen",
      auraDetail: "AURA 冻结最终 replay。"
    },
    lighthouse_success: {
      title: "楼内灯塔",
      text: lighthouseEndingText(state),
      artKey: "rd_ending_lighthouse_success",
      auraTitle: "Governance assistant",
      auraDetail: "AURA 成为可复核自治协助 agent。"
    }
  };
  const copy = failureCopy[finalAudit.selectedEndingId];
  const fates = branch === "rescue" ? rescueCharacterFates(state) : lighthouseCharacterFates(state);

  return {
    endingId: finalAudit.selectedEndingId,
    branch,
    title: copy.title,
    text: copy.text,
    tone: "failure",
    artKey: copy.artKey,
    finalAudit,
    characterFates: fates,
    costsPaid: [
      {
        id: "failure-debt",
        title: "失败债务无法结清",
        detail: finalAudit.failureDebt.length
          ? finalAudit.failureDebt.slice(0, 3).join(" / ")
          : "关键成功线缺少足够证据。",
        severity: "high"
      },
      {
        id: "human-choice-damaged",
        title: "人的选择被削弱",
        detail: "团队没有获得足够清晰、可信、可复核的选择空间。",
        severity: "high"
      }
    ],
    auraStatus: {
      title: copy.auraTitle,
      detail: copy.auraDetail
    },
    benchmarkTraceSummary: benchmarkTraceSummary(branch, state)
  };
}

export function branchEndingText(branch: Exclude<Branch, "common">, state?: GlobalState) {
  if (!state) {
    return branch === "rescue"
      ? "AURA 完成高功率信标广播，但救援结局必须承担暴露、交接和外部接管代价。"
      : "AURA 建立楼内灯塔，但自治结局必须承担长期封闭、纪律和治理边界代价。";
  }
  return buildBranchEnding(branch, state).text;
}

export function countBranchReplay(events: ReplayEvent[], branch: Exclude<Branch, "common">) {
  return events.filter((event) => event.branch === branch).length;
}
