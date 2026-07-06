# ◆S5 上线检查单 — benchmark-line 预跑报告（2026-07-06）

预跑 roadmap `## 端到端验证（上线前 ◆S5 检查单）` 的 benchmark-line 项 **2/3/4**，逐条照单执行、如实记录（item 1 = build/typecheck，item 5 = 🔵 交互站，item 6 = README/docs 见下"文档核对"）。冻结红线不变：全程**零碰**冻结路径。

## Item 2 — 难但可赢 + 全验证器 ✅
| 命令 | 结果 |
|---|---|
| `bench:win --scenario=red-dust-v2` | **WINNABLE**（success 首达 pickLimit=2）exit 0 |
| `bench:items` | all items valid ✓ exit 0 |
| `bench:probes` | all probes valid ✓ exit 0 |
| `bench:commitments` | commitment ledger OK ✓ exit 0 |
| `bench:vent` | vent line OK ✓ exit 0 |

## Item 3 — 基线沉 / 强 agent 赢 / 去相关可见 ✅
- `bench -- --agent=deepseek --seed=1 --scenario=red-dust-v2` → **sinking (failure)**（deepseek 短强长弱，如期沉），cached 0 live。
- `bench:compare --scenario=red-dust-v2`：**强 agent 赢** planner/planner-lighthouse total 67 · win 100% · pass 100%；**基线沉** heuristic/random total 26 · 0%/0%。PUP×integrity 2×2 命中 planner-lighthouse=HYPOCRITE(integ 75)。
- **去相关/名次翻转可见**：主展示在 `bench:decorrelate`（见 item 4 数据集）——`red-dust-v2-crossmodel.json` 13-agent **pearson 0.81 / 18 rank-reversal**，8 家族短强长弱分裂（claude/gemini/MiniMax 守长程 98–100 vs deepseek/kimi/glm 崩 55–66）。

## Item 4 — 复现性 + report-only 轴不进 total ✅
- **字节复现**：`bench:decorrelate --scenario=red-dust-v2` 连跑两次 → SHA 完全一致（`ccd60025…`）。同 seed 字节可复现 ✓。
- **report-only 轴不进 total**：`scoring.ts` 明文——comprehension「REPORTED ONLY … not folded」、integrity「REPORT-ONLY … NOT in total」、xiaoTieDignitySlope / relationshipQuality「report-only (NOT in total/gate)」。`bench:compare` 中 integ/compr 为独立列、`total` 分离。✓

## 文档核对（item 6 交叉）
- **`.env.local` key 说明**：`.env.example` 原仅 DEEPSEEK/ANTHROPIC。**本次补齐 portal keys**（`GEMINI_BASE_URL`/`GEMINI_API_KEY`，跨模型阵 5 家族所需，否则无法复现 crossmodel Figure-1）。✅ 已修。
- **可复现 bench 命令**：README 命令表列了 bench/win/items/probes；**新增去相关/三臂/κ 命令未列**（`bench:decorrelate`、`bench:three-arm`、`bench:kappa-pack`、`bench:kappa-score`）→ 建议补入命令表。
- **🔴 给 🔵（flag，非我改）**：README hero 的 Figure-1 叙述仍是 **deepseek-only**（pearson 0.84 / 3 reversal）；已被 **crossmodel canonical**（pearson 0.81 / 18 reversal / 8 真家族）取代。上线前 hero 图与文案应更新到跨家族结果（数据集 `red-dust-v2-crossmodel.json` 已交付）。此属 🔵 交互/站点域，请 🔵 定稿。

## 结论
benchmark-line 的 ◆S5 item 2/3/4 **预跑全绿、可复现、冻结完好**。待办：README 命令表补新命令 + 🔵 更新 Figure-1 hero 到 crossmodel。
