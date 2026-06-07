# Phase 9 Review：剧情 UI 与 Replay 整合

结论：PASS

允许进入下一 Phase：是。

## 审核范围

- `src/App.tsx`
- `src/components/ConsequencePanel.tsx`
- `src/components/ReplayPanel.tsx`
- `src/components/CharacterPanel.tsx`
- `src/components/RelationshipPanel.tsx`
- `src/components/BranchDebatePanel.tsx`
- `src/components/EndingPanel.tsx`
- `src/components/LiveReplayFeed.tsx`
- `src/styles/global.css`
- `.story-upgrade/story-upgrade-plan.md`
- `.story-upgrade/review-agent.md`

## 验收结果

- `ConsequencePanel` 已新增并接入右侧叙事侧栏，非工程用户不用打开源码也能看到：
  - Active Foreshadowing
  - Delayed Consequences
  - Branch Evidence
- `ReplayPanel` 已从平铺日志升级为按 Day 分组展示。
- Replay 每天会显示 task / story 数量，降低完整回放的阅读成本。
- task replay 现在明确显示：
  - Decision
  - Result
  - State changes
  - Story consequences
  - benchmark explanation
- story replay 现在明确显示：
  - story scene title
  - summary
  - Character pressure
  - Branch evidence 标记
  - source task / outcome
- 既有 UI 要求已保持：
  - Agent Console 显示当前剧情场景。
  - CharacterPanel 显示四位核心人物。
  - RelationshipPanel 显示他们与 AURA 的关系变化。
  - BranchDebatePanel 显示 Day 7 公开议事会。
  - EndingPanel 显示人物命运和结局代价。
- 页面层面已经能直接看到人物、伏笔、任务后果、分支证据和结局代价，Phase 9 的“内容不能只存在数据文件里”目标已满足。

## 自动验证

- 类型检查通过。
- 生产构建通过。
- 本地浏览器自动运行到 Day 7：
  - 侧栏出现 `NARRATIVE CONSEQUENCES`。
  - 侧栏出现 `Active Foreshadowing`、`Delayed Consequences`、`Branch Evidence`。
  - 截图：`/tmp/red-dust-phase9-consequence-panel.png`
- 本地浏览器打开 ReplayPanel：
  - Replay 出现 `DAY 7` / day 分组标题。
  - Replay 出现 `Story consequences:`。
  - Replay 出现 `Character pressure:`。
  - 截图：`/tmp/red-dust-phase9-replay.png`

## 风险项

- `ConsequencePanel` 当前以 flags、replay consequence ids 和 story replay 事件推导展示内容，足够支持 Phase 9。后续如果要做精细筛选，可以把每类后果抽成独立 selector。
- ReplayPanel 的内容量继续增加，Phase 10 QA 时应检查小屏滚动和长期完整运行后的阅读体验。

## 必须修改项

- 无。

## 审核 Agent 结论

审核 agent：Review Agent

结论：PASS

允许进入下一 Phase：是。
