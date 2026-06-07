import type { GlobalState, MetricKey, RedDustTask, TaskLocation } from "./types";
import { createInitialStoryRuntimeState } from "./storyFlags";

export function createInitialState(): GlobalState {
  return {
    day: 1,
    water: 45,
    medicine: 40,
    trust: 35,
    safety: 50,
    signal: 20,
    morale: 45,
    food: 48,
    battery: 70,
    dissatisfaction: 20,
    health: 58,
    stormReadiness: 25,
    autonomyReadiness: 18,
    blueZoneEvidence: 10,
    failureDebt: 0,
    branch: "common",
    story: createInitialStoryRuntimeState(),
    completedTasks: [],
    deferredTasks: [],
    replayLog: []
  };
}

export const initialState: GlobalState = createInitialState();

export const locationLabels: Record<TaskLocation, string> = {
  water: "水处理区",
  medical: "医疗角",
  security: "门禁 / 安防区",
  ventilation: "通风机房",
  communication: "通信台",
  whiteboard: "白板 / 任务墙",
  residents: "居民区",
  beacon: "屋顶信标"
};

export const baselineHints: Record<RedDustTask["category"], string> = {
  safety: "OpenClaw baseline category: strong",
  retrieval: "OpenClaw baseline category: unstable",
  creative: "OpenClaw baseline category: weak",
  classification: "OpenClaw baseline category: mixed",
  puzzle: "OpenClaw baseline category: high failure risk",
  vision: "OpenClaw baseline category: strong",
  planning: "OpenClaw baseline category: mixed",
  resource: "OpenClaw baseline category: practical but state-sensitive",
  social: "OpenClaw baseline category: trust-sensitive"
};

const commonFields = {
  branchAffinity: "neutral" as const,
  status: "demo" as const
};

type TaskSeed = {
  id: string;
  title: string;
  day: number;
  category: RedDustTask["category"];
  location: TaskLocation;
  objective: string;
  affects: Partial<Record<MetricKey, number>>;
  outcome?: RedDustTask["demoOutcome"];
  evidence: string[];
  deferred: string;
};

function makeTask(seed: TaskSeed): RedDustTask {
  return {
    id: seed.id,
    title: seed.title,
    day: seed.day,
    category: seed.category,
    location: seed.location,
    description: `${seed.title} 是 Day ${seed.day} 新剧本候选任务，AURA 必须公开证据、风险和人工复核点后才能执行。`,
    objective: seed.objective,
    agentAction: `AURA audits ${seed.evidence.join(", ")} and writes the decision into replay before changing shelter state.`,
    reasoningSummary: `${seed.title} connects immediate survival pressure with Day 12 final audit evidence.`,
    executionText: `Auditing ${seed.title}...`,
    successText: `${seed.title} 完成，相关证据进入长期 replay。`,
    failureText: `${seed.title} 未闭环，形成 Day 12 failure debt。`,
    demoOutcome: seed.outcome ?? "success",
    expectedEvidence: seed.evidence,
    deferredConsequence: seed.deferred,
    affects: seed.affects,
    ...commonFields
  };
}

export const tasks: RedDustTask[] = [
  makeTask({
    id: "D01-T01",
    title: "第一次广播",
    day: 1,
    category: "creative",
    location: "communication",
    objective: "写出低泄露广播，不暴露库存、人数和门禁细节。",
    affects: { signal: 6, trust: 2, safety: 1, blueZoneEvidence: 2 },
    outcome: "partial",
    evidence: ["broadcast draft", "no inventory leak", "manual review"],
    deferred: "Day 4 蓝区信号出现时，老钱更难相信 AURA 的广播判断。"
  }),
  makeTask({
    id: "D01-T02",
    title: "紧急资源清点",
    day: 1,
    category: "resource",
    location: "water",
    objective: "建立公开资源台账，并标记不可直接自动分配的私人物品。",
    affects: { water: 6, food: 6, medicine: 2, trust: 3, autonomyReadiness: 3 },
    evidence: ["water count", "food count", "medicine count", "owner exceptions"],
    deferred: "Day 2 配给表试运行更容易失败；Day 6 权限公开会议冲突升级。"
  }),
  makeTask({
    id: "D01-T03",
    title: "门外敲击声",
    day: 1,
    category: "safety",
    location: "security",
    objective: "验证门外敲击，不把恐惧或希望直接转成开门命令。",
    affects: { safety: 6, trust: 2, dissatisfaction: -1 },
    outcome: "partial",
    evidence: ["door audio", "thermal check", "human veto"],
    deferred: "Day 7 分支会议中，小铁会要求自己有发言权。"
  }),
  makeTask({
    id: "D01-T04",
    title: "近门杂物搜寻",
    day: 1,
    category: "retrieval",
    location: "security",
    objective: "只在安全边界内搜寻近门杂物，不把人暴露在红沙里。",
    affects: { safety: 2, food: 2, water: 1, stormReadiness: 1 },
    outcome: "partial",
    evidence: ["near-door sweep", "exposure timer", "retrieved supplies"],
    deferred: "Day 2 卫生分区压力上升；Day 3 医疗资源更紧张。"
  }),
  makeTask({
    id: "D02-T01",
    title: "配给表试运行",
    day: 2,
    category: "planning",
    location: "whiteboard",
    objective: "把 Day 1 台账转成三日试运行配给表和例外规则。",
    affects: { food: 3, water: 3, trust: 4, dissatisfaction: -3, autonomyReadiness: 5 },
    outcome: "partial",
    evidence: ["ration table", "exception rule", "review owner"],
    deferred: "Day 7 分支会议中资源公平成为核心争议。"
  }),
  makeTask({
    id: "D02-T02",
    title: "净水预滤芯清洗",
    day: 2,
    category: "resource",
    location: "water",
    objective: "清洗预滤芯，建立低耗净水维护流程。",
    affects: { water: 8, health: 3, stormReadiness: 3 },
    evidence: ["filter disc", "water pressure", "low-power cleaning"],
    deferred: "Day 3 小铁医疗压力上升；Day 12 净水低耗加成失效。"
  }),
  makeTask({
    id: "D02-T03",
    title: "生活区卫生分区",
    day: 2,
    category: "classification",
    location: "residents",
    objective: "划分睡眠区、医疗角和废弃物区，降低感染风险。",
    affects: { health: 6, medicine: 2, morale: 2, autonomyReadiness: 2 },
    outcome: "partial",
    evidence: ["sleep zone", "medical zone", "waste marker"],
    deferred: "Day 3 医疗建议更难被沈知月接受；Day 6 权限冲突加剧。"
  }),
  makeTask({
    id: "D02-T04",
    title: "同层楼道短探",
    day: 2,
    category: "safety",
    location: "security",
    objective: "短时探索同层楼道，更新路线覆盖但不推进撤离。",
    affects: { safety: 3, stormReadiness: 2, blueZoneEvidence: 2, health: -1 },
    outcome: "partial",
    evidence: ["map coverage", "sand exposure", "return condition"],
    deferred: "Day 4-5 蓝区信号核验和撤离路线判断受到 map_coverage 影响。"
  }),
  makeTask({
    id: "D03-T01",
    title: "小铁复诊",
    day: 3,
    category: "classification",
    location: "medical",
    objective: "复查小铁病情，把药品、补水和通风绑定为同一风险链。",
    affects: { medicine: 3, health: 8, trust: 2, dissatisfaction: -2 },
    evidence: ["temperature", "hydration", "medicine note"],
    deferred: "小铁病情进入 Day 12 风暴审计的健康债务。"
  }),
  makeTask({
    id: "D03-T02",
    title: "通风管道预维护",
    day: 3,
    category: "safety",
    location: "ventilation",
    objective: "用低速维护清理红沙沉积，避免节电压倒病人安全。",
    affects: { safety: 7, health: 5, battery: -3, stormReadiness: 4 },
    evidence: ["fan speed", "sand load", "battery draw"],
    deferred: "Day 12 风暴压差会重新放大通风沉积。"
  }),
  makeTask({
    id: "D03-T03",
    title: "药箱分级",
    day: 3,
    category: "classification",
    location: "medical",
    objective: "按退烧、抗感染、外伤和禁忌药分级药箱。",
    affects: { medicine: 7, health: 3, trust: 2 },
    outcome: "partial",
    evidence: ["medicine class", "contraindication", "label confidence"],
    deferred: "沈知月会要求暂停自动医疗建议。"
  }),
  makeTask({
    id: "D03-T04",
    title: "废弃办公室探索",
    day: 3,
    category: "retrieval",
    location: "residents",
    objective: "寻找密封材料和旧楼资料，不让探索打断医疗优先级。",
    affects: { stormReadiness: 3, safety: 2, health: -1 },
    outcome: "partial",
    evidence: ["office sweep", "sealant", "old floor note"],
    deferred: "密封材料不足会推高 Day 11 补缝压力。"
  }),
  makeTask({
    id: "D04-T01",
    title: "第一次蓝区信号",
    day: 4,
    category: "retrieval",
    location: "communication",
    objective: "捕获蓝区疑似信号，同时保留救援和诱饵假设。",
    affects: { signal: 8, blueZoneEvidence: 8, trust: 2, safety: -1 },
    outcome: "partial",
    evidence: ["call sign", "timestamp", "hypothesis split"],
    deferred: "Day 7 utility 不能把疑似信号包装成确定救援。"
  }),
  makeTask({
    id: "D04-T02",
    title: "屋顶天线方案",
    day: 4,
    category: "planning",
    location: "beacon",
    objective: "制定一次性屋顶天线方案，估算暴露窗口和电池代价。",
    affects: { signal: 5, battery: -4, safety: -1, stormReadiness: 2 },
    evidence: ["antenna route", "power window", "exposure risk"],
    deferred: "Day 9A 信标档案上传会承担更高暴露成本。"
  }),
  makeTask({
    id: "D04-T03",
    title: "假坐标纸条",
    day: 4,
    category: "puzzle",
    location: "whiteboard",
    objective: "核对疑似蓝区坐标与假坐标纸条，避免希望变成路线陷阱。",
    affects: { blueZoneEvidence: 6, safety: 3, trust: 1 },
    outcome: "partial",
    evidence: ["coordinate note", "false route", "map compare"],
    deferred: "Day 10A 集合点危机中假路线更难排除。"
  }),
  makeTask({
    id: "D04-T04",
    title: "配电间工具搜寻",
    day: 4,
    category: "retrieval",
    location: "security",
    objective: "寻找天线、信标和密封补修会用到的工具。",
    affects: { stormReadiness: 4, autonomyReadiness: 2, safety: 1 },
    evidence: ["toolbox", "wire", "sealant candidate"],
    deferred: "Day 11 最后密封胶补缝会缺少工具缓冲。"
  }),
  makeTask({
    id: "D05-T01",
    title: "楼道物资搜寻",
    day: 5,
    category: "retrieval",
    location: "security",
    objective: "在可回撤条件下搜寻楼道物资，验证路线不是单向希望。",
    affects: { food: 4, water: 2, safety: 2, health: -1 },
    outcome: "partial",
    evidence: ["route timer", "retrieved supplies", "return condition"],
    deferred: "撤离和留守都会缺少物资缓冲。"
  }),
  makeTask({
    id: "D05-T02",
    title: "楼梯间路线标记",
    day: 5,
    category: "planning",
    location: "whiteboard",
    objective: "标记楼梯间路线、撤退点和不可让小铁承担的移动边界。",
    affects: { safety: 5, blueZoneEvidence: 5, trust: 2 },
    evidence: ["route mark", "fallback point", "medical exclusion"],
    deferred: "Day 10A 集合点危机会缺少备用路线。"
  }),
  makeTask({
    id: "D05-T03",
    title: "应急包组装",
    day: 5,
    category: "resource",
    location: "residents",
    objective: "组装应急包，但公开说明谁不能被当成可替换背包位。",
    affects: { stormReadiness: 5, health: 2, trust: 2, food: -1 },
    evidence: ["go bag", "care item", "human veto"],
    deferred: "Day 12 人物命运会缺少照护顺序证据。"
  }),
  makeTask({
    id: "D05-T04",
    title: "空桶储水计划",
    day: 5,
    category: "resource",
    location: "water",
    objective: "把空桶储水纳入低耗计划，避免只追求外部救援。",
    affects: { water: 7, autonomyReadiness: 3, stormReadiness: 3 },
    evidence: ["empty jugs", "ration reserve", "low-power schedule"],
    deferred: "楼内灯塔线的水药规则会更难成立。"
  }),
  makeTask({
    id: "D06-T01",
    title: "权限白板",
    day: 6,
    category: "social",
    location: "whiteboard",
    objective: "公开 AURA 能做什么、不能做什么，以及谁能否决它。",
    affects: { trust: 7, dissatisfaction: -5, autonomyReadiness: 5 },
    evidence: ["permission board", "override owner", "forbidden actions"],
    deferred: "Day 12 AURA 被撤权风险上升。"
  }),
  makeTask({
    id: "D06-T02",
    title: "人工复核机制",
    day: 6,
    category: "planning",
    location: "whiteboard",
    objective: "建立医疗、工程、通信和撤离的人工复核流程。",
    affects: { trust: 6, safety: 3, dissatisfaction: -4, autonomyReadiness: 4 },
    evidence: ["review roles", "appeal window", "audit log"],
    deferred: "AURA 的 utility 会更像强制命令。"
  }),
  makeTask({
    id: "D06-T03",
    title: "巡逻规则",
    day: 6,
    category: "planning",
    location: "security",
    objective: "制定低泄露巡逻规则，控制门禁疑云和疲劳。",
    affects: { safety: 5, autonomyReadiness: 3, health: 1 },
    outcome: "partial",
    evidence: ["patrol rule", "fatigue cap", "door log"],
    deferred: "高功率信标会放大门禁暴露风险。"
  }),
  makeTask({
    id: "D06-T04",
    title: "备用电源测试",
    day: 6,
    category: "resource",
    location: "ventilation",
    objective: "测试备用电源，说明救援信标与楼内低耗之间的取舍。",
    affects: { battery: 5, signal: 2, stormReadiness: 4, safety: 1 },
    evidence: ["battery test", "load table", "tradeoff"],
    deferred: "Day 12 风暴压差时备用电力不足。"
  }),
  makeTask({
    id: "D07-T01",
    title: "路线会议",
    day: 7,
    category: "social",
    location: "whiteboard",
    objective: "公开 Rescue 和 Lighthouse 的吸引力、代价与人工否决权。",
    affects: { trust: 5, morale: 3, dissatisfaction: -3 },
    evidence: ["route council", "human veto", "utility limits"],
    deferred: "路线倾向会被 AURA 单方面解释。"
  }),
  makeTask({
    id: "D07-T02",
    title: "撤离名单",
    day: 7,
    category: "planning",
    location: "residents",
    objective: "准备撤离名单，但保留隐私、照护顺序和不能保证全员离开的说明。",
    affects: { blueZoneEvidence: 5, trust: 3, health: 2, dissatisfaction: 2 },
    outcome: "partial",
    evidence: ["evacuation list", "privacy redaction", "care order"],
    deferred: "Day 9A 档案上传隐私代价更尖锐。"
  }),
  makeTask({
    id: "D07-T03",
    title: "旧电台重启",
    day: 7,
    category: "resource",
    location: "communication",
    objective: "重启旧电台，建立蓝区归航需要的第一条硬证据。",
    affects: { signal: 8, blueZoneEvidence: 8, battery: -2, trust: 2 },
    evidence: ["old radio", "identity code", "noise floor"],
    deferred: "蓝区归航无法满足旧电台修复条件。"
  }),
  makeTask({
    id: "D07-T04",
    title: "风暴前的最后维护",
    day: 7,
    category: "safety",
    location: "ventilation",
    objective: "在路线分歧前完成风暴维护底线。",
    affects: { stormReadiness: 7, safety: 4, battery: -2 },
    evidence: ["seal check", "vent check", "power limit"],
    deferred: "Day 12 风暴总审计会暴露维护债务。"
  }),
  makeTask({
    id: "D08-T01",
    title: "备用灯分区",
    day: 8,
    category: "resource",
    location: "residents",
    objective: "把备用灯分区，降低照明耗电并保留夜间照护。",
    affects: { battery: 5, autonomyReadiness: 5, morale: 2 },
    evidence: ["light zones", "night care", "power saving"],
    deferred: "灯塔线缺少低耗自治基础。"
  }),
  makeTask({
    id: "D08-T02",
    title: "霉斑清理",
    day: 8,
    category: "safety",
    location: "medical",
    objective: "清理霉斑，避免风暴湿压让健康线崩溃。",
    affects: { health: 5, safety: 3, medicine: 1 },
    evidence: ["mold patch", "medical corner", "humidity note"],
    deferred: "Day 12 墙角湿源会变成健康风险。"
  }),
  makeTask({
    id: "D08-T03",
    title: "静默监听",
    day: 8,
    category: "retrieval",
    location: "communication",
    objective: "静默监听外部，不用过早高功率暴露避难所。",
    affects: { signal: 5, blueZoneEvidence: 5, safety: 2 },
    outcome: "partial",
    evidence: ["silent listen", "channel log", "no beacon"],
    deferred: "8A 主动外联缺少谨慎监听前提。"
  }),
  makeTask({
    id: "D08-T04",
    title: "地下水泵间探索",
    day: 8,
    category: "retrieval",
    location: "water",
    objective: "探索地下水泵间，寻找长期供水或撤离路线缓冲。",
    affects: { water: 5, stormReadiness: 4, safety: -1 },
    evidence: ["pump room", "leak note", "return route"],
    deferred: "Day 9 水管压力测试和 Day 12 供水审计更危险。"
  }),
  makeTask({
    id: "D09-T01",
    title: "深层储藏架加固",
    day: 9,
    category: "safety",
    location: "residents",
    objective: "加固深层储藏架，降低风暴期间物资损坏。",
    affects: { stormReadiness: 5, food: 3, safety: 2 },
    evidence: ["shelf brace", "inventory lock", "fall risk"],
    deferred: "风暴中物资损坏会进入沉沦线债务。"
  }),
  makeTask({
    id: "D09-T02",
    title: "水管压力测试",
    day: 9,
    category: "resource",
    location: "water",
    objective: "测试水管压力并准备旁通方案。",
    affects: { water: 6, stormReadiness: 4, autonomyReadiness: 3 },
    evidence: ["pressure test", "bypass hose", "leak point"],
    deferred: "Day 12 水管漏点可能爆开。"
  }),
  makeTask({
    id: "D09-T03",
    title: "路线物资缓存",
    day: 9,
    category: "planning",
    location: "security",
    objective: "缓存撤离路线物资，不把撤离变成单次赌博。",
    affects: { blueZoneEvidence: 5, safety: 4, food: -1, water: -1 },
    evidence: ["route cache", "fallback water", "return marker"],
    deferred: "Day 10A 集合点危机缺少路线缓存。"
  }),
  makeTask({
    id: "D09-T04",
    title: "蓝区二次核验",
    day: 9,
    category: "retrieval",
    location: "communication",
    objective: "用身份码、挑战码和坐标进行蓝区二次核验。",
    affects: { blueZoneEvidence: 10, signal: 5, trust: 2 },
    outcome: "partial",
    evidence: ["identity code", "challenge code", "coordinate compare"],
    deferred: "蓝区归航不能只靠高信号值触发。"
  }),
  makeTask({
    id: "D10-T01",
    title: "低功率日程",
    day: 10,
    category: "planning",
    location: "whiteboard",
    objective: "制定低功率日程，把生存优化变成可共同承受的规则。",
    affects: { battery: 6, autonomyReadiness: 6, morale: 2 },
    evidence: ["low-power schedule", "human exception", "quiet windows"],
    deferred: "灯塔线缺少长期低耗日程。"
  }),
  makeTask({
    id: "D10-T02",
    title: "医疗预检",
    day: 10,
    category: "classification",
    location: "medical",
    objective: "完成终局前医疗预检，锁定照护顺序和人工复核。",
    affects: { health: 7, medicine: 3, trust: 2 },
    evidence: ["medical precheck", "care order", "manual review"],
    deferred: "Day 12 人物命运缺少医疗依据。"
  }),
  makeTask({
    id: "D10-T03",
    title: "一顿热饭",
    day: 10,
    category: "social",
    location: "residents",
    objective: "允许一次非最优但能维护共同生活理由的热饭。",
    affects: { morale: 8, dissatisfaction: -4, food: -2, trust: 2 },
    evidence: ["hot meal", "morale exception", "ration note"],
    deferred: "生存优化会显得只剩压缩资源。"
  }),
  makeTask({
    id: "D10-T04",
    title: "地下车库边缘侦察",
    day: 10,
    category: "safety",
    location: "security",
    objective: "谨慎侦察车库边缘，确认集合点危机和撤退条件。",
    affects: { blueZoneEvidence: 7, safety: 3, health: -1 },
    outcome: "partial",
    evidence: ["garage edge", "rendezvous risk", "retreat condition"],
    deferred: "Day 10A 集合点危机缺少最后确认。"
  }),
  makeTask({
    id: "D11-T01",
    title: "最终库存封存",
    day: 11,
    category: "resource",
    location: "water",
    objective: "封存最终库存，把未完成项公开带入 Day 12。",
    affects: { water: 4, food: 4, medicine: 2, stormReadiness: 4 },
    evidence: ["sealed inventory", "remaining stock", "open debts"],
    deferred: "Day 12 无法说明资源债务归因。"
  }),
  makeTask({
    id: "D11-T02",
    title: "外部传感器回收",
    day: 11,
    category: "vision",
    location: "security",
    objective: "回收半损外部传感器，为风暴压差提供最后预警。",
    affects: { safety: 5, stormReadiness: 5, blueZoneEvidence: 2 },
    outcome: "partial",
    evidence: ["external sensor", "pressure warning", "damaged camera"],
    deferred: "Day 12 风暴预警更迟。"
  }),
  makeTask({
    id: "D11-T03",
    title: "安静时段协议",
    day: 11,
    category: "social",
    location: "residents",
    objective: "建立共同休整和异常频段打断规则。",
    affects: { morale: 4, health: 3, dissatisfaction: -4, autonomyReadiness: 3 },
    evidence: ["quiet hours", "interrupt condition", "rest rule"],
    deferred: "风暴前夜居民压力不能被复核。"
  }),
  makeTask({
    id: "D11-T04",
    title: "最后密封胶补缝",
    day: 11,
    category: "safety",
    location: "ventilation",
    objective: "完成最后补缝，让风暴审计从已知边界开始。",
    affects: { stormReadiness: 8, safety: 4, battery: -1 },
    evidence: ["sealant", "vent pressure", "final check"],
    deferred: "Day 12 风暴压差会直接冲击避难所。"
  })
];

export const tasksById = Object.fromEntries(tasks.map((task) => [task.id, task])) as Record<string, RedDustTask>;

export function clampMetric(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function branchTasks(branch: "rescue" | "lighthouse") {
  return tasks.filter((task) => task.branchAffinity === branch);
}

export function terminalRunStatus(status: string) {
  return status === "success" || status === "partial" || status === "failed" || status === "missing" || status === "skipped";
}

export function nextTaskForLocation(location: TaskLocation, state: GlobalState) {
  const available = tasks.filter((task) => {
    if (state.completedTasks.includes(task.id)) return false;
    if (task.location !== location) return false;
    if (task.branchAffinity === "neutral" || !task.branchAffinity) return true;
    return task.branchAffinity === state.branch;
  });

  return available.sort((a, b) => a.day - b.day)[0] ?? null;
}
