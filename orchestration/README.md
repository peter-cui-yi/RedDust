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

当前 `orchestration/` 还未提交。先提交它，让各 worktree 继承，再建三个 worktree：

```bash
REPO="/Users/yicui/Documents/New project 2/red-dust-mvp-demo-git-ready"
cd "$REPO"
git add orchestration && git commit -m "Add orchestration scaffolding for 3-line parallel execution"

# 三条线各建一个 worktree（独立 checkout + 独立分支，互不覆盖工作树）
git worktree add ../red-dust-narrative   -b line/narrative
git worktree add ../red-dust-interaction -b line/interaction
git worktree add ../red-dust-benchmark   -b line/benchmark
# 审计留在主 checkout（$REPO 本身，read-mostly）
```

结果（同级目录，审计可直接读到每条线的磁盘实况，与分支无关）：
```
red-dust-mvp-demo-git-ready/   主 checkout（审计 session 的 cwd）
red-dust-narrative/            worktree line/narrative   ← 🟣 session 的 cwd
red-dust-interaction/          worktree line/interaction ← 🔵 session 的 cwd
red-dust-benchmark/            worktree line/benchmark   ← 🟢 session 的 cwd
```

> 想串行/省事？不建墙，直接 `git switch -c line/x` 在单一 checkout 里切分支——但那样就不是真并行。真三线并行必须用 worktree。

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
| 🟢 benchmark | `bench/*`（含新 `decorrelation.ts` + 生成流水线）· `src/engine/{scoring,resourceEconomy}.ts` · `runScenario.ts` 的天数/结构部分 · **生成题单独放 `src/engine/generatedItems.ts`** · `runs/` |

**争用文件（改前必须协调，勤合并小步提交，撞车找审计排序）**：
- `src/engine/scoring.ts` —— 🟣 接 report-only 旗标 hunk；🟢 管轴/版本/promotion hunk。
- `src/engine/runScenario.ts` —— 🟣 接两难/披露 hunk；🟢 做 30 天化 hunk。
- `src/engine/types.ts` —— 🟣 加 `StoryFlagKey`；🔵 可能加 trace 类型；🟢 可能加打分类型。

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
