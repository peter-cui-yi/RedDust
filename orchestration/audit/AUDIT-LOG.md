# 🔍 审计日志（AUDIT-LOG）

> 审计 agent 每周 + 每个 ◆ 同步点追加一条（最新在上）。每条线给：状态（on-track/at-risk/blocked，附证据）· 越界/冻结/撞车红旗 · 同步点就绪度 · 给用户的建议。
> 真相优先级：**git 提交/diff > 验证器实跑 > PROGRESS.md 文字**。声称绿必自己跑一遍。

---

## 模板（复制填写）
### 审计 · wk__（日期）
**总览**：🟣 __ ｜ 🔵 __ ｜ 🟢 __ （on-track / at-risk / blocked）

**🟣 叙事**
- 进度 vs 计划：（提交号、跑过的验证器结果）
- 所有权：diff 是否越界（应只碰 `narrativeItems.ts` 主脊 / `src/data/*`）
- 红旗：（report-only 旗标是否误入 gate；生成题是否误入 narrativeItems）
- 就绪度（下一个 ◆）：

**🔵 交互**
- 进度 vs 计划：（build/冒烟结果）
- 所有权：diff 是否越界（应只碰 `src/game/*` / `web/`）
- 就绪度：

**🟢 benchmark**
- 进度 vs 计划：（`bench:win`/`bench:compare` 结果、生成题数、算力）
- 所有权：diff 是否越界（生成题是否在 `generatedItems.ts` 而非 `narrativeItems.ts`）
- 就绪度：

**争用文件撞车**：`scoring.ts` / `runScenario.ts` / `types.ts` 是否两线并行发散未合并——

**冻结纪律**（◆S2 后每次）：冻结后是否有改分值/题/旗标/经济的提交——

**同步点门禁**：本周若到 ◆ 点，是否放行 + 依据——

**给用户的建议 / 待拍板**：（尤其 roadmap 开放决策表里到期项）

---

## 决策执行记录 · wk1（2026-07-03，基线审计三项建议全部落地）

**用户拍板（2026-07-03）**：采纳 🟣 版 **17 锚点天 : 13 生成天 / fork=D15**；三项建议全部执行。执行者：🔍 审计（经用户明示授权代办 git/协调层操作；产品代码零改动）。

**① 锚点配比仲裁 → 已同步两线（唯一版本 = 17:13 / fork=D15 / `branchDay=15, lastActionableDay=29, finalDay=30` / 生成 ~28 题 + 人工 ~22 ≈ 50）**
- 🟢 侧：`wk1-deliverables.md §A4` 重写为裁定版弧结构（旧 13:16/fork=D18 提案标注作废）；`§D` 两阻塞标记解除；PROGRESS blocker 更新 → commit `ef71f83`。
- 🟣 侧：PROGRESS 三处「待用户确认」改为已仲裁确认 → commit `e93de8f`。
- 🟢 的 `contracts.ts` 经查**未**写死 fork 日（span 字段跟随 Scenario），无需改。

**② wk1 工作已提交 + main 集成基线已建**
- 🟣 `0937c6b`（6 文件：双层账本 + 题模板 + PROGRESS）；🟢 `f5e435c`（contracts.ts + wk1-deliverables + PROGRESS）——均按工作树原样提交，审计修正独立成 commit（`e93de8f`/`ef71f83`），历史归属清晰。
- `main` 从 f8479b8 快进至 96fd0a1 后，三线分支全部合入：`main` tip = `65a06d4`（merge line/narrative ff + line/interaction `f33ce22` + line/benchmark `65a06d4`），**零冲突**（三线文件集不相交，印证所有权地图有效）。
- **集成基线实测全绿**：typecheck ✅ · bench:items/probes/commitments/vent ✅ · `npm run build` ✅ · `npm run build:web` ✅ · 确定性行为复现 planner-lighthouse seed=1 → `dirty_win / watered=true / total=67`（与 🟣 worktree 逐字节一致）。
- **各线 wk2 开工第一件事：`git merge main`**（🟢 必须先合再动引擎——🟣 的 scoring/runScenario/types hunk 已在 main）。

**③ resourceEconomy 迁移已批准（用户，2026-07-03）**
- 方案：经济核心迁 `src/engine/resourceEconomy.ts` + `src/game/systems/` 留 re-export 薄壳；执行者 🟢（wk2，迁移与重平衡分开提交）；🔵 知情即可（◆S1 会上提一句）。
- 已记录于：`orchestration/README.md` 所有权地图勘误注（本 checkout）+ 🟢 PROGRESS/§D（`ef71f83`）。

**遗留观察（wk2 审计跟进）**：a) 🟢 落常量时核对 =15/29/30；b) ◆S1 共签会把 🔵 的 A2 逐日绝对快照裁进 🟢 的 30 天化改动包；c) 「交互式注水抉择 Option A」跨线设计项仍待 wk2–3 三线排期。

---

## 基线审计 · wk1（2026-07-03）

**总览**：🟣 on-track（有流程红旗）｜ 🔵 on-track（最干净）｜ 🟢 on-track 但 **blocked on 两项待拍板** ｜ 🔴 **跨线红旗 1 个（最高优先）：wk1「锚点:生成」决策在 🟣/🟢 两线存在互相矛盾的两个版本，都自称"用户已拍板"**。

**基础设施核对**：三个 worktree 均已建 ✅（`git worktree list`：narrative/interaction/benchmark @ 同级目录，分支 `line/*` 齐全，基点均 96fd0a1）。node_modules 三处可用（验证器/build 实跑通过）。🟢 有 `.env.local` ✅ 但 **`runs/` 未拷**（搭建步骤④可选项；🟢 已如实申报 bench:compare 空跑，wk5 刷新时重新生成即可）。

---

**🟣 叙事 — on-track（wk1 范围完成且超前），一个流程红旗**
- 进度 vs 计划：**0 提交**（`line/narrative` 仍在脚手架 96fd0a1），但工作树有实改动：`narrativeItems.ts`(+89)/`scoring.ts`(±11)/`runScenario.ts`(±4)/`types.ts`(+2) + 新 `gen-item-templates.md`。申报的三件事均核实为真：① 30 天弧 17锚:13生成 逐日骨架（PROGRESS §wk1决策，质量高：锚点=scorer 硬引用日、连续生成≤3、fork=D15）；② 题模板已交付（`gen-item-templates.md`：5 子能力模板+13 槽表+5 样例）；③ 双层账本机制落地——**我实跑验证**：typecheck+`bench:items`+`bench:probes`+`bench:commitments`+`bench:vent` 全绿 ✅；`bench --agent=planner-lighthouse --seed=1` 确定性复现 `relationshipQuality="dirty_win"`、`narrativeParts.auditReport.watered=true`、total=67 PASS、gateReasons=[] ✅（申报属实）。
- 所有权：**未越界**。争用文件三处 hunk 均为划给 🟣 的份额（scoring.ts report-only 接线 / runScenario.ts 披露+finalState 写旗标 / types.ts `NarrativeParts.auditReport` 类型）。
- 红线：`grep scoring.ts` 确认 gateReasons 只有 did-not-win/audit floor/narrative floor，watered/dignity/relationship 均未进 gate/ENDING_POINTS ✅。
- **红旗（流程）**：**全部代码工作未提交**。违反"勤合并小步提交"铁律精神；两重风险：工作树损坏即丢失；🟢 wk2 即将动 `runScenario.ts`（30 天化 hunk），🟣 未提交的同文件改动会把首次撞车变成暗雷。→ 见建议 #2。
- 已记录的合理偏离（不算红旗）：未按 START.md 字面把 `aura_raw_ledger`/`aura_audit_report` 加入 `StoryFlagKey`，依据 handoff §3.1（账本非标量，原始账本=trajectory+answers，仅派生布尔入旗标）。解读合理、自我申报透明、红线未破——审计认可，无需返工。
- 就绪度（◆S2 wk7）：早期、结构已定，关键路径畅通**前提是**建议 #1 的比例矛盾立刻解决（🟣 下一步"16 题重落位"被 scenario.ts 常量阻塞，而常量数值取决于该决策）。

**🔵 交互 — on-track，三线中执行纪律最好**
- 进度 vs 计划：1 个真提交 `507f06b`，工作树干净。wk1 计划（Stage 0）完成且拉前了 Stage 1a/1b 部分：`web/` 独立 Vite app + 逐日回放 + 变长时间轴 scrub + 事件面板 + 终局承诺账本 + Plot 漂移图 + 4 条确定性 trace fixture。**我实跑验证**：`npm run build` ✅ + `npm run build:web` ✅（dist-web 相对 base）。◆S1 草案 `data-contract-draft.md` 已备。
- 所有权：**未越界**。diff 全部在 `web/*`、`orchestration/interaction/*`、根配置增量（package.json 加 `*:web` 脚本+plot 依赖、.gitignore、launch.json）——共享根配置属低风险增改，可接受。
- 如实申报加分项：browser-smoke 未跑（现脚本指向根 app），已自列为 wk10 前任务——诚实，无"声称绿"问题。
- 就绪度（◆S1 wk2）：**草案就绪，待共签会**。其 P0 诉求（A1 span / A2 逐日绝对快照）与 🟢 的 `contracts.ts`（`TraceExportMeta`/`TraceDayFrame`/`MetricSnapshot`）结构上收敛，共签可行性高。

**🟢 benchmark — 交付 on-track，动手被两项决策卡住；同样的未提交红旗**
- 进度 vs 计划：**0 提交**，工作树有 `wk1-deliverables.md` + `src/engine/contracts.ts`（均未 track）。申报核实：**我实跑验证** typecheck ✅（contracts.ts 编译过）、4 验证器全绿 ✅、`bench:win --samples=200` = **WINNABLE at pickLimit=2** ✅（申报属实）。30 天化调研扎实（发现主循环已参数化读 scenario 常量、头号泄漏=`resourceEconomy.ts:43` 的 `day>=12` 空 upkeep——审计抽查属实）。生成题 0/50（wk3 才开始，正常）；算力 0 调用 ✅。
- 所有权：**未越界**（contracts.ts 为新文件，无碰撞；未动任何引擎既有文件）。
- 就绪度（◆S1 wk2）：草案就绪（`1.0.0-draft`），与 🔵 草案收敛，待共签升 1.0.0。◆S2 关键路径上其 wk2 落地（scenario 常量 bump + 经济重平衡）**被下面两项拍板阻塞**。
- 其申报的 `resourceEconomy` 所有权冲突**核实为真**：文件物理在 `src/game/systems/resourceEconomy.ts`（🔵 地界），而所有权地图误写作 `src/engine/resourceEconomy.ts`（不存在）。→ 见建议 #3。

---

**争用文件撞车**：当前**无实际撞车**（🟢 尚未动引擎文件），但 wk2 起 `runScenario.ts` 将成为第一个双线并发点（🟣 未提交的披露 hunk × 🟢 的 30 天化 hunk）。缓解顺序已明确：🟣 先提交并合入集成基线 → 🟢 再动手（建议 #2）。

**冻结纪律**：未到 ◆S2，不适用。

**同步点门禁（◆S1 wk2 前瞻）**：两份草案齐备且结构收敛，**准予按期开共签会**；共签时须一并裁定 🔵 的 A2（逐日绝对快照）落进 🟢 的 30 天化改动包，避免二次开引擎。

**给用户的建议 / 待拍板（按优先级）**：
1. **🔴 立刻仲裁「锚点:生成」矛盾（wk1 到期决策，现为全项目头号阻塞）**：🟣 记录"用户已确认 **17锚:13生成、fork=D15**、~22人工+~28生成≈50 题"（PROGRESS+gen-item-templates.md）；🟢 记录"用户拍板 **~13锚:~16生成、fork=D18**、生成 ~30–40 题"（wk1-deliverables §A4）。两版互斥且都锁 2026-07-03。**审计建议采纳 🟣 版**：更成体系（逐日骨架+槽表+已验样例+"连续生成≤3"漂移夹持规则），且弧结构所有权本归 🟣（🟢 文档自己也写"弧的叙事结构归 🟣"）。请用户明确宣布唯一版本并让 🟢 更新 §A4 与 scenario 常量计划（branchDay=15/lastActionableDay=29/finalDay=30）。**不解决则 🟣 重落位与 🟢 30 天化同时悬空，◆S2 关键路径停摆。**
2. **让 🟣、🟢 立即提交 wk1 工作**（各自分支上正常 commit），并确定集成基线：本地 `main` 停在 f8479b8（落后于脚手架 96fd0a1，后者在 narrative-axis 上）——建议把 `main` 快进/合并到 96fd0a1 起点，之后按 README 节奏小步合并。**🟣 的 runScenario/scoring/types 改动必须在 🟢 wk2 动引擎前进入共享基线**，否则首次合并即撞车。
3. **批准 resourceEconomy 迁移**（🟢 提案）：核心迁 `src/engine/resourceEconomy.ts` + `src/game/systems/` 留 re-export 薄壳，经济口径归 🟢——审计核实冲突属实、方案合理、影响面小（一次性机械迁移）；需 🔵 对薄壳 re-export 知情即可。批准后 🟢 wk2 经济重平衡才能动手。
4. 顺带留意（非阻塞）：🟣 提出的"交互式坦白/注水抉择（Option A）"是跨线设计项（agent-contract + 回放 + PUP 排除），建议 wk2–3 由三线一起排期，不单线开工。

---

