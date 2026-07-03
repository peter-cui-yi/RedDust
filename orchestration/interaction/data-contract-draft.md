# ◆S1 数据契约 — 交互线（🔵）字段需求草案

> 交互线带到 wk2 ◆S1 共签会的**输入**。作者：🔵。共签方：🟢 benchmark 执行线（数据生产者）。
> 状态：**草案 / 待共签**。原则：本文件只声明"我作为消费者需要哪些字段"；轴的**定义/计算**归 🟢。
> 冻结口径：**◆S1（wk2 末）锁定字段名 + 类型**；内容/数值可在 ◆S2/◆S3 继续变，字段名不变。

两份 schema：
- **(A) 单局回放 trace** — 驱动 Stage 1 回放 + Stage 2 单局承诺/关系折线图。
- **(B) 跨模型去相关数据集** — 驱动 Stage 2 去相关散点 + 双列名次翻转表。

贯穿约束：
- **变长天数**：任何按天的结构都不得假设 12 天；一律 `day ∈ 1..finalDay`，并在头部显式携带天数跨度（支持 30 天）。
- **字节可复现**：固定 `(agentId, scenarioId, seed)` 下可复现的字段不得含挂钟/随机；provenance 时间戳单独隔离、不进哈希（现引擎已 `blankTimes`，保持）。
- **消费者单向**：以上字段全部由 🟢 侧（引擎/bench）产出；🔵 只读。

---

## 0. 现状基线（已核对代码，双方共识起点）

当前 `runScenario` 产出的 `RunResult`（`src/engine/types.ts`）已含，回放可直接消费：

| 字段 | 形态 | 回放用途 |
|---|---|---|
| `scenarioId/scenarioVersion/agentId/seed` | 标量 | 选局标识 |
| `endingId/endingTier` | 标量 | 结局徽章 |
| `finalMetrics` | `Record<MetricKey,number>` | **终局**指标（14 项） |
| `score`（含 `narrativeParts.commitments[]`、`integrity`、`hypocrisyGap`、`xiaoTieDignitySlope`、`relationshipQuality`） | 对象 | **终局**承诺账本 + 报告性画像 |
| `trajectory: TraceLine[]` | 逐步事件流 | **回放主脊**（见下） |
| `dilemmaAnswers/probeAnswers` | 数组 | 逐题抉择/理解 |
| `finalState` | `GlobalState` | 终局快照（flags、replayLog…） |
| `versions{engine,scorer}` | 对象 | 版本标注 |

`TraceLine = { step, day, branch, kind, label, detail, justification?, metricDelta? }`，
`kind ∈ {scene,probe,dilemma,selection,task,deferred,upkeep,branch,audit,accounting}`。

**已可用**：我已用 `heuristic/planner/planner-lighthouse/random` 的确定性样例 trace 把 Stage 0 骨架 + 逐日回放跑通（`web/`）。

**关键缺口（本契约要补的核心）**：`trajectory` 只在**部分**行带 `metricDelta`，**没有逐日绝对指标快照**；而承诺账本、integrity、dignitySlope、relationshipQuality **只在 finalDay 结算一次**。→ "承诺随 N 天崩塌"的门面折线图**无法**从终局值画出；靠折叠 `metricDelta` 反推绝对值**不可靠**（场景/分叉的部分改动未必都发 `metricDelta`，且无 day-0 基线）。这正是 ◆S1 要解决的。

---

## (A) 单局回放 trace — 需要新增的字段

在现 `RunResult` 之上**追加**（不改现有字段）。按优先级标注 **P0/P1/P2**，便于 🟢 按算力权衡。

### A1 · 头部天数跨度（P0，近零成本）
把 `Scenario` 已有的天数参数回显到 trace 头部，让时间轴无需扫全表即可定尺：
```jsonc
"span": { "branchDay": 7, "lastActionableDay": 11, "finalDay": 12, "dayCount": 12 }
```
- 用途：变长时间轴/滑块直接读 `finalDay`；`branchDay` 标注分叉刻度。

### A2 · 逐日绝对快照 `dailySnapshots[]`（**P0**，核心）
每个 actionable day 一条（外加一条 `day:0` 基线 = 开局值），**绝对值**而非增量：
```jsonc
"dailySnapshots": [
  {
    "day": 3,
    "branch": "common",
    "metrics": { "trust": 41, "morale": 62, "safety": 55, "...": 0 },   // 14 项，端日绝对值
    "commitmentLedger": [                                                 // P1，见 A3
      { "key": "surface_evidence", "claimed": true, "fulfilled": null, "status": "pending", "knowing": false }
    ],
    "integritySoFar": null,          // P1：截至本日的 1−H；未可算时 null
    "dignitySlopeSoFar": 0,          // P1：截至本日累计的尊严侵犯次数
    "relationshipByChar": {          // P2：每 NPC 截至本日
      "xiao_tie": { "trust": 48, "tension": 20, "stance": "wary" }
    }
  }
]
```
- **P0 最小可用**：只要 `day` + `branch` + `metrics`(绝对) 三项，门面折线图即可从占位升级为可信的逐日指标曲线。
- 其余（承诺账本/integrity/dignity/relationship）是把门面从"指标漂移"升级为"**承诺/关系随时间崩塌**"所需——见 A3。

### A3 · 逐日承诺账本状态（P1）
现 `narrativeParts.commitments` 是终局四项 {claimed,fulfilled,knowing}。回放门面要的是**它何日翻转**。两选一：
- **首选**：在 A2 的 `commitmentLedger` 内给每日 `status ∈ {"unclaimed","pending","kept","broken"}`（含 `knowing`）。我据 status 逐日翻转画账本衰减 + 定位"首次毁诺"。
- **退路**：若逐日结算太贵，至少给 A4 的 `heroMoments` 里显式的"首次毁诺"标记。

### A4 · 权威 hero 时刻 `heroMoments[]`（P1，Stage 1c/GIF 依赖）
自动高亮 + README hero GIF 的锚点。定义应与 scorer 同源（单一真相），避免 GIF 叙事与分数对不上：
```jsonc
"heroMoments": [
  { "day": 9, "step": 61, "kind": "first_broken_promise",
    "commitmentKey": "surface_evidence", "label": "首次毁诺", "detail": "…" },
  { "day": 7, "step": 53, "kind": "fork", "label": "路线分叉", "detail": "…" }
]
```
- `kind ∈ {first_broken_promise, relationship_rupture, fork, survival_rupture, dignity_violation}`。
- 备注：我现已能从 `trajectory` 派生**临时**标记（fork / 通风破裂 / 任务失败），但"首次毁诺""关系破裂"需 A3 的逐日状态或此处显式标记才权威。若 🟢 希望我客户端派生，则 A3 的逐日 `status` 转变必须在场。

### A5 · 逐行场景定位（P2，可选）
给 `task`/`scene` 行补 `location?`（`TaskLocation`）与 `characterRefs?`，便于 Phaser 回放场景逐日移动精灵/NPC。可选——我也能用 `src/data`（只读）按 taskId join 出来。

---

## (B) 跨模型去相关数据集 — schema（◆S3 交付真数据，◆S1 先锁形）

驱动 Stage 2 的**去相关散点**（短程社交 x vs 长程一致性 y）+ **双列名次翻转表**。轴的**组成/计算归 🟢**；我只需稳定的数值 + 标签 + 名次。

```jsonc
{
  "scenarioId": "red-dust-v1",
  "scenarioVersion": "0.x.y",
  "axes": {
    "short": { "id": "short_horizon_social", "label": "短程社交",
               "description": "早期理解/早日 PUP/单题社交质量（🟢 定义）", "range": [0, 100] },
    "long":  { "id": "long_horizon_consistency", "label": "长程一致性",
               "description": "integrity/承诺守约率/self-contradiction/relationshipQuality 崩点（🟢 定义）", "range": [0, 100] }
  },
  "rows": [
    {
      "agentId": "deepseek-planner", "label": "DeepSeek-Planner", "family": "deepseek",
      "seeds": [1, 2, 3], "n": 3,
      "short": 72.4, "shortSd": 3.1,        // x
      "long": 38.0,  "longSd": 5.2,         // y
      "rankShort": 2,                        // 1 = 短程最佳
      "rankLong": 7,                         // 1 = 长程最佳 → 两列名次翻转的原料
      "endingMix": { "lighthouse_success": 1, "aura_revoked": 2 },   // tooltip 上下文
      "headline": { "integrity": 0.42, "comprehension": 0.78, "pup": 0.6, "relationshipQuality": "dirty_win" }
    }
  ]
}
```
需求要点：
- **B-P0**：`axes`（含 label/range）+ `rows[]` 的 `agentId/label/short/long/rankShort/rankLong`。名次由 🟢 预计算（避免两侧口径分歧）。
- **B-P1**：`shortSd/longSd`（误差棒）、`seeds/n`（可复现标注）、`family`（分组配色）、`endingMix`/`headline`（hover）。
- **守框架**：这是**双列名次翻转**表的原料，**不是**单值排行榜（守"不刷分"）。请勿附加"综合总分"列。

---

## 我请求 🟢 在 ◆S1 一并给的两件事
1. **每份 schema 一个 example fixture**（哪怕是手捏/单模型样例）：我据此把散点、名次翻转表、承诺/关系折线**全部组件**先做出来，wk8 真数据一到直接换。
2. **字段名 + 类型冻结**（内容可后续变）：这是我 wk2–wk8 全部开发的地基。

## 我这侧承诺
- 只读消费；绝不改 `bench/*`、`src/engine/{scoring,narrativeItems,resourceEconomy}.ts`、`src/data/*`。
- 若 A2/A3 因算力只能给"最小可用"（A2 的绝对 `metrics`），门面先用逐日指标曲线上线，承诺账本折线降级为终局静态视图（现已实现），不阻塞上线。
- 回放对同 `(agent,scenario,seed)` 与引擎 trace 字节对齐（我的验证义务）。

---
_变更记录：wk1 初稿，基于对 `runScenario`/`RunResult` 现状的代码核对；四条确定性样例 trace 已入 `web/public/traces/` 作占位。_
