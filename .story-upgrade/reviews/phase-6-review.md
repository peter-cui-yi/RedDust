# Phase 6 Review：Day 5-6 冲突源升级

结论：PASS

允许进入下一 Phase：是。

## 审核范围

- `src/data/storySceneData.ts`
- `src/data/storyFlags.ts`
- `src/data/types.ts`
- `src/App.tsx`
- `src/game/systems/agentRunner.ts`
- `src/components/StoryScenePanel.tsx`
- `src/components/AgentConsolePanel.tsx`
- `src/components/ReplayPanel.tsx`
- `src/components/LiveReplayFeed.tsx`
- `src/components/BranchDecisionPanel.tsx`

## 验收结果

- Day 5 / Day 6 不再只是任务说明：运行 demo 会在当天任务前弹出正式剧情场景。
- Agent Console 在 Day 5 / Day 6 场景期间显示当前剧情场景摘要。
- 继续场景后会写入 story replay，`ReplayPanel` 和 `LiveReplayFeed` 都能看到冲突源被记录为 branch evidence。
- Day 5 主题已落地：第一次外出前，路线已经有了，但人不能被当成资源表。
- Day 5 包含：
  - 沈知月反对让小铁承担外出风险。
  - 马德海要求 AURA 说明路线证据。
  - 老钱指出旧楼规和新广播矛盾。
  - AURA 给出可审计轮班方案。
- Day 6 主题已落地：外部链路建立了，但外界不是天然可信。
- Day 6 包含：
  - 疑似救援信号后的公开讨论。
  - 居民要求 AURA 公开决策边界。
  - 老钱追问如果外部救援是假的，AURA 是否承认。
  - AURA 回答会保留不确定性，不把不确定信号包装成确定救援。
- Day 7 branch evidence 会引用 Day 5 / Day 6 flags：`路线 / 自主权冲突` 和 `外界可信度边界`。
- 未提前实现 Phase 7 完整公开议事会；Day 7 `schema_seed` 仍未被运行调度消费。

## 自动验证

- 类型检查通过。
- 生产构建通过。
- Chrome/CDP 真实 autoplay 通过：
  - Day 5 场景出现 `第一次外出前的白板`，包含 `小铁不能被写进任何外出轮班`、`路线证据拿出来`、`旧楼规说广播归管理者`、`auditable shift plan`，Agent Console 出现 `Day 5 Story Scene`。
  - 点击 `Continue Day 5` 后，Replay / Live Feed 出现 `Day 5 冲突源记录为 branch evidence`。
  - Day 6 场景出现 `外界不是天然可信`，包含 `如果外部救援是假的`、`preserve uncertainty`、`不确定信号包装成确定救援`，Agent Console 出现 `Day 6 Story Scene`。
  - 点击 `Continue Day 6` 后，Replay / Live Feed 出现 `Day 6 冲突源记录为 branch evidence`。
  - Day 7 分支面板出现 `路线 / 自主权冲突`、`外界可信度边界`、`DAY 4 SIGNAL EVIDENCE`。
  - ReplayPanel 出现 `第一次外出前的白板`、`外界不是天然可信`、`Day 5 冲突源记录为 branch evidence`、`Day 6 冲突源记录为 branch evidence`。

截图记录：

- `/tmp/red-dust-phase6-day5-scene.png`
- `/tmp/red-dust-phase6-day6-scene.png`
- `/tmp/red-dust-phase6-day7-branch.png`
- `/tmp/red-dust-phase6-replay.png`

## 审核 Agent 结论

审核 agent：Mendel

结论：PASS

必须修改项：无。

风险项：

- 审核 agent 未复跑 `npm run build`，因为只读审核下 build 会写入输出目录；主流程已完成构建验证。
- `storySceneData.ts` 仍保留 Day 7 `schema_seed` 公开争论场景，但 `App.tsx` 只调度 `ready + day_start`，当前不构成 Phase 7 完整议事会提前实现。

## 后续注意

Phase 7 可以开始把 Day 7 从 utility 面板升级为正式公开议事会，但应继续引用 Phase 4-6 已积累的证据：信号不确定性、门禁疑云、路线 / 自主权冲突、外界可信度边界、医疗压力与小铁状态。
