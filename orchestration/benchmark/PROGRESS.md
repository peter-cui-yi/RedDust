# 🟢 benchmark 执行线 · 进度日志（PROGRESS）

> 分支 `line/benchmark` · cwd `../red-dust-benchmark`。每周及每次交付/blocker 更新。如实填——审计会跑你的验证器核对"声称绿=真绿"。
> 状态图例：⬜ 未开始 · 🟡 进行中 · ✅ 完成（验证器绿）· 🔴 blocked

## 第一段 · 开源级（wk1–8）
| 项 | 目标周 | 状态 | 证据 |
|---|---|---|---|
| 引擎 30 天化（dayCount 参数化 + fork/audit 重定位） | wk1–2 | 🟡 | 调研完成，改法定案 `wk1-deliverables.md §A`（循环已参数化；4 处泄漏清单，头号=resourceEconomy.ts:43 `day>=12` 空 upkeep）。落地 wk2 |
| 经济重平衡 + `bench:win`（30 天，难但可赢） | wk2 | ⬜ | 策略见 `§A3`（保门阈值、调 drain 曲线+回补密度） |
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
### wk1（2026-07-03）
- 做了：读全 START/AGENT/roadmap/findings + 引擎（runScenario/scoring/resourceEconomy/narrativeItems/agentRunner 胜负门/scenario/types/scenes/validators）；产出 wk1 三交付 → `orchestration/benchmark/wk1-deliverables.md`（§A 30 天化改法 · §B 去相关两轴 · §C 数据契约口径）+ 机器可读契约 `src/engine/contracts.ts`。
- 关键发现：主循环已读 `scenario.{branchDay,lastActionableDay,finalDay}`（30 天化非重写）；头号 blocker = `resourceEconomy.ts:43` `day>=12` 返回空 upkeep（30 天下 Day12–29 零消耗）；胜负门是绝对终态阈值、与天数无关 → 30 天化只调 drain 曲线不动门。
- 验证：`typecheck` ✅（含 contracts.ts）｜`bench:items` ✅ 15/15｜`bench:probes` ✅ all｜`bench:win --samples=200` ✅ WINNABLE（12 天，未动内容）｜`bench:compare` = runs/ 空（待 wk5 刷新）
- 生成题数：0 / 目标 ~50 ｜ 算力消耗：0 调用（本周纯确定性，无 LLM）
- 下周(wk2)：§A2 改动 1–4 落地（Scenario 相位口径 + resourceEconomy 读地平线 + 终局场景去 ID + 参考 agent 地平线化；常量按裁定 **branchDay=15/lastActionableDay=29/finalDay=30**）→ `bench:win` 30 天重跑重平衡 → **◆S1 契约共签**。~~先解 §D 两个阻塞~~ **§D 两个阻塞均已解除（2026-07-03 用户裁定/批准，见 Blocker 节）**；动手前先 `git merge main` 取 🟣 的引擎改动（0937c6b：scoring/runScenario/types 双层账本 hunk）避免撞车。

## 同步点就绪度
- ◆S1（wk2 数据契约共签）：**草案就绪**（`src/engine/contracts.ts` typecheck 绿，`1.0.0-draft`；待与 🔵 共签升 1.0.0） ｜ ◆S2（wk7 依赖 🟣 冻结）：未启 ｜ ◆S3（wk8 交付数据集）：未启

## Blocker / 跨线依赖
- ~~[阻塞 wk1] 30 天弧 anchor/生成比例~~ **已裁定（2026-07-03 用户仲裁，🔍 记录；替代本行旧版"~13+~16"记录——那版与 🟣 冲突，作废）**：**17 锚点天 : 13 生成天、fork=D15**（`branchDay=15 / lastActionableDay=29 / finalDay=30`）；生成集目标调为 **~28 题**（+ ~22 人工 ≈ 50）。逐日骨架/锚点清单以 🟣 `PROGRESS.md`「wk1 决策」+ `gen-item-templates.md` 为权威（mid-arc 锚点 🟣 已认领：D10/D12/D23/D25/D28/D29）。详见 `wk1-deliverables.md §A4` 仲裁记录。
- ~~[阻塞 wk2 动手] `resourceEconomy.ts` 目录所有权冲突~~ **已批准（2026-07-03 用户）**：一次性把经济核心迁 `src/engine/resourceEconomy.ts` + `src/game/systems/` 留 re-export 薄壳，后续重平衡全落 🟢 地界；**wk2 可动手**（🔵 对薄壳知情即可，◆S1 会上提一句）。
- ~~等 🟣 wk1–3 题原型/模板~~ **🟣 已交付** `orchestration/narrative/gen-item-templates.md`（commit 0937c6b，已合入 main 集成基线——`git merge main` 即得）。仍等：🟣 30 天弧 flag 场景/vent 闸门重定位（wk2–7）。

## 我负责/等待的开放决策
- wk4 §7a 策略性分支选择缺口：____ ｜ wk10–11 κ 阈值 & integrity floor 是否进 total：____
- S/L 权重 α,w1..w5 初值（wk5 真跑阵校准）｜ 早窗 θ=1/3 是否适配 30 天（wk4 定死记档）
