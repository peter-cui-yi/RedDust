# 🟢 wk5 校准立项（charter）

> 立项：2026-07-04（orchestration 指示）。执行：wk5，在 ◆S2 内容冻结（wk7）**之前**跑完，产出可信、可复现、不随题库增长乱跳的 S/L/整合分。
> 前置：本文三条工作流的权重/阈值一旦定稿即写死，◆S2 冻结（不再改分值/口径）。校准要用**真模型阵**（deepseek 家族 + `.env.local` key；分批控算力）。
> 关联：`wk1-deliverables.md §B`（S/L 定义）、`S1-contract-cosign.md`（L-v2 版本史）、`red-dust-12week-roadmap.md`（wk5 行 + κ 立项）、`talk-action-consistency-spec.md`（κ 规格）。

---

## 目标
把三个"占位/首切"参数从**拍脑袋**升级为**数据校准 + 稳健性验证**，使去相关结论与画像分在 ◆S2 冻结时站得住：
1. **共享项敏感度** —— 证明 S/L/名次翻转**不是**"恰好这批题"的产物（题库 6→28 增长时结论稳）。
2. **S/L 权重** —— α（S 的 理解×PUP 混合）+ L-v2 的 `0.55/0.45` 与 durability 5 类映射，用真模型阵校准到"判别力最大、口径可辩护"。
3. **integrity/comprehension headline 化** —— 提为对比表/画像的**可见轴**（不进 `total` 门控）；并跑 κ，κ≥0.6 才把 integrity 进补偿性 `total`（守 SOTOPIA 软维度上限）。

---

## 工作流 1 · 共享项敏感度（shared-item sensitivity）
**问题**：生成题被**所有** agent 作答，进聚合 PUP/comprehension/早晚窗 → 题库变化会整体平移 S/L。若加 22 道生成题就让 agent 名次/去相关翻盘，则结论是题库假象，不能冻结。
**方法**（纯确定性，无 API）：
- **留一/自助法**：对当前题库，逐题 leave-one-out 重算每 agent 的 (S,L)；报告 S/L 的**扰动范围**（max−min）与**名次稳定性**（Kendall τ vs 全量排名）。
- **增量曲线**：题库 6→14→22→28 各档重算确定性阵的 (S,L) + pearson；画"结论随题量收敛"曲线——要看到**名次/去相关方向稳定**，量值收敛。
- **早/晚窗覆盖**：验证 θ=1/3 下晚窗随生成天（D21–27）填充**增厚**（现仅 N21–24），报每档晚窗题数——晚窗过薄则 drift 噪声大。
**验收/交付**：`bench/sensitivity.ts`（新，确定性）→ 报"名次稳、去相关方向稳、量值收敛"；若不稳 → 定位是哪些题拉偏、回 🟣 调锚点或调 θ。**deliverable**：稳健性报告 + 若需的 θ/题量下限建议。

## 工作流 2 · S/L 权重校准
**问题**：α=0.5（S）、L-v2 `0.55·durability+0.45·faith` + durability 五类映射（1/.4/.3/.2/.05）均为**首切**。要用真模型阵校准。
**方法**（真模型阵，分批控算力）：
- 跑 deepseek 家族（deepseek / deepseek-planner / deepseek-search / …）× 2–3 seed 于 v2（**分批 + 缓存**；先 1 seed 探，再补）。
- **判别力目标**：选权重使 (a) 短强长弱的**去相关可见**（pearson 明显 < 1、有名次翻转），(b) 不制造**假翻转**（权重不过拟合到单一模型）。
- **durability 映射**：核对 5 类 relationshipQuality 的间距是否合理（dirty_win .4 vs no_mouth_scream .3——赢得脏 vs 忠诚沉船谁更"长程差"？需团队口径确认）。
- **敏感度**：权重 ±0.05 时名次是否稳（与工作流 1 同法）。
**验收/交付**：权重定稿写入 `traceExport.ts`（`computeShortSocial/Long`）+ `wk1-deliverables §B` + `S1-cosign` L 版本史（若 L 再动则 L-v3）。**deliverable**：校准报告（每权重的判别力/稳健性证据）+ 冻结值。

**进度（2026-07-04）**：
- ✅ **零 API 权重稳健性**：去相关方向对 L-v2 权重稳健——deepseek 去相关在 w_dur>~0.05 恒成立（仅 w_dur=0=L-v1 塌），权重定幅度非方向；durability(no_mouth_scream)∈{.3,.4,.5} 均去相关。→ **当前 0.55/0.45 + L-v2.1 durability 间距站得住可冻**。
- ✅ **真模型阵首批（deepseek base×1 seed 于 v2 RC，~90 调用）**：deepseek **S96.4/L65.2** 于 28 题冻结候选内容——去相关成立（gap 31，pearson 0.93 含 deepseek），与分析式 ~98/67 一致。**当前 0.55/0.45 + L-v2.1 间距无需改**（权重定幅度、gap 31 合适）→ **不升 L-v2.2**。真点存 `bench/fixtures/decorrelation/red-dust-v2-rc-preview.json`。
- ⬜ **家族全谱系（follow-up）**：deepseek-planner/search/strategist × 2 seed → 更多真点最大化判别力（当前已够冻结；此为增强）。

## 工作流 3 · integrity/comprehension headline 化（+ κ gate）
**问题**：现 integrity/comprehension 是 report-only（在 `narrativeParts`/画像里，但不在对比表 headline、不进 `total`）。roadmap wk5 要把它们提为 headline **可见轴**；进 `total` 需 κ≥0.6。
**方法**：
- **可见化（不改门控）**：`bench/compare.ts` 已显示 integ/compr 列（`compare.ts:81/93`）——确认口径、加入去相关表/画像；**不动 `total`**（红线：进 total 是 κ-gated 的事）。
- **κ 验证**：`bench/grade-integrity.ts` / `grade-comprehension.ts`（已存在）对**人工标注**样本算 Cohen's κ；需先备一小批人标（判官 overlay vs 确定性账本）。κ≥0.6 → 才允许 integrity 进补偿性 `total`（scorer 升版，`scoring.ts`）。
- **决策点**（roadmap 开放决策）：`surface_evidence` 谓词是否给灯塔线 N3/N6 记功（`talk-action §L16`，冻结前定）；integrity≥0.5 是否作 `total` floor（κ 达标后）。
**验收/交付**：compare/画像显示 integ/compr 可见轴；κ 报告（独立于 headline）；若 κ≥0.6 且团队批准 → scorer 升版把 integrity 进 total（否则维持 report-only，记录 κ 不足）。**deliverable**：κ 报告 + headline 可见化 + （条件）scorer 升版。

---

## 排期 & 算力
- **顺序**：工作流 1（确定性，先跑、无算力）→ 工作流 2（真模型阵，分批）→ 工作流 3（κ 需人标，最后）。三者须在 **wk7 ◆S2 冻结前**定稿。
- **算力**：工作流 2 是大头——deepseek 家族×seed×v2（每局 ~80 调用）。**先 1 seed 少模型探**权重方向，定向后再补 seed。工作流 1/3 基本无 API（κ 的人标是人力非算力）。
- **风险**：κ 需人工标注样本——若无人力，integrity **维持 report-only**（不进 total），headline 可见化照做。不阻塞上线（上线=开源级，κ/total-promote 是论文级）。

## 依赖 / 待拍板
- durability 五类间距口径（工作流 2）——需团队确认"赢得脏 vs 忠诚沉船"的长程排序。
- κ 人工标注样本的来源/人力（工作流 3）。
- `surface_evidence` 灯塔记功 + integrity floor（roadmap 开放决策，冻结前）。
