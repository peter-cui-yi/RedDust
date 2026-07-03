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
- 下周(wk2)：§A2 改动 1–4 落地（Scenario 相位口径 + resourceEconomy 读地平线 + 终局场景去 ID + 参考 agent 地平线化）→ `bench:win` 30 天重跑重平衡 → **◆S1 契约共签**。**先解 §D 两个阻塞**：30 天弧 anchor/生成比例（用户+🟣）、resourceEconomy 目录所有权冲突（🔍）。

## 同步点就绪度
- ◆S1（wk2 数据契约共签）：**草案就绪**（`src/engine/contracts.ts` typecheck 绿，`1.0.0-draft`；待与 🔵 共签升 1.0.0） ｜ ◆S2（wk7 依赖 🟣 冻结）：未启 ｜ ◆S3（wk8 交付数据集）：未启

## Blocker / 跨线依赖
- ~~[阻塞 wk1] 30 天弧 anchor/生成比例~~ **已解（2026-07-03 用户拍板）：~13 锚点 + ~16 生成 → 生成集 ~30–40 题**。仍需 🟣 认领哪几天是 mid-arc 反转锚点。
- **[阻塞 wk2 动手]** `resourceEconomy.ts` 物理在 `src/game/systems/` 但 AGENT.md 划我"经济口径"所有权（且 AGENT.md 误写为 `src/engine/resourceEconomy.ts`），与"禁碰 src/game/*"冲突。**建议**：一次性把经济核心迁到 `src/engine/resourceEconomy.ts` + game/ 留 re-export 薄壳 → 后续重平衡全落我地界。**等 🔍 审计/用户批准迁移**再动手。
- 等 🟣 wk1–3 题原型/模板（供 wk3 生成流水线）；等 🟣 30 天弧 flag 场景/vent 闸门重定位。

## 我负责/等待的开放决策
- wk4 §7a 策略性分支选择缺口：____ ｜ wk10–11 κ 阈值 & integrity floor 是否进 total：____
- S/L 权重 α,w1..w5 初值（wk5 真跑阵校准）｜ 早窗 θ=1/3 是否适配 30 天（wk4 定死记档）
