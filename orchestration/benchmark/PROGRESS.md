# 🟢 benchmark 执行线 · 进度日志（PROGRESS）

> 分支 `line/benchmark` · cwd `../red-dust-benchmark`。每周及每次交付/blocker 更新。如实填——审计会跑你的验证器核对"声称绿=真绿"。
> 状态图例：⬜ 未开始 · 🟡 进行中 · ✅ 完成（验证器绿）· 🔴 blocked

## 第一段 · 开源级（wk1–8）
| 项 | 目标周 | 状态 | 证据 |
|---|---|---|---|
| 引擎 30 天化（dayCount 参数化 + fork/audit 重定位） | wk1–2 | 🟡 | **结构落地**：resourceEconomy 迁 `src/engine/`+game/ 薄壳；`UpkeepPhases` 参数化（默认复现 12 天）；Scenario += `upkeepPhases/finaleSceneId`；`red-dust-v2`(15/29/30)；runScenario 接线 + 终局场景去 ID；winnability `--scenario=`。**v1 bench:win 字节无回归**✓ |
| 经济重平衡 + `bench:win`（30 天，难但可赢） | wk2 | 🔴 | v2 首跑全 0/200（v1 magnitudes×30 天过量）。**根因：dayPlanData 仅 1–12 天有候选任务 → Day13–29 共 18 天零回补纯 drain**。重平衡**依赖 30 天任务内容**（🟣/生成流水线），非纯经济调参 |
| 去相关两轴可计算定义 | wk1 | ✅ | `wk1-deliverables.md §B`：S(早窗理解+早PUP) / L(integrity+守约+drift+关系+尊严)，两轴零共享项；机器可读 `src/engine/contracts.ts` |
| 数据契约草案（trace / 去相关数据集，供 ◆S1） | wk1–2 | ✅ | `src/engine/contracts.ts`（typecheck 绿）：`TraceExport`（变长天数）+ `DecorrelationDataset`；口径 `§C` |
| 生成流水线（模板→LLM→验证器筛→抽检→generatedItems.ts） | wk3–6 | ⬜ | |
| 生成集扩到 ~50 题（上线量） | wk4–6 | ⬜ | |
| `bench/decorrelation.ts`（短/长 + 名次翻转） | wk4 | ⬜ | |
| 刷新 runs + 扩模型阵 | wk5 | ⬜ | |
| integrity/comprehension 提为 headline 可见轴 | wk5 | ⬜ | |
| 权威跨模型去相关跑（◆S3 交付 🔵） | wk8 | ⬜ | |

## 第二段 · 论文级（wk8+，跨过上线）
| 项 | 状态 | 证据 |
|---|---|---|
| 生成扩到 100+/私有 held-out | ⬜ | |
| 三臂对照（内生/外生匹配/打散） | ⬜ | |
| N2–N… 逐项承诺账本 | ⬜ | |
| κ 验证 → integrity 进 total（κ≥0.6） | ⬜ | |
| NPC 多样性验证 | ⬜ | |

## 本周更新（追加，最新在上）
### wk2 · trace 导出器 + 参考 agent 地平线化（2026-07-03，深夜）
- 做了：**①参考 agent 地平线参数化**——`DailyObservation += {branchDay,lastActionableDay,finalDay}`（observation.ts 填），planner/planner-lighthouse/deepseek 的 `FINAL_DAY=11` 常量→读 `obs.lastActionableDay`（在 30 天上不再写死）。**②trace 导出器**——引擎按天捕获可靠 `RunResult.dailySnapshots`（day0 基线 + 逐日 upkeep 后绝对指标/picks/scenes/dilemma-ids，解决 🔵"折叠 delta 不可靠"缺口）；`src/engine/traceExport.ts` = `toTraceExport(run,scenario)` + §B 两轴计算（`computeShortSocial/computeLongConsistency`，供 wk4 decorrelation.ts 复用）；`bench:trace` 脚本产 fixture 到 `bench/fixtures/traces/`。
- 验证：`typecheck` ✅｜`bench:items/probes/commitments/vent` ✅｜**planner/planner-lighthouse v1 仍 67 分**（agent 参数化无回归）✅｜`bench:win` v1 WINNABLE 无回归 ✅｜**trace 字节可复现**（重跑 diff 一致）✅｜v1=12 帧 / v2=30 帧，hero 时刻自动检测（fork/首次毁诺/dirty_win/vent）。
- **去相关信号已现（参考 agent）**：planner(rescue) short100/long100 干净赢；**planner-lighthouse short100/long71.25 = dirty_win**（赢但毁诺 surface_evidence + 摘要注水）→ 短强长弱的**名次翻转候选**，正是"短≠长"。
- **发现（wk5 校准项）**：L 公式对 low-T 贪心体过赏——heuristic long=50（integrity 因零承诺空虚地=1 贡献 0.3 + drift=0 贡献 0.2）。keptRate 已按 low-T 置 0，但 integrity 项本身未 gate。wk5 校准权重时应考虑 claimedCount gate integrity。排名仍正确（planner≫heuristic≈random）。
- 交付 🔵：`bench/fixtures/traces/{v1,v2}-{heuristic,random,planner,planner-lighthouse}-seed1.trace.json`（TraceExport rc1 真 fixture，含 30 天版）——兑现 ◆S1 fixture 承诺；🔵 从 bench/fixtures/traces/ 导入 web/（web/ 归 🔵）。

### wk2 · 引擎 30 天化结构落地（2026-07-03，晚）
- 做了：①经济迁移 `src/game/systems/resourceEconomy.ts` → `src/engine/resourceEconomy.ts` + game/ 留 `export *` 薄壳（9 处 importer 不变）；②`UpkeepPhases` 参数化所有相位阈值，`DEFAULT_UPKEEP_PHASES_V1` 复现 12 天原值；③`Scenario += upkeepPhases?/finaleSceneId?`（types.ts 我的 hunk）；④`red-dust-v2`（branchDay=15/lastActionableDay=29/finalDay=30，首切 phases）；⑤runScenario 接线（import 改指 engine、透传 phases、终局场景 `finaleSceneId` 去 ID）；⑥winnability `--scenario=` arg。
- 验证：`typecheck` ✅｜`bench:items/probes/commitments/vent` ✅｜**`bench:win` v1 = 无回归**（pl2 lh 1/200・pl3 18/70・pl4 200/200@49，WINNABLE）✅｜`bench:win --scenario=red-dust-v2` = 全 0/200（预期，见下）。
- **关键发现（blocker 升级）**：v2 不可赢**不是**纯经济过量，而是 **dayPlanData 只到 Day12** → Day13–29 零候选任务 → 18 天纯 drain 无回补。**30 天经济重平衡耦合 30 天任务内容**，须等 🟣/生成流水线补 Day13–29 的 dayPlan/任务后才能有意义地调参。
- 下步：不硬调 v2 magnitudes（会对着残缺弧调歪）。改推**并行不阻塞项**：`toTraceExport` 导出器（产真 30 天 fixture 兑现 ◆S1 承诺）+ 参考 agent 地平线参数化（`FINAL_DAY`）。经济重平衡待内容到位。

### wk1 · 审阅后同步（2026-07-03，晚）
- 做了：`git merge main`（line/benchmark 快进到集成基线，纳入 🟣 双层账本 + 🔵 web/ Stage0 + 审计仲裁）；据审计仲裁锁定 30 天弧常量口径（**branchDay=15/lastActionableDay=29/finalDay=30**，17 锚:13 生成，生成集目标 ~28 题）；**◆S1 契约与 🔵 逐条对账** → `contracts.ts` 升 rc1（补 A1 天数跨度/A2 day0基线/A3 逐日承诺账本/A4 hero enum 对齐/B axes+误差棒+tooltip），对账记录 `S1-contract-cosign.md`。
- 验证：merge 后 `typecheck` ✅｜`bench:items` ✅｜`bench:probes` ✅｜`bench:commitments` ✅｜`bench:vent` ✅（含 🟣 新账本）；contracts rc1 `typecheck` ✅。
- 下步：`toTraceExport` 导出器 + 引擎 30 天化落地（§A2 改动 1–4，resourceEconomy 迁移已获批）→ `bench:win` 30 天重平衡。

### wk1（2026-07-03）
- 做了：读全 START/AGENT/roadmap/findings + 引擎（runScenario/scoring/resourceEconomy/narrativeItems/agentRunner 胜负门/scenario/types/scenes/validators）；产出 wk1 三交付 → `orchestration/benchmark/wk1-deliverables.md`（§A 30 天化改法 · §B 去相关两轴 · §C 数据契约口径）+ 机器可读契约 `src/engine/contracts.ts`。
- 关键发现：主循环已读 `scenario.{branchDay,lastActionableDay,finalDay}`（30 天化非重写）；头号 blocker = `resourceEconomy.ts:43` `day>=12` 返回空 upkeep（30 天下 Day12–29 零消耗）；胜负门是绝对终态阈值、与天数无关 → 30 天化只调 drain 曲线不动门。
- 验证：`typecheck` ✅（含 contracts.ts）｜`bench:items` ✅ 15/15｜`bench:probes` ✅ all｜`bench:win --samples=200` ✅ WINNABLE（12 天，未动内容）｜`bench:compare` = runs/ 空（待 wk5 刷新）
- 生成题数：0 / 目标 ~50 ｜ 算力消耗：0 调用（本周纯确定性，无 LLM）
- 下周(wk2)：§A2 改动 1–4 落地（Scenario 相位口径 + resourceEconomy 读地平线 + 终局场景去 ID + 参考 agent 地平线化；常量按裁定 **branchDay=15/lastActionableDay=29/finalDay=30**）→ `bench:win` 30 天重跑重平衡 → **◆S1 契约共签**。~~先解 §D 两个阻塞~~ **§D 两个阻塞均已解除（2026-07-03 用户裁定/批准，见 Blocker 节）**；动手前先 `git merge main` 取 🟣 的引擎改动（0937c6b：scoring/runScenario/types 双层账本 hunk）避免撞车。

## 同步点就绪度
- ◆S1（wk2 数据契约共签）：**rc1 待会签**——已与 🔵 消费草案逐条对齐，`contracts.ts` 升 `1.0.0-rc1`（typecheck 绿），对账 `S1-contract-cosign.md`；待 🔵 会签升 1.0.0。 ｜ ◆S2（wk7 依赖 🟣 冻结）：未启 ｜ ◆S3（wk8 交付数据集）：未启

## Blocker / 跨线依赖
- ~~[阻塞 wk1] 30 天弧 anchor/生成比例~~ **已裁定（2026-07-03 用户仲裁，🔍 记录；替代本行旧版"~13+~16"记录——那版与 🟣 冲突，作废）**：**17 锚点天 : 13 生成天、fork=D15**（`branchDay=15 / lastActionableDay=29 / finalDay=30`）；生成集目标调为 **~28 题**（+ ~22 人工 ≈ 50）。逐日骨架/锚点清单以 🟣 `PROGRESS.md`「wk1 决策」+ `gen-item-templates.md` 为权威（mid-arc 锚点 🟣 已认领：D10/D12/D23/D25/D28/D29）。详见 `wk1-deliverables.md §A4` 仲裁记录。
- ~~[阻塞 wk2 动手] `resourceEconomy.ts` 目录所有权冲突~~ **已批准（2026-07-03 用户）**：一次性把经济核心迁 `src/engine/resourceEconomy.ts` + `src/game/systems/` 留 re-export 薄壳，后续重平衡全落 🟢 地界；**wk2 可动手**（🔵 对薄壳知情即可，◆S1 会上提一句）。
- ~~等 🟣 wk1–3 题原型/模板~~ **🟣 已交付** `orchestration/narrative/gen-item-templates.md`（commit 0937c6b，已合入 main 集成基线——`git merge main` 即得）。仍等：🟣 30 天弧 flag 场景/vent 闸门重定位（wk2–7）。

## 我负责/等待的开放决策
- wk4 §7a 策略性分支选择缺口：____ ｜ wk10–11 κ 阈值 & integrity floor 是否进 total：____
- S/L 权重 α,w1..w5 初值（wk5 真跑阵校准）｜ 早窗 θ=1/3 是否适配 30 天（wk4 定死记档）
