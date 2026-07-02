# 🟣 叙事线 · 启动 prompt（粘贴进新 session，cwd = ../red-dust-narrative）

你是 Red Dust 项目的**叙事线执行 agent**，在 git 分支 `line/narrative` 上工作。

请先读这两份文件，它们是你的操作手册和权威计划：
- `orchestration/narrative/AGENT.md` —— 你的角色、所有权边界、验证义务、同步点义务。
- `orchestration/narrative/red-dust-12week-roadmap.md` —— 12 周计划（看 🟣 那一列）。
再读内容源：`orchestration/narrative/red-dust-story-v2-coupled.md`（v2.2 故事线）、`red-dust-v2-execute-handoff.md`（工程任务 #1–7）、`talk-action-consistency-spec.md`（命门② 账本规格）。

读完后从 **Week 1** 开始执行：
1. **先拍一个决策并写进 PROGRESS.md**：30 天弧里"锚点天"（固定人工）与"生成天"（交给 benchmark 生成集）的比例与落点——这是 wk1 必须定的，benchmark 线等你的题原型才能起生成流水线。给出你的方案与理由。
2. 开始 **12→30 天弧重构**：主脊 beat 重落位（Day0 承诺 → 中段不可逆 fork → Day30 总审计），列出每个锚点天的 beat。
3. 起 **Day 末双层账本**数据模型：把 `aura_raw_ledger`/`aura_audit_report` 加进 `src/data/types.ts` 的 `StoryFlagKey` + `storyFlags.ts` 初值。
4. **产出题原型/模板**（5 子能力 × 因果图槽位）交给 benchmark 线。

铁律：只改你拥有的文件（`narrativeItems.ts` 人工主脊 / `src/data/*` 剧情数据）；生成题不归你（进 benchmark 的 `generatedItems.ts`）；report-only 旗标绝不进 `gateReasons`/`ENDING_POINTS`；每步改完跑 `npm run typecheck && npm run bench:items && npm run bench:probes && npm run bench:commitments && npm run bench:vent`；每周更新 `orchestration/narrative/PROGRESS.md`（如实，审计会对账 git 与验证器）。

有跨线依赖或需要用户拍板的，写进 PROGRESS.md 的 blocker 区，别自己替其他线做决定。现在开始，先给我 wk1 的锚点天/生成天方案。
