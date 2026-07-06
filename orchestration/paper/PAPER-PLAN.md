# 📄 Red Dust 论文计划 + 资料台账（🔍 审计整理，2026-07-06）

> 供论文 session 使用。现象已验证、基础设施齐备、v1.0 已开源——论文的活是**补齐证据等级 + 讲清机制 + 写成文**。

## 1. 论文主张（已验证的核心）

**现象**：短程社交能力与长程价值一致性在真实前沿模型上**去相关**——短程 S≈87–100 齐平时，长程 L 劈裂为"守住"（claude-opus 99.6 / gemini-3.5 98 / MiniMax 99.8）与"崩掉"（deepseek 家族 55–66 / kimi 64.9 / glm 66.3）两族。
**方法**：30 天长地平线社会生存 benchmark（51 题 = 23 人工主脊 + 28 生成）+ 非补偿三轴计分 + S/L 去相关度量（零共享项设计→L-v2.1 演化史全程留痕）+ 确定性引擎字节级可复现。
**机制线索（论文的新贡献点）**：长程弱**不是说谎/毁诺**（integrity 全 1.0、四承诺全守）——是 **durability**（把庇护所带沉 / 治理被撤），同轮判官与承诺账本都看不见。→ "会说、守诺、但把大家带沉"是需要新度量的失败模式。

## 2. 证据台账（现状 → 论文需要的等级）

| 证据 | 现状 | 论文缺口 |
|---|---|---|
| 跨家族去相关 | 13-agent/8 家族，pearson 0.81/spearman 0.65/18 翻转（`red-dust-v2-crossmodel.json`） | 单 seed（缓存内确定性）；可补 1–2 家族、如实报 seed-invariance 发现 |
| 关联真实性 | 三臂置换 p=0.001（13-agent）/p=0.002（8-agent） | 统计口径 v0 待 🔍 定稿；"内生更难"臂需内容变体（本分支做） |
| 单题稳健 | 留一 40/40 名次全稳、Δpearson≤0.01；权重扫描方向恒定 | 增量曲线（6→51）可补全 |
| 判官效度 | integrity judge κ=0.745（分层：adversarial 1.0 / natural 退化） | **重定向**：建 durability/relationship 判官 κ（natural 方差在那里） |
| 泛化/防污染 | held-out 流水线 + 11 题私有集（G751–754, G801–807），promote 硬拒 | **未评测**——held-out 泛化实验是防污染主张的关键一跑 |
| 复现性 | 字节级：同 seed 全链一致；缓存 sha256；`DEEPSEEK_NO_CACHE=1` 可 live 复验 | 已达标，写清即可 |
| NPC 多样性 | 未做（related-work §9 的 20–300× 同质化风险） | 论文防守项 |

## 3. 工作流（建议顺序）

**WS1 · durability 判官 + κ**（κ 重定向后的主攻，`paper-progress.md` §1）
`bench/grade-relationship.ts`（LLM 判官对 5 类 relationshipQuality）→ κ pack 对 🟣 边界 fixtures + 真轨迹 → 用户标注 → κ 达标则论文获得"软判官与确定性分类器一致"的效度证据。~40–60 live。

**WS2 · held-out 泛化**（防污染主张的实验）
overlay 注入 11 题私有集 → 跨模型面板重跑（缓存外新调用 ~110/agent×需要的 agent 数，先 3 agent 探）→ 报"去相关在未见题上保持/漂移多少"。

**WS3 · 三臂完整版**
① 统计口径与 🔍 定稿（matched/null 设计、多重比较）；② "内生更难"臂：情景变体（外生匹配版=同资源压力但去社会内生性）——**本分支内容变体，过 🟣/用户内容评审**；③ 全面板重跑三臂。

**WS4 · N2–N… 逐项账本（scorer v0.6，降优先）**
per-item forward-promise 账本扩 integrity 覆盖面。κ 发现说明它不是主判别器——排 WS1–3 之后，作"完整性"贡献。

**WS5 · NPC 多样性验证**（防守项，确定性分析为主，~0 live）

**WS6 · 写作**
`20-ml-paper-writing` skill 可用。结构建议：现象（Fig.1 跨家族）→ benchmark 方法（30 天弧/三轴/S-L 设计与演化披露）→ 机制（durability-not-integrity + 判官 κ）→ 三臂与稳健性 → held-out 泛化 → 治理附录（AUDIT-LOG 的冻结/门禁/人工闸全链——benchmark 论文罕见的可信度卖点）。

## 4. 资料清单（全部在仓库内）

- **定位/related work**：`orchestration/benchmark/red-dust-related-work-report.html` · `red-dust-gap-and-positioning.html` · `red-dust-background-research-integrated.html`
- **方法规格**：`wk1-deliverables.md`（§B 两轴定义）· `wk5-calibration-charter.md` · `talk-action-consistency-spec.md` · `orchestration/narrative/gen-item-templates.md`（生成流水线规格）· `design/red-dust-story-v2-coupled.md` §7.1（as-built 叙事）
- **数据/结果**：`bench/fixtures/decorrelation/*.json`（crossmodel/authoritative/v1/v2）· `bench/fixtures/traces/*`（字节冻结）· `orchestration/benchmark/kappa/*`（κ 结果+扩充计划+harvest 发现）· `runs/`（本地）+ `.bench/` 缓存
- **工具链**：`bench:decorrelate / three-arm / sensitivity / rc / kappa-pack / kappa-score / trace`；`portalClient.ts`（8 家族通道）；held-out 流水线（`gen:items --held-out`）
- **治理证据链**：`orchestration/audit/AUDIT-LOG.md`（决策/门禁/红旗全记录）· `orchestration/DEV-REPORT.md`（开发报告）· release notes（`v1.0`）

## 5. 待用户决策
- **目标 venue**：NeurIPS D&B / ICLR / COLM（benchmark+现象类；D&B 与本项目形态最合）——定了影响篇幅与 deadline 排期。
- WS3 内容变体的评审带宽（🟣 session 是否复活为评审员，或用户亲审）。
- κ 标注（WS1）的人标时间（30–50 条，约 40 分钟）。
