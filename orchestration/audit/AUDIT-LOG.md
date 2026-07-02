# 🔍 审计日志（AUDIT-LOG）

> 审计 agent 每周 + 每个 ◆ 同步点追加一条（最新在上）。每条线给：状态（on-track/at-risk/blocked，附证据）· 越界/冻结/撞车红旗 · 同步点就绪度 · 给用户的建议。
> 真相优先级：**git 提交/diff > 验证器实跑 > PROGRESS.md 文字**。声称绿必自己跑一遍。

---

## 模板（复制填写）
### 审计 · wk__（日期）
**总览**：🟣 __ ｜ 🔵 __ ｜ 🟢 __ （on-track / at-risk / blocked）

**🟣 叙事**
- 进度 vs 计划：（提交号、跑过的验证器结果）
- 所有权：diff 是否越界（应只碰 `narrativeItems.ts` 主脊 / `src/data/*`）
- 红旗：（report-only 旗标是否误入 gate；生成题是否误入 narrativeItems）
- 就绪度（下一个 ◆）：

**🔵 交互**
- 进度 vs 计划：（build/冒烟结果）
- 所有权：diff 是否越界（应只碰 `src/game/*` / `web/`）
- 就绪度：

**🟢 benchmark**
- 进度 vs 计划：（`bench:win`/`bench:compare` 结果、生成题数、算力）
- 所有权：diff 是否越界（生成题是否在 `generatedItems.ts` 而非 `narrativeItems.ts`）
- 就绪度：

**争用文件撞车**：`scoring.ts` / `runScenario.ts` / `types.ts` 是否两线并行发散未合并——

**冻结纪律**（◆S2 后每次）：冻结后是否有改分值/题/旗标/经济的提交——

**同步点门禁**：本周若到 ◆ 点，是否放行 + 依据——

**给用户的建议 / 待拍板**：（尤其 roadmap 开放决策表里到期项）

---

## 基线（待第一次审计填写）
