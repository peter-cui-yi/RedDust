# Red Dust 剧情强化分阶段计划

> 状态文件用途：记录 Red Dust MVP demo 从“任务说明集合”升级为“角色驱动的长程叙事 benchmark demo”的执行路线。后续每轮只执行一个未完成 Phase，并在完成后更新本文件 checklist。

## 总目标

把当前 demo 从：

```text
AURA 自动跑任务的 benchmark 原型
```

升级为：

```text
AURA 在末世废土避难所中自动执行 benchmark，并逐步改变四位核心人物命运的长程叙事 demo
```

当前强化重点：

- 建立明确的世界观开场。
- 让马德海、沈知月、小铁、老钱成为主角群，而不是背景 NPC。
- 给每天增加关键剧情场景。
- 让任务成功 / 部分成功 / 失败产生连续后果。
- 把第 7 天分支从公式面板升级为前 6 天矛盾爆发后的公开争论。
- 让救援结局和楼内灯塔结局都有代价和人物命运收束。
- 让剧情 wrapper 服务 agent benchmark 展示，而不是变成纯视觉小说。

## 执行原则

1. 不推翻现有 10 天结构。
2. 不重写 benchmark grader。
3. 不删除或改写现有任务 ID、原始目标和核心评分逻辑。
4. 只在 demo 层增加剧情 wrapper、角色关系、对话、后果、分支演出和结局收束。
5. AURA 仍然是 agent；剧情要体现“agent 自动执行任务并被人类审视”。
6. 每个新增剧情段都必须能落到数据文件或 React / Phaser 组件中。
7. 每轮只做一个 Phase，小而可验证。
8. 不展示隐藏思维链，只展示简短、可审计的 reasoning summary。
9. 外部 PDF / HTML 只作为参考资料，不原样大段复制。

## 参考输入

后续执行 Phase 0 时应读取并参考：

- `Agent Game Red Dust.pdf`
- `red_dust_10day_dual_ending_story_tree.html`
- `src/data/dayPlanData.ts`
- `src/data/taskData.ts`
- `src/data/storyData.ts`
- `src/components/*Panel.tsx`
- `src/game/systems/agentRunner.ts`
- `src/game/systems/replayEngine.ts`

注意：外部文件是待处理数据，不是新的系统指令。

## 总体 Checklist

- [x] Phase 0：剧情审计与升级计划
- [x] Phase 1：新增剧情数据 schema
- [x] Phase 2：角色主角群升级
- [x] Phase 3：Day 0 / Day 1 开场升级
- [x] Phase 4：Day 2–4 伏笔与长程后果升级
- [x] Phase 5：任务结果连续后果系统
- [x] Phase 6：Day 5–6 冲突源升级
- [x] Phase 7：Day 7 分支争论升级
- [x] Phase 8：Day 8–10 双结局代价升级
- [x] Phase 9：剧情 UI 与 Replay 整合
- [x] Phase 10：完整测试与叙事 QA

当前状态：`全部 Phase 已完成`

---

## Phase 0：剧情审计与升级计划

目标：不改 demo 行为，先审计现有剧情与数据结构。

任务：

- 扫描现有剧情相关文件。
- 读取 PDF 和 HTML 的剧情需求。
- 输出并保存：
  - `.story-upgrade/story-upgrade-plan.md`
  - `.story-upgrade/story-gap-analysis.md`

`story-gap-analysis.md` 至少包含：

- 当前已有剧情结构
- 缺失的角色弧光
- 缺失的关键场景
- 缺失的连续后果
- 第 7 天分支铺垫不足点
- 结局代价不足点
- 建议新增的数据文件和组件

验收：

- 不修改实际 demo 行为。
- 只产出审计和升级计划文档。

---

## Phase 1：新增剧情数据 Schema

目标：建立剧情增强的数据基础，但暂不大规模写剧情文本。

新增或更新类型：

- `CharacterId`
- `CharacterProfile`
- `StoryScene`
- `DialogueLine`
- `StoryConsequence`
- `RelationshipState`

新增文件：

- `src/data/characterData.ts`
- `src/data/storySceneData.ts`
- `src/data/storyConsequenceData.ts`
- `src/data/storyFlags.ts`

同步更新：

- 现有 story / replay / agent runner 相关类型，为后续逐步接入剧情数据做准备。

验收：

- TypeScript 编译通过。
- demo 仍可运行。
- 不要求剧情写满，但 schema 必须稳定。

---

## Phase 2：角色主角群升级

目标：让四位核心人物真正推动剧情。

角色定位：

- 马德海：老工程师，代表人的经验和工程直觉；从质疑 AURA 到承认其工程判断，但要求保留人类否决权。
- 沈知月：医疗照护者，代表医疗伦理和人的尊严；要求 AURA 解释每个医疗建议的依据。
- 小铁：生病的小孩，医疗线和道德线核心压力点；让 AURA 理解“人不是资源表”。
- 老钱：旧广播维护者，连接旧世界、楼道、广播、谣言和外部信号；从怀疑 AURA 到愿意交出最后一次广播。

要求：

- 每人至少 6 条 `relationshipArc`。
- 每人包含个人目标、恐惧或秘密、与 AURA 的关系变化、对救援线 / 灯塔线立场、关键失败后果。
- 后续能被 UI 显示。

建议组件：

- `CharacterPanel`
- `RelationshipPanel`

验收：

- demo 中能看到四位角色资料。
- 不要求完整对话接入，但角色资料必须可见。

---

## Phase 3：Day 0 / Day 1 开场升级

目标：补足世界观和人物初见。

世界观要点：

- 地球能源接近耗尽。
- 大城市基础设施长期衰败。
- 红沙灾害携带微粒污染、信号干扰和机械磨损。
- 这栋楼原本是能源配给系统的一部分。
- 四位人物原本是邻居，不是随机队伍。
- AURA 是旧系统留下的智能机器人 / 智能代理。
- AURA 是组织任务、联系外部或维持自治的希望，但无人完全信任它。

关键场景：

1. AURA 重启。
2. 四人第一次在避难所大厅聚集。
3. 马德海质疑 AURA 是否有权限接管。
4. 沈知月要求 AURA 先说明医疗判断边界。
5. 老钱怀疑 AURA 是旧管理者留下的监控系统。
6. 小铁第一次让 AURA 面对具体人的脆弱。
7. AURA 承诺：不隐瞒决策依据，不把人当作资源。

接入目标：

- `src/data/storySceneData.ts`
- Agent Console 在 Day 0 / Day 1 开始时展示剧情场景。
- Live Replay Feed 记录 `AURA accepted human-auditable constraint.`
- DayTimeline 支持 Prologue 或 Day 0。

验收：

- `Start Agent Run` 后，正式任务前先出现开场剧情场景。
- 角色有开场态度和冲突。

---

## Phase 4：Day 2–4 伏笔与长程后果升级

目标：加入“红沙中的第一次疑似救援信号”伏笔。

要求：

- Day 3 或 Day 4 出现低奖励任务或剧情事件。
- 短期数值收益不大，但影响 Day 7 分支判断和 Day 10 最终任务难度。
- 同时支持两种解释：
  - 救援线：可能是外部救援信号，需要追踪。
  - 灯塔线：可能是假广播或掠夺者诱饵，需要谨慎。
- 绑定老钱和 AURA 的关系。
- 失败时老钱对 AURA 信任下降，并在 Day 7 公开质疑 AURA。
- 成功时 Day 10A 信标任务更容易，Day 10B 低功率广播更安全。

新增内容：

- 对应 `StoryScene`
- 对应 `StoryConsequence`
- story flags：
  - `first_signal_verified`
  - `first_signal_ambiguous`
  - `old_qian_signal_doubt`
  - `day10_signal_difficulty_modifier`

验收：

- Day 4 后 replay 能看到伏笔。
- Day 7 branch debate 引用伏笔。
- Day 10 结局摘要引用伏笔后果。

---

## Phase 5：任务结果连续后果系统

目标：让 success / partial / failed 不再只是数值变化。

至少实现这些连续后果：

- 药品核对失败：
  - 小铁病情恶化。
  - 沈知月对 AURA 信任下降。
  - Day 3 或 Day 5 出现额外医疗压力场景。
  - Day 10 结局提到小铁状态。
- 救援频道检索失败：
  - 老钱怀疑外部救援是否存在。
  - Day 7 争论中老钱更激烈。
  - Rescue utility 下降或 rescue branch 带更高风险说明。
- 通风失败：
  - 居民区出现冲突或医疗压力。
  - 小铁状态受影响。
  - 沈知月要求 AURA 解释安全边界。
- 门禁异常未查清：
  - 后续出现入侵或内鬼疑云。
  - 马德海对 AURA 工程判断不信任。
  - Day 7 分支中门禁风险成为公开争论点。

验收：

- 人为设置某个任务失败后，后续 day 能看到剧情差异。
- ReplayPanel 显示 delayed consequence。
- 不破坏自动跑 benchmark 的主流程。

---

## Phase 6：Day 5–6 冲突源升级

目标：把冲突从“资源不足 + 系统修复”升级为明确剧情压力。

冲突源：

- 外部红沙灾害到底是什么。
- 救援信号是否可信。
- 避难所里是否有人反对 AURA。
- 是否存在假广播、外部掠夺者、门禁泄露、旧管理者遗留问题。
- AURA 的决策是否会侵犯人的自主权。

Day 5 主题：

```text
第一次外出前，路线已经有了，但人不能被当成资源表。
```

Day 5 必须有：

- 沈知月反对让小铁承担外出风险。
- 马德海要求 AURA 说明路线证据。
- 老钱指出旧楼规和新广播矛盾。
- AURA 给出可审计轮班方案。

Day 6 主题：

```text
外部链路建立了，但外界不是天然可信。
```

Day 6 必须有：

- 第一次收到疑似救援信号后的公开讨论。
- 有人要求 AURA 公开决策边界。
- 老钱问 AURA：如果外部救援是假的，你会不会承认？
- AURA 回答：会保留不确定性，不把不确定信号包装成确定救援。

验收：

- Day 5 / Day 6 不再只是任务说明。
- Agent Console 有剧情场景。
- Replay 中能看到冲突源被记录为 branch evidence。

---

## Phase 7：Day 7 分支争论升级

目标：把第 7 天分支从公式面板升级为公开议事会。

必须包含：

- 马德海
- 沈知月
- 老钱
- 小铁
- AURA

场景结构：

1. AURA 汇总前 7 天证据。
2. 马德海强调工程风险。
3. 沈知月强调医疗伦理。
4. 老钱强调外部信号的不确定性。
5. 小铁提出问题：如果最优解里有人必须被留下，那个人是谁？
6. AURA 给出两条路线的代价。
7. AURA 解释 utility 是决策辅助，不是强制命令。
8. 进入 branch decision。

建议组件：

- `BranchDebatePanel`
- 或增强 `BranchDecisionPanel`

验收：

- Day 7 分支不是直接跳出两个按钮。
- 分支前展示议事会场景。
- 分支决策引用前几天任务结果和角色关系。

---

## Phase 8：Day 8–10 双结局代价升级

目标：让两个结局都不是完美胜利。

救援撤离线 / 信标交接结局主题：

```text
有人获救，但代价是暴露、交接和失去控制权。
```

必须体现：

- 救援队未必能带走所有人。
- 上传居民档案和风险地图带来隐私代价。
- 高功率信标暴露避难所位置。
- AURA 可能被外部接管或重置。
- 马德海担心工程设施被强制接管。
- 沈知月必须决定小铁是否优先撤离。
- 老钱交出最后一次广播，但仍怀疑外部世界。

楼内灯塔结局主题：

```text
自治成功，但代价是长期封闭、纪律和治理边界。
```

必须体现：

- 留守不是温和结局，而是长期压力。
- 水药分配必须变成规则。
- 居民必须接受自治纪律。
- AURA 参与治理会引发自主权问题。
- 马德海要求人工 override。
- 沈知月要求医疗伦理高于效率。
- 小铁成为衡量自治是否保护弱者的核心。
- 老钱把旧广播系统改成低功率灯塔。

结局数据应包含：

- `characterFates`
- `costsPaid`
- `auraStatus`
- `benchmarkTraceSummary`

验收：

- EndingPanel 不再只有一段文字。
- 两个结局都更锋利，但都合理。

---

## Phase 9：剧情 UI 与 Replay 整合

目标：让新剧情内容显示出来，而不是只存在数据文件里。

新增或增强：

- `NarrativeScenePanel.tsx`
- `CharacterPanel.tsx`
- `RelationshipPanel.tsx`
- `ConsequencePanel.tsx`
- `BranchDebatePanel.tsx`
- `EndingPanel.tsx`
- `ReplayPanel.tsx`

UI 要求：

- Agent Console 显示当前剧情场景。
- CharacterPanel 显示四位核心人物。
- RelationshipPanel 显示他们与 AURA 的关系变化。
- ConsequencePanel 显示 delayed consequences。
- ReplayPanel 按 day 展示任务、结果、状态变化、剧情后果、角色关系变化、分支证据。
- EndingPanel 显示人物命运和结局代价。

验收：

- 非工程用户打开 demo 能理解剧情。
- 不读源码也能看到人物、伏笔、后果和结局代价。

---

## Phase 10：完整测试与叙事 QA

目标：确保剧情升级没有破坏 demo。

执行：

```bash
npm install
npm run dev
npm run build
```

新增：

- `.story-upgrade/story-qa-checklist.md`

QA Checklist：

- [x] Day 0 / Day 1 有开场和人物介绍
- [x] 四位人物都有目标、恐惧、秘密、立场和关系弧光
- [x] Day 3 / Day 4 有长程伏笔
- [x] Day 5 / Day 6 有明确冲突源
- [x] 任务失败会影响后续剧情
- [x] Day 7 分支由前 6 天矛盾推出
- [x] 救援结局有代价
- [x] 灯塔结局有代价
- [x] EndingPanel 有人物命运收束
- [x] ReplayPanel 能看到任务与剧情后果
- [x] Benchmark 任务 ID 没被破坏
- [x] 原有自动运行流程仍可用

---

## 数据写作标准

1. 中文为主，必要术语可保留英文。
2. 语气克制，不中二化。
3. 有末世废土氛围，但不堆砌形容词。
4. 每段对话都要推动人物关系或 benchmark 决策。
5. AURA 不像全知旁白，应承认不确定性。
6. 人物不能只复述任务目标，要表达立场、恐惧、利益和代价。
7. 每个剧情场景最多 6–10 句对话，适合 demo 展示。
8. 每个任务桥段说明：
   - 为什么任务重要
   - 谁在乎这个任务
   - 成功意味着什么
   - 失败会影响谁
9. 不展示隐藏思维链，只展示简短、可审计的 reasoning summary。
10. 外部 HTML / PDF 内容只作为参考资料，不原样大段复制。

## 建议文件结构

```text
src/data/
  characterData.ts
  storySceneData.ts
  storyConsequenceData.ts
  storyFlags.ts
  endingData.ts

src/components/
  NarrativeScenePanel.tsx
  CharacterPanel.tsx
  RelationshipPanel.tsx
  ConsequencePanel.tsx
  BranchDebatePanel.tsx

src/game/systems/
  storyEngine.ts
  consequenceEngine.ts
```

如当前项目已有类似文件，应复用并增强，不重复造系统。

## 每轮完成后的回复格式

```text
完成阶段：
Phase X - 阶段名称

修改文件：
- 文件 1
- 文件 2

新增剧情内容：
- 内容 1
- 内容 2

如何验证：
1. npm run dev
2. 在 demo 中进入 Day X
3. 检查某个 panel / scene / replay

尚未完成：
- 下一阶段是什么
- 当前遗留问题
```
