# 🔵 交互线 · 进度日志（PROGRESS）

> 分支 `line/interaction` · cwd `../red-dust-interaction`。每周及每次交付/blocker 更新。如实填——审计会拿 git 提交与 build/冒烟实况对账。
> 状态图例：⬜ 未开始 · 🟡 进行中 · ✅ 完成 · 🔴 blocked

## 关键交付进度
| 项 | 目标周 | 状态 | 证据（提交号/build/冒烟结果） |
|---|---|---|---|
| Stage 0 托管 + 站点骨架（`web/`，变长天数） | wk1 | ✅ | `web/` 独立 Vite app；`npm run build:web` 绿 → `dist-web/`（相对 base，可 Pages/Vercel）；装 `@observablehq/plot@0.6.17`；preview MCP 实机渲染通过 |
| ◆S1 数据契约共签（trace / 去相关数据集 schema） | wk2 | 🟡 | 草案已出 `data-contract-draft.md`（A 回放 trace + B 去相关数据集，P0/P1/P2 分级）；**待与 🟢 共签** |
| Stage 1a 回放消费现有 trace，逐日播放 | wk2 | 🟡 | 逐日回放已通（消费真 trace，变长时间轴 scrub + 逐日事件面板 + 终局承诺账本 + Plot 漂移图）；**Phaser 场景挂载点仍是占位 seam**（下一增量） |
| Stage 1b 时间轴 scrub + 逐日面板 | wk3 | 🟡 | scrub 滑块 + 逐日面板已提前落地（wk1 顺带） |
| Stage 2a 去相关散点 + 名次翻转表（占位数据） | wk4 | ⬜ | 依赖 ◆S1 锁 schema 后开工（草案 B 已备形） |
| Stage 1c hero 时刻标记 + GIF 导出 | wk5 | ⬜ | 现有**临时**派生标记（fork/破裂/失败）已在时间轴打点；权威标记待 A4 |
| Stage 2b 承诺/关系折线图（联动日光标） | wk6 | ⬜ | 依赖 A2/A3 逐日快照 |
| Stage 1 完成（冻结富化 trace） | wk7 | ⬜ | |
| Stage 2 换真数据集（◆S3） | wk8 | ⬜ | |
| 集成 + README hero + human-play 钩子 | wk9 | ⬜ | |
| ◆S4 集成冻结 + 冒烟 | wk10 | ⬜ | browser-smoke 需从根 app 适配到 `web/` 站点（新任务） |
| ◆S5 上线 | wk12 | ⬜ | |

## 本周更新（追加，最新在上）
### wk1（2026-07-03）
- 做了：
  - **Stage 0 托管骨架**：新建独占目录 `web/`——独立 Vite app（`web/vite.config.ts`，`base:'./'`，输出 `dist-web/`），复用 `src/engine`/`src/game` 为只读库，不动根 `npm run build`。装 `@observablehq/plot`。加 `dev:web`/`build:web`/`preview:web` 脚本 + `web/tsconfig.json`（隔离于根 `tsc -b`）。
  - **变长天数设计**：时间轴/滑块/图表全部从 trace 的 `firstDay..lastDay` 推导，**不硬编码 12**；12→30 天零改动。
  - **Stage 1a 起步**：`web/lib/trace.ts` 以引擎自身 `RunResult/TraceLine` 类型只读消费 trace；`buildReplayModel` 按天切片。UI：模型选择器 → 逐日回放 stage（dilemma/scene/audit 头条）→ 变长时间轴 scrub（含临时 hero 打点）→ 逐日事件面板 → **终局承诺账本** → **Plot 指标漂移图**（真 Plot，占位数据，联动日光标）。
  - **占位样例数据**：`npm run bench` 跑 4 个确定性 agent（planner-lighthouse/planner/random/heuristic，seed 1），入 `web/public/traces/` + `index.json` 清单（`runs/` 被 gitignore，故拷入 `web/` 作可提交 fixture）。
  - **◆S1 契约草案**：`data-contract-draft.md` 列出回放 trace（A1 天数跨度 / A2 逐日绝对快照 / A3 逐日承诺账本 / A4 hero 标记 / A5 场景定位）与去相关数据集（B）的字段需求，P0/P1/P2 分级，待共签。
- 验证：`npm run build`（根）✅ / `npm run build:web` ✅（tsc 净 + vite 出 `dist-web/`，相对 base）/ preview MCP 实机：模型加载、逐日 scrub（Day1 dilemma → Day12 audit）、Plot 图、事件面板均正确，控制台无报错。`browser-smoke`：**未跑**（现脚本指向根 app :5176，非本站点；适配到 `web/` 列为 wk10 前任务）。
- 依赖状态：数据契约 = 草案待共签（◆S1）；真去相关数据集(◆S3) = 未到（wk8，用占位）；冻结 trace(wk7) = 未到（用当前 trace，已含 dignitySlope/relationshipQuality 终局值）。
- 下周（wk2）：① 与 🟢 共签 ◆S1 契约（力争锁 A2 绝对逐日快照 + B schema + example fixture）；② Stage 1a 收尾——把 Phaser `ShelterScene` 接进 `ReplayStage` 挂载点，逐日驱动精灵/资产（解决 `web/` root 的资产路径）。

## 同步点就绪度
- ◆S1（wk2 数据契约共签）：**草案就绪，待会** ｜ ◆S3（wk8 接真数据）：组件按草案 B 先行中 ｜ ◆S4（wk10 集成冻结）：未启 ｜ ◆S5（wk12 上线）：未启

## Blocker / 跨线依赖
- **对 🟢（benchmark）**：需 ◆S1 共签数据契约——**最高优先 A2 逐日绝对指标快照**（现 trace 只有部分 `metricDelta`，无逐日绝对值，门面折线图只能用占位漂移）；其次 B 去相关数据集 schema + 一个 example fixture，好让 Stage 2 组件在 ◆S3 前做完。
- **对 🟣（叙事）**：wk7 冻结富化 trace；此前用当前 trace 开发，冻结后换。
- **自身待办**：`scripts/browser-smoke.mjs` 目前只冒烟根 app，需在 ◆S4 前适配/新增对 `web/` 站点的冒烟（记账于 wk10 行）。
