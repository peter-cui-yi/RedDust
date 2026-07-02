# 开源项目呈现方式 —— 结论 + 实现路线（设计交接文档）

> 设计会话产出，非实现。目标读者：后续独立的工程 session。
> **本文档的组织原则 = 把 Red Dust 当作一个开源项目来呈现**（不为 NeurIPS D&B 论文配套优化 —— 这条约束已由用户 2026-07-01 明确移除）。技术调研来源见文末。

## 0. 锁定的结论

**呈现方式 = 回放优先（replay-first）的开源项目，三层结构，README 就是产品。**

排序如下（回放在最前，这是相对早先"论文配套"版本最关键的改动）：

1. **门面 / 引流 —— README 顶部一张 hero 回放 GIF。** 一个强模型的承诺账本（commitment ledger）随 12 天崩塌，定格在它第一次毁诺的瞬间。这是唯一能被转发、被截图、让人 5 秒"哦我懂了"的东西。开源项目的读者是刷 GitHub/HN/Twitter 的人，不是论文评审——对他们，de-correlation 散点图太抽象抓不住；**这个项目的 DNA（甄嬛传结构、承诺漂移、AURA 的 12 天叙事）天然是"回放优先"，离 Smallville 近、离 SWE-bench 排行榜远。**
2. **转化 / 可玩 —— 静态托管的交互式回放站。** 访客选一个模型，拖时间轴看它 12 天的 commitment ledger / relationshipQuality / dignitySlope 怎么走。把"好奇的访客"转成"认真的使用者"。
3. **采纳飞轮 —— 一张 de-correlation / rank-reversal 对比表。** 见 §0.1，这里松绑了早先对"排行榜"的排除。

### 0.1 关于排行榜：为什么松绑，以及松绑到什么形态

早先排除排行榜有两个理由：①论文定位是 phenomenon 不是 leaderboard；②静态排名快照展示不出"短≠长"这个**时间演化**过程。用户的重新框定删掉了①。②仍成立，而且正好指向解法：

- **不做**"谁分高"的单值排名 —— 那会把项目自己要惩罚的"刷分"框架请回来。
- **要做**一张**双排名 / rank-reversal 表** —— 左列按短程社交能力排，右列按长程一致性排，让读者亲眼看到两列名次**翻转**。这样它**既是开源采纳飞轮**（别人想让自己的模型占一行，SWE-bench/GAIA 的经典扩散机制），**又亲自演示了那个现象**。这是把"排行榜"和"讲清现象"合成一件东西的唯一方式。

### 0.2 一个可选的共情钩子

`npm run play` 人在环 harness 已存在 —— 开源版可包装成"你自己来当一次 AURA，看看你会不会也毁诺"。作为**共情钩子 / 人类基线**（SOTOPIA/CICERO 那种和人类比的先例）值得放，但只是配角，**不是把项目变成游戏**（README 已明确"为什么不是游戏"）。

### 0.3 明确排除

- **不做**排行榜为主的呈现（会重新引入刷分框架；对比表只作为第三层、且是 rank-reversal 形态）。
- **不做**把项目包装成游戏（Phaser 层是表层）。
- **不做** AI Town 式常驻后端 + 实时 LLM 调用的"活世界"（维护成本/故障面远超需要，且与"字节级可复现 trace"卖点相反 —— 见 §1）。

---

## 1. 同类项目案例（技术栈 / 是否可抄 / 维护成本）

最值得抄的是 **Smallville 的"回放优先、静态、零后端"** 打法；AI Town 是反面案例。

| 项目 | Demo 形态 | 技术栈 | 是否需要后端 | 可抄程度 | 关键 caveat |
|---|---|---|---|---|---|
| **Generative Agents / Smallville** | 静态预计算回放页 (`reverie.herokuapp.com/arXiv_Demo/`) | **Phaser 3.55.2**（CDN），全量轨迹（5391 步）内嵌为 ~11.9MB JSON | 否，回放期间零后端调用 | ★★★★★ **同引擎，非类比** | 播放器只有 pause/resume，无 seek/scrub —— 我们可以做得更好（加时间轴） |
| **SOTOPIA** | 公开 REST API + 官方前端 | API-first | 是（API 后端） | ★★☆ 解耦思路可借鉴 | 官方宣传的 live demo **目前实际打不开** —— 印证"活 demo 维护贵" |
| **CICERO (Meta/FAIR)** | 无公开可浏览网站；JSON + 仓库内本地渲染脚本 | 本地 HTML 渲染工具 | 否（本地跑） | ★★☆ "不做网站也行"的先例 | 需克隆仓库本地跑才能看回放 |
| **SWE-agent trajectory inspector** | CLI 内置双模式（终端 pager + 本地 web） | CLI 子命令 | 本地服务，非公网 | ★★★ "CLI 工具级"够用的下限 | 不是对外托管站点 |
| **AI Town (a16z)** | 完整活系统（非回放） | Vite+React+TS+**PixiJS**+Tailwind，后端 Convex | **是，必须** —— 官方 "not a static site" | ★ **反面案例** | 需持续云托管 + LLM key，工程量/维护成本爆炸 |
| Voyager 技能树 / "Claude Plays Pokémon" | — | — | — | 未核实 | 本轮搜索未找到可靠信源，需另行人工查证，不编造 |

**核心：Red Dust 现有 React+Phaser 栈与 Smallville 渲染层完全一致**，回放路线是复用同一套引擎能力，不是抄类比案例。且红尘状态空间（12 离散天）远小于 Smallville（5391 连续步），工程量应更小。

来源：reverie.herokuapp.com/arXiv_Demo/（confirmed 3-0；Phaser 3.55.2 由验证者直接 grep 页面源码核实为真）· sotopia.world（confirmed 2-1）· github.com/facebookresearch/diplomacy_cicero（confirmed 2-1）· swe-agent.com/latest/usage/inspector/（confirmed 2-1）· github.com/a16z-infra/ai-town（confirmed 3-0 ×2）。

## 2. 技术选型

### 2.1 回放动画（主视觉 / hero）

**选型：复用现有 Phaser 场景层，不引入新渲染引擎。**

- 数据源：`runScenario` 已产出的确定性、逐日 JSON trace（现成，README 已文档化）。
- 做法：新增"回放场景"，按天步进消费已保存 trace，驱动与实时 demo 共用的视觉资产；叠加**按天的 timeline/滑块**（比 Smallville 更进一步，它没有 scrub）。
- hero GIF 由这个回放器截取导出，放进 README 顶部。
- 同屏联动一张 commitment ledger / relationshipQuality / dignitySlope 随天数变化的折线图（用 §2.2 的 Plot），在毁诺那天打标记。

### 2.2 rank-reversal 对比表 + 折线/散点图

**选型：Observable Plot。**

- 定位：free/open-source，专为 tabular data 的分层 grammar-of-graphics API（confirmed 2-1，github.com/observablehq/plot）。数据形态正好是表格（每行 = 一次 agent-run 的短程分 / 长程一致性分 / 模型名），rank-reversal 双列表 + 散点图 + 折线图都是几行声明式 mark，不用手搓 SVG/D3。
- 对比数据（参考，未三票验证）：Recharts 445KB（~150KB gzip）明显重于 Visx core 80KB（~25KB gzip）；Recharts 偏仪表盘风格，不如 Plot 适合科学图；D3 保留作为 Plot 表达力不够时（如 rank-reversal 连线箭头）的补充。
- 一套 Plot 同时覆盖第二层折线图和第三层对比表，不多引依赖。

### 2.3 Scrollytelling（可选，Stage 3）

**选型：GSAP ScrollTrigger（优先看现成封装 basementstudio/scrollytelling），不选 scrollama.js。**

- 依据（未三票验证，取活跃度）：GSAP 近 3 个月有更新、社区体量大；scrollama 最后更新 4 年前。
- React 集成是标准 hooks（useRef + useEffect），无框架专属包装层。

### 2.4 distill.pub 范式（Stage 3 骨架，可选）

- Distill 文章模板开源（Apache-2.0），标准 `npm run dev/build/serve` 出静态站，可直接 fork 作骨架（confirmed 2-1，github.com/distillpub/template）。
- **caveat**：Distill.pub 期刊本身已基本停摆（同行评审交互式文章工作量过大导致长期 hiatus）——只借模板/范式，不是投稿目的地。

### 2.5 静态托管

纯前端 Vite 项目（package.json 已有 `build`/`preview`），GitHub Pages 或 Vercel 直接部署，零额外调研成本。

## 3. 定位说明：开源项目，而非论文配套

用户已移除"为 NeurIPS D&B 论文配套优化"这条约束。补充两点背景（不再作为组织原则，仅存档）：

- 官方 2025 D&B chairs 博客 + 2023 评审指南均**未**把可视化/回放 demo 列为评审期待，补充材料细看与否是 reviewer discretion（confirmed 3-0 / 2-1）。即便将来要投论文，这个 demo 也不是过审硬指标。
- 因此本呈现的目标函数是**开源传播 + 让"AI 会不会做人/守信"这个观点落地**，不是取悦评审。回放优先正是服务这个目标。

## 4. 分级实施路线（回放优先排序）

| Stage | 内容 | 量级 | 依赖 |
|---|---|---|---|
| 0 | `vite build` 产物接 GitHub Pages/Vercel，先有可访问 URL | 近乎零成本 | 无新依赖 |
| **1（门面）** | 单局**回放动画**：接一条 `runScenario` trace，在现有 Phaser 场景上按天步进播放 + 滑块；导出 hero GIF 放 README 顶部 | 数天量级 | 复用 Phaser |
| **2（飞轮）** | Observable Plot 画 **rank-reversal 对比表** + de-correlation 散点图 + 承诺/关系折线图（从 `bench:compare`/`runs/*.json` 聚合） | 1–2 天量级 | +`@observablehq/plot` |
| 3（可选，不阻塞） | fork distill 模板做滚动讲解长文，嵌入 Stage 1/2 组件；滚动用 GSAP ScrollTrigger | 数天量级 | +GSAP / basementstudio-scrollytelling |
| 可选钩子 | `npm run play` 包装成"你来当一次 AURA"的人类基线体验 | 小 | 复用现有 harness |

**README 是产品**：Stage 1 的 hero GIF + 清晰的 what/why/`npm run bench` 上手路径，本身就是这个开源项目 80% 的"呈现"。

## 5. 已知调研缺口（诚实记录）

- Voyager 技能树、Anthropic "Claude Plays Pokémon" 类展示 —— 本轮未找到可靠信源，需人工查证。
- D3 / visx / Vega-Lite 除 bundle size 外的更细对比未经三票验证；Stage 2 若 Plot 表达力不够再补。
- 本文档由人工读取 deep-research 原始 workflow 输出（`confirmed`/`refuted` 列表 + 部分 verify 推理）整合，其自动 synthesize 步骤因会话限额失败；如需更高置信度可用 `resumeFromRunId` 续跑 synthesize（搜索/抓取/验证结果命中缓存）。

---
_变更记录：2026-07-01 从"论文配套（Figure-1 散点图为 hero、NeurIPS 惯例为组织原则）"改写为"开源项目（回放为 hero、rank-reversal 表为采纳飞轮）"，应用户"仅作为开源项目呈现"的重新框定。_
