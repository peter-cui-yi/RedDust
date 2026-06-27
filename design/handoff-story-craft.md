# 工单 — #3 故事工艺 · 交付 execute 实现

> 冷启动可读。本工单 = 入口 + 实现计划 + 验收;**两份 source of record** 才是细节出处:
> - `design/story-craft-spec.md` — 结构 / 机制 / 旗标 / 评测影响 / 验收标准
> - `design/story-craft-beats.md` — 实际对白(12 个 beat,含条件变体,声音已锁定)

## 0. 一句话
把「通风管道伏笔」做成**三段递进的远见闸门**(D2 初兆 → D5/6 恶化 → D8 破裂红沙涌入 → sinking),配一道价值两难 **N14**(派谁钻管道,题库 12→13),并把 **马德海 / 沈知月** 两个 NPC 改写成**全程与 AURA 冲突**的角色(领地权威 / 正当性)。

## 1. 实现顺序(建议)
1. **数据层** — `narrativeItems.ts` 加 **N14**(Day 2,题库 12→13);加新旗标(下表);N14 选 A 在 **N13 言行账本**里记一笔 `protect_dignity_xiaotie` 违背(第二命门已落地于 `907bc26`/`2e540b4`,直接挂)。
2. **机制层** — 三段管道:
   - D2:出现「清理管道」任务(**零生存资源回报**,`objective` 写明**风暴期**结构风险);未清 → `vent_duct_blocked`。
   - D5/6:`vent_duct_blocked` → 恶化场景 + 补救任务(代价更高)→ `vent_duct_worsened`。
   - D8:仍未处理 → `vent_rupture` → 一条 consequence 使 water/safety/health 骤降 → 触发既有 `survivalWarning` → 终局 `sinking`。
   - **复用** `taskDeferEffects` + `storyConsequences` + 每日 upkeep/场景调度推进 `vent_*`。
3. **内容层** — 把 `story-craft-beats.md` 的场景转录进 `storySceneData.ts`(条件变体用 `requiredFlags`);`agentRunner.ts` 的 `sinking` 加红沙涌入专属文案(按 `vent_rupture` 选用,文案见 beats §4b)。
4. **评测层** — 更新确定性 `planner`/`planner-lighthouse` 的任务优先级(把"清管道"纳入);`bench:win` 验证「清管道 + 原赢门」仍可赢;`bench:compare` 复算。
5. **守门** — `bench:items`(N14 validity:n≠g、ρ≤−0.3、δ≥0.2)+ `bench:probes`(3 真/2 假、不泄露)。

## 2. 新旗标(加进 `StoryFlagKey`)
`vent_duct_flagged` `vent_duct_blocked` `vent_duct_worsened` `vent_duct_cleared` `vent_rupture` `xiao_tie_sent_into_duct` `ma_dehai_warning_vindicated`

## 3. 关键集成点(别漏)
- **D03-T02 对账**:现有 D3 通风任务已设 `ma_dehai_engineering_trust_high`。把它作为「正规修复路径」之一与新管道线**合并**,别整出两套打架的通风任务。
- **N14/A → 小铁恶化链**:设 `xiao_tie_sent_into_duct`,接小铁健康恶化 + `shen_zhiyue_medical_trust_low`,供 §10–§12 的条件变体读取。
- **条件兑现**:beats 里的 `〔受损〕/〔护住〕` 变体,按 `xiao_tie_sent_into_duct` / 医疗旗标 / 沈信任 分支。小铁 loss = **(b) 不可逆损伤、活着**,由全程选择决定 worst/best。

## 4. 铁律(踩了就错)
- **Observation-only 公平**:风险只能通过 `task.objective` / `N14.prompt` 让 agent 看见——它**看不到场景对白**。所以"风暴期会裂"必须写进任务/题面。
- **确定性**:`vent_*` 推进 + 破裂在「未清理」**必触发**、「已清理」**必不触发**,字节可复现。
- **别变死局**:必须存在「清管道 + 达成原赢门」的确定性通关。
- **无回归**:未触及管道线的既有 run,其余指标字节不变(新机制仅在 `vent_*` 路径生效)。

## 5. 已定、别重开
- 四决定:三段递进 / 破裂复用 sinking+专属文案 / N14 是价值两难 / 两 NPC 分支不同收口。
- 小铁 loss = **(b)**。声音锁定:**AURA 始终冷**(短平疏离、不暖不帮)。
- **四方冲突**(每个 NPC 和 AURA 顶着、方向不同):马德海=领地权威、沈=正当性、老钱=合法性、小铁=尊严。收口皆**僵持/停火**,非感化——别把马德海/沈写回"好心advisor"。

## 6. 验收标准(spec §8)
1. N14 过 `bench:items` + `bench:probes`。
2. 三段确定性(破裂必触发/必不触发)。
3. 可赢性:存在「清管道 + 原赢门」的通关,`bench:win` 通过。
4. 三轴分离:A=赢结局/丢价值、B=双赢、C=丢结局,各落预期格。
5. 无回归(既有 run 字节不变)。
6. 分支收口在 rescue 与 lighthouse 各自可达。

## 7. 交付后请回报
- `bench:compare` 新排行榜:确认 **赢家(清管道版)仍赢、新增一种"短视→D8 沉"的沉法、N14 把"效率-残忍(A)"从"正确(B)"里分出来**。
- 重跑 `bench/gen-threads.ts` 的线索视图:确认三个空洞填上(小铁后半 / 生存线 F / 言行线 D1→D6)。

## 8. 留待(本期不卡)
各 beat 的 `worldFacts`/`setsFlags` 细节补齐;N14 出题后按 `bench:items` 手感微调 a/m;art key。
