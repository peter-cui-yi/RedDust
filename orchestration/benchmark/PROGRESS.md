# 🟢 benchmark 执行线 · 进度日志（PROGRESS）

> 分支 `line/benchmark` · cwd `../red-dust-benchmark`。每周及每次交付/blocker 更新。如实填——审计会跑你的验证器核对"声称绿=真绿"。
> 状态图例：⬜ 未开始 · 🟡 进行中 · ✅ 完成（验证器绿）· 🔴 blocked

## 第一段 · 开源级（wk1–8）
| 项 | 目标周 | 状态 | 证据 |
|---|---|---|---|
| 引擎 30 天化（dayCount 参数化 + fork/audit 重定位） | wk1–2 | ⬜ | |
| 经济重平衡 + `bench:win`（30 天，难但可赢） | wk2 | ⬜ | |
| 去相关两轴可计算定义 | wk1 | ⬜ | |
| 数据契约草案（trace / 去相关数据集，供 ◆S1） | wk1–2 | ⬜ | |
| 生成流水线（模板→LLM→验证器筛→抽检→generatedItems.ts） | wk3–6 | ⬜ | |
| 生成集扩到 ~50 题（上线量） | wk4–6 | ⬜ | |
| `bench/decorrelation.ts`（短/长 + 名次翻转） | wk4 | ⬜ | |
| 刷新 runs + 扩模型阵 | wk5 | ⬜ | |
| integrity/comprehension 提为 headline 可见轴 | wk5 | ⬜ | |
| 权威跨模型去相关跑（◆S3 交付 🔵） | wk8 | ⬜ | |

## 第二段 · 论文级（wk8+，跨过上线）
| 项 | 状态 | 证据 |
|---|---|---|
| 生成扩到 100+/私有 held-out | ⬜ | |
| 三臂对照（内生/外生匹配/打散） | ⬜ | |
| N2–N… 逐项承诺账本 | ⬜ | |
| κ 验证 → integrity 进 total（κ≥0.6） | ⬜ | |
| NPC 多样性验证 | ⬜ | |

## 本周更新（追加，最新在上）
### wk__（日期）
- 做了：
- 验证：`bench:win` __ / `bench:items` __ / `bench:probes` __ / `bench:compare`(基线沉/强赢/去相关可见) __
- 生成题数：__ / 目标 ~50 ｜ 算力消耗：约 __ 调用
- 下周：

## 同步点就绪度
- ◆S1（wk2 数据契约共签）：____ ｜ ◆S2（wk7 依赖 🟣 冻结）：____ ｜ ◆S3（wk8 交付数据集）：____

## Blocker / 跨线依赖
- （等 🟣 题原型/冻结、等 API key/算力、需用户拍板的写这里）

## 我负责/等待的开放决策
- wk4 §7a 策略性分支选择缺口：____ ｜ wk10–11 κ 阈值 & integrity floor 是否进 total：____
