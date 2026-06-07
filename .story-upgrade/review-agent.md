# Red Dust 剧情升级审核 Agent

> 目的：每个 Phase 完成后，先由审核 agent 检查产出是否符合剧情升级目标、是否通顺、是否可继续进入下一阶段。审核通过后，才允许更新 `story-upgrade-plan.md` 的 checklist。

## 审核原则

审核 agent 只检查当前 Phase 的产出，不提前要求后续 Phase 完成。

审核必须同时关注三件事：

1. 范围是否正确：本 Phase 有没有越界修改不该修改的内容。
2. 剧情是否成立：新增或规划内容是否符合 Red Dust 的四人主角群、AURA agent benchmark 和末世避难所设定。
3. 可落地性是否足够：产出是否能映射到数据文件、组件、运行系统或可验证文档。

## 通用审核输入

每次审核至少读取：

- `.story-upgrade/story-upgrade-plan.md`
- 当前 Phase 新增或修改的文件
- 与当前 Phase 相关的 `src/data/*`
- 与当前 Phase 相关的 `src/components/*`
- 与当前 Phase 相关的 `src/game/systems/*`

如果 Phase 涉及视觉或游戏运行，还需要检查：

- `src/game/scenes/*`
- `public/assets/*`
- 实际运行截图或本地运行结果

## 通用审核输出

审核记录保存为：

```text
.story-upgrade/reviews/phase-N-review.md
```

每份审核记录必须包含：

- Phase 编号和名称。
- 审核日期。
- 审核输入文件。
- 通过项。
- 风险项。
- 必须修改项。
- 结论：`PASS` 或 `FAIL`。
- 是否允许进入下一 Phase。

## Phase 0 审核标准

Phase 0 只允许产出审计和计划文档，不允许修改实际 demo 行为。

必须通过：

- `story-gap-analysis.md` 存在。
- 文档覆盖当前已有剧情结构。
- 文档覆盖缺失的角色弧光。
- 文档覆盖缺失的关键场景。
- 文档覆盖缺失的连续后果。
- 文档覆盖第 7 天分支铺垫不足点。
- 文档覆盖结局代价不足点。
- 文档提出建议新增的数据文件和组件。
- 未修改 `src/`、`public/`、`package.json` 等运行文件。

失败条件：

- 只泛泛说“加强剧情”，没有落到具体角色、天数、任务或组件。
- 把外部资料原文大段复制进项目文档。
- 在 Phase 0 修改了 demo 行为。
- 没有明确下一阶段的可执行入口。

## Phase 1+ 审核重点

后续 Phase 审核时，除本 Phase 专属要求外，还要持续检查：

- 四位人物是否仍然是主角群，而不是背景 NPC。
- AURA 是否仍然是可审计 agent，而不是普通剧情角色。
- 新剧情是否服务 benchmark replay。
- success / partial / failed 是否产生可追踪后果。
- Day 7 分支是否由前 6 天矛盾推出。
- 双结局是否都有代价和人物命运收束。
- TypeScript 编译和 demo 运行是否通过。

## 审核结论规则

只有在没有必须修改项时，才能给出：

```text
结论：PASS
允许进入下一 Phase：是
```

如果存在必须修改项，必须给出：

```text
结论：FAIL
允许进入下一 Phase：否
```

并列出最小修复清单。
