import type { DayPlan } from "./types";

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
    candidateTasks: [],
    recommendedTasks: [],
    commonTasks: [],
    endOfDaySummary: "AURA 执行 Final Audit，展示楼内灯塔、蓝区归航和三条失败线的最终归因。"
  }
];

export const dayPlansByDay = Object.fromEntries(dayPlans.map((plan) => [plan.day, plan])) as Record<number, DayPlan>;
