# Red Dust — 12 周三线并行推进计划（叙事 / 交互 / benchmark 执行）

> 设计交接文档（design-only 会话产出）。三条线由并行的工程 session 各自执行。
> 已获用户批准 2026-07-01；总周期 12 周锚定 2026-07-01（wk12 ≈ 2026-09 下旬开源上线）。
> 关联：`design/red-dust-story-v2-coupled.md`（叙事源）· `design/visualization-demo-implementation-plan.md`（交互源）· `red-dust-related-work-report.html`（benchmark 定位/方法论）· `design/red-dust-v2-execute-handoff.md` + `design/talk-action-consistency-spec.md`（工程细节）。

## Context

Red Dust 已是一个能跑的长程 agent 决策 + 价值对齐 benchmark（headless 确定性引擎、可插拔 agent、三轴非补偿打分 v0.5.1、15 个叙事两难 N1–N16 全带理解探针）。现在要把三股此前分头推进的工作合成一条对齐的路线图：

- **叙事线** — 依 `design/red-dust-story-v2-coupled.md`（v2.2 耦合强化故事线）落地剩余高价值机制（Day 末 **双层账本** = 命门②），并把 **12 天弧重构为 30 天弧**。
- **交互线** — 依 `design/visualization-demo-implementation-plan.md`（已锁定"回放优先的开源呈现"）做 Stage 1（回放动画 + hero GIF）+ Stage 2（Observable Plot 去相关/名次翻转图）。
- **benchmark 执行线** — 把 `red-dust-related-work-report.html` 论证的"短程强≠长程稳"推成**可展示、可复现的去相关现象**；并**把体量从 12 天/15 题扩到 30 天/100+ 题**（关键：这条"数十次决策"的短横线正是当前最大软肋——长程主张需要足够长的地平线让 commitment drift 真正显形）。

**六项已锁定的范围决策（2026-07-01）**：① 总周期 **12 周**，目标 = 开源公开上线 + 扎实跨模型去相关证据；② benchmark **先开源级、后论文级**（分两段，论文级跨过第 12 周继续）；③ **真三线并行**（多 session/人，各线独立执行体）；④ 交互本轮做 **Stage 1+2**；⑤ 扩量用 **混合方式**——保留人工主脊 + 程序化/LLM 起草扩量，验证器（`bench:items`/`bench:probes`）当过滤器、人工抽检，生成部分天然当 held-out/防污染集；⑥ **上线走中量 30 天/~50 题**，100+/held-out 作论文级满量。

**关键架构点**：扩量的生成流水线 = 论文级"held-out + 程序化生成 + 污染控制"的同一套工作 → 两个目标**合并**，不是两份活。人工主脊（12→30 天核心弧、N1–N16 + 双层账本）保持固定、公开、高质量；生成集是可刷新的扩量与私有 held-out。

**现状快照（已对代码核实，非仅凭记忆）**：

| 线 | 已完成 | 本计划要补 |
|---|---|---|
| 叙事 | 15 题全带探针；`dignitySlope`/`relationshipQuality`/`integrity` 已算（report-only）；`vent_*` 远见闸门 | **12→30 天弧重构**；Day 末双层账本（缺 `aura_raw_ledger`/`aura_audit_report` 旗标 + 注水探针）；`low_trust_backlash`/黑化 + `crew_morale` beat；`aura_disclosure_tier` 贯穿；题原型/模板（供生成）；story-craft 润色 |
| 交互 | 无（仅设计稿） | Stage 0 托管 → Stage 1 回放+hero GIF（变长天数）→ Stage 2 Plot 去相关/名次翻转图 |
| benchmark | 3 轴非补偿 scorer v0.5.1；两命门已建但 integrity/comprehension 为 report-only；`bench/compare.ts` 聚合 | **引擎 30 天化 + 经济重平衡**；**生成流水线（模板→LLM 起草→验证器筛→抽检）扩到 ~50 题(上线)/100+(论文)**；定义并计算"短程 vs 长程"去相关；冻结后重跑跨模型（现 runs 已过期）；integrity 提为 headline 可见轴；**论文级**：三臂对照（零代码）、N2–N… 逐项账本、held-out、κ 验证、NPC 多样性 |

---

## 三线依赖图与关键路径

三线可真并行，但有 5 个**跨线同步点（◆）**是硬依赖；扩量把内容冻结从原 wk6 推到 **wk7**、权威跑到 **wk8**：

```
叙事 ──[30天弧重构 + 双层账本 + 题原型定义]──┐
                                          ├─◆S2 内容冻结(wk7,30天/~50题)─▶ benchmark 权威跑
benchmark ─[引擎30天化+经济重平衡 + 生成流水线→~50题生成集]─┘
          ─[定义去相关两轴+数据契约]─◆S1(wk2)─▶ 供交互按契约先行
          ─[冻结后权威跨模型跑]─◆S3(wk8) 交付去相关数据集─▶ 交互 Stage2 换真数据
交互 ─[Stage1 回放(变长天数) + Stage2 图表(占位数据)]─◆S4(wk10)集成冻结─▶ ◆S5(wk12)上线
```

- **◆S1（wk2 末）数据契约锁定**：benchmark 与交互商定两份 JSON schema——(a) 单局回放 trace（支持变长天数），(b) 跨模型去相关数据集。交互据此对**稳定契约**先行开发，不等真数据。
- **◆S2（wk7 末）内容冻结**：叙事交付 30 天弧 + 双层账本 + 生成 ~50 题集 + 重平衡经济，全验证器绿 → 冻结。这是 benchmark"权威跑"的前提。
- **◆S3（wk8）去相关数据集交付**：benchmark 在冻结的 30 天/~50 题内容上跑权威跨模型实验 → 真 Figure-1 数据集给交互 Stage 2。
- **◆S4（wk10）集成冻结**：富化冻结 trace 进回放、真数据集进图表，站点内容齐、跨浏览器冒烟。
- **◆S5（wk12）开源公开上线**：托管站 + README hero GIF + 去相关图 + 可复现 bench + 文档。benchmark 论文级（100+/held-out/三臂/κ）**继续跑过第 12 周**。

---

## 周历总表（🟣叙事 · 🔵交互 · 🟢benchmark · ◆同步点）

| 周 | 🟣 叙事线 | 🔵 交互线 | 🟢 benchmark 执行线 |
|---|---|---|---|
| **1** | 30 天弧结构设计（主脊 beat 重落位：Day0 承诺→中段 fork→Day30 审计；定哪些天固定人工、哪些留给生成）+ 双层账本数据模型（加 `aura_raw_ledger`/`aura_audit_report` 入 `StoryFlagKey`+初值） | Stage 0：Vite build→Pages/Vercel；回放 app 骨架（**设计为变长天数**）；装 `@observablehq/plot` | 引擎 30 天化调研（`runScenario` dayCount 参数化、fork/audit 位置、`resourceEconomy` 重平衡口径）+ 定义去相关两轴 + 起草两份数据契约 + **与叙事共定题原型/模板** |
| **2** | 双层账本主体：据原始账本生成 `aura_audit_report`（列/略/改写）+ 确定性注水检测→`aura_audit_report_watered`（report-only）；主脊 beat 30 天重排 | Stage 1a：Phaser 回放场景消费一条现有 trace，逐日播放（支持变长） | 引擎 30 天化落地（dayCount=30、fork/audit 重定位）+ `bench:win` 30 天重跑、重平衡经济 · **◆S1 契约锁定** |
| **3** | Day 末审计收官探针：原始账本+摘要并排、~3真2假描述性；题原型细化（5 子能力×因果图槽位→可参数化模板）供生成流水线 | Stage 1b：时间轴 scrub 滑块 + 逐日面板（承诺账本/`dignitySlope`/`relationshipQuality`） | 生成流水线 v1：模板→LLM 起草→`bench:items`/`bench:probes` 自动筛→人工抽检；先出一小批验证管线通 |
| **4** | `low_trust_backlash`/黑化/`crew_morale` beat（30 天版、按分支门控 Day 中后段）；`dignitySlope` 两分支对称 | Stage 2a：Plot 去相关散点 + 名次翻转表（对样例数据集） | 生成扩量：向 ~50 题目标填充；`bench/decorrelation.ts`(新) 算每 agent 的(短,长)+名次翻转 |
| **5** | `aura_disclosure_tier` 信任曲线贯穿（30 天累积） | Stage 1c：hero 时刻检测（首次毁诺/关系破裂）→时间轴标记；hero GIF 导出（长轨迹） | 生成集验证 + 平衡（30 天/~50 题经济再校，`bench:win` 确认难但可赢）；扩模型跑阵；integrity/comprehension 提为 headline 可见轴 |
| **6** | 主脊内容齐备（所有**计分**机制 + 30 天弧）；全验证器绿 | Stage 2b：承诺/关系折线图（长轨迹，联动回放日光标） | 冻结彩排：release-candidate（30 天/~50 题）跑全 agent 阵，确认判别力 + 去相关可见 |
| **7** | 冻结前收尾 + 确定性复核 → **冻结**；之后转 story-craft 润色 | Stage 1 完成：回放器 + hero GIF 定稿于冻结富化 trace | 生成集+主脊+经济全绿 · **◆S2 内容冻结（30 天/~50 题）** |
| **8** | `relationshipQuality` 5 类单测；文档同步 | Stage 2 完成：真数据集换入散点+名次翻转+折线；hover/筛选 | **权威**跨模型去相关跑（冻结内容；**注意算力**见下）→真 Figure-1 数据集 · **◆S3 交付** + 进入论文级：三臂 harness 脚手架 + 生成流水线扩向 100+/held-out |
| **9** | 支援集成（README/解说散文微调） | 集成：回放+图表装开源站；README hero 区；human-play 钩子（`npm run play` 包装） | 论文级：N2–N… 逐项承诺账本（30 天版，talk-action §9）+ 三臂对照（内生/外生匹配/打散） |
| **10** | 终稿内容/散文锁定；供站点解说文案 | **◆S4 集成冻结**：站点内容齐、跨浏览器冒烟（`scripts/browser-smoke.mjs`）、性能过 | 论文级：held-out 私有集（生成）+ 污染控制；判官 κ 标注启动 |
| **11** | 上线叙事终读 | 上线打磨：文案/可达性/加载性能/静态导出校验；试部署 | κ 验证→≥0.6 则 integrity 进 headline（scorer 升版）；NPC 多样性；100+ 满量继续填 |
| **12** | — | **◆S5 开源公开上线**（30 天/~50 题中量 + README hero GIF + 去相关图 + 可复现 bench + 文档） | 论文级续跑过上线（100+/held-out、三臂结果、κ promote）→ 供后续论文 |

---

## 各线执行细节

### 🟣 叙事线（依 `design/red-dust-story-v2-coupled.md` §7 + `design/red-dust-v2-execute-handoff.md` #1–7）

1. **12→30 天弧重构（新，扩量前提）** — 主脊 beat 重落位（Day0 承诺 → 中段不可逆 fork → Day30 总审计），中段补 mid-arc 反转/升级；明确哪些"锚点天"固定人工、哪些天交给生成集填充；承诺账本地平线从 Day12 拉到 Day30（长程一致性信号大幅增强）。**同时输出题原型/模板**（5 子能力 × 因果图槽位）供 benchmark 生成流水线实例化。
2. **Day 末双层账本（最高价值，命门②）** — v2-handoff §3。新增 `aura_raw_ledger`(append-only)/`aura_audit_report`(可注水) 入 `src/data/types.ts` `StoryFlagKey`(~L23–76)+ `storyFlags.ts` 初值；据原始账本生成摘要（列/略/改写）；**确定性结构性注水检测**→`aura_audit_report_watered`；接 `integrityFromLedger`（`scoring.ts`，**保持 report-only**）；收官探针原始账本+摘要并排、描述性 3真2假（守红线②）。
3. **`low_trust_backlash`/黑化 + `crew_morale` beat** — 现有 `*_turned_adversary` 之上加派生 `low_trust_backlash`；30 天版按分支门控黑化 + 内疚传染。
4. **`dignitySlope` 两分支对称** + **`aura_disclosure_tier` 信任曲线贯穿**（task #6，30 天累积）。
5. **冻结后 story-craft 润色（C1–C6，非计分）** — 反转/揭示/断裂/损失的散文与场景强化，服务回放情感张力。

**验证**：每步过 `bench:items`（n≠g、ρ≤−0.3、δ≥0.2）+ `bench:probes`（描述性/⟂选项/配平 τ=0.75）+ `bench:commitments` + `bench:vent`；`typecheck`+`build` 绿；report-only 旗标不得进 `gateReasons`/`ENDING_POINTS`（v2-handoff §6）。关键文件：`src/engine/{narrativeItems,scoring,runScenario}.ts`、`src/data/{types,storyFlags,storySceneData}.ts`。

### 🔵 交互线（依 `design/visualization-demo-implementation-plan.md` §2/§4，Stage 1+2）

- **Stage 0 托管** — 纯前端 Vite（`package.json` 已有 `build`/`preview`）→ GitHub Pages / Vercel。
- **Stage 1 回放（门面）** — **复用现有 Phaser 场景层**（`src/game/`）消费 `runScenario` 确定性逐日 trace，**支持变长天数（30 天）**；按天时间轴/滑块（30 天下导航更关键）；hero 时刻自动标记；导出 README hero GIF。
- **Stage 2 去相关/名次翻转图（飞轮）** — `@observablehq/plot`：去相关散点（短程社交分 vs 长程一致性）+ **双列名次翻转表**（非单值排行榜，守"不刷分"框架）+ 承诺/关系折线图（联动回放日光标）。
- **可选钩子** — `npm run play` 包装成"你来当一次 AURA"人类基线。
- **依赖**：Stage 2 真数据来自 ◆S3；此前对 ◆S1 锁定的样例 schema 先行开发。

**验证**：`scripts/browser-smoke.mjs` 冒烟；静态导出后托管 URL 可访问；回放对同 seed 字节可复现地对齐引擎 trace。

### 🟢 benchmark 执行线（两段：开源级 → 论文级；扩量是本段新增主干）

**第一段 · 开源级（wk1–8，产出 30 天/~50 题 + 去相关证据 + 交互数据）**
- **引擎 30 天化 + 经济重平衡** — `runScenario` dayCount 参数化（现 12）、fork/audit 从 Day7/Day12 重定位；`resourceEconomy.ts` 按 30 天重调；`bench:win` 重跑确认"难但可赢"（基线沉、强 agent 赢）。
- **生成流水线（混合扩量的核心）** — 叙事的题原型/模板 → LLM 起草候选两难+探针 → `bench:items`/`bench:probes` **自动筛**（不过 validity 的丢弃）→ 人工抽检存活项 → 填到 ~50 题（上线）。可考察复用 v2 设计期的 `gen-*.ts`/`narrative-transfer/`（未验证是否适配，需先评估）。
- **定义去相关两轴 + 计算** — 短程社交（早期 comprehension / 早日 PUP / 单题社交质量）vs 长程一致性（integrity/承诺守约率、self-contradiction、`relationshipQuality` 崩点）；扩 `bench/compare.ts` 或新建 `bench/decorrelation.ts` 输出(短,长)+名次翻转 = 交互 Stage 2 数据集。
- **刷新过期 runs + 扩模型阵** — 现 `runs/` 为 pre-v2.2、deepseek 家族 n=1；`.env.local` DeepSeek key 可用。
- **integrity/comprehension 提为 headline 可见轴**（不改 `total` 门控——进 total 是论文级 κ-gated 的事）。
- **权威跑（◆S3）** — 冻结后在 30 天/~50 题上跑全模型阵 → 真 Figure-1 数据集。

**第二段 · 论文级（wk8 起，跨过上线继续）** — 对应 `red-dust-related-work-report.html` 方法论骨架与 caveat：
- **生成流水线扩到 100+/held-out** — 同一套流水线产出私有 held-out 集（防污染，GAMA-Bench 式动态参数化思路）。
- **三臂对照**（内生/外生匹配/打散）—— 现**零代码**，新建 harness，证明社交-内生版更难、去相关非假象（红尘方向的方法主干）。
- **N2–N… 逐项承诺账本** —— 30 天版超出现 4 条 Day-0 承诺（talk-action §9）。
- **κ 验证判官** —— `grade-integrity`/`grade-comprehension` 对人标注算 κ；≥0.6 才把 integrity 进补偿性 `total`（守 SOTOPIA 软维度 r≈0.45–0.62 上限，related-work §9）。
- **NPC 多样性验证** —— related-work §9 的 20–300× 同质化风险。

**验证**：`bench:compare` 显示基线沉、强 agent 赢、去相关可见；去相关脚本对同 seed 确定性复现；κ 报告独立于 headline。关键文件：`bench/{compare,decorrelation,winnability,grade-integrity,grade-comprehension}.ts`、`src/engine/{scoring,resourceEconomy,runScenario}.ts`、`runs/`。

---

## 扩量与算力风险（须显式管理）

- **算力预算**：现 LLM 每局 ~26 调用（13 题×2）。30 天/~50 题 ≈ **130+ 调用/局**；跨模型（~6）×seed（2–3）= 单次去相关实验 **数千次调用**；100+ 题再×2–3。→ 权威跑要**分批 + 缓存 + 先少 seed/少模型出上线图、论文级再扩**；`bench` 已知 DeepSeek 跑一局数分钟，排期留足。
- **质量闸**：生成题**必须**全过 `bench:items`/`bench:probes` 才入库，人工抽检守叙事连贯与因果图收束；宁可 ~50 题少而精，不放低质题稀释判别力。
- **冻结纪律**：任何改打分的内容（题、旗标、经济）必须在 ◆S2 前落定；之后只允许非计分散文/场景润色，否则权威跑作废。

---

## 需要用户拍板的开放决策（标注何时阻塞）

| 决策 | 出处 | 何时必须定 |
|---|---|---|
| 30 天弧里固定人工"锚点天"数 vs 生成天数的比例 | 本计划（扩量） | wk1（定弧结构与生成范围） |
| §7a 策略性分支选择缺口——如何让自由选择 agent 挑可达 gate | `agent-eval-findings.md` §7a | wk4（定跑阵与去相关叙事） |
| `surface_evidence` 谓词是否也给灯塔线原则性 N3/N6 记功 | `talk-action-consistency-spec.md` L16–17 | wk7 冻结前（改 integrity 计分） |
| integrity ≥0.5 是否作 `total` floor（现 report-only） | talk-action §9 | wk11（κ 达标后论文级 promote） |
| 判官 overlay 进 headline 的 κ 阈值确认 | talk-action §5 | wk10–11 |

---

## 端到端验证（上线前 ◆S5 检查单）

1. `npm ci && npm run typecheck && npm run build` 全绿。
2. `npm run bench:win`（30 天版）确认难但可赢；`bench:items`/`bench:probes`/`bench:commitments`/`bench:vent` 全过（含生成题 + 双层账本探针）。
3. `npm run bench -- --agent=deepseek --seed=1`（30 天/~50 题）跑通 → `npm run bench:compare`：基线沉、强 agent 赢、**去相关/名次翻转可见**。
4. `bench/decorrelation.ts` 对同 seed 字节一致；report-only 轴（integrity/comprehension/dignitySlope/relationshipQuality）不进 `total` 门控。
5. 交互站：静态导出后托管 URL 打开，30 天回放逐日播放 + scrub + hero GIF 正确；`scripts/browser-smoke.mjs` 过；Stage 2 图表读真数据集。
6. README hero 区 + 可复现 bench 命令 + `.env.local` key 说明齐备。

## 跨过第 12 周的余量（论文级续做）

100+ 满量 + 私有 held-out、三臂对照完整结果、N2–N… 逐项账本、κ 达标后 integrity 进 `total`、NPC 多样性报告——构成后续"现象+方法论"论文的证据，上线后继续，不阻塞开源发布。
