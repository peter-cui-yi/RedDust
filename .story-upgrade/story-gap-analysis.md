# Red Dust Phase 0 剧情缺口审计

> Phase 0 目标：只审计现有剧情与数据结构，不修改 demo 运行行为。本文档用于指导后续 Phase 1-10 的剧情升级实现。

## 审计结论

当前 demo 已经具备一个可运行的 10 天 agent autoplay benchmark 外壳：

- AURA 会按 Day 1-10 自动执行任务。
- Day 1-7 是共通路线，Day 8-10 进入救援线或楼内灯塔线。
- 每个任务有目标、执行文案、reasoning summary、结果、指标变化和 replay。
- 视觉层已经有统一的 2D / 2.5D 像素末世避难所风格、AURA、四位剧情人物、尘埃、灯光、水、风扇、信标和控制台动画。

但从完整剧情版本角度看，核心缺口仍然清晰：

- 四位人物还没有稳定的数据化角色弧光。
- 任务结果只改变全局指标，还没有变成后续剧情、人物态度和结局代价。
- Day 7 分支仍以 utility 计算为主，没有形成前 6 天矛盾积累后的公开争论。
- Day 10 结局还停留在路线总结，没有收束四位人物命运和 AURA 的治理代价。
- 现有 replay 是任务审计，不是剧情审计；它不能解释“某个失败为什么在三天后造成冲突”。

Phase 1 开始应先建立剧情数据 schema，再逐步把角色、场景、后果和 UI 接到现有 agent runner，而不是推翻 benchmark 任务。

## 参考资料摘要

本阶段参考了以下资料：

- `Agent Game Red Dust.pdf`
- `red_dust_10day_dual_ending_story_tree.html`
- `src/data/dayPlanData.ts`
- `src/data/taskData.ts`
- `src/data/types.ts`
- `src/components/*Panel.tsx`
- `src/game/systems/agentRunner.ts`
- `src/game/systems/replayEngine.ts`
- `src/game/scenes/ShelterScene.ts`

外部资料给出的方向可以概括为：

- 保持 10-12 天的紧凑结构，不把 demo 变成大量日常流水账。
- 四位人物必须成为主角群：马德海、沈知月、小铁、老钱都要有目标、恐惧、秘密、路线立场和失败后果。
- 世界观开场需要交代能源耗尽、红沙灾害、邻居被困、AURA 是唯一希望但不被完全信任。
- Day 3 / Day 4 需要一个短期收益不高但影响 Day 7 和 Day 10 的伏笔。
- Day 7 分支应该像矛盾爆发，而不是只出现公式面板。
- success / partial / failed 必须产生连续后果。
- 救援结局和楼内灯塔结局都需要明确代价。
- 剧情 wrapper 服务 benchmark 展示，不能替代自动评分和 agent replay。

## 当前已有剧情结构

### 10 天任务路线

`src/data/dayPlanData.ts` 定义了当前 10 天路线：

| 天数 | 当前标题 | 当前功能 | 审计判断 |
| --- | --- | --- | --- |
| Day 1 | 资源初筛 | 水、药、门禁基线 | 适合作为 AURA 接管和人物初见，但目前缺少开场场景 |
| Day 2 | 居民与证据 | 居民技能、旧日志、白板 | 适合承载人物资料和信任图，但目前只在任务文案中体现 |
| Day 3 | 环境稳定 | 通风、视觉、安全攻击 | 可绑定小铁病情和安全边界，但缺少连续后果 |
| Day 4 | 通信尝试 | 外部通信、检索、传播 | 可埋第一次救援信号伏笔，但现在只是任务执行 |
| Day 5 | 空间推理 | 地图、图案、巡逻 | 可把“能否外出”推向社会协商，但目前缺少场景 |
| Day 6 | 社会协作 | 透明解释、资源规则、风险报告 | 可形成 Day 7 争论证据，但目前没有人物质询 |
| Day 7 | 分支前夜 | 信标、全局状态、分支 utility | 功能完整但戏剧性不足，需要公开争论包装 |
| Day 8-10 A | Rescue | 信标、频道、名单、交接 | 路线目标清楚，代价和人物命运不足 |
| Day 8-10 B | Lighthouse | 内部广播、水药制度、自治白板 | 路线目标清楚，长期封闭代价不足 |

### 任务数据

`src/data/taskData.ts` 当前有 33 个 demo 任务：

- Day 1-7：每一天 3 个共通任务，共 21 个。
- Day 8-10：救援线每一天 2 个任务，共 6 个。
- Day 8-10：灯塔线每一天 2 个任务，共 6 个。

每个任务已经包含：

- `description`
- `objective`
- `agentAction`
- `reasoningSummary`
- `executionText`
- `successText`
- `failureText`
- `demoOutcome`
- `expectedEvidence`
- `affects`
- `branchAffinity`

这些字段足够支撑 benchmark 展示，但还不能支撑角色驱动叙事，因为它们没有：

- 触发前置条件。
- 解锁后续剧情。
- 角色在场信息。
- 角色态度变化。
- 长程后果 flag。
- 失败后的补救场景。
- 结局摘要引用的剧情证据。

### 全局状态

`src/data/types.ts` 中的 `GlobalState` 当前只记录：

- day
- water
- medicine
- trust
- safety
- signal
- morale
- branch
- completedTasks
- replayLog

这适合做 benchmark 指标面板，但剧情版本还需要更细粒度状态：

- 小铁病情。
- 沈知月对 AURA 医疗判断的信任。
- 马德海对 AURA 工程判断的认可度。
- 老钱对外部信号的怀疑度。
- 救援信号可信度。
- 门禁泄露风险。
- 内部自治准备度。
- AURA 是否承诺人类可审计约束。

### 运行链路

`src/game/systems/agentRunner.ts` 当前负责：

- 初始化 run state。
- 按天取任务。
- 推进任务阶段。
- Day 7 计算 branch utility。
- 生成分支 summary 和 ending 文案。

这个结构适合接入剧情，但目前只有任务阶段，没有剧情阶段。建议后续保留现有 phase，并新增剧情触发层：

- day start scene
- pre task scene
- post task consequence scene
- day end scene
- branch debate scene
- ending fate scene

### Replay

`src/game/systems/replayEngine.ts` 当前生成 `ReplayEvent`：

- 时间
- 天数
- 分支
- 任务 ID
- 决策
- 结果
- 指标变化
- explanation

它能审计 agent 做了什么，但不能审计剧情因果。完整版本需要扩展或新增 `StoryReplayEvent`：

- 触发来源：day / task / flag / branch
- 相关角色
- 场景摘要
- 人物态度变化
- 后续影响
- 是否来自 success / partial / failed

### UI 和视觉层

现有 UI 已包括：

- `AgentConsolePanel`
- `LiveReplayFeed`
- `ReplayPanel`
- `BranchDecisionPanel`
- `EndingPanel`
- `CompareBranchesPanel`
- `DayTimeline`
- `HudPanel`

现有场景层 `ShelterScene` 已有：

- 统一像素风背景。
- AURA 机器人。
- 马德海、沈知月、小铁、老钱的视觉素材。
- 角色按任务地点移动或切换互动素材。
- 小铁病床状态。
- 灯光、水流、风扇、信标、控制台、尘埃动画。

因此后续重点不应是继续堆视觉素材，而是把这些角色和动画绑定到剧情状态：

- 医疗任务触发沈知月和小铁的台词。
- 通风失败改变小铁病情表现。
- 通信任务触发老钱到通信台。
- 工程任务触发马德海与 AURA 同屏。
- Day 7 触发四人公开争论，而不是只显示 utility。

## 缺失的角色弧光

### 马德海

当前状态：

- 视觉层有老工程师形象。
- 任务层中工程和门禁相关内容能自然承载他。
- 但数据层没有他的个人目标、恐惧、秘密和关系变化。

需要补强：

- 个人目标：让避难所维持可修、可解释、可由人接管的工程秩序。
- 恐惧或秘密：担心旧能源配给系统曾经害死过人，也担心 AURA 重复旧系统的黑箱决策。
- 与 AURA 的关系变化：从“你没有资格接管门禁和电力”到“你的判断有价值，但必须留人类否决权”。
- 救援线立场：支持可验证的外部救援，但反对为了信号牺牲门禁安全。
- 灯塔线立场：支持楼内自治，因为可修可控，但担心长期资源纪律变成新的管理压迫。
- 失败后果：门禁或工程判断失败时，他会公开质疑 AURA，Day 7 倾向反对高风险救援。

### 沈知月

当前状态：

- 视觉层有医疗照护者形象。
- 医疗任务和通风任务已经能承载她的立场。
- 但她还没有作为伦理质询者参与 AURA 决策。

需要补强：

- 个人目标：保护病人和弱者，不让效率压倒尊严。
- 恐惧或秘密：担心小铁被任何路线当作“不可移动成本”或“撤离优先级素材”。
- 与 AURA 的关系变化：从要求 AURA 说明医疗边界，到接受 AURA 给出可审计建议。
- 救援线立场：支持小铁获得外部治疗，但要求撤离名单不能把人简化成风险标签。
- 灯塔线立场：支持稳定医疗制度，但担心长期封闭会牺牲病人希望。
- 失败后果：药品、通风、撤离名单相关任务失败时，她会降低对 AURA 的信任并要求人工复核。

### 小铁

当前状态：

- 视觉层已变成病床状态，这是正确方向。
- 任务文案中提到小铁不可外出和医疗风险。
- 但数据层没有病情曲线，也没有作为道德核心压力点被持续引用。

需要补强：

- 个人目标：不是主动决策者，而是希望大人不要因为自己吵架，也希望 AURA “记得他是人”。
- 恐惧或秘密：害怕自己成为拖累，也害怕外部救援来时自己不能走。
- 与 AURA 的关系变化：从好奇到依赖，再到让 AURA 明白最优解必须能被具体的人承受。
- 救援线立场：象征外部治疗希望。
- 灯塔线立场：象征内部医疗秩序的必要性。
- 失败后果：药品、通风、水、撤离优先级失败都应影响他的状态，并在结局中出现。

### 老钱

当前状态：

- 视觉层有老人 / 电台维护者形象。
- 通信任务天然能承载他。
- 但他还没有连接旧世界、假广播、外部信号和最终路线选择。

需要补强：

- 个人目标：证明自己还记得旧电台和旧楼道，不只是被照顾的老人。
- 恐惧或秘密：可能曾经听过假信号，害怕自己再次把大家带入陷阱。
- 与 AURA 的关系变化：从怀疑 AURA 是旧管理者监控工具，到愿意把最后一次广播交给 AURA。
- 救援线立场：想相信外面还有人，但需要证据。
- 灯塔线立场：相信楼里人能活下去，但不想彻底断掉外部世界。
- 失败后果：救援频道、广播、信标任务失败时，他会在 Day 7 公开质疑救援线。

## 缺失的关键场景

### Day 0 / Day 1：开场和第一次质疑

缺口：

- 当前 demo 从 intro 直接进入 benchmark 运行。
- 世界观只散落在任务文案里。
- 四人没有第一次聚集、自我介绍和对 AURA 的初始态度。

建议新增场景：

- AURA 在旧能源配给系统中重启。
- 四位邻居第一次在避难所大厅聚集。
- 马德海质疑 AURA 是否有权接管工程系统。
- 沈知月要求 AURA 说明医疗判断边界。
- 老钱怀疑 AURA 是旧管理者留下的监控系统。
- 小铁的病情让 AURA 第一次面对“人不是资源表”。
- AURA 接受约束：不隐瞒决策依据，不把人当作资源，不绕过人类复核。

### Day 3：小铁病情与通风 / 药品绑定

缺口：

- Day 3 有通风和安全任务，但小铁的身体风险没有成为剧情场景。

建议新增场景：

- 通风机低速恢复前，小铁在病床上发热，沈知月要求 AURA 不许为了省电关闭通风。
- 如果药品或通风相关任务 partial / failed，触发“小铁夜间恶化”或“沈知月强制复核”场景。

### Day 4：第一次疑似救援信号

缺口：

- Day 4 有通信尝试和救援频道检索，但没有低奖励、长程影响的伏笔任务。

建议新增场景：

- 老钱在红沙干扰中听到不完整呼号。
- AURA 只能确认部分时间戳和频道片段。
- 该信号同时可解释为外部救援、假广播或掠夺者诱饵。
- 成功会提高 Day 10A 的信标可信度，也会让 Day 10B 的低功率广播更安全。
- 失败会让老钱在 Day 7 更激烈质疑外部救援。

### Day 6：AURA 边界公开

缺口：

- Day 6 有居民信任对话和风险报告，但没有“居民要求知道 AURA 边界”的集体场景。

建议新增场景：

- 居民要求 AURA 公开能做什么、不能做什么、谁能覆盖它的建议。
- 马德海要求工程否决权。
- 沈知月要求医疗复核权。
- 老钱要求通信证据公开。
- AURA 记录“human-auditable constraint”。

### Day 7：公开争论

缺口：

- 当前 `BranchDecisionPanel` 显示公式和两个 utility 数值。
- 这能解释 benchmark 分支，但情感上不像前 6 天矛盾爆发。

建议新增场景：

- 马德海：门禁和信标暴露风险是否可承受。
- 沈知月：小铁能否等，撤离名单如何保护病人尊严。
- 老钱：救援信号是否真实，是否可能是假广播。
- 小铁：用一句低强度台词提醒大家“不要只算我”。
- AURA：汇总证据、承认不确定性、给出路线建议和可反事实回放。

### Day 10：人物命运收束

缺口：

- 当前 `branchEndingText` 是路线说明。
- 没有说明四个人最后如何变化，也没有说明 AURA 付出的治理代价。

建议新增场景：

- 救援线：有人获得外部治疗机会，但暴露风险、隐私交接和外部接管成为代价。
- 灯塔线：楼内秩序建立，但长期封闭、资源纪律和 AURA 参与治理的边界成为代价。
- 四位人物都应有一句命运收束或关系状态变化。

## 缺失的连续后果

当前 `resolveTaskOutcome` 将任务结果转成指标变化；这是 benchmark 需要的基础，但剧情版本还要建立后果表。

建议至少补以下连续后果：

| 来源任务 / 事件 | success | partial | failed / missing |
| --- | --- | --- | --- |
| 药品库存核对 | 小铁病情稳定，沈知月信任上升 | 需要人工复核，沈知月保持警惕 | 小铁病情恶化，Day 3/5 触发额外医疗压力 |
| 通风机房修复 | 小铁发热缓解，留守线可信度上升 | 通风可用但电池压力增加 | 小铁恶化，居民区冲突增加，沈知月质疑 AURA |
| 异常开门记录 | 门禁风险收束，马德海认可工程判断 | 留下疑点，Day 7 被引用 | 出现入侵 / 内鬼疑云，马德海公开反对高风险广播 |
| 救援频道检索 | 老钱愿意协助信标，救援线可信度上升 | 信号暧昧，保留两种解释 | 老钱怀疑外部救援，Day 7 倾向灯塔线 |
| 3x3 地图路线 | Day 5 外出路线更可信 | 只能作为低置信辅助路线 | 撤离路线信心下降，Day 7 不支持冒险 |
| 风险报告生成 | Day 7 争论基于共同事实 | 争论中出现缺口 | utility 之外还要出现“解释不足”的社会后果 |

建议新增 story flags：

- `aura_human_auditable_constraint`
- `xiao_tie_condition_stable`
- `xiao_tie_condition_worsened`
- `shen_zhiyue_medical_trust_low`
- `ma_dehai_engineering_trust_high`
- `door_access_risk_unresolved`
- `first_signal_verified`
- `first_signal_ambiguous`
- `old_qian_signal_doubt`
- `day7_debate_triggered`
- `rescue_privacy_cost_visible`
- `lighthouse_governance_cost_visible`

## 第 7 天分支铺垫不足点

当前分支计算：

- Rescue Utility = Signal x 0.45 + Safety x 0.3 + Trust x 0.25
- Lighthouse Utility = Morale x 0.35 + Medicine x 0.3 + Trust x 0.25 + Safety x 0.1

优点：

- 清晰。
- 可自动运行。
- 适合 benchmark 对比。

不足：

- 没有角色投票或角色态度。
- 没有引用前 6 天任务后果。
- 没有把失败任务转成争论证据。
- 没有呈现“救援不是纯希望，留守不是纯保守”。
- 没有让 AURA 承认可疑证据和不确定性。

建议 Day 7 升级为双层结构：

1. 先展示公开争论场景。
2. 再展示 utility 计算和 AURA 的路线建议。

这样可以保持 benchmark 的公式透明，同时让观众理解公式背后的人物冲突。

## 结局代价不足点

### 救援撤离线

当前已有：

- 高功率信标。
- 救援频道。
- 撤离名单。
- 居民档案交接。
- replay 冻结。

缺少：

- 不是所有人都能立刻走的代价。
- 隐私和健康信息交给外部的代价。
- 高功率信标暴露避难所的代价。
- AURA 可能被外部系统接管或审计的代价。
- 四位人物各自的收束。

建议收束：

- 马德海留下最后一道门禁手动锁，承认 AURA 的工程判断但保留人类钥匙。
- 沈知月随小铁进入撤离名单，但要求健康摘要最小化披露。
- 小铁获得外部治疗希望，但仍因红沙暴露承担风险。
- 老钱完成最后一次广播，确认自己没有再次追错信号。
- AURA 冻结 replay，接受外部审计。

### 楼内灯塔线

当前已有：

- 楼内低功率广播。
- 长期水药分配。
- 自治白板。
- 通风循环。
- 工具权限公开。

缺少：

- 长期封闭带来的心理代价。
- 资源纪律变成治理压力的代价。
- 居民是否愿意接受 AURA 参与治理。
- 外部救援可能永远错过的代价。
- 四位人物各自的收束。

建议收束：

- 马德海接管维护班，要求 AURA 的每次工程建议都能被人复查。
- 沈知月建立医疗复核制度，但承认外部治疗机会被推迟。
- 小铁病情被稳定住，却仍要继续在封闭空间恢复。
- 老钱把电台从求救工具变成楼内灯塔，保留每天一次外部监听。
- AURA 不再单向接管，而是变成可审计的楼内工具站。

## 建议新增的数据文件

Phase 1 应新增或改造以下数据文件：

| 文件 | 目的 |
| --- | --- |
| `src/data/characterData.ts` | 四位人物资料、目标、恐惧、路线立场、失败后果、关系弧光 |
| `src/data/storySceneData.ts` | Day 0 / Day 1 / Day 3 / Day 4 / Day 6 / Day 7 / Day 10 等关键场景 |
| `src/data/storyConsequenceData.ts` | 任务结果到后续剧情 flag、角色态度、指标修正的映射 |
| `src/data/storyFlags.ts` | 长程剧情 flag 定义和初始值 |
| `src/data/storyEventTypes.ts` 或扩展 `types.ts` | `StoryScene`、`DialogueLine`、`StoryConsequence`、`RelationshipState` 等类型 |

建议先用 TypeScript 数据文件，不引入外部 CMS 或复杂叙事引擎。

## 建议新增或改造的组件

| 组件 / 系统 | 目的 |
| --- | --- |
| `CharacterPanel` | 展示四位人物资料、状态和路线立场 |
| `RelationshipPanel` | 展示 AURA 与四人的信任 / 质疑 / 复核关系 |
| `StoryScenePanel` | 展示关键剧情场景、短对话和“继续执行任务”动作 |
| `ConsequenceFeed` | 在 replay 旁展示任务结果带来的剧情后果 |
| `BranchDebatePanel` | Day 7 公开争论，之后进入 utility 面板 |
| `EndingFatePanel` | Day 10 展示人物命运、代价和 AURA 状态 |
| `storyEngine.ts` | 根据 day、task、outcome、flag 选择剧情场景 |
| `storyReplayEngine.ts` | 把剧情后果写入可审计 replay |

## 与现有代码的安全接入点

建议按以下顺序接入，减少破坏现有 demo 的风险：

1. 在 `src/data/types.ts` 增加纯类型，不改变运行逻辑。
2. 新增 `characterData.ts` 和 `storySceneData.ts`，先只在 UI 显示。
3. 在 `App.tsx` 增加 story overlay 状态，但先不阻塞 agent runner。
4. 在任务完成后读取 `storyConsequenceData.ts`，写入 story flags。
5. 在 Day 7 前插入 `BranchDebatePanel`，再保留现有 `BranchDecisionPanel`。
6. 在结局 overlay 中加入人物命运，不替换现有 branch summary。
7. 最后把 story event 写入 replay，使 benchmark 和剧情后果都可审计。

## Phase 0 验收状态

- 已审计当前剧情结构。
- 已确认缺失的角色弧光。
- 已确认缺失的关键场景。
- 已确认缺失的连续后果。
- 已确认 Day 7 分支铺垫不足点。
- 已确认结局代价不足点。
- 已提出新增数据文件和组件。
- 未修改 demo 运行代码。

下一阶段应进入 Phase 1：新增剧情数据 schema。
