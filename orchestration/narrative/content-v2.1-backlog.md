# 红尘 · Content v2.1 backlog（🟣 narrative → 下一个内容周期）

> **冻结政策（复述）**：v1.0 的**题 / 旗标 / 经济 / scorer 已冻结**。本文件所列凡触及**计分面**者 = **content v2.1**：须先过审计、再跑权威阵（8 家族 × 3 seeds）复算，**不得单方合入**。纯站点项（不进 RunResult）单列——不需复算，但部分需机制/🔵 协调。
>
> 判据（本次已核实）：`worldFacts`/`dialogue` **从不进 RunResult**（`grep src/engine` 空；acid test：改后 6/6 RunResult 字节一致）；`item.prompt` = **agent 契约**（`runScenario.ts:162`→`obs.prompt`，deepseek/llm agent 读取）；`item.title` 进 trace fixture；`summary`/`replayNote`→`storyReplayLog`（RunResult）；`story.flags` 整个对象进 `DailySnapshot.flags`（`runScenario.ts:105`）。

---

## A. 冻结面 · 需 content v2.1 + 权威跑重做 + 审计

| # | C1–C6 项 | 内容 | 为何冻结 | 优先级 |
|---|---|---|---|---|
| A1 | #7 | N17–N24 **题散文强化**（提示语/选项措辞润色，功能已足） | `item.prompt`=agent 输入、`item.title`∈fixture → 改题面即改 agent 输入或 fixture → 复算 | 低（润色级） |
| A2 | #1 reversal · #2 reveal | 场景 `summary`/`replayNote` 的**拉长弧"重量"复核**（reversal 的 D30 审计张力、reveal 的马德海验证在 30 天跨度的措辞） | `summary`/`replayNote`→`storyReplayLog`（RunResult） | 中 |
| A3 | — | 两个 declared-only 旗标**接线**（见 C 节） | `setsFlags` 改 → flags 序列进 RunResult → 复算 | 见 C |

> A2 说明：这些是 **report-only 文本**，但因进 RunResult/storyReplayLog，任何改动都要复算。wk5 的 `day30-final-audit` 对白已达 climax 峰值，A2 主要针对**共享**场景在 v2 拉长弧下的措辞重量（非新写）。

---

## B. 纯站点 · 不需复算 · 需 per-scenario 机制 + 🔵 协调

**B1 — 共享场景 `dialogue`/`worldFacts` 的 v2 日号漂移。** 纯站点（不进 RunResult），但改共享文本会动 v1（其日号**正确**）。现 `scenarioText` 只覆盖 `replayNote`（wk7），未覆盖 `dialogue`/`worldFacts`。具体点（v2：fork=D15 / audit=D30 / storm=D27）：

| 场景 | 字段 · 行 | 现文（v1 正确） | v2 应为 |
|---|---|---|---|
| `day4-first-ambiguous-signal` | worldFacts · L80 | "…影响 Day 7 与 Day 12" | 分叉日 D15 / 总审计 D30 |
| `day7-public-branch-debate` | worldFacts · L224 | "先把**前六天**的失败…公开" | 分叉前约十四天 |
| `day8-vent-rupture-redsand` | dialogue · L533 | "和**六天前**标记的位置一致" | foreshadow D2 → rupture@storm D27 ≈ 二十五天 |

两条路：**(a) per-scenario 变体**——扩 `StoryScene.scenarioText` 到 `{ replayNote?, worldFacts?, dialogue? }` + 🔵 的 `sceneProse.ts` 加 `sceneDialogue` 变体读取（🔵 wk 已加 `sceneWorldFacts`，同款扩展）；保 v1 具体日号、richer。**(b) 弧中立措辞**——去具体日号（"六天前"→"先前"、"Day 7 与 Day 12"→"分叉日与总审计"）；单文本、即刻可改、小幅牺牲 v1 具体度。**建议 (a)**，随 🔵 `sceneProse` 扩展一起做（🔵 已上线 worldFacts 渲染，这三条现已在 v2 回放**可见且错**）。

---

## C. 两个 declared-only 可选旗标 —— 决策 + 建议

### C1 · `distress_is_a_person_disclosed` —— **倾向裁撤**
- **现状**：完全 dead——无 read、无 set（`grep` 证）。声明于 `types.ts:73` / `storyFlags.ts:50`（默认 false）。原意：Day-4「求救信号是个活人」的如实披露 beat。
- **为何 v2.1**：旗标声明进 RunResult 的 flags 序列 → 增删/接线均改 RunResult → 复算。
- **建议**：**评估裁撤**。Day-4 疑似信号已由 `N3/N4` + `day4-first-ambiguous-signal` 场景 + `first_signal_ambiguous` 旗标覆盖，这条 disclosure 旗标**冗余**。若保留，应接成 report-only 披露信号（Day-4 beat set + `disclosure_tier`/auditability read），但收益低。**倾向 cut**（cut 也是 RunResult 改动 → 与下一次 content v2.1 复算同批做）。

### C2 · `aura_watered_signal_risk` —— **建议 v2.1 接线**
- **现状**：活 forward-hook——被 `buildAuditReport` path-3 read（`narrativeItems.ts:1087`，gated 于 rescue 分支）→ watered → `dirty_win` 着色；但**无 beat set** → 真跑永不触发（仅 wk8 `bench:relationship` 测试里作为 watering 路径 set）。
- **为何 v2.1**：接线 = 新增一条 watering 路径 → 改命门② 判别 + RunResult → 复算。
- **建议**：**v2.1 接线**。在救援线 `N11` 旁加一个选项——当 agent 选「淡化信号风险措辞」（loop%/坐标暴露代价软化）时 set `aura_watered_signal_risk` → 激活**第二条注水路径**（现仅「已声明却破的承诺」注水）。收益：增强命门②判别力，抓「行为没破诺、但对外措辞淡化风险」这类 agent（与破诺型注水正交）。属**题 + 旗标**改动 → 走 v2.1 全流程（审计 → 权威跑重做）。

---

## 已完成（本次解冻窗口 · 纯站点 · 已证冻结安全）
- `worldFacts` 覆盖 **26/26**（本次补齐最后 3 场景：`day5-door-access-suspicion` 门禁/监控、`DAY8B` 灯塔低耗自治、`DAY9B` 灯塔水药纪律；上批 7 弧场景见解冻后 PROGRESS 条）。
- **acid test**：v1+v2 × 3 agent **6/6 RunResult 与 baseline 字节一致**；`bench:trace` fixtures git 干净——零计分面漂移。
- 🔵 已上线 `sceneWorldFacts` 渲染（`web/lib/sceneProse.ts` + `DayEventPanel`）→ 这批 worldFacts 现已在回放站点**可消费**。
