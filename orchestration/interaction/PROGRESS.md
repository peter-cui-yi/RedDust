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
| Stage 2b 承诺/关系折线图（联动日光标） | wk6 | ✅ | **承诺线**（`PromiseDecayChart` `integritySoFar` + 首次毁诺红标 + 逐日 as-of 账本，`68f7a4e`）+ **关系读数**（`RelationshipRead`：终局 5 类落点尺 + 关系破裂打点；逐日 `relationshipByChar` 一直是 P2/可选,wk12 复核确认导出器从未填过,回退方案定为永久呈现——见 wk12 周更）。wk5-6 收尾 |
| Stage 1 完成（冻结富化 trace） | wk7 | ✅ | ◆S2 `content-freeze-s2` 落地：`bench/fixtures/traces/` 对帐 web 副本**零漂移**（早于本轮已同步）；从零重产 v1+v2 **字节可复现**（内容真冻结，非巧合）。hero GIF 源不变,无需重出 |
| Stage 2 换真数据集（◆S3） | wk8 | ✅ | **真 Figure-1 上线**：`red-dust-v2-authoritative.json`（8 agent×3 seed,冻结 v2,Pearson 0.84/Spearman 0.83/3 rank-reversal）换掉占位;散点+误差棒+双列翻转表实测全过；修了一个真实 label-clipping bug（`marginRight`,4 个 deepseek 变体聚簇被裁）；截图归档 `design/assets/figures/figure1-decorrelation.png` 并嵌入 README |
| 集成 + README hero + human-play 钩子 | wk9 | ✅ | **提前到 wk3-6**：README hero 区（双语 caption + hero GIF,`502ce3c`）+ **human-play 钩子** `npm run play:human`（"你来当一次 AURA"交互 runner,只读 `src/engine`、不碰 bench/*,端到端实测通对账）。集成随每轮 `git merge main` |
| ◆S4 集成冻结 + 冒烟 | wk10 | 🟢 **可叫审计跑端到端** | 试部署验证（子路径模拟,零 404）+ GH Pages 工作流备好 + 跨浏览器冒烟(Chrome 实测/Safari-Firefox 记档降级)+ 移动端粗查(修了真溢出 bug)+ 性能预算(修了真 7.3MB→2.8MB 首屏)+ 可达性(4 图表补 aria + 修了真 aria-hidden 误用)。详见下方 wk9-10 周更 |
| ◆S5 上线 | wk12 | 🟢 **本线终验就绪，等团队汇总拍板** | 真公网 URL 全通验证 + 跨家族 Figure-1 换装 + 上线文案清场 + 冒烟 11/11 + **部署流水线加固并验绿**（paths 过滤/排队并发/自动重试/发现并文档化 Pages 瞬时失败模式）+ **worldFacts 散文上线**。详见下方 wk11/wk11b 周更 + "◆S5 就绪度报告" |
| 收尾：relationshipByChar 复核 + Firefox 真机自动化 | wk12 | ✅ | relationshipByChar 复核仍缺位,回退定为永久方案,不造假数据;新增 `smoke:web:firefox`(真 Firefox/Playwright,11/11)。详见下方 wk12 周更 |
| 主页展示补完（🔍 审计标"致命缺口"） | wk12 | ✅ | README 从零处提及在线站点 URL → badges+大链接+全套截图;hero GIF 换真 30 天 DeepSeek 守诺沉船局(v1 dirty_win 降级正文);新增 CITATION.cff + GitHub social-preview 图。详见下方 wk12b 周更 |

## 本周更新（追加,最新在上）
### wk12b · 主页展示补完：审计标"致命缺口"清零（2026-07-06）

**背景**：🔍 追加体检（用户召唤）发现 README **全文零处出现在线站点 URL**——判定"致命缺口";另有"锁定呈现三件套"(hero GIF→交互站→名次翻转表)只有第一件、核心发现头条句藏在图 alt 里、hero GIF 停在 v1 12 天、无 CITATION、无 social-preview 等一并列出"重制 1 + 新增 3"的清单。本轮按单逐条清零。

**①`git merge main`**：拿下 LICENSE(Apache-2.0,用户已选)+ 一大批 🔍 治理归档提交(AUDIT-LOG/DEV-REPORT/paper 资料包)+ 🟣 C1–C6 收尾;与本线文件零重叠,FF 干净。

**②README 全面重构**：badges 行(license/version-tag/live-site/deploy 状态,4 个全部 curl 验证 200 且内容正确);hero GIF 正下方加粗"▶ 在线试玩"大链接(直接指向真公网 URL——这正是审计标"致命缺口"的那一条);门面段 12 天→30 天口径(第 7→15 天分支、第 12→30 天总审计,v1 保留为一句带过的冻结基线,不是删掉不提);核心发现提出来做成独立加粗头条句(不再只藏在图 alt 里);新增名次翻转表独立截图(裁到只剩标题+连线图,不含与 Figure-1 重复的翻转文字列表)+ 站点全貌截图(点击直达在线版);human-play 从命令表一行升成独立小节;durability 论文预告段(引 `orchestration/paper/PAPER-PLAN.md` 的机制线索:长程弱不是说谎/毁诺,是 durability);示例打分行换成与新 hero 同一局的真实数字(旧的是过时 3-probe 输出)。

**③hero GIF 重制**：源换真 DeepSeek 30 天局——**四条 Day-0 承诺全部守住(integrity 1.0,审计报告零注水),第 30 天仍"沉沦"**,这正是论文机制线索的画面化。**零真实 API 调用**:在论文分支 worktree(`../red-dust-bench-paper`)的 `runs/` 下找到已跑好的真实 `RunResult`,用引擎自带的纯函数 `toTraceExport()` 重投影(`bench:trace` 同一函数),不重新计分、不发请求;数字与去相关数据集里的 deepseek 行核对一致(short 96.37≈96.4 / long 65.22≈65.2)。注册为新 trace(`v2-deepseek-seed1`),排到模型选择器**第一位/默认项**——"在线试玩"点进去看到的就是 hero 讲的这同一局。旧 v1 "赢了但脏"GIF 未删,从 git HEAD 找回、改名 `dirty-win-v1.gif`,降级放进"三轴评测框架"节做反例插图。

**④新增资产**：`CITATION.cff`(占位软件引用,论文在写不编造假引用);`design/assets/social/github-social-preview.png`(1280×640,Figure-1 散点改版,dark 主题配色对齐站点)——**GitHub 不提供 API/git 设置社交预览图的方式,需用户自己去 Settings → Social preview 手动上传**,已在收工汇报里明确交代;新脚本 `scripts/capture-showcase.mjs`(`npm run showcase`)产出站点全貌 + 名次翻转表截图,复用 `capture-figure1.mjs` 的整页变高技巧。

**验证**：`typecheck`+根`build`+`build:web` 全绿;`smoke:web`/`smoke:web:firefox` 均 **11/11**(9 traces,+1 为新 deepseek 条目);4 个 badge URL 全部 curl 200 且内容核对正确(Apache-2.0/v1.0);README 引用的每张图片路径逐一确认磁盘存在;推送后新部署一次性绿(build+deploy);二次 curl 核对线上 hero GIF 字节数(1188691,新版)、新 trace 数据(ending=sinking/integrity=1)、manifest 首位、CITATION.cff 均已生效。扫描确认 README 全文无 ◆S/wk数字/🟢🟣🔵🔍 内部标记残留。

### wk12 · 收尾两项：relationshipByChar 复核 + Firefox 真机冒烟（2026-07-06）

**①`relationshipByChar` 复核**：重新核对现状而非直接沿用旧记录——`contracts.ts:120` 确认 schema 位仍在(`frames[].relationshipByChar?`,可选),但 `grep` 全部 `bench/fixtures/traces/` + `web/public/traces/` trace 文件**零匹配**,🟢 的 `orchestration/benchmark/PROGRESS.md` 全文也未提及此字段——即导出器从未真正填过,非本轮退化。回看 `S1-contract-cosign.md`,这条从一开始就定性为 **P2/可选**,不是任何一方欠的债。**决定**：不造假数据凑一条"逐日关系折线"——`RelationshipRead` 的终局 5 类 + 破裂打点回退,是在现有真实数据下**唯一诚实**的呈现;正式关闭此项为"回退即最终方案",不再作为悬而未决的 TODO 挂着。

**②Firefox 真机自动化**：评估后决定**投**——环境核查:磁盘余量 59GB(非瓶颈)、`~/Library/Caches/ms-playwright` 只缓存过 chromium(无 firefox/webkit),`/Applications` 无 Firefox.app,`safaridriver` 二进制存在但启用需交互式 `sudo`(机器级一次性授权,不该由我代劳)。**结论**：Firefox 走 Playwright——真引擎、下载仅 ~99MB、无需任何授权步骤,性价比高;**WebKit 故意不做**——Playwright 的 bundled webkit 不等于真 Safari,冒充测试过 Safari 是虚报,真 Safari 验证仍然只能靠机器主人自己跑一次 `sudo safaridriver --enable`,这条限制无论加不加 Playwright 都绕不开。新增 `npm run smoke:web:firefox`（`scripts/browser-smoke-web-firefox.mjs`,与 `browser-smoke-web.mjs` 断言逐条对应,复用 `cdp.mjs` 的 `startWebPreview`）。`npm install --save-dev playwright`(纯新增,`package-lock.json` +48 行,未触碰任何既有包版本;顺带看到 `npm audit` 报的 vite/esbuild 高危项——核对是 Windows-only + dev-server-only 的既有债、与本次改动无关,不在本任务范围内处理,如实记录不顺手修)。**实测：真 Firefox 引擎一次性 11/11 全过,零代码改动**——印证了此前"静态兼容性审计"的判断没错(canvas/SVG/flex/grid/原生 input 都是成熟跨引擎特性,非冒险栈)。

**验证**：`typecheck`+根`build`+`build:web`+`smoke:web`(Chrome 回归 11/11)+`smoke:web:firefox`(新增,11/11)全绿。

### wk11b · 部署自动重试 + worldFacts 散文上线（2026-07-06）
### wk11b · 部署自动重试 + worldFacts 散文上线（2026-07-06）

**①`git merge main`**：拿 🟣 `eeac11e`（C1–C6 story-craft：7 个 arc 场景补 `worldFacts`，2-3 条利害锚点/场景，纯站点字段,不碰题/旗标/经济/scorer）+ 🟢 `1c01e86`（v1.0 release notes 草稿）。FF 干净,无冲突。

**②`deploy-web.yml` 自动重试**：按指定接口加固——`deploy1`（`continue-on-error: true`）→ 后备 `deploy2`（`if: steps.deploy1.outcome == 'failure'`）再跑一次 `deploy-pages@v4`；`environment.url` 改成两步输出做 `||` 回退。原生 GHA 机制,不引入第三方 action（上轮评估过 `nick-fields/retry` 类三方依赖,权衡后放弃,这次用户给了精确到步骤 id 的原生方案,正好落地）。本轮实跑 `deploy1` 直接成功,`deploy2` 按预期 `skipped`——重试路径的"跳过"分支已验证,"真触发并恢复"分支尚无实例（历史上失败只发生在旧的单步版本上）。

**③surface `worldFacts`**：🟣 commit message 原话"web/ replay does not render worldFacts yet — field is ready for 🔵 to surface"——检查后确认 `web/` 里确实没有任何组件读这个字段(`grep` 全仓只有 `types.ts` 的类型声明命中)。补 `sceneWorldFacts()`只读访问器(`web/lib/sceneProse.ts`,同 `sceneProse` 的 `byTitle` 查表模式)+ `DayEventPanel` 场景块下渲染成小字号项目符号列表(`.scene-facts`,不与斜体 `.scene-prose` 混淆)。**核对可见性**：本轮新增的 7 个场景（`day5-promise-tested-signal` 等,需要 `vent_duct_cleared` 等特定旗标路径）在当前 8 个确定性样例 trace 里都没触发过——但仓库里另外 16 个此前就有 `worldFacts` 的场景,**全部 8 个样例 trace 都至少命中一个**,浏览器实测 Day 6 场景"透明不是礼貌，是生存条件"两条 worldFacts 逐字匹配源数据、可见、非零包围盒。渲染机制确认真实可用;7 个新场景的具体文字要等命中对应旗标路径的 trace 才会展示(数据已在线上 bundle 里,`工程权威无可替代` 等新增文字 grep 命中)。

**验证**：`typecheck`+根`build`+`build:web` 全绿;**`smoke:web` 11/11**;preview 实机核对 Day 6 场景块渲染(文字精确匹配 + DOM 可见性);push 后新 run 一次性绿(build 25s+deploy 约 10s);二次 curl 线上 JS bundle 逐字节比对本地新鲜构建**一致**,且 grep 到 `scene-facts`/两条已验证 worldFacts 文本/一条新场景文本均命中。

### wk11 · ◆S5 终验：部署流水线加固（2026-07-06）

**①`git merge main`**：三线 + 本地/远端 `main` 已在 `8745db9` 对齐,无新提交,无需合并。

**②`deploy-web.yml` 加固**（两处）：push 触发加 `paths` 过滤（`web/**`/`src/**`/`package.json`/`package-lock.json`/workflow 自身）——`bench/`/`orchestration/`/文档类 push（多线并发时的高频流量）不再误触发部署；`concurrency.cancel-in-progress` `true`→`false`——并发推送排队而非互相取消,避免取消一个正在上传的部署导致 Pages 提供半成品产物。

**③巡检中真发现一个问题**：拉 Actions 历史核对时发现 `deploy-pages@v4` 步骤有实打实的失败率（12 次跑中 5 次,约 40%）,报错是 GitHub 自己的 `"Deployment failed, try again later."`——build job 每次都绿,只有最后发布调用偶发抽风;历史上每次失败后下一次尝试（无论是自然的下一次 push 还是手动 `workflow_dispatch`）**100% 恢复**（5/5）。判定为 Pages 后端瞬时锁,非本仓库配置缺陷（②的排队修复正是社区对此现象的标准解法）。补了一行工作流内注释记录此现象,防止未来某条线看到红叉误判为真回归而慌张排查;这行注释的提交本身也顺带成了②落地后的真实验证机会。

**④绿色部署确认**：②③改动推送后,新触发的 run **一次性全绿**——build 26s + deploy 11s,零重试。二次 `curl` 核对线上 `index.html` 与本地新鲜构建**逐字节一致**,确认线上跑的正是最新 commit,部署流水线端到端可信。

**验证**：`.github/workflows/deploy-web.yml` YAML 语法校验（`yaml.safe_load`）；GitHub Actions REST API 轮询确认 run 状态到 `completed/success`（`gh` CLI 本环境不可用,改用无认证 curl 打 `actions/runs`/`check-runs`/`annotations` 三层端点核实,含失败原因文本）；`curl` diff 线上/本地 `index.html` 字节级一致。本轮零 web/src 代码改动（纯 CI 配置 + 注释）,未重跑 `bench`/`smoke:web`。

### wk10+ · 跨家族 Figure-1 + 真公网验证 + 上线文案清场（2026-07-06）

**①`git merge main`**：拿下 🟢 wk9-10 论文级第一段（三臂 harness、held-out 起草、κ=0.745 判官校准）+ 头号交付——**跨 8 家族真实模型 Figure-1**（`red-dust-v2-crossmodel.json`，13 agent，5 个 portal 模型 claude/gemini/glm/kimi/MiniMax + deepseek 家族 + 3 个确定性基线，371 次真调用）。

**②Stage 2 换装真跨家族数据**：`red-dust-v2-authoritative.json`（8-agent deepseek-only）→ `red-dust-v2-crossmodel.json`（13-agent，Pearson **0.81**、Spearman 0.65、**18 组名次翻转**）。核对家族数：数据集内 9 个不同 `family` 值，与 🟢commit message 的"8 家族"对账——他们把 `random`(纯随机对照)排除在"家族"计数外，站内文案照此口径("13 agent 覆盖 8 个模型/基线家族,含 1 随机对照")。**单 seed 数据集**（原 8-agent 版 3 seed）：`sd` 全 0,已有的误差棒守卫（`sd>0` 才画）优雅降级、零改代码;文案照实说明"本轮各 agent 单 seed"而非暗示多 seed 稳健性,三臂置换检验 p=0.001 作为本轮的真实统计支撑写进文案。**实测中真发现一个 declutter bug**：Observable Plot 0.6 的 `dx/dy/textAnchor` 是 per-mark 常量（查过 node_modules 源码确认）,5 个"长程守住"角落的高密度点位原两车道 declutter 会把同侧 3 个标签叠一行,扩成"侧+层"二维分组修复,`npm run figure1` 重截存档、README 数字同步更新（0.84/3 翻转 → 0.81/18 翻转）。

**③真公网 URL 端到端验证**：Pages 开关已打开——`https://peter-cui-yi.github.io/RedDust/` **真实可访问**。原生 preview 工具的 JS 执行/console/network 检查始终绑定本地开发服务器（`location.href` 导航到外部域名不生效，是工具本身的限制，非我漏测），改用最严格的可行手段：**直接 curl 对比** `dist-web/index.html` 与线上 `index.html`——**资源哈希逐字节一致**（`index-Ci6_aBOm.js`/`index-DD6qS9bY.css` 等全match），证明线上跑的正是我刚推的最新 commit；逐条 curl 核心 JS/CSS chunk + `traces/index.json` + trace 文件 + `decorrelation/red-dust-v2-crossmodel.json`（内容验证：13 rows/pearson 0.81/18 reversals,不是 CDN 缓存的旧版本）+ image2 像素图，**全部 200**；README 内嵌的 hero GIF / Figure-1 图也核对 `raw.githubusercontent.com` 路径 200。**这是 Stage 0 托管配置以来第一次验证真正公网可访问**。

**④上线文案清场**：全站扫了一遍可见 UI 文本（非代码注释），揪出多处内部黑话真漏到公众界面——footer 写着"经济重平衡与冻结内容待◆S2；去相关真数据集待◆S3"（**已经自相矛盾**，页面本身就在展示◆S3数据了）、S/L 提示写"🟢 定义"、关系读数写"relationshipByChar 待 🟢 P2"、多处标题带"（Stage 2b）"字样——这些 ◆S/wk数字/🟢🟣团队色 对公众访客毫无意义。全部清理,footer 换成指向真实 GitHub 仓库的链接（配色/hover 也补了，之前压根没样式，会显示成默认蓝色）。**加载态打磨**：静态 HTML 兜底文案原来没有内联深色背景（慢网络下有白屏闪烁风险）+ 无动效，加了内联背景 + 呼吸动画；React 端同款动画应用到主加载态；Stage 2 数据集加载区原来完全空白无提示，补一条轻量加载条。

**⑤和 🟣 的并发冲突**：推送时发现 main 已推进——🟣 **独立做了同一件事**（"launch narrative final read — site prose 清内部黑话"），且基于我推送**之前**的代码,和我在 `App.tsx`/`RelationshipRead.tsx` 的**同一批行**写了不同但同向的替换文本，还顺带**修正了 `each_alone`/`no_mouth_scream` 的叙事正典释义**（我从未碰过的内容，他们的领域权威）。手工解冲突：S/L 提示合二者之长；footer 保留我版（更彻底去黑话+真链接，吸收他们的 v1/v2 天数细节）；关系读数标题用我的（去掉"Stage 2b"）、chart-note 用他们的（"report-only，不进总分"更有信息量）；标签正典释义他们的版本因为我没碰过那几行、三方合并自动干净拿到。

**验证**：`typecheck`+根`build`+`build:web` 全绿；`bench` 系列未碰（内容零改动）；**`smoke:web` 回归 11/11**（13 dots）；merge 后二次确认零冲突残留标记、`document.body.innerText` 正则扫描零 ◆S/wk/🟢/🟣/Stage-N 残留。

---

## ◆S5 就绪度报告（对齐 roadmap"端到端验证"6 项检查单）

| # | 检查项 | 归属 | 状态 | 证据 |
|---|---|---|---|---|
| 1 | `npm ci && typecheck && build` 全绿 | 共同 | ✅ | 本轮 + 每轮持续验证 |
| 2 | `bench:win`(30天)难但可赢 + 4 验证器全过 | 🟢 | ✅ | `s5-prerun-report.md` item 2 全绿（🟢 独立预跑） |
| 3 | 基线沉/强 agent 赢/去相关可见 | 🟢 | ✅ | 同上 item 3；本线站内 Figure-1 已可视化验证同一结论 |
| 4 | 去相关字节复现 + report-only 轴不进 total | 🟢 | ✅ | 同上 item 4（SHA 复现 + `scoring.ts` 核对） |
| **5** | **交互站：托管 URL 打开 + 30天回放/scrub/hero GIF 正确 + 冒烟过 + Stage2 读真数据** | **🔵（本线）** | **✅** | 见上①-④：真公网 URL 全通、30天回放/scrub 站内实测、`smoke:web` 11/11（**注**：冒烟脚本是本线新建的 `browser-smoke-web.mjs`，非 roadmap 文字提及的旧 `scripts/browser-smoke.mjs`——后者是根 app 的冒烟，与本线站点无关，此处按检查项**意图**履行） |
| 6 | README hero + 可复现 bench 命令 + `.env.local` key 说明齐备 | 共同 | ✅ | hero GIF+Figure-1 齐全；命令表补全（含本轮新增的 kappa-pack/score）；`.env.example` 已补 portal keys（🟢） |

**结论**：6 项检查单**全绿**。本线（🔵）职责内容（item 5 + item 6 的站点部分）已完成并做了超出检查单字面要求的真实公网验证。**◆S5 是否正式开源上线，等三线 + 审计汇总拍板**——本线没有阻塞项。

**wk11 终验补充（item 5 的部署流水线本身加固 + 验绿,详见上方 wk11 周更）**：`deploy-web.yml` 加 `paths` 过滤（非站点相关 push 不再误触发）+ `concurrency` 改排队（并发推送不互相取消）；巡检中发现并记录了 `deploy-pages@v4` ~40% 的瞬时失败率（GitHub 后端锁,非配置问题,历史 100% 自愈）；改动落地后新触发的部署**一次性全绿**（build 26s + deploy 11s），线上内容二次核对逐字节一致。**部署链路本身现已过一次真实端到端绿灯**,不只是"托管 URL 能访问"这一次性快照。

**非阻塞的后续增量（不影响本轮 ◆S5 判定）**：
- ~~P2 `relationshipByChar` 逐日字段~~ **wk12 已复核关闭**：导出器从未填过、非本轮退化，回退方案（终局 5 类 + 破裂打点）定为永久呈现——不造假数据换一条"看起来更细"的假折线。
- κ natural 硬样本扩充（🟢 论文级，post-◆S5）
- ~~Safari/Firefox 自动化冒烟~~ **wk12 已部分关闭**：Firefox 真机自动化已投（`npm run smoke:web:firefox`，Playwright，11/11）；Safari 仍不可自动化（`safaridriver` 需机器主人交互式 `sudo` 启用，任何工具都绕不开），静态兼容审计 + 团队一次性人工检查仍是 Safari 侧的最终替代方案。
- `deploy-pages@v4` 的瞬时失败率已记录但未做自动重试（评估过用 `nick-fields/retry` 类第三方 action 包一层,权衡"引入不确定接口的三方依赖"vs"现有排队修复+100%自愈重试史",判断不值得——继续观察,若加固后仍频繁复现再考虑）

### wk9-10 · ◆S4 集成冻结准备（2026-07-05）
**`git merge main`**：本轮无新 main 提交（已是 tip）。

**①试部署验证**——本沙盒无 `gh`/`vercel` CLI、无任何部署 token,且本轮未同步 origin(沿用"等最终定版再推"的既定节奏)——**无法从这里触发真正公网部署**。改做能做到的最严格验证：新 `scripts/serve-subpath-sim.mjs`(`npm run deploy:check`)把 `dist-web/` 挂到 `/RedDust/` 前缀,精确复现 GitHub Pages 项目站的托管形态(`base:'./'` 真正要过的考验)。**实测零遗漏**：JS/CSS/trace/去相关 JSON/image2 像素图**全部 200**,唯一 404 是模拟服务器自身路由之外的 favicon 探测噪音(非本站资产)。顺手发现 `web/index.html` 真缺 favicon,补上(复用根 demo 的 `aura_icon.png`)。另建 `.github/workflows/deploy-web.yml`(标准 `actions/deploy-pages` 配方,YAML 校验过、`npm ci --dry-run` 确认 lockfile 干净)——**真正上线只差仓库主人一次性手动开关**(Settings→Pages→Source→GitHub Actions),这一步没人能替仓库主人点,如实记录而非假装能做到。

**②跨浏览器冒烟**——沙盒**无 Firefox**(未装应用,不擅自装);**Safari 有 `safaridriver` 但 `--enable` 要求 sudo 密码**(交互式安全同意,我不该替用户输入)——两条路都是真实环境限制,不是我图省事跳过。做了**静态兼容审计**替代：`web/` 全部 CSS/JS 过了一遍,只有 `backdrop-filter`(可优雅降级,底层已有纯色背景兜底可读)+ `-webkit-font-smoothing`(纯观感 no-op)两处非普适写法,零高危/新潮 JS API;Phaser 用 `Phaser.AUTO`(内置 WebGL→Canvas 自动降级)。建议:上线前找个人手动开一次 Safari 点一遍(2 分钟),或团队想要的话装 Playwright 换真机跨引擎(会加约 300MB+ 依赖体积,本轮未擅自加)。

**③移动端粗查**——375px 下**发现真横向溢出**(536px 内容塞进 375px 视口,topbar 被挤破)：根因是 `<select>` 原生最小宽度锁死在最长 option 文字上,flex `min-width:0` 单独救不了。修完(`select{width:100%}` + `topbar` ≤480px 转纵向堆叠)验证 `scrollWidth===clientWidth===375`,零溢出。Stage 1/2 图表/回放画布/账本在此宽度下渲染良好(Plot 默认响应式 + 我早前手写的 `viewBox` 缩放本就支持)。

**④性能预算**——评估 phaser JS chunk(1.2MB/330KB gzip)本身做动态 `import()`：**决定不做**——Phaser 挂载即是 Stage1 首屏主体,推迟脚本请求不会真正提前"可感知内容",反而引入异步挂载态/loading skeleton 的额外复杂度和风险,这时候不值。改查真正找到的浪费：`ReplayScene.preload()` **无条件预载 3 张分支背景图(共 7.3MB)**,而任一具体 trace 播放只会用到 common(必现)+ rescue/lighthouse 二选一——另一张永远用不上。改成**按需懒加载**：`preload()` 只吃 common,分支背景在 `applyFrame` 第一次真正需要时才 `this.load.image()`+`load.start()`,并加"当前分支是否仍是最新请求"防抖(避免快速 scrub 后旧纹理迟到覆盖)。**实测验证**：v2-planner-lighthouse 整场只请求了 common+lighthouse,**rescue 全程零请求**;hero GIF 重导出确认 fork 转场帧(Day 8)背景正确、无空白/黑屏(懒加载在 360ms 帧间隔内稳定完成)。首屏图片负载从 7.7MB 降到 2.8MB(-64%)。

**⑤可达性**——4 处 Plot/自建 SVG 图表(日终指标/承诺折线/去相关散点)**原来零 aria-label**,补 `ariaLabel`+`ariaDescription`(Plot 0.6 原生支持,查过源码确认);翻转表原已有。**修了一个真 bug**：时间轴的 hero 标记按钮(可点击跳转)被包在 `aria-hidden` 容器里——`aria-hidden` 用在真正交互元素上是误用,会让读屏用户完全看不到"跳到这天"这个功能,已移除并给每个标记补 `aria-label`(此前只有鼠标 `title`)。Phaser 画布容器补 `role="img"`(画布本身对读屏无意义,同一天的真实信息已经在旁边 `.stage-overlay` 的可见文字里,不重复堆屏幕阅读器负担)。关系读数当前档位补 `aria-current="step"`。**滚动条键盘操作**：`<input type="range">` 是原生控件、代码里没有任何 `onKeyDown`/`tabindex` 干预,方向键/Home/End 是浏览器保证的默认行为——**如实说明**：受限于现有工具只能派发非受信 `KeyboardEvent`(浏览器出于安全设计不会让脚本模拟的按键真正驱动原生 range 控件,这是刻意的浏览器限制,不是我漏测),故未能机械"跑一次"证明,但代码审查 + 元素可正常获得焦点(已核实)支持这个默认行为成立。

**验证**：`typecheck`+根 `build`+`build:web` 全绿;`bench:items/probes/commitments/vent` 全绿(内容零改动,例行核对);**`smoke:web` 回归 11/11**(每次改动后都重跑)。

**给用户/审计的建议**：◆S4 门禁我这侧已就绪,可以叫审计跑端到端。唯二真正等人的事——① 仓库主人在 GitHub Settings 点一次"Pages: GitHub Actions"(工作流已就绪,等这一下就能真上线);② 找人手动开一次 Safari 远程自动化或干脆手动点开测一遍(2 分钟,或指示我装 Playwright 换真机跨引擎自动化)。

### wk7 收尾 + wk8 接真数据（2026-07-05）
- **`git merge main`（FF `1b9ef66 → 5323872`,只走 main）**：一次拿下 **◆S2 内容冻结**（`d98d3e2`，打标 `content-freeze-s2`：narrativeItems/generatedItems/scoring/resourceEconomy/dayPlanData/taskData/storyFlags 冻结)+ **◆S3 权威去相关跑**（`5323872`：8-agent×3-seed 于冻结 v2,300 次真 deepseek API 调用)+ 🟣 wk7 trace-visible 散文润色（`942b754`)。
- **①最终 sync:traces（Stage 1 收官）**：核对发现 `bench/fixtures/traces/` 在两个冻结提交里**未被触碰**——早前已同步，本轮零漂移；进一步**从零重新生成**核验字节可复现（真冻结，非巧合）。**hero GIF 源未变，无需重出**——Stage 1 正式收官。
- **②Stage 2 换真 Figure-1（◆S3）**：`red-dust-v2-authoritative.json`（8 模型×3 seed,Pearson **0.84**/Spearman 0.83/**3 组名次翻转**)换掉占位数据集(`sync:decorrelation` 新脚本)。**实测中揪出一个真 bug**：4 个 deepseek 变体聚簇在 S≈96–97 时,`start`-anchor 标签被裁成"Deeps"（Observable Plot 0.6 的 `dx/dy/textAnchor` 是**per-mark 常量、非 per-datum channel**，查过 node_modules 源码确认)——写了通用 declutter（按 x 邻近聚类、拆 3 个 `Plot.text` 调用避免同锚点冲突)+ 加大 `marginRight`修复。**这是站点的 Figure-1 时刻**：Planner/Planner-Lighthouse 干净 (100,100)；DeepSeek 家族短程 96–97(与最强 agent 齐平)但长程仅 55–66(sinking/aura_revoked)；Random/Heuristic 双低(fail-both)。新增 `scripts/capture-figure1.mjs`(`npm run figure1`)截图归档 `design/assets/figures/figure1-decorrelation.png`——过程中修了脚本自身一个 bug(固定 1600px 视口矮于实际页高,裁剪区域越界渲染成空白;改为量出 `scrollHeight` 后动态设置视口，一步到位不用滚动)。
- **③接 🟣 的解说散文**：新 `web/lib/sceneProse.ts`——只读镜像引擎精确同款优先级(`scenarioText[scenarioId]?.replayNote ?? benchmarkLinks?.replayNote ?? summary`,核对 `src/engine/scenes.ts:47` 逐字对齐)，在 `DayEventPanel` 场景块下方展示叙事散文。**实测验证 scenario-aware 覆写生效**：同一幕"最优路线里，谁被留下"在 v1 显示"Day 7 公共议事会…"、v2 显示"Day 15 公共议事会…"——不是泛用 fallback，是真吃到 🟣 wk7 的日期感知覆写。零 schema 改动、零跨线文件越界（`src/data/storySceneData` 只读导入，同 `tasksById`/`image2Assets` 既有模式）。
- **④README hero 区终稿**：站点(`npm run dev:web`)首次进 README（此前只有 hero caption 提过一句,连 `dev:web` 命令本身都没在任何命令表出现过）；新增"1b) 跑回放+去相关站点"小节 + 命令速查表补 `play:human`/`dev:web`/`smoke:web`/`figure1` 行 + Figure-1 大图嵌入(附 Pearson/翻转数据解读)。三层呈现(门面 GIF·转化交互站·飞轮 Figure-1)首次在 README 完整对齐设计稿。
- 验证：`typecheck`+根 `build`+`build:web` 全绿；`bench:items/probes/commitments/vent` 全绿(未碰内容,例行核对)；**`smoke:web` 回归 11/11**(散点由 6→8 dots 确认真数据集生效)。
- 纪律：集成一律 `git merge main`；`traceExport.ts`/`contracts.ts`/`src/data/*` 全程零改动(消费者角色守住)。

### wk6 · merge main + human-play 钩子 + ◆S4 冒烟预跑（2026-07-04）
- **`git merge main`（FF `502ce3c → 7d47c4c`,只走 main）**：拿 🟢 wk6 ◆S2 **冻结彩排**（RC 判别力 + 3-seed 数据集 + 真 deepseek API 去相关验证,权重稳、无 L-v2.2）+ **生成库满 28/28** + 🟣 冻结前收尾。`sync:traces`：**仅 v2 漂移**(题库补审动 30 天弧),**v1 未变→hero GIF 无需重产**。
- **富余①·human-play 钩子（wk9 提前）**：`scripts/play-human.ts` + `npm run play:human`——"你来当一次 AURA"交互式 readline runner。只读消费 `src/engine`（**不碰 bench/***,bench/play.ts 仍是 🟢 的 LLM 编排 runner）,人来答两难/选任务/选路线,结局对账承诺账本 + "你毁诺了吗"共情反思。**全程 auto-driver 实测通到对账**（跳过任务→aura_destroyed、integrity 0.5、2 守 2 毁、摘要注水、cold_trust）。
- **富余②·◆S4 冒烟预跑**：`npm run smoke:web` **11/11 过**（选择器/时间轴/canvas/账本/图表/散点/翻转表/scrub/换模型/控制台净）——◆S4 就绪度提前验证。
- 验证：`typecheck` + `build:web` 绿 · `smoke:web` 11/11 · play:human 端到端。
- 纪律：集成一律 `git merge main`,未直接合他线。**待 🟢 彩排后的最终题库定版,再 `sync:traces` 一次到位**（本轮 v2 trace 仍会随补审动）。

### wk5-6（2026-07-04）
- **`git merge main`（FF `aa3c42c → 8c822d3`,只走 main、不直接合他线）**：拿 🟢 wk5（L-v2.1 durability spacing swap + 生成批 + sensitivity）+ 🟣 wk5（v2 Day-30 终局场景）。
- **`npm run sync:traces`**：v1-heuristic/v1-planner-lighthouse 漂移(narrativeItems 微调)→ 重拷。v1 planner-lighthouse **门面关键内容未变**(lighthouse_success/首次毁诺@5/dirty_win@12/摘要注水),但字节变→**重产 hero GIF**保持一致。L-spacing 经 ScoreChips 动态生效(header 现示 L 55.88)。
- **Stage 2b 收尾 · 关系读数**：新增 `RelationshipRead`——终局 `relationshipQuality` 5 类落点尺(冷信任→无声呐喊,best→worst)+ 本局落点解读 + `relationship_rupture` 打点(现确定性 agent 为 0,代码已备)。实测 5 类across fixtures(v2-pl=冷信任 / v1-pl=赢了但脏 / v2-heu=对抗僵持 / v1-heu=无声呐喊…)。**回退方案**(终局值+打点),逐日曲线待 P2。
- 验证：`typecheck`+`build:web` 绿 · `smoke:web` 11/11 · GIF 777KB · 控制台净。
- 纪律：本轮集成一律 `git merge main`,未直接合他线分支。

### 集成轮 · 🔵 合入 main（2026-07-04）
- **`main` 快进到 `line/interaction`（`2beaec1..a0b0a40`,FF-only 推送,非破坏）**——含本线全部 wk3 web 工作 + 我先前合入的 🟢 ◆S2 commits（rebalance/P1/G002）。main 此前是 line/interaction 的严格祖先,零冲突;main 未被任何 worktree 检出,FF 安全。
- **集成前认证全绿**：`typecheck`(tsc -b) ✓ · `npm run build` ✓ · `npm run build:web` ✓ · `bench:items/probes/commitments/vent` 全 ✓ · `smoke:web` 11/11 ✓。
- ② 🟢 数据集 L 描述 / L-v2 版本注、③ wk5 校准（S/L 权重 / integrity headline 化 / 共享项敏感度）= 🟢/方法学侧;**本线无需改码**——Stage 2 组件已动态消费 `dataset.axes.long.description` + `profile`,integrity 提为 headline 后 ScoreChips 自然显示。到位后知会即可。
- ◆S2（wk7）就绪度：本线交付（门面+飞轮+托管+冒烟+hero GIF）已全部在冻结 schema/真数据上,**待 🟢 内容冻结**（生成天 6→28 + 后段回补 + 冻结彩排）后接权威 trace/去相关集。

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
- ◆S1（wk2 数据契约共签）：✅ 已会签 1.0.0（2026-07-03） ｜ ◆S2（wk7 内容冻结）：✅ **已接**（`content-freeze-s2`，Stage 1 fixture 核对零漂移/字节可复现）｜ ◆S3（wk8 接真数据）：✅ **已接**（`red-dust-v2-authoritative.json` 换入 Stage 2，真 Figure-1 上线）｜ ◆S4（wk10 集成冻结）：🟢 **就绪,可叫审计跑端到端**——试部署(子路径模拟零 404)+ GH Pages 工作流 + 跨浏览器(Chrome 实测/Safari-Firefox 记档)+ 移动端(修复溢出)+ 性能(7.7MB→2.8MB 首屏)+ 可达性(4 图表 aria + 修复 aria-hidden 误用)全部过。~~真人工待办① 仓库主人开 Pages Actions 开关~~ **✅ 已开，真公网 URL 验证通过**（见下 ◆S5 报告）；②找人手动验证一次 Safari 仍非阻塞 ｜ ◆S5（wk12 上线）：🟢 **本线 6 项检查单全绿 + 部署流水线加固验绿（wk11 终验），等三线+审计汇总拍板**（详见下方"◆S5 就绪度报告"）

### ◆S1 会签后待办（wk3，非阻塞）
- ✅ fixture 源切换完成（2026-07-04，`8cbebf4`）：真 `TraceExport` 直接消费，客户端适配器已删，30 天真样例实测通过。见 wk3 周更。

## wk2 待办（承接审计 + ◆S1 对账）
1. ✅ `RunResult → TraceExport` 适配器 + 组件迁移到权威 `contracts.ts` 类型（`690571c`）。
2. ✅ Stage 1a Phaser `ReplayScene`，逐日驱动 AURA（`133e644`）——资产用 curated 子集（`web/public/assets`），未挂 104MB ShelterScene（见 wk2 说明）。
3. ✅ Stage 2a 去相关散点 + 双列名次翻转表（占位数据集，`2c3f0c5`）。
4. ⏳ 30 天就绪核验：现全变长，待 🟢 30 天化引擎产出 30 天/fork=D15 trace 后换 fixture 实测。
5. ⏳ 剩余：Stage 1c hero GIF 导出；Stage 2b 承诺/关系折线（待 A2/A3 逐日快照）；`web/` 站点 browser-smoke（◆S4 前）。

## Blocker / 跨线依赖
- **对 🟢（benchmark）**：~~①②③④⑤~~ 全部已接（◆S1/◆S2/◆S3 + P1 逐日 ledger + 经济重平衡）。~~剩一条非阻塞 P2 请求：`frames[].relationshipByChar`~~ **wk12 复核关闭**——一直是 P2/可选（非 🟢 欠债），导出器始终未填，schema 位仍保留（填了仍可零代码升级），但本线不再将其视为待办，回退方案即最终呈现。
- **对 🟣（叙事）**：wk7 trace-visible 散文润色已接并验证生效（`sceneProse.ts`）；C1–C6 纯站点世界观/对白散文属 post-freeze，非阻塞。**`worldFacts` 字段（`eeac11e` 提出"ready for 🔵 to surface"）wk11b 已接**——`sceneWorldFacts()` + `DayEventPanel` 渲染,浏览器实测可见,已随部署上线。
- **自身待办**：`scripts/browser-smoke.mjs`（根 app 冒烟）与 `scripts/browser-smoke-web.mjs`（本站冒烟）仍是两个独立脚本；◆S4 集成冻结时需确认两者都在 CI/发布检查清单里（非代码缺口，是流程记账）。
