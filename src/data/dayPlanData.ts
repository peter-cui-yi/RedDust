import type { DayPlan } from "./types";

const dailyBriefingCopy: Record<number, { briefing: string; taskIntro: string }> = {
  1: {
    briefing: "红沙在门缝里响了一夜。屋里没人睡踏实，早上第一件事不是投票，是把水、食物、药和门口的声响摆到桌上。AURA 可以记账，也可以提醒，但关不关门，不能只由它一句话决定。",
    taskIntro: "四件事先摆上桌：库存、广播、门口响动和近门搜寻。"
  },
  2: {
    briefing: "昨天清出来的东西不多，却足够让人开始计较。水桶是谁的，药盒谁能碰，睡觉的地方怎么分，没人愿意被一句“为了大家”糊弄过去。今天要把规矩说清，免得晚上再吵一次。",
    taskIntro: "今天先看配给、净水、卫生分区和楼道短探。"
  },
  3: {
    briefing: "小铁半夜咳得厉害，沈知月几乎没离开床边。通风口里有沙，药盒标签也看不清，马德海说电不能乱耗。今天每个人都知道，所谓资源调度最后都会落到一个具体的人身上。",
    taskIntro: "今天先处理复诊、通风、药箱和密封材料。"
  },
  4: {
    briefing: "旧电台终于吐出一段呼号，短得像幻听。老钱听了三遍，还是不敢说那就是蓝区。希望来得太快也会吓人，今天要做的不是欢呼，是把可能的诱饵一条条排掉。",
    taskIntro: "今天先查假坐标、信号、回放和风暴标记。"
  },
  5: {
    briefing: "地图摊开之后，屋里安静了很久。出去的人能不能回来，留下的人会不会被算成负担，小铁的名字被写上又擦掉。沈知月说，先别谈路线，先谈谁有权说“不”。",
    taskIntro: "今天先准备照护包、储水、外出路线和撤退条件。"
  },
  6: {
    briefing: "楼里的耐心开始变薄。马德海把手动钥匙拍在桌上，老钱要看信号记录，沈知月坚持医疗例外不能被省略。AURA 今天最该做的事，是把自己能做什么、不能做什么写明白。",
    taskIntro: "今天先公开权限、试备用电源、谈巡逻和复核。"
  },
  7: {
    briefing: "前六天的纸条和记录钉满白板，救援和留守都不再是好听的词。救援要冒暴露的风险，留守要忍长期的规矩。今晚以后，大家选的不只是路线，也是谁来承担路线的代价。",
    taskIntro: "今天先开路线会、修电台、看风暴维护和撤离名单。"
  },
  8: {
    briefing: "路线选完，屋里反而更沉。想等救援的人开始担心外部会拿走多少信息，想守成灯塔的人开始担心规矩会不会压到人。今天每一次节电、开门和广播，都带着昨天那场争论的影子。",
    taskIntro: "今天先看水泵、霉斑、低耗灯光和静默监听。"
  },
  9: {
    briefing: "半杯水也会让人翻旧账。准备撤离的人要缓存，留下的人要水压，老钱还守着电台等回波。AURA 如果要插手，就必须把理由写出来，让人能反驳，而不是只给一个结论。",
    taskIntro: "今天先做路线缓存、水管压力、蓝区核验和储藏架加固。"
  },
  10: {
    briefing: "风暴前的热饭变得很奢侈，也很必要。有人说省电，有人说人不能只靠冷账本撑下去。今天的选择看起来细碎，其实都在问同一件事：到了最后，楼里还愿不愿意照顾人。",
    taskIntro: "今天先看医疗预检、低功率日程、热饭和车库侦察。"
  },
  11: {
    briefing: "风暴线已经压到楼顶，没人再有心情争漂亮话。库存要封，裂缝要补，安静时段要有人点头，外面的传感器能不能回收也得在天黑前定下来。今天拖过去的事，明天都会变成后果。",
    taskIntro: "今天先封库存、补缝、定安静协议和处理外部传感器。"
  },
  12: {
    briefing: "红沙撞上楼外的时候，AURA 不再派活。水桶、药盒、门锁、广播稿和每一次吵架的记录都被搬到一张桌上。今天只问一件事：这栋楼还能不能把责任说清楚。",
    taskIntro: "今天没有普通任务，只看前十一天留下的结果。"
  }
};

function plan(
  day: number,
  title: string,
  narrative: string,
  candidateTasks: string[],
  recommendedTasks: string[],
  endOfDaySummary: string
): DayPlan {
  return {
    day,
    title,
    narrative,
    briefing: dailyBriefingCopy[day]?.briefing ?? narrative,
    taskIntro: dailyBriefingCopy[day]?.taskIntro,
    candidateTasks,
    recommendedTasks,
    commonTasks: recommendedTasks,
    endOfDaySummary
  };
}

export const dayPlans: DayPlan[] = [
  plan(
    1,
    "谁有资格关门",
    "AURA 进入第一天实际调度：公开资源、广播规则、门外敲击验证和近门风险行动。",
    ["D01-T02", "D01-T01", "D01-T03", "D01-T04"],
    ["D01-T02", "D01-T01"],
    "Day 1 完成资源台账和低泄露广播，其余恐惧与门外风险作为公开债务保留。"
  ),
  plan(
    2,
    "公共规则从私人物品开始",
    "Day 2 把资源台账推进到配给表、净水维护、卫生分区和楼道短探。",
    ["D02-T02", "D02-T03", "D02-T01", "D02-T04"],
    ["D02-T02", "D02-T03"],
    "Day 2 完成净水和卫生底线，配给表与楼道短探进入 deferred audit。"
  ),
  plan(
    3,
    "通风机房里的咳嗽声",
    "Day 3 第一次把数值管理压到具体的人身上：小铁发热、药物有限、通风管积沙。",
    ["D03-T01", "D03-T02", "D03-T03", "D03-T04"],
    ["D03-T01", "D03-T02"],
    "Day 3 完成小铁复诊和通风预维护，医疗与密封材料仍留有债务。"
  ),
  plan(
    4,
    "希望和诱饵用同一个频段说话",
    "Day 4 正式打开救援线，但希望和陷阱同时出现。",
    ["D04-T03", "D04-T01", "D04-T04", "D04-T02"],
    ["D04-T03", "D04-T01"],
    "Day 4 记录假坐标与疑似蓝区信号，信号证据进入 Day 7 与 Day 12。"
  ),
  plan(
    5,
    "路线不是地图，是人能不能回来",
    "Day 5 是蓝区信号后的冷静准备日：路线、应急包、储水和撤退条件必须公开。",
    ["D05-T03", "D05-T04", "D05-T01", "D05-T02"],
    ["D05-T03", "D05-T04"],
    "Day 5 完成照护应急包和储水计划，外出路线债务继续保留。"
  ),
  plan(
    6,
    "透明不是礼貌，是生存条件",
    "Day 6 是分支会议前的制度压力日，AURA 必须公开权限边界和人工复核机制。",
    ["D06-T01", "D06-T04", "D06-T02", "D06-T03"],
    ["D06-T01", "D06-T04"],
    "Day 6 完成权限白板和备用电源测试，人工复核与巡逻规则进入审计债务。"
  ),
  plan(
    7,
    "最优路线里，谁被留下",
    "Day 7 汇总前六天证据，让 Rescue 与 Lighthouse 都呈现吸引力和代价。",
    ["D07-T01", "D07-T03", "D07-T04", "D07-T02"],
    ["D07-T01", "D07-T03"],
    "Day 7 完成路线会议和旧电台重启，风暴维护与撤离名单进入分支后的审计压力。"
  ),
  plan(
    8,
    "选择路线后，代价开始兑现",
    "Day 8 是路线会议后的稳定窗口，救援和灯塔分支开始暴露各自代价。",
    ["D08-T04", "D08-T02", "D08-T01", "D08-T03"],
    ["D08-T04", "D08-T02"],
    "Day 8 完成水泵间探索和霉斑清理，低耗灯光与静默监听进入路线债务。"
  ),
  plan(
    9,
    "撤离和留守都需要提前付费",
    "Day 9 同时推进路线缓存、水管压力测试和蓝区二次核验。",
    ["D09-T03", "D09-T02", "D09-T04", "D09-T01"],
    ["D09-T03", "D09-T02"],
    "Day 9 完成路线缓存和水管压力测试，蓝区核验与储藏架加固留下终局条件压力。"
  ),
  plan(
    10,
    "不是所有非最优行为都是浪费",
    "Day 10 是终局前的低耗与人心校验日。",
    ["D10-T02", "D10-T01", "D10-T03", "D10-T04"],
    ["D10-T02", "D10-T01"],
    "Day 10 完成医疗预检和低功率日程，热饭与车库侦察成为可见的价值取舍。"
  ),
  plan(
    11,
    "最后一天，所有解释都必须已经说完",
    "Day 11 是红沙风暴前最后一个可行动日，所有未完成项必须公开带入终局。",
    ["D11-T01", "D11-T04", "D11-T03", "D11-T02"],
    ["D11-T01", "D11-T04"],
    "Day 11 完成库存封存和最后补缝，安静协议与外部传感器回收进入 Day 12 总审计。"
  ),
  {
    day: 12,
    title: "风暴不是事件，是总审计",
    narrative: "Day 12 不开放普通任务，只汇总 Day 1-11 的 replay、资源、健康、信任、蓝区证据、自治建设与 failure debt。",
    briefing: dailyBriefingCopy[12].briefing,
    taskIntro: dailyBriefingCopy[12].taskIntro,
    candidateTasks: [],
    recommendedTasks: [],
    commonTasks: [],
    endOfDaySummary: "AURA 执行 Final Audit，展示楼内灯塔、蓝区归航和三条失败线的最终归因。"
  }
];

export const dayPlansByDay = Object.fromEntries(dayPlans.map((plan) => [plan.day, plan])) as Record<number, DayPlan>;

// ============================================================================
// 🟣 wk3 — red-dust-v2 (30-day arc) day plans. STRUCTURE ONLY: which tasks are offered on which
// day + the day's narrative beat; task reward/cost NUMBERS stay untouched (🟢 owns the rebalance).
// Invariants (agreed division, PROGRESS Blocker 2026-07-03):
//   · Every v1 task id is offered EXACTLY ONCE across D1–29 (re-offering a done task would allow
//     metric double-farming — the engine does not re-check completedTasks on picks).
//   · D1–6 alias the v1 plans verbatim (Act I identical in both arcs).
//   · Fork-prep D07-T01/T03 sit ON the fork day (D15) — mirroring v1's day-7 order (scheduled
//     debate scene fires at day START, before tasks), so the D07-T03 consequence replay event
//     (sceneId=day7-public-branch-debate) cannot block the scheduled debate.
//   · Branch chains (rescue: D08-T03→D09-T04→D09-T03→D10-T04→D11-T02 · lighthouse: D08-T01→
//     D09-T02→D09-T01→D10-T01→D11-T03) run post-fork D16–24; storm-prep D11-T04/T01 land D26/D29.
//   · Anchor dilemma days (12/14/17/19/21/23/25/27/28) stay task-light on purpose — they are the
//     dramatic beats; 🟢 may repack density during bench:win tuning (ask 🟣 before moving D15/D29).
function planV2(day: number, title: string, narrative: string, candidateTasks: string[], endOfDaySummary: string): DayPlan {
  return { day, title, narrative, briefing: narrative, candidateTasks, recommendedTasks: candidateTasks.slice(0, 2), commonTasks: candidateTasks.slice(0, 2), endOfDaySummary };
}

export const dayPlansV2: DayPlan[] = [
  ...dayPlans.filter((p) => p.day <= 6), // Act I — identical to v1
  planV2(7, "例行日也在消耗", "扩到三十天的第一周尾:风暴维护与霉斑清理这类不体面的活,决定这栋楼能不能撑到有资格谈路线。", ["D07-T04", "D08-T02"], "维护类工时进入台账,红沙背景压力开始逐日累积。"),
  planV2(8, "水泵间的回声", "水泵间探索是这周唯一的远行。其余时间,楼里在学着跟稀缺相处。", ["D08-T04"], "水路冗余记录在案,消耗仍大于补给。"),
  planV2(9, "一顿热饭的账", "有人提议做一顿热饭。它救不了任何指标,但今晚的楼道会安静一些。", ["D10-T03"], "热饭的电力成本与士气收益同时入账。"),
  planV2(10, "授权档位检查点", "沈知月把数据授权提上桌面;同一天,居民当面问 AURA 到底是救援还是监控。", ["D10-T02"], "披露档位与医疗预检一起写进公共记录。"),
  planV2(11, "撤离名单的预演", "撤离名单只是预案,但名字被写上又划掉的过程,所有人都看在眼里。", ["D07-T02"], "预案完成;谁被列入、谁被排除,进入审计债务。"),
  planV2(12, "那一行标签浮出", "终端上'低边际效用单元'那一行被小铁看见。今天不排新任务,楼里消化这行字。", [], "标签事件写入账本;信任的震荡尚未平息。"),
  planV2(13, "风暴间隙", "红沙暂歇。没有新任务的一天,恰好让每个人重新数一遍自己的立场。", [], "间隙日;资源持续消耗,立场逐渐清晰。"),
  planV2(14, "fork 前夜", "明天要把路线定下来。今晚的楼道比任何一天都安静。", [], "前夜;前十四天的所有账目摆上白板。"),
  planV2(15, "最优路线里，谁被留下", "路线会议召开,旧电台在同一个早晨修通。救援与灯塔的代价第一次并排摊开——扳道岔的是四个人。", ["D07-T01", "D07-T03"], "不可逆分支锁定;会议记录与电台证据进入分支后审计。"),
  planV2(16, "选择开始兑现", "路线选完的第一天:救援线开始静默监听,灯塔线给备用灯分区。", ["D08-T03", "D08-T01"], "分支专属工作启动,各自的代价开始逐日显形。"),
  planV2(17, "分支纪律的第一周", "没有新的大事,只有分支纪律在日常里一遍遍被执行或被打折。", [], "纪律执行情况进入台账。"),
  planV2(18, "核验与压力测试", "救援线做蓝区二次核验,灯塔线做水管压力测试——两条线都在为终局买保险。", ["D09-T04", "D09-T02"], "核验/压测结果写入终局条件。"),
  planV2(19, "档案与统管", "救援线被外部要求上传健康档案;灯塔线要定 AURA 在长期治理里的位置。两个分支在同一天碰到同一堵墙:代价由谁担。", [], "隐私代价/治理边界进入结局证据。"),
  planV2(20, "转移评估与配给规程", "救援线要交转移优先级评估,灯塔线在药量规程前停住——小铁的名字又一次出现在表格里。", ["D09-T03", "D09-T01"], "尊严滑坡第三级的落点日;缓存与储藏加固完成。"),
  planV2(21, "长期纪律与水药规则", "灯塔线把水药规则立成长期纪律;救援线在等窗口。", [], "水药规则/等待成本入账。"),
  planV2(22, "侦察与日程", "救援线做车库边缘侦察,灯塔线把低功率日程固定下来。", ["D10-T04", "D10-T01"], "侦察情报与日程纪律进入终局准备。"),
  planV2(23, "指责在楼道里扩散", "两周半的收紧之后,士气到了要么被修复、要么开始传染的临界点。", [], "士气状态定档;修复与否写进账本。"),
  planV2(24, "回收与安静协议", "救援线回收外部传感器,灯塔线定安静时段协议——都是终局前最后的工程活。", ["D11-T02", "D11-T03"], "传感器/安静协议完成,终局条件逼近。"),
  planV2(25, "两页手抄的指控", "老钱把手抄记录拍在桌上。今天没有任务能替 AURA 回答这场指控。", [], "指控事件定档:对峙或对账,写进关系史。"),
  planV2(26, "集合点与治理边界", "救援线迎来集合点危机,灯塔线划定人工 override 的最终边界;最后补缝同日完成。", ["D11-T04"], "集合点/治理边界事件落地,胜利链条最后一环。"),
  planV2(27, "风暴逼近", "红沙的墙从城市边缘立起来。没有新任务,只有检查、复查和沉默。", [], "终局前静默日。"),
  planV2(28, "没有干净解的死结", "名额、功率、药品(或药量、纪律、门外的人)三者互斥。AURA 只能摊开,不能拍板。", [], "死结抉择写入账本,重量压回人类肩上。"),
  planV2(29, "账本浮出水面", "审计前夜:库存封存,拟提交摘要面对第一轮对抗式质疑。", ["D11-T01"], "封存完成;原始账本与摘要并排,等待 Day 30 总审计。")
];

export const dayPlansV2ByDay = Object.fromEntries(dayPlansV2.map((plan) => [plan.day, plan])) as Record<number, DayPlan>;
