# Red Dust Story QA Checklist

审核日期：2026-06-04

结论：PASS

## 命令验证

- [x] `npm install`
  - 原 demo：通过，0 vulnerabilities。
  - git-ready 包：通过，0 vulnerabilities。
- [x] `npm run typecheck`
  - 原 demo：通过。
  - git-ready 包：通过。
- [x] `npm run build`
  - 原 demo：通过。
  - git-ready 包：通过。
- [x] `npm run dev`
  - 本地服务 `http://127.0.0.1:4173/` 可启动并完成浏览器自动化验证。

## 剧情 QA

- [x] Day 0 / Day 1 有开场和人物介绍。
  - 证据：Replay 中出现 `AURA 重启`，移动端开场截图显示四位人物与 AURA 初始承诺。
- [x] 四位人物都有目标、恐惧、秘密、立场和关系弧光。
  - 证据：`CharacterPanel` 显示马德海、沈知月、小铁、老钱的 goal、fear / secret、AURA relationship、branch stance 和 Active Arc。
- [x] Day 3 / Day 4 有长程伏笔。
  - 证据：Day 4 `红沙里的第一次呼号` 和信号不确定性进入 replay、branch evidence 与 Day 10 信号难度。
- [x] Day 5 / Day 6 有明确冲突源。
  - 证据：Replay 中出现 `第一次外出前的白板` 和 `外界不是天然可信`。
- [x] 任务失败会影响后续剧情。
  - 证据：`Story consequences:` 能在 ReplayPanel 中看到；`ConsequencePanel` 会展示 delayed consequences。
- [x] Day 7 分支由前 6 天矛盾推出。
  - 证据：Day 7 `分支前夜公开争论` 先于 branch decision 出现，并引用信号、医疗、路线、门禁与外界可信度。
- [x] 救援结局有代价。
  - 证据：CompareBranchesPanel 显示 Rescue Branch 的 `Ending Costs:` 和 `AURA Status:`。
- [x] 灯塔结局有代价。
  - 证据：CompareBranchesPanel 显示 Lighthouse Branch 的 `Ending Costs:` 和 `AURA Status:`。
- [x] EndingPanel 有人物命运收束。
  - 证据：EndingPanel 显示 `CHARACTER FATES`、`COSTS PAID`、`AURA STATUS`、`BENCHMARK TRACE SUMMARY`。
- [x] ReplayPanel 能看到任务与剧情后果。
  - 证据：ReplayPanel 按 Day 分组展示 task / story，并显示 `Story consequences:`、`Character pressure:`。
- [x] Benchmark 任务 ID 没被破坏。
  - 证据：脚本检查 `taskData.ts` 与 `dayPlanData.ts`：`taskCount=33`、`plannedTaskCount=33`、无 missing、无 duplicate。
- [x] 原有自动运行流程仍可用。
  - 证据：浏览器自动化完成 `Run Both Branches`，进入 `COMPARE BRANCHES SUMMARY`，同时显示 Rescue / Lighthouse。

## 浏览器截图证据

- `/tmp/red-dust-phase10-compare.png`
- `/tmp/red-dust-phase10-replay.png`
- `/tmp/red-dust-phase10-mobile-opening.png`

## 剩余风险

- ReplayPanel 内容量已经较大。当前可滚动且按 Day 分组可读，Phase 10 PASS；后续产品化时可继续增加过滤器或折叠分组。
- `characterFates` 和后果展示当前由 runtime selector / builder 生成。当前 demo 够用；后续多语言或多结局变体可抽成独立数据文件。
