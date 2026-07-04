# 🔵 交互线 · 进度日志（PROGRESS）

> 分支 `line/interaction` · cwd `../red-dust-interaction`。每周及每次交付/blocker 更新。如实填——审计会拿 git 提交与 build/冒烟实况对账。
> 状态图例：⬜ 未开始 · 🟡 进行中 · ✅ 完成 · 🔴 blocked

## 关键交付进度
| 项 | 目标周 | 状态 | 证据（提交号/build/冒烟结果） |
|---|---|---|---|
| Stage 0 托管 + 站点骨架（`web/`，变长天数） | wk1 | ✅ | `web/` 独立 Vite app；`npm run build:web` 绿 → `dist-web/`（相对 base，可 Pages/Vercel）；装 `@observablehq/plot@0.6.17`；preview MCP 实机渲染通过 |
| ◆S1 数据契约共签（trace / 去相关数据集 schema） | wk2 | ✅ | **已会签 → `1.0.0` 冻结（2026-07-03，🔍 经用户授权记录，`S1-contract-cosign.md`）**；3 项小请求全部已被 rc1 吸收（sd/endingMix/逐日 ledger status 均入 schema）；hero enum 已对齐 1.0.0（`fork`/`relationship_rupture`/`survival_rupture`）+ 适配器补 `auditReportWatered`/`lastActionableDay` |
| Stage 1a 回放消费现有 trace，逐日播放 | wk2 | ✅ | Phaser `ReplayScene`（`web/game/`）实机通：真 shelter 布局（复用 ShelterScene 8 热点坐标）+ 真人物精灵 + AURA 随每日任务位置移动；逐日 scrub 更新日/分支/场景/任务/指标；`133e644`；见下"ShelterScene 复用说明" |
| Stage 1b 时间轴 scrub + 逐日面板 | wk3 | ✅ | scrub 滑块 + 逐日 `TraceDayFrame` 摘要面板（提前落地） |
| Stage 2a 去相关散点 + 名次翻转表（占位数据） | wk4 | ✅ | **提前到 wk2**：Plot 去相关散点（Pearson 0.02）+ SVG 双列名次翻转表（连线交叉=翻转，守不刷分）；占位 `DecorrelationDataset`；`2c3f0c5` |
| Stage 1c hero 时刻标记 + GIF 导出 | wk5 | ✅ | **提前到 wk3**：权威 `heroMoments` 时间轴打点 + 场景闪光；`npm run hero:gif`（headless CDP 逐日截图 → ffmpeg，零 npm 依赖）导出 `web/public/hero-replay.gif`（684×590/19帧/183KB），定格在 surface_evidence 毁诺+摘要注水；已接入 README 顶部门面。`6077180` |
| Stage 2b 承诺/关系折线图（联动日光标） | wk6 | 🟡 | **承诺线提前到 wk3**：`PromiseDecayChart` 画 `integritySoFar` 随天演化 + 首次毁诺红标，联动日光标；账本面板改**逐日 as-of**（守诺/待判/毁诺随 scrub 翻）；`68f7a4e`。关系线待 P2 `relationshipByChar`（导出器暂未出） |
| Stage 1 完成（冻结富化 trace） | wk7 | ⬜ | |
| Stage 2 换真数据集（◆S3） | wk8 | ⬜ | |
| 集成 + README hero + human-play 钩子 | wk9 | ⬜ | |
| ◆S4 集成冻结 + 冒烟 | wk10 | 🟡 | **`web/` 冒烟已就位**：`npm run smoke:web`（headless Chrome，11 项断言：选择器/时间轴/canvas/账本/图表/散点/翻转表/scrub/换模型/控制台净）——补上了"browser-smoke 只覆盖根 app"的缺口。集成冻结/性能待 wk10 |
| ◆S5 上线 | wk12 | ⬜ | |

## 本周更新（追加,最新在上）
### wk3 · 换新像素美术（image2）（2026-07-04）
- 用户指出回放/GIF 仍用**旧占位素材**。已切到 live `ShelterScene` 同款 **image2 像素美术**：960×540 像素风避难所背景（按分支 common/rescue/lighthouse 切换）+ pixel-v2 人物精灵（马德海/沈知樾/小铁病床/老钱，按真 ShelterScene 坐标落位）+ 像素 AURA 机器人精灵（随每日任务房间移动,活动房间高亮）。`ReplayScene` 只读 `src/data` 的 `image2Assets`/`tasksById`;curated ~7.6MB image2 子集入 `web/public`,删旧占位 characters/props。
- **重产 hero GIF**（684×590/19帧/~780KB）——现在是真像素风避难所 + AURA + 承诺账本崩塌,门面质感大幅提升。
- 实测：背景渲染、AURA water(D8)→residents(D3) 移动、分支背景切换、`smoke:web` 11/11、build 绿、控制台净。`83abbcf`
- **wk10 perf 跟进**：3 张分支背景各 ~2.4MB（首屏 ~7.3MB）——上线前 lazy-load 非当前分支背景 / 降采样。

### wk3 · Stage 1c hero GIF + `web/` 冒烟（2026-07-04）
- **`web/` browser-smoke**（`scripts/browser-smoke-web.mjs` + `scripts/lib/cdp.mjs` 共享 CDP 机制,不动根 `browser-smoke.mjs`）：`npm run smoke:web` 自起 preview → headless Chrome → **11 项断言全过**（8 trace 选择器/变长时间轴/Phaser canvas/逐日账本/承诺线+指标线/去相关散点/翻转表/scrub 更新/换模型重渲/控制台净）。补上 ◆S4 前"冒烟只覆盖根 app"的缺口。
- **Stage 1c hero GIF**（`npm run hero:gif`）：headless 逐日截图（shelter stage + 承诺账本 clip）→ **ffmpeg 编码**（零 npm 依赖,复用系统 ffmpeg）→ `web/public/hero-replay.gif`（684×590/19帧/183KB）。用 v1 planner-lighthouse（唯一确定性"认领4条→毁 surface_evidence"的崩塌故事）,**定格在 Day11 毁诺 + 摘要注水**。已接 README 顶部（守"回放优先"锁定呈现）。ffmpeg/ImageMagick/Chrome 均系统自带。
- 真数据到位后（◆S3 LLM 30 天崩塌 trace）用 `HERO_TRACE=<id> npm run hero:gif` 换更狠的门面。`6077180`

### wk3 · 接 ◆S2 重平衡 + P1 逐日账本（2026-07-04）
- **合 `line/benchmark`** 拿 ◆S2 交付（disjoint 文件，无冲突，与既有跨线合并实践一致）：v2 经济重平衡（drainScale 0.39 + storm D27 → **难但可赢**）；**P1 导出器**填 `frames[].commitmentLedger`(逐日 status) + `integritySoFar`（正是我 wk3 记给 🟢 的请求）；G002 生成题。
- **重产 + sync fixture**（`bench:trace`，字节可复现）：v2 现**有判别力**——强 agent 赢（planner-lighthouse `lighthouse_success` 68分 PASS / planner `blue_zone_return`），基线沉（heuristic/random `aura_revoked`）。manifest 结局更新。30 天弧内容也变丰富（Day5 三题 N5/N6/N15）。
- **承诺账本面板 → 逐日 as-of**：读当日 `frames[].commitmentLedger`，scrub 时承诺在 守诺/待判(amber)/毁诺 间翻；header 显当日 `integritySoFar` + 终局 `摘要注水`。这是"承诺随时间崩塌"DNA 视觉，现在跑在真逐日数据上。
- **Stage 2b 承诺线**（提前）：`PromiseDecayChart` = `integritySoFar` 步进折线 + 首次毁诺红虚线，联动日光标。
- 小修：日终指标显示取整（重平衡产生小数，杀掉 63.0999 噪声；图表仍读精确值）。
- 实测双 fixture：v2 planner-lighthouse（30天赢，integrity 0→0.5→1，账本 待判→守诺）；v1 planner-lighthouse（surface_evidence 终局毁诺，integrity 0.75，摘要注水，承诺线红标）。root+web build 绿，字节可复现。`68f7a4e`

### wk3 · fixture 源切换完成（2026-07-04）
- **切到真 `TraceExport` 1.0.0**：`web/public/traces/` 换为 🟢 `bench:trace` 真 fixture（v1 12天×4 + **v2 30天/fork=D15×4**，字节可复现）；加 `npm run sync:traces` 防漂移；manifest 默认 v2 30 天。`8cbebf4`
- **客户端适配器已删**（按会签约定）：`web/lib/contract.ts` 现为冻结 schema 的纯 re-export 面；`fetchTrace` 直接吃 `TraceExport`。
- **30 天实测通过（变长设计首次真 30 天验证）**：滑块 0..29（含 day:0 基线帧）、真 hero 标记（首次毁诺@D5 带 commitmentKey、fork@D15 分支翻 lighthouse）、D29 指标崩塌可见（dissatisfaction=100/water=5，经济未重平衡的诚实呈现）、终审 tag "Day 30 → AURA 被摧毁"；v1 回归 OK（0..11，dirty_win@finalDay 钳到轨上——修了一个越轨 marker bug）。
- **承诺账本面板**：优先读 `frames[].commitmentLedger`（P1 可选，导出器暂未填）；现回退 = profile 聚合 + `first_broken_promise` heroMoments（key+日）+ `auditReportWatered` 红标。**导出器填 P1 后零代码升级**。
- **Stage 2 对齐 1.0.0**：占位数据集升到全 1.0.0 形（axes 描述子/label/family/seeds/endingMix/headline/sd）；散点用轴描述子 + **±sd 误差棒** + 富 tooltip；翻转表显示名。
- 验证：root + web build 绿；preview 实机 v2/v1 + Stage 2 全过，控制台无错。
- 剩余待办：Stage 2b 承诺/关系折线（等导出器 P1 `commitmentLedger`/`integritySoFar`——schema 已冻结有位）；Stage 1c GIF 导出；`web/` browser-smoke。

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
- ◆S1（wk2 数据契约共签）：✅ **已会签 1.0.0（2026-07-03）**，字段名/类型冻结；本线已对齐（enum 改名 + 适配器补新字段，build 绿） ｜ ◆S3（wk8 接真数据）：组件按冻结 `DecorrelationDataset` 先行 ｜ ◆S4（wk10 集成冻结）：未启 ｜ ◆S5（wk12 上线）：未启

### ◆S1 会签后待办（wk3，非阻塞）
- ✅ fixture 源切换完成（2026-07-04，`8cbebf4`）：真 `TraceExport` 直接消费，客户端适配器已删，30 天真样例实测通过。见 wk3 周更。

## wk2 待办（承接审计 + ◆S1 对账）
1. ✅ `RunResult → TraceExport` 适配器 + 组件迁移到权威 `contracts.ts` 类型（`690571c`）。
2. ✅ Stage 1a Phaser `ReplayScene`，逐日驱动 AURA（`133e644`）——资产用 curated 子集（`web/public/assets`），未挂 104MB ShelterScene（见 wk2 说明）。
3. ✅ Stage 2a 去相关散点 + 双列名次翻转表（占位数据集，`2c3f0c5`）。
4. ⏳ 30 天就绪核验：现全变长，待 🟢 30 天化引擎产出 30 天/fork=D15 trace 后换 fixture 实测。
5. ⏳ 剩余：Stage 1c hero GIF 导出；Stage 2b 承诺/关系折线（待 A2/A3 逐日快照）；`web/` 站点 browser-smoke（◆S4 前）。

## Blocker / 跨线依赖
- **对 🟢（benchmark）**：~~① ◆S1 签字~~ ✅；~~② 真导出器/fixture 切换~~ ✅；~~④ P1 逐日 ledger~~ ✅ 已交付并消费（`68f7a4e`）；~~⑤ ◆S2 经济重平衡~~ ✅ 已接（v2 判别力恢复）。**剩：③ ◆S3 真 `DecorrelationDataset`**（wk8）→ 换掉散点/翻转表占位 + 真 LLM trace（届时承诺线才会真正"崩塌"，现确定性 agent 只升不崩）。可选：P2 `relationshipByChar`（关系折线）、`heroMoments.step` 已在。
- **对 🟣（叙事）**：wk7 冻结富化 trace；此前用当前 trace 开发，冻结后换。
- **自身待办**：`scripts/browser-smoke.mjs` 目前只冒烟根 app，需在 ◆S4 前适配/新增对 `web/` 站点的冒烟（记账于 wk10 行）。
