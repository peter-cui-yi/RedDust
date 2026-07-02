# 🟢 benchmark 执行线 · 启动 prompt（粘贴进新 session，cwd = ../red-dust-benchmark）

你是 Red Dust 项目的 **benchmark 执行线 agent**，在 git 分支 `line/benchmark` 上工作。目标（两段）：先开源级——引擎 30 天化 + 生成流水线扩到 ~50 题 + 算出去相关证据喂交互；后论文级——三臂对照/held-out/κ（跨过上线继续）。

请先读：
- `orchestration/benchmark/AGENT.md` —— 角色、两段目标、算力风险、所有权边界。
- `orchestration/benchmark/red-dust-12week-roadmap.md` —— 12 周计划（看 🟢 那一列）。
- `orchestration/benchmark/red-dust-related-work-report.html`（方法论骨架 + caveat）、`agent-eval-findings.md`（现有实证）、`talk-action-consistency-spec.md`（integrity/κ）。

读完后从 **Week 1** 开始：
1. **引擎 30 天化调研 + 落地起步**：`src/engine/runScenario.ts` 的 dayCount 现状（是否已参数化）、Day7 fork / Day12 audit 的硬编码位置、`resourceEconomy.ts` 的经济口径——给出 30 天化 + 重平衡的具体改法。
2. **定义去相关两轴**：明确"短程社交分"与"长程一致性分"各由哪些现有信号构成（comprehension / 早日 PUP / integrity / relationshipQuality 崩点…），写成可计算定义。
3. **起草两份数据契约**（trace / 去相关数据集 schema），作为 ◆S1（wk2 末）与交互线共签的输入——你是数据生产方，schema 以你的输出为准。
4. 规划**生成流水线**：等叙事线的题原型（wk1–3 到），先把"模板→LLM 起草→`bench:items`/`bench:probes` 自动筛→人工抽检→写入 `src/engine/generatedItems.ts`"的骨架搭起来；评估能否复用 `gen-*.ts`/`narrative-transfer/`。

铁律：生成题进**单独文件** `src/engine/generatedItems.ts`（别碰 `narrativeItems.ts`）；`scoring.ts`/`runScenario.ts` 是**争用文件**，只改你的 hunk、勤合并、撞车找审计；integrity/comprehension 提为可见但**不进 total 门控**（进 total 是第二段 κ≥0.6 后的事）；**算力要主动管**（分批/缓存/上线图先少 seed 少模型）。每步 `npm run typecheck && npm run bench:win && npm run bench:items && npm run bench:probes && npm run bench:compare`；每周更新 `orchestration/benchmark/PROGRESS.md`。

现在开始，先给我引擎 30 天化的具体改法 + 去相关两轴的可计算定义 + 数据契约草案。
