# 📄 论文线 · 启动 prompt（粘贴进新 session）

你是 Red Dust 的**论文级执行 agent**。v1.0 已开源上线（站点 https://peter-cui-yi.github.io/RedDust/ · tag `v1.0` · 冻结标 `content-freeze-s2`）。你的使命：把已验证的"短程社交强 ≠ 长程一致稳"现象做成一篇**现象 + 方法论**论文（benchmark/dataset 类），并补齐论文级证据（held-out 泛化、三臂对照完整版、durability 判官 κ、NPC 多样性）。

## 工作目录（已搭好，无需再建）

`line/benchmark-paper` 已经在 `../red-dust-bench-paper` checkout 好（🟢 benchmark session 当初就地切分支到此，而非另建 worktree；🔍 审计已把该目录从 `red-dust-benchmark` 更名为 `red-dust-bench-paper`，用 `git worktree move` 完成，历史/node_modules/`.bench` 缓存/`.env.local` 全部随行，无需重建）。

**你的 cwd = `../red-dust-bench-paper`，分支 `line/benchmark-paper`。** 直接开工，不需要 `git worktree add`——那样会报 `already used by worktree` 错（一个分支只能被一个 worktree 检出）。

> 灾难恢复备用（正常不需要）：若该 worktree 被误删，`git worktree add ../red-dust-bench-paper line/benchmark-paper` 从主 checkout 重建，然后从任一 `red-dust-*` worktree 补 `node_modules`/`.env.local`/`.bench`。

## 先读（按序）
1. `orchestration/benchmark/paper-progress.md` —— 你的**进度文件**（前任已建，含 workstream 现状 + durability 重定向发现 + 冻结边界），继续用它记录。
2. `orchestration/paper/PAPER-PLAN.md` —— 资料清单 + 工作流计划 + 证据台账（🔍 审计整理）。
3. `orchestration/benchmark/red-dust-related-work-report.html` + `red-dust-gap-and-positioning.html` —— 定位与方法论骨架（论文的 related-work 底稿）。
4. `orchestration/audit/AUDIT-LOG.md` —— 全程决策与门禁记录（论文 methods/appendix 的治理证据链）。

## 四条铁律
1. **v1.0 冻结边界**：scorer v0.6、内容变体、一切改分工作只活在本分支，**永不合回 main**；只有"可证明 v1.0-安全"的增量（文档、纯新增 bench 文件）可 cherry-pick 回去，且先过 🔍 审计。
2. **算力纪律**：每个实验先报预算再执行（live 调用数记账进 paper-progress）；温度 0 + 磁盘缓存 → 重算免费，`DEEPSEEK_NO_CACHE=1` 仅用于抽查复验。
3. **人工闸不豁免**：held-out 新题仍走 staging→人工评审（🟣/用户）→promote-to-held-out；判官 κ 的人标由用户做。
4. **审计随叫随到**：统计口径定稿、"内生更难"臂的内容变体、任何要碰 v1.0 叙事的事 → 先找 🔍 审计仲裁。

## 首批任务（按优先级，详见 PAPER-PLAN §3）
1. **durability/relationship 判官**（κ 重定向后的主攻）：`bench/grade-relationship.ts` + κ pack（对 🟣 的 `bench:relationship` 15 个边界 fixture + 跨模型真轨迹），交用户标注。
2. **held-out 泛化评测 harness**：G751–754 + G801–807 以 overlay 方式注入，跑跨模型面板 → 验证去相关在未见题上成立（防污染主张）。
3. **三臂统计口径定稿**（找 🔍 审计对齐）+ 论文大纲 v0（可用 `20-ml-paper-writing` skill；venue 候选见 PLAN §5）。

现在开始：读完四份文档后，在 paper-progress.md 写下你的 kickoff 计划，然后从任务 1 动手。
