# Phase 5 Review：任务结果连续后果系统

结论：PASS

允许进入下一 Phase：是。

## 审核范围

- `src/data/storyConsequenceData.ts`
- `src/data/storySceneData.ts`
- `src/data/storyFlags.ts`
- `src/data/types.ts`
- `src/App.tsx`
- `src/game/systems/outcomeEngine.ts`
- `src/game/systems/agentRunner.ts`
- `src/components/AgentConsolePanel.tsx`
- `src/components/BranchDecisionPanel.tsx`
- `src/components/ReplayPanel.tsx`
- `src/components/LiveReplayFeed.tsx`
- `src/components/CompareBranchesPanel.tsx`
- `src/styles/global.css`

## 验收结果

- `StoryConsequence` 已从单条信号特例升级为通用运行管线：任务完成后统一写入 story flags、人物关系、story replay、普通 replay 的 consequence 标记。
- 药品核对失败已产生连续后果：小铁病情恶化、沈知月信任下降、额外医疗压力场景、Day 7 分支证据、Day 10 结局承接。
- 救援频道检索失败继续影响老钱、Day 7 utility、Day 10 信号难度。
- 通风失败已产生连续后果：居民冲突、医疗压力、小铁病情恶化、沈知月要求安全边界解释。
- 门禁 partial / failed 已产生连续后果：入侵或内鬼疑云、马德海工程不信任、Day 7 门禁风险证据。
- 开发者控制增加 `Force Failed` / `Force Partial` / `Force Success`，可人为设置任务结果并观察后续剧情差异。
- `ReplayPanel`、`LiveReplayFeed`、`BranchDecisionPanel`、`CompareBranchesPanel` 均能展示 delayed/story consequence 证据。
- 自动 benchmark 主流程未被破坏。

## 自动验证

- 类型检查通过。
- 生产构建通过。
- 默认 autoplay 验证：
  - Day 7 分支面板出现 `DELAYED CONSEQUENCE EVIDENCE`、`门禁疑云`、`小铁暂时稳定`、`DAY 4 SIGNAL EVIDENCE`。
  - 截图：`/tmp/red-dust-phase5-default-day7-v2.png`
- 人为 `Force Failed RD-MED-01` 验证：
  - 立即出现药品失败 delayed consequence 和 `病床旁的通风边界`。
  - Day 7 出现 `小铁医疗压力`、`沈知月`、`门禁疑云`。
  - Day 10 结局提到小铁恶化相关状态、医疗压力和门禁疑云。
  - ReplayPanel 出现 `Source: RD-MED-01` 和 `med-inventory-failure-worsens-xiao-tie`。
  - 截图：`/tmp/red-dust-phase5-med-force-failed.png`
  - 截图：`/tmp/red-dust-phase5-med-failed-day7.png`
  - 截图：`/tmp/red-dust-phase5-med-failed-ending.png`
  - 截图：`/tmp/red-dust-phase5-med-failed-replay.png`
- 人为 `Force Failed RD-VENT-01` 验证：
  - 立即出现通风失败造成居民冲突 / 医疗压力和 `病床旁的通风边界`。
  - Day 7 出现 `通风 / 居民冲突`、`小铁医疗压力`。
  - 截图：`/tmp/red-dust-phase5-vent-force-failed.png`
  - 截图：`/tmp/red-dust-phase5-vent-failed-day7.png`

## 审核 Agent 结论

审核 agent：Helmholtz

结论：PASS

必须修改项：无。

风险项：

- 审核 agent 未重新运行 `typecheck` / `build`，以保持只读审核；主流程已完成这些验证。
- 两个早期默认路径截图名不可复核：`/tmp/red-dust-phase5-default-ending.png`、`/tmp/red-dust-phase5-default-replay.png`。本阶段 PASS 依赖源码检查、默认 Day 7 截图、强制失败路径截图和主流程验证输出。
- follow-up scene 当前主要作为 story replay / branch evidence 立即记录，并携带 Day 3 / 5 / 7 元数据；Phase 5 可接受。后续若要求“到当天再弹出剧情场景”，需要单独的场景调度。

## 后续注意

Phase 6 可以开始把 Day 5 / Day 6 冲突源升级为正式场景，但不要覆盖 Phase 5 的通用 consequence 管线。尤其要保持药品、通风、门禁、救援频道四类后果能继续被 Day 7 和 Day 10 消费。
