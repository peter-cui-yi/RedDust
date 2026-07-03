# Red Dust — 三线并行执行 · 编排总纲（orchestration/）

这是把 [`design/red-dust-12week-roadmap.md`](../design/red-dust-12week-roadmap.md) 的三线并行计划**落成可执行的多 session 编排**。四个子文件夹 = 四个 session 的家：

```
orchestration/
  narrative/    🟣 叙事线 session   — AGENT.md · START.md · PROGRESS.md · 已复制的叙事源文档
  interaction/  🔵 交互线 session   — AGENT.md · START.md · PROGRESS.md · 可视化实现稿
  benchmark/    🟢 benchmark session — AGENT.md · START.md · PROGRESS.md · related-work + findings
  audit/        🔍 审计 session     — AGENT.md · START.md · AUDIT-LOG.md
```

## 文件夹决策：分开管理，统一父目录

**结论 = 每条线一个独立控制文件夹，统一收在 `orchestration/` 下；代码走各自 git 分支（worktree）。**
- **分开** —— 每个 session 只看自己那一份 brief + 文档，上下文不互相污染、所有权清晰。
- **统一父目录** —— 审计 session 一处读全三条线的 PROGRESS；共享的 roadmap 只维护一份。
- **代码不在这里** —— 这些文件夹只放**协调层**（brief / 启动 prompt / 进度日志 / 参考文档）。真正的代码改动发生在各自的 **git worktree** 里（见下），互不覆盖。

## 一次性搭建（用户执行一次）

分四步。**关键：worktree 不继承 gitignored 文件（`node_modules`/`.env.local`/`runs/`），必须逐个补种，否则 session 一开就报缺依赖。**

```bash
REPO="/Users/yicui/Documents/New project 2/red-dust-mvp-demo-git-ready"
cd "$REPO"

# ① 提交编排层 + 两份 canonical 设计文档（否则 worktree 里 roadmap 的 design/... 链接 404）
git add orchestration design/red-dust-12week-roadmap.md design/visualization-demo-implementation-plan.md
git commit -m "Add orchestration scaffolding + canonical roadmap/viz-plan"

# ② 三条线各建一个 worktree（独立 checkout + 独立分支，互不覆盖工作树）
git worktree add ../red-dust-narrative   -b line/narrative
git worktree add ../red-dust-interaction -b line/interaction
git worktree add ../red-dust-benchmark   -b line/benchmark
# 审计留在主 checkout（$REPO 本身，read-mostly）

# ③ 每个 worktree 补 node_modules（从主 checkout 拷，无需联网；也可各自 npm ci）
for d in narrative interaction benchmark; do cp -R node_modules "../red-dust-$d/node_modules"; done

# ④ benchmark 补 gitignored 的 key 与既有 runs（LLM 跑阵与首日 bench:compare 需要）
cp .env.local ../red-dust-benchmark/.env.local
cp -R runs ../red-dust-benchmark/runs 2>/dev/null   # 可选，不拷则重新生成
```

结果（同级目录，审计可直接读到每条线的磁盘实况，与分支无关）：
```
red-dust-mvp-demo-git-ready/   主 checkout（审计 session 的 cwd）
red-dust-narrative/            worktree line/narrative   ← 🟣 session 的 cwd
red-dust-interaction/          worktree line/interaction ← 🔵 session 的 cwd
red-dust-benchmark/            worktree line/benchmark   ← 🟢 session 的 cwd
```

> **别 `git switch` 到 line/* 分支**：worktree 文件夹已经"停"在它的分支上了，你只需把 session 的工作目录设到那个文件夹。在主 checkout 里切到 `line/narrative` 会报"已被工作区使用"——这是 git 的保护，不是错误。
> 想串行/省事？不建 worktree，直接 `git switch -c line/x` 在单一 checkout 里切分支——但那样就不是真并行。

## 启动每个 session

为每条线开一个新的 Claude Code session，cwd 设为它的 worktree，然后**粘贴对应的 `START.md` 全文**：
- 🟣 cwd `../red-dust-narrative` → 粘 `orchestration/narrative/START.md`
- 🔵 cwd `../red-dust-interaction` → 粘 `orchestration/interaction/START.md`
- 🟢 cwd `../red-dust-benchmark` → 粘 `orchestration/benchmark/START.md`
- 🔍 cwd 主 checkout → 粘 `orchestration/audit/START.md`

每个 `AGENT.md` 也可直接丢进 `.claude/agents/` 当子 agent 定义用（带 frontmatter）。

## 代码所有权地图（防撞车的核心）

| 归属 | 拥有的路径（可自由改） |
|---|---|
| 🟣 叙事 | `src/engine/narrativeItems.ts`（**仅人工主脊题**）· `src/data/{types,storyFlags,storySceneData}.ts` 等剧情数据 · 剧情/场景文案 |
| 🔵 交互 | `src/game/*` · 新建站点目录 `web/`（或 `site/`）· 托管配置 · hero GIF 资产 |
| 🟢 benchmark | `bench/*`（含 `export-trace.ts`、fixtures、新 `decorrelation.ts` + 生成流水线）· `src/engine/{scoring,resourceEconomy,contracts,traceExport,scenario}.ts` · `runScenario.ts` 的天数/结构部分 · `src/engine/observation.ts` 与 `src/engine/agents/*` 的**地平线参数化 hunk** · **生成题单独放 `src/engine/generatedItems.ts`** · `runs/` |

> **resourceEconomy 迁移（✅ 已完成 2026-07-03，wk2 commit 68705d8）**：经济核心已在 `src/engine/resourceEconomy.ts`（🟢 拥有），`src/game/systems/resourceEconomy.ts` 只是 re-export 薄壳（保持 9 处 importer 路径不变）。`src/game/*` 其余仍归 🔵。
> **wk2 补记（🔍，2026-07-03）**：上表 🟢 列新增 `contracts.ts`（◆S1 权威契约，已 1.0.0 冻结——改字段需双方重新会签）、`traceExport.ts`、`scenario.ts`（v1/v2 场景与常量）、agents/observation 的地平线 hunk（agents 的**策略语义**不属 🟢，改策略先协调）。

**争用文件（改前必须协调，勤合并小步提交，撞车找审计排序）**：
- `src/engine/scoring.ts` —— 🟣 接 report-only 旗标 hunk；🟢 管轴/版本/promotion hunk。
- `src/engine/runScenario.ts` —— 🟣 接两难/披露 hunk；🟢 做 30 天化 hunk。
- `src/engine/types.ts` —— 🟣 加 `StoryFlagKey`；🔵 可能加 trace 类型；🟢 可能加打分类型。
- `src/data/dayPlanData.ts` + `taskData.ts`（**wk2 新增约定**）—— Day12–29 扩充：**结构/任务剧情归 🟣**（哪天有什么任务、叙事内容），**奖励/消耗数值校准归 🟢**（经济重平衡步）。顺序：🟣 先落结构（占位数值）→ 🟢 调参过 `bench:win --scenario=red-dust-v2`。

**四条铁律**：
1. **生成题进单独文件** `src/engine/generatedItems.ts`（🟢 拥有）——绝不塞进 `narrativeItems.ts`，保住人工主脊不打合并战。
2. **争用文件改前协调**——勤从集成分支拉/合，各改各的 hunk；两边都要动同一段就找审计排。
3. **冻结纪律（◆S2 wk7）**——冻结后**禁止**一切改打分的东西（题/旗标/经济/scorer），只许非计分文案/场景/站点润色，否则 benchmark 权威跑作废。
4. **数据契约（◆S1 wk2）**——🟢 与 🔵 共定两份 JSON schema（回放 trace / 去相关数据集）并冻结，🔵 对冻结契约先行开发。

## 集成与合并节奏

- 各线小步频繁把自己的分支合进 `main`（或一条 `line/integration` 集成分支）。
- 每个 ◆ 同步点：集成 + 审计门禁检查，通过才继续下一段。
- 冲突以争用文件为主——靠"各改各 hunk + 勤合并 + 审计排序"控制。

## 同步点日历（详见 roadmap）

| 点 | 周 | 内容 | 门禁 |
|---|---|---|---|
| ◆S1 | wk2 末 | 数据契约锁定（trace + 去相关数据集 schema） | 🟢🔵 共签 |
| ◆S2 | wk7 末 | 内容冻结（30 天/~50 题，全验证器绿） | 审计确认冻结纪律 |
| ◆S3 | wk8 | 去相关数据集交付给交互 | 🟢→🔵 |
| ◆S4 | wk10 | 集成冻结（站点齐、冒烟过） | 审计跑端到端 |
| ◆S5 | wk12 | 开源公开上线 | 审计过上线检查单 |
