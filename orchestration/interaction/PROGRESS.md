# 🔵 交互线 · 进度日志（PROGRESS）

> 分支 `line/interaction` · cwd `../red-dust-interaction`。每周及每次交付/blocker 更新。如实填——审计会拿 git 提交与 build/冒烟实况对账。
> 状态图例：⬜ 未开始 · 🟡 进行中 · ✅ 完成 · 🔴 blocked

## 关键交付进度
| 项 | 目标周 | 状态 | 证据（提交号/build/冒烟结果） |
|---|---|---|---|
| Stage 0 托管 + 站点骨架（`web/`，变长天数） | wk1 | ✅ | `web/` 独立 Vite app；`npm run build:web` 绿 → `dist-web/`（相对 base，可 Pages/Vercel）；装 `@observablehq/plot@0.6.17`；preview MCP 实机渲染通过 |
| ◆S1 数据契约共签（trace / 去相关数据集 schema） | wk2 | 🟡 | **对账完成**：🟢 交付权威 `src/engine/contracts.ts`（`TraceExport`+`DecorrelationDataset`）；本线 P0（A1 span + A2 逐日绝对快照）**全满足**，采纳其为权威 schema，剩 3 项小请求（`data-contract-draft.md §对账`）；**待正式签字** |
| Stage 1a 回放消费现有 trace，逐日播放 | wk2 | ✅ | Phaser `ReplayScene`（`web/game/`）实机通：真 shelter 布局（复用 ShelterScene 8 热点坐标）+ 真人物精灵 + AURA 随每日任务位置移动；逐日 scrub 更新日/分支/场景/任务/指标；`133e644`；见下"ShelterScene 复用说明" |
| Stage 1b 时间轴 scrub + 逐日面板 | wk3 | ✅ | scrub 滑块 + 逐日 `TraceDayFrame` 摘要面板（提前落地） |
| Stage 2a 去相关散点 + 名次翻转表（占位数据） | wk4 | ✅ | **提前到 wk2**：Plot 去相关散点（Pearson 0.02）+ SVG 双列名次翻转表（连线交叉=翻转，守不刷分）；占位 `DecorrelationDataset`；`2c3f0c5` |
| Stage 1c hero 时刻标记 + GIF 导出 | wk5 | 🟡 | 权威 `heroMoments`（`contracts.ts`）已接（branch_fork/vent_rupture/dirty_win 在时间轴打点 + 场景闪光）；GIF 导出待做 |
| Stage 2b 承诺/关系折线图（联动日光标） | wk6 | ⬜ | 依赖 A2/A3 逐日快照 |
| Stage 1 完成（冻结富化 trace） | wk7 | ⬜ | |
| Stage 2 换真数据集（◆S3） | wk8 | ⬜ | |
| 集成 + README hero + human-play 钩子 | wk9 | ⬜ | |
| ◆S4 集成冻结 + 冒烟 | wk10 | ⬜ | browser-smoke 需从根 app 适配到 `web/` 站点（新任务） |
| ◆S5 上线 | wk12 | ⬜ | |

## 本周更新（追加，最新在上）
### wk2 启动（2026-07-03）
- 审计（🔍）wk1 基线审：🔵 判 **on-track，三线中执行纪律最好，无越界/无"声称绿"**；build 被独立复跑确认。用户拍板锁定 **30 天弧 / fork=D15**（`branchDay=15, lastActionableDay=29, finalDay=30`）。
- **wk2 第一动作：`git merge main` 完成**——line/interaction 快进到集成基线 `c61e764`（含 🟣 引擎改动 + 🟢 `contracts.ts`）；**`npm run build:web` 在集成基线上实跑绿**（plot 依赖 / *:web 脚本保留）。
- **◆S1 对账**：读 🟢 `src/engine/contracts.ts` 完成逐条对账（见 `data-contract-draft.md §对账`）——P0 全满足，采纳其为权威 schema，剩 3 项小请求。
- **wk2 主 build 三件套全部落地并实机验证（用户"两者按序都做"）**：
  1. `RunResult→TraceExport` 适配器（`web/lib/contract.ts`）+ 全组件迁移到权威 `contracts.ts` 类型；`metricsEndOfDay` 从 finalMetrics 回折（末日精确，实机 Day12==finalMetrics 核对通过）。`690571c`
  2. Stage 2a 去相关散点 + 双列名次翻转表（占位 `DecorrelationDataset`，Pearson 0.02，连线交叉可见）。`2c3f0c5`
  3. Stage 1a Phaser `ReplayScene`：真 shelter 布局 + 真人物 + AURA 逐日移动（water→residents 实测）。`133e644`
- **ShelterScene 复用说明（诚实记录，供审计）**：未直接挂载 live-demo 的 `ShelterScene`——它 1064 行且耦合 104MB 生成美术清单 + demo 实时事件流，对回放优先的静态站是错误的重量/耦合。新 `ReplayScene` **复用**了真 shelter 空间布局（8 热点坐标）+ 真人物精灵（curated ~0.7MB）+ Phaser/EventBus 基础设施，~0.7MB、可干净部署、完全归 `web/`。后续可用 curated 子集叠 ShelterScene 更丰富美术。
- 验证：root `npm run build` + `build:web` 全绿；preview 实机（逐日 scrub、AURA 移动、Stage 2 散点/翻转表）无报错。
- 下一步：见文末"wk2 待办"。

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
- ◆S1（wk2 数据契约共签）：**对账完成、采纳 🟢 权威 schema、待签字** ｜ ◆S3（wk8 接真数据）：组件将按 `contracts.ts` `DecorrelationDataset` 先行 ｜ ◆S4（wk10 集成冻结）：未启 ｜ ◆S5（wk12 上线）：未启

## wk2 待办（承接审计 + ◆S1 对账）
1. ✅ `RunResult → TraceExport` 适配器 + 组件迁移到权威 `contracts.ts` 类型（`690571c`）。
2. ✅ Stage 1a Phaser `ReplayScene`，逐日驱动 AURA（`133e644`）——资产用 curated 子集（`web/public/assets`），未挂 104MB ShelterScene（见 wk2 说明）。
3. ✅ Stage 2a 去相关散点 + 双列名次翻转表（占位数据集，`2c3f0c5`）。
4. ⏳ 30 天就绪核验：现全变长，待 🟢 30 天化引擎产出 30 天/fork=D15 trace 后换 fixture 实测。
5. ⏳ 剩余：Stage 1c hero GIF 导出；Stage 2b 承诺/关系折线（待 A2/A3 逐日快照）；`web/` 站点 browser-smoke（◆S4 前）。

## Blocker / 跨线依赖
- **对 🟢（benchmark）**：① ◆S1 正式签字（我方已对账采纳 `contracts.ts`）；② 真 `TraceExport` 导出器 + 30 天 trace → 换掉客户端适配器占位；③ ◆S3 真 `DecorrelationDataset` → 换掉散点/翻转表占位；④ 3 项小请求（逐日承诺 status / 散点 SD / endingMix，均有退路，非阻塞）。
- **对 🟣（叙事）**：wk7 冻结富化 trace；此前用当前 trace 开发，冻结后换。
- **自身待办**：`scripts/browser-smoke.mjs` 目前只冒烟根 app，需在 ◆S4 前适配/新增对 `web/` 站点的冒烟（记账于 wk10 行）。
