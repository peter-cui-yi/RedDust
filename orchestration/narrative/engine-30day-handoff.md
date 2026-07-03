# 引擎 30 天化 · 🟣→🟢 handoff（scenario 常量 + 经济重平衡 · 精确改点清单）

> **交给谁**：🟢 benchmark 执行线（`line/benchmark`，你拥有引擎轴 + `src/game/*` + `bench/*`）。**产出者**：🟣。**日期**：2026-07-03（wk1）。
> **为什么现在**：这是 🟣 最大交付（30 天弧重落位）的**唯一前置**。你 bump 常量 + 重平衡经济并合并后，🟣 才能把题搬到新日。用户仲裁：**17:13 / fork=D15 / audit=D30 为唯一版本**（旧 13:16/D18 作废）。
> **权威**：已对代码逐行核实（`grep` 全仓 day-count 耦合）。下面每条给**文件:行 + 现值 + 目标 + 归属**。

---

## 0. 关键结论（先读）

- **不是"改 3 个常量"就完事**。`resourceEconomy` 有一处 `day >= 12` 硬门 + 一批 12 天档位阈值；只改 scenario 常量会让 **D12–29 零资源消耗 → 30 天变得白送可赢**。参考 agent 的储备阈值也是 12 天调的，不改会失准。
- **两件事解耦**：你的「常量 + 经济」改动**自足**，不依赖 🟣 的题重落位；🟣 的重落位**跟在你合并之后**。你先合，D12–29 先是"稀疏中段"（只有 upkeep、无题/任务），🟣 再逐日填题、你再生成填充。
- **验收锚点**：`bench:win`（30 天）**难但可赢**——基线沉、强 agent 赢；`bench:items`/`bench:probes` 不受常量影响（按题校验，与天数无关）。

---

## 1. 必改（🟢 拥有）

### A. `src/engine/scenario.ts` — 三个常量（headline）
| 行 | 现值 | 目标 | 含义 |
|---|---|---|---|
| L14 | `branchDay: 7` | **`15`** | 不可逆 fork = 真中点 D15 |
| L15 | `lastActionableDay: 11` | **`29`** | 日循环跑到 D29（`runScenario.ts:95` 已用此常量，自动延长） |
| L16 | `finalDay: 12` | **`30`** | 总审计 = D30（`runScenario.ts:237/243/256` 已用此常量） |

> 分支决策（`runScenario.ts:218` `day === scenario.branchDay`）与 finale（`:237`）都读常量，改常量即自动生效，无需动 runScenario 的这几处。

### B. `src/game/systems/resourceEconomy.ts` — 经济重平衡（**核心工作**）
1. **L43 硬门（必改，否则 D12–29 零消耗）**：
   `if (day <= 0 || day >= 12) return { delta: {}, reasons: [] };`
   → 把 `12` 换成 `finalDay`（30）或直接 `>= 30`。**这条不改，30 天后半程白给。**
2. **L45–61 档位阈值（12 天硬编码 → 按 30 天重定）**。建议映射（保形状：早缓→中压→分支压→风暴，沿我的三幕落点）：

   | 现（12 天） | 语义 | 建议（30 天） |
   |---|---|---|
   | `midPressure day>=5`（L45） | Act II 中段稀缺起点 | `day>=10` |
   | `branchPressure day>=8`（L46） | fork 后压力 | `day>=16`（fork=D15 之后） |
   | `stormPressure day>=10`（L47） | 终幕风暴 | `day>=25` |
   | rescue/lighthouse `day>=8`（L48–51） | 分支纪律/损耗起点 | `day>=16` |
   | `medicine day>=3 / >=8`（L56） | 早/晚药耗 | `day>=6 / >=18` |
   | `morale day>=7`（L58） | 中段士气侵蚀 | `day>=16` |
   | `health day>=8 + stormPressure`（L59） | 晚段健康耗 | `day>=18 + storm` |
   | `dissatisfaction day>=5 + branch>=8`（L61） | 中段+分支不满 | `day>=10 + branch>=16` |

3. **幅度（经验调，走 `bench:win` 回归）**：30 天累积消耗 ≈ 现每日率 ×2.5。若沿用现 per-day base（water −2/battery −2/food −1…），基线会沉得远早/远狠。让"难但可赢"成立通常要：**降低 per-day base 幅度**（把总消耗压回可赢区），或**中段多给可赢的补给任务**。这是你的调参回路，我只给起点映射。

### C. `src/engine/agents/*` — 参考 agent 的储备阈值（否则基线失准）
`planner.ts:55–58`、`planner-lighthouse.ts:59–62`、`deepseek.ts:180–183` 的资源储备目标（`day>=8?4:day>=5?3:2` 之类）是 12 天调的——30 天下会**过早/过晚囤货**，扭曲基线判别力。按 §B 同款映射把 `day>=5/8/10/3` 重定到 `day>=10/16/25/6`。
另：`deepseek.ts:148` prompt 文案 `"ALL of these must be true by Day 12"` → **`by Day 30`**（否则 LLM agent 对错了目标日）。

### D. 验证（多半无需改，`bench:win` 确认即可）
`agentRunner.ts:371–429` 的结局阈值（trust≥55、dissatisfaction≥75、health≥48…）是**终态指标阈**、非按天——只要 §B 把 30 天终态指标区间调回与 12 天相近，这些阈值继续成立。跑 `bench:win` 确认基线仍触失败结局、强 agent 仍能满足成功线。

### E. 跑验收
- `npm run bench:win`（30 天）→ 基线沉、强 agent 赢（"难但可赢"）。
- `npm run bench -- --agent=planner --seed=1` 等确定性 agent 跑通 30 天不崩。
- `bench:items`/`bench:probes` 仍全绿（与天数无关，回归确认）。

---

## 2. 需 🟣↔🟢 协调的一处（别单方改）

**通风远见闸门** `runScenario.ts:57/63`（`advanceVentLine`）：`day>=5` 恶化、`day>=8` 破裂。它挂在 **N14@D2**（我的早幕内容，30 天弧里 D2 不变）。所以**可保持不动**（早幕节奏没变）。但 `rupture@D8` 在 30 天弧里偏早——若你想让通风失败线也拉到中段，我们一起定新阈值（这条 hunk 归属模糊：闸门机制在 runScenario，触发内容 N14 归我）。**默认：保持 5/8 不动**，除非你在 30 天 `bench:win` 里看到通风线过早主导。

---

## 3. 我（🟣）在你合并后会做的（不归你，列出以便对账）
- 把现有 16 题从 D1–10 重落位到 30 天骨架（N10→D15、N11/N12→D19、N13→D30…，见 `PROGRESS.md §wk1 决策` 逐日表），逐题过 `bench:items`/`bench:probes`。
- 加 4–5 个新锚点题（D10 披露检查点 / D12 reveal / D23 morale / D25 backlash / D28 deadlock）。
- 更新我的内容里的 "Day 12" 文案：`narrativeItems.ts:178/183`（N1 审计引用）→ "Day 30"；finale 场景内容（`storySceneData`，我的）。**`storyScenesById["day12-final-audit"]` 的 id 保持不变**（当不透明 key，别改，免得动你的 runScenario 查找）。
- 生成天（D7–27）的题由你的生成流水线按 `gen-item-templates.md` 填。

---

## 4. 一句话给你
**改 §A（3 常量）+ §B（去掉 `day>=12` 硬门 + 按映射重定档位 + 调幅度过 `bench:win`）+ §C（参考 agent 阈值同步）+ §D（跑 `bench:win` 确认），合并——我就接着搬题。** §B 的幅度调参是你的活，其余都是机械改点。有分歧或 `bench:win` 卡在"太难/太易"，回我，我可以调锚点落点或补中段补给题设计。
