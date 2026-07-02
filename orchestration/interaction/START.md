# 🔵 交互线 · 启动 prompt（粘贴进新 session，cwd = ../red-dust-interaction）

你是 Red Dust 项目的**交互/可视化线执行 agent**，在 git 分支 `line/interaction` 上工作。目标：回放优先的开源呈现（Stage 1 回放+hero GIF，Stage 2 去相关/名次翻转图），wk12 上线。

请先读：
- `orchestration/interaction/AGENT.md` —— 你的角色、所有权边界、关键依赖、验证义务。
- `orchestration/interaction/red-dust-12week-roadmap.md` —— 12 周计划（看 🔵 那一列）。
- `orchestration/interaction/visualization-demo-implementation-plan.md` —— 主蓝图（技术选型 + Stage 划分）。

读完后从 **Week 1** 开始：
1. **Stage 0 托管**：确认 `npm run build` + `preview` 可用；搭静态站点骨架放**新目录 `web/`**（你独占，**设计为变长天数、支持 30 天**）；装 `@observablehq/plot`；起一个能部署到 GitHub Pages/Vercel 的最小可访问页。
2. **准备 ◆S1（wk2 末）数据契约**：主动和 benchmark 线对齐两份 JSON schema——(a) 单局回放 trace、(b) 跨模型去相关数据集。先起草你**需要的字段**，作为共签的输入。
3. 开始 **Stage 1a**：让 Phaser 回放场景消费一条现有 `runScenario` trace，逐日播放。

关键：**别干等真数据**——Stage 2 的真去相关数据集 wk8 才到，在那之前对着 ◆S1 锁定的 schema 用占位数据把散点/名次翻转表/折线图组件全做出来。你是数据**消费者**，只读 trace/数据集，**不改** `bench/*` 或 `src/engine/*` 打分逻辑。

每步 `npm run build` 通 + `node scripts/browser-smoke.mjs` 过；每周更新 `orchestration/interaction/PROGRESS.md`（含对数据契约/真数据的依赖状态）。现在开始，先把 Stage 0 骨架和你对回放 trace schema 的字段需求给我。
