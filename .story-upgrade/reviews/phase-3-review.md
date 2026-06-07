# Phase 3 Review：Day 0 / Day 1 开场升级

结论：PASS

允许进入下一 Phase：是。

## 审核范围

- `src/data/storySceneData.ts`
- `src/data/types.ts`
- `src/data/storyFlags.ts`
- `src/data/storyConsequenceData.ts`
- `src/components/StoryScenePanel.tsx`
- `src/components/AgentConsolePanel.tsx`
- `src/components/LiveReplayFeed.tsx`
- `src/components/DayTimeline.tsx`
- `src/App.tsx`
- `src/styles/global.css`
- `src/game/systems/agentRunner.ts`
- `src/game/systems/replayEngine.ts`
- `src/game/systems/outcomeEngine.ts`
- `.story-upgrade/story-upgrade-plan.md`
- `.story-upgrade/review-agent.md`

## 验收结果

- Day 0 / Day 1 开场已接入运行流程：`Start Agent Run` 会先进入 Prologue，确认后才开始 Day 1 benchmark 任务。
- 世界观要点已覆盖：能源接近耗尽、城市基础设施衰败、红沙污染 / 信号干扰 / 机械磨损、旧能源配给系统、四人邻居关系、AURA 来源与不完全信任。
- 开场关键场景已覆盖：AURA 重启、四人聚集、马德海质疑权限、沈知月要求医疗边界、老钱怀疑监控、小铁暴露脆弱性、AURA 承诺接受人类审查。
- Agent Console 会展示当前开场剧情摘要。
- Live Replay Feed 会记录精确文本：`AURA accepted human-auditable constraint.`
- DayTimeline 已支持 Prologue / Day 0 状态。

## 自动验证

- 原 demo：类型检查通过。
- 原 demo：生产构建通过。
- 浏览器交互检查通过：
  - `Start Agent Run` 后开场剧情出现，正式任务未提前排队。
  - 点击 `Begin Day 1 Benchmark` 后开场关闭，Day 1 第一项任务进入队列。
  - Live Replay Feed 出现 `AURA accepted human-auditable constraint.`
  - Prologue 时间线节点进入完成状态。
  - 390px 移动视口无横向溢出，约束承诺文案可见。

截图记录：

- `/tmp/red-dust-phase3-prologue-v2.png`
- `/tmp/red-dust-phase3-day1-v2.png`
- `/tmp/red-dust-phase3-mobile.png`

## 审核 Agent 结论

审核 agent：Fermat

结论：PASS

必须修改项：无。

风险项：

- `storySceneData.ts` 和 `storyConsequenceData.ts` 中保留了 Phase 4 / 5 / 7 的 `schema_seed` 数据；它们当前没有接入运行逻辑，不构成越界，但后续不能把这些 seed 当作已完成实现。
- `ReplayPanel.tsx` 仍只展示任务 replay，不展示 story replay；本阶段要求是 Live Replay Feed 记录约束，因此不阻塞。

## 后续注意

Phase 4 开始时，只能实现 Day 2-4 的伏笔与长程后果，不应提前接入 Phase 5 的完整连续后果系统或 Phase 7 的正式分支争论流程。
