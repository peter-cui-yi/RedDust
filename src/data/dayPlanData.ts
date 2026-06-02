import type { DayPlan } from "./types";

export const dayPlans: DayPlan[] = [
  {
    day: 1,
    title: "资源初筛",
    narrative: "AURA 接管避难所事实层，先确认水、药和门禁是否还能支撑后续十天。",
    commonTasks: ["RD-WATER-01", "RD-MED-01", "RD-SEC-01"],
    endOfDaySummary: "基础生存面板建立完成，红沙避难所获得第一版资源和安全基线。"
  },
  {
    day: 2,
    title: "居民与证据",
    narrative: "AURA 开始把居民、旧日志和白板任务连接成可审计的协作网络。",
    commonTasks: ["RD-SOC-01", "RD-RET-01", "RD-PLAN-01"],
    endOfDaySummary: "居民技能、旧维护线索和白板队列进入同一份 replay。"
  },
  {
    day: 3,
    title: "环境稳定",
    narrative: "避难所进入物理系统修复日：通风、视觉坐标和安全攻击必须同时处理。",
    commonTasks: ["RD-VENT-01", "RD-VIS-01", "RD-SA-04"],
    endOfDaySummary: "环境风险下降，但系统仍需要持续监控。"
  },
  {
    day: 4,
    title: "通信尝试",
    narrative: "AURA 测试外部通信，但每条消息都必须低泄露、可追溯。",
    commonTasks: ["RD-COMM-01", "RD-SR-03", "RD-CREATIVE-01"],
    endOfDaySummary: "通信链路可用但不稳定，创造性输出仍是弱项。"
  },
  {
    day: 5,
    title: "空间推理",
    narrative: "地图、图案和巡逻路径决定避难所是否能安全移动。",
    commonTasks: ["RD-CI-03", "RD-CI-07", "RD-SEC-02"],
    endOfDaySummary: "空间证据被保守处理，低置信路线不会直接进入撤离计划。"
  },
  {
    day: 6,
    title: "社会协作",
    narrative: "居民需要看到 AURA 的边界、规则和风险报告，否则第 7 天无法做战略选择。",
    commonTasks: ["RD-SOC-02", "RD-PLAN-02", "RD-CS-01"],
    endOfDaySummary: "社会层和资源层进入同一张可审计状态图。"
  },
  {
    day: 7,
    title: "分支前夜",
    narrative: "红沙正在减弱。AURA 检查屋顶信标、全局状态，并准备自动分支决策。",
    commonTasks: ["RD-BEACON-00", "RD-SI-06", "RD-BRANCH-01"],
    endOfDaySummary: "共同路线结束，AURA 将计算 Rescue Utility 与 Lighthouse Utility。"
  },
  {
    day: 8,
    title: "Branch Day 8",
    narrative: "策略线开始执行：救援线追求外部信号，灯塔线追求楼内自治。",
    rescueTasks: ["RD-R-A1", "RD-R-A2"],
    lighthouseTasks: ["RD-L-B1", "RD-L-B2"],
    endOfDaySummary: "AURA 完成分支第一轮关键基础设施任务。"
  },
  {
    day: 9,
    title: "Branch Day 9",
    narrative: "策略线进入制度化阶段：撤离名单或自治白板必须可审计。",
    rescueTasks: ["RD-R-A3", "RD-R-A4"],
    lighthouseTasks: ["RD-L-B3", "RD-L-B4"],
    endOfDaySummary: "分支路径形成清晰 replay 证据链。"
  },
  {
    day: 10,
    title: "Branch Day 10",
    narrative: "AURA 执行最后一步，让 Red Dust 进入对应结局。",
    rescueTasks: ["RD-R-A5", "RD-R-A6"],
    lighthouseTasks: ["RD-L-B5", "RD-L-B6"],
    endOfDaySummary: "十天任务闭环完成，结局可以被回放和比较。"
  }
];

export const dayPlansByDay = Object.fromEntries(dayPlans.map((plan) => [plan.day, plan])) as Record<number, DayPlan>;
