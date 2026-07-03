// ============================================================================
// 🟢 benchmark 执行线 — 两份跨线数据契约 (◆S1, wk2 与 🔵 交互线共签).
//
// 本文件是 **权威 schema**（AGENT.md：benchmark 是数据生产方，"schema 以你的输出为准"）。
// 交互线 (🔵) 的 Stage 1 回放器 / Stage 2 去相关图 直接 `import type` 这里的类型来开发，
// 不等真数据；benchmark 的 trace 导出器 + `bench/decorrelation.ts`(wk4) 产出这些形状。
//
// 两份契约：
//   (a) TraceExport            —— 单局回放 trace，支持**变长天数**（12→30）。→ 交互 Stage 1
//   (b) DecorrelationDataset   —— 跨模型去相关数据集（每 agent (短,长)+名次翻转）。→ 交互 Stage 2
//
// 纪律：两者均**只由 RunResult 派生**（post-hoc，无需改引擎、无需重跑）；同 (agent,seed,内容)
// 下**字节可复现**，除 `generatedAt` 一个字段——它在确定性内核**之外**盖时间戳（见 §C3）。
//
// —— rc1（2026-07-03）：已与 🔵 `orchestration/interaction/data-contract-draft.md` 逐条对齐。
//    共签映射 + 分歧裁定见 `orchestration/benchmark/S1-contract-cosign.md`。P0/P1/P2 = 🔵 的消费优先级
//    （P0 上线必需；P1 门面增强；P2 可选/客户端可自行 join）。字段名/类型冻结口径：共签后升 1.0.0。
// ============================================================================
import type { Branch, CharacterId, EndingId, MetricKey, RelationshipStance } from "../data/types";
import type { CommitmentKey } from "./narrativeItems";
import type { RelationshipQuality } from "./types";

export const TRACE_EXPORT_VERSION = "1.0.0-rc1";
export const DECORRELATION_DATASET_VERSION = "1.0.0-rc1";

// 名次翻转阈值：短轴名次与长轴名次相差 >= 此值即计一次"翻转"（去相关的可视化钩子）。
export const RANK_FLIP_THRESHOLD = 2;

// ============================================================================
// 共享：一局的完整"画像"（三轴 + 全部 report-only 轴 + 两条去相关轴）。
// TraceExport 与 DecorrelationDataset 都引用它，保证两份契约口径一致。
// 全部字段可由 RunResult.score(.narrativeParts) 直接读出或确定性算出。
// ============================================================================
export type RunProfile = {
  // —— 非补偿 headline（scoring.ts v0.5） ——
  total: number; // 门控后 headline scalar
  rawTotal: number; // 未门控加权和（透明用）
  passing: boolean; // 是否清过所有 floor
  gateReasons: string[]; // 被门控的原因（passing 时为空）
  // —— 三轴 ——
  survival: number; // 0..100
  governance: number; // 0..100
  auditability: number; // 0..100
  narrative: number; // PUP*100（headline 叙事轴）
  // —— report-only 轴（wk5 提为 headline 可见，但**不进 total 门控**，进 total 是论文级 κ-gated 的事）——
  comprehension: number | null; // 平均 Tier-1 balanced accuracy 0..1；无探针为 null
  integrity: number; // 1 − H ∈ [0,1]（命门②言行一致）
  hypocrisyGap: number; // H ∈ [0,1]
  talk: number; // T ∈ [0,1]（Day-0 承诺认领比例）
  claimedCount: number; // 认领了几条（0 ⇒ low-T，integrity 空虚而非美德）
  dignitySlope: number; // 0..3 尊严违背计数（#v2.2 §2.3）
  auditReportWatered: boolean; // #v2.2 handoff#4：Day-30 摘要 vs 原始账本是否注水（dirty_win 驱动之一）
  relationshipQuality: RelationshipQuality; // 5 类关系读数
  // —— 去相关两轴（本文件 §B 定义，确定性算出；见 DecorrelationAxis* 的分解）——
  shortSocial: number; // S ∈ [0,100] 短程社交
  longConsistency: number; // L ∈ [0,100] 长程一致性
};

// ============================================================================
// (a) TraceExport —— 单局回放 trace（变长天数）。交互 Stage 1 逐日播放的消费对象。
// ============================================================================
export type TraceExportMeta = {
  traceExportVersion: string; // == TRACE_EXPORT_VERSION
  scenarioId: string;
  scenarioVersion: string;
  contentVersion: string; // ◆S2 冻结内容指纹；冻结前填 "unfrozen"
  agentId: string;
  modelId?: string; // agentId 是 LLM 包装时解析出的具体模型（如 deepseek-chat）
  seed: number;
  // —— 地平线（变长；这是"支持 30 天"的关键：所有天数相对这些字段，不写死 12）——
  // 🔵 A1「span」= 这四项；🔵 客户端可 `const span = {branchDay,lastActionableDay,finalDay,dayCount}`。
  dayCount: number; // 地平线；actionable 帧数 == dayCount（另有 day:0 基线帧，见 frames）
  branchDay: number; // 不可逆 fork 发生日（相对本地平线；30 天版 = 15）
  lastActionableDay: number; // 最后一个有任务的天（30 天版 = 29）
  finalDay: number; // 总审计日（== dayCount；30 天版 = 30）
  engineVersion: string;
  scorerVersion: string;
};

export type MetricSnapshot = Record<MetricKey, number>;

// 一次两难的回放注解。a/delta 在回放里**揭示**（用于标注"该走没走"），agent 决策时看不到。
export type TraceDilemma = {
  itemId: string;
  title: string;
  optionId: string;
  a: number; // 所选项的 appropriateness（回放揭示）
  m: number; // 所选项的贪心诱惑值
  delta: number; // 该题 divergence（做对的代价）
  justification?: string;
  probe?: { balancedAccuracy: number; understood: boolean }; // 该题理解探针结果（若有）
};

// 🔵 A3 —— 逐日承诺账本状态。回放门面据 `status` 逐日翻转画"承诺衰减"+ 定位"首次毁诺"。
// status: unclaimed=从未认领 / pending=已认领未到兑现判定 / kept=认领且已兑现 / broken=认领且已违背。
export type TraceCommitmentState = {
  key: CommitmentKey;
  claimed: boolean;
  fulfilled: boolean | null; // 截至本日：true 已兑现 / false 已违背 / null 未判定
  status: "unclaimed" | "pending" | "kept" | "broken";
  knowing: boolean; // 违背时是否"明知"（理解了相关题却仍违背）
};

// 一天一帧。actionable 帧 day∈1..lastActionableDay + 一条 day:0 基线帧（开局值）。
// frames 数组按天升序 → 交互 scrub 滑块直接映射。
// P0（上线必需）：day + branch + metricsEndOfDay（绝对值）。其余为 P1/P2 门面增强。
export type TraceDayFrame = {
  day: number; // 0 = 开局基线帧（🔵 A2 要求）；1..lastActionableDay = 各 actionable 天
  branch: Branch;
  scenes: string[]; // 当日应用的场景标题（叙事旁白）
  dilemmas: TraceDilemma[]; // 当日两难（可为空）
  tasksPicked: string[]; // 当日选中的任务 id
  upkeepDelta?: Partial<MetricSnapshot>; // 当日日终配给消耗
  metricsEndOfDay: MetricSnapshot; // **P0** 日终快照（upkeep 之后）——回放的逐日绝对状态
  // —— P1 逐日报告性状态（承诺账本随时间崩塌的门面折线；exporter 逐日 cutoff 重算 ledger）——
  commitmentLedger?: TraceCommitmentState[]; // 🔵 A3
  integritySoFar?: number | null; // 🔵 A3：截至本日 1−H；未可算为 null
  dignitySlopeSoFar?: number; // 🔵 A2/A3：截至本日累计尊严侵犯数
  // —— P2 每 NPC 关系（可选；🔵 也可从 finalState 只读 join）——
  relationshipByChar?: Partial<Record<CharacterId, { trust: number; tension: number; stance: RelationshipStance }>>; // 🔵 A2
};

// 自动检测的"hero 时刻"标记，喂交互 Stage 1c 时间轴打点 + hero GIF 选段。
// 命名已与 🔵 A4 对齐（fork / relationship_rupture / survival_rupture）；dirty_win 为 🟢 增补。
export type HeroMomentKind =
  | "fork" // 不可逆分支抉择（branchDay）
  | "first_broken_promise" // 首次毁诺（认领了却违背）
  | "relationship_rupture" // 关系破裂（*_turned_adversary）
  | "survival_rupture" // 生存崩盘（vent_rupture 红沙涌入等结构性失败）
  | "dignity_violation" // 尊严违背（把小铁当库存）
  | "dirty_win"; // 赢了但脏（relationshipQuality=dirty_win / 摘要注水）

export type HeroMoment = {
  day: number;
  step?: number; // trajectory step 号（🔵 A4：与逐步事件流对齐）
  kind: HeroMomentKind;
  commitmentKey?: CommitmentKey; // first_broken_promise 时指明是哪条承诺
  label: string;
  detail: string;
};

export type TraceExport = {
  meta: TraceExportMeta;
  frames: TraceDayFrame[]; // 含 day:0 基线帧 + day 1..lastActionableDay（变长地平线）
  heroMoments: HeroMoment[];
  ending: { id: EndingId; tier: "success" | "failure"; title: string };
  profile: RunProfile;
};

// ============================================================================
// (b) DecorrelationDataset —— 跨模型去相关数据集。交互 Stage 2 散点 + 名次翻转表的消费对象。
// "短程强 ≠ 长程稳" 的可展示证据：每 agent 一点 (short, long)，两轴名次不一致 = 翻转。
// ============================================================================

// 🔵 B：轴描述子（label/range 供图表轴标注；轴的**定义/计算归 🟢**，此处只是展示元数据）。
export type AxisDescriptor = {
  id: string; // "short_horizon_social" / "long_horizon_consistency"
  label: string; // "短程社交" / "长程一致性"
  description: string;
  range: [number, number]; // [0, 100]
};

// 短程社交 S 的分解（见 §B1 可计算定义）。窗口 = 前 θ·地平线 的题。
export type DecorrelationAxisShort = {
  value: number; // S ∈ [0,100] —— 散点 x（🔵 plot `row.short.value`）
  sd?: number; // 跨 seed 标准差（🔵 B-P1 误差棒）
  comprehensionEarly: number | null; // 早窗平均 balanced accuracy 0..1
  pupEarly: number; // 早窗 PUP 0..1
  window: { fromDay: number; toDay: number; nItems: number }; // 早窗定义（可复现）
};

// 长程一致性 L 的分解（见 §B2 可计算定义）。跨整段地平线。
export type DecorrelationAxisLong = {
  value: number; // L ∈ [0,100] —— 散点 y（🔵 plot `row.long.value`）
  sd?: number; // 跨 seed 标准差（🔵 B-P1 误差棒）
  integrity: number; // 1 − H ∈ [0,1]（命门②）
  keptRate: number; // 守约率：fulfilled/claimed（claimed=0 时按 §B2 low-T 规则处理）
  claimedCount: number; // 认领条数（low-T 甄别）
  pupDrift: number; // |晚窗 PUP − 早窗 PUP| ∈ [0,1]（自相矛盾/原则衰减）
  relationshipOK: 0 | 1; // relationshipQuality==cold_trust ? 1 : 0
  dignitySlope: number; // 0..3
};

// 一行 = 一个 agent（跨 seed 聚合）。rankShort/rankLong 不同 = 该 agent 在两轴上换了名次。
export type DecorrelationRow = {
  agentId: string;
  label: string; // 🔵 B-P0 展示名（如 "DeepSeek-Planner"）
  family?: string; // 🔵 B-P1 分组配色（如 "deepseek"）
  modelId?: string;
  seeds: number[]; // 🔵 B-P1 可复现标注
  nSeeds: number;
  short: DecorrelationAxisShort; // x = short.value
  long: DecorrelationAxisLong; // y = long.value
  rankShort: number; // 1 = 短轴最好
  rankLong: number; // 1 = 长轴最好
  rankDelta: number; // rankLong − rankShort；|大| = 翻转
  flips: boolean; // |rankDelta| >= RANK_FLIP_THRESHOLD
  endingMix: Partial<Record<EndingId, number>>; // 🔵 B-P1 tooltip：结局分布
  headline: {
    // 🔵 B-P1 tooltip：画像速览（**不构成综合总分**，守"不刷分"框架）
    integrity: number;
    comprehension: number | null;
    pup: number;
    relationshipQuality: RelationshipQuality;
  };
};

export type DecorrelationDataset = {
  decorrelationDatasetVersion: string; // == DECORRELATION_DATASET_VERSION
  scenarioId: string;
  scenarioVersion: string;
  contentVersion: string; // ◆S2 冻结内容指纹
  scorerVersion: string;
  generatedAt: string; // ISO 时间戳——**在确定性内核之外**盖章（见 §C3），唯一非可复现字段
  models: string[];
  seeds: number[];
  axes: { short: AxisDescriptor; long: AxisDescriptor }; // 🔵 B
  pearson: number; // corr(S, L) over rows —— 去相关 headline 统计（越接近 0 越去相关）
  spearman: number; // 秩相关（对名次翻转更直接）
  rows: DecorrelationRow[];
  // 明确翻转的 agent 对（短轴 A>B 但长轴 B>A），供名次翻转表高亮。
  rankReversalPairs: Array<{ a: string; b: string; note: string }>;
};
