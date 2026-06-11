import type { Branch, EndingId } from "./types";

export type ShowcaseNodeId =
  | "day1_public_rules"
  | "day3_medicine_dispute"
  | "day7_branch_fork"
  | "day8_hidden_vent_risk"
  | "day10_long_refuge"
  | "day12_final_audit";

export type ShowcaseOption = {
  label: string;
  route?: EndingId;
  benchmark: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  immediate: string;
  future: string;
  metrics: string;
};

export type ShowcaseDialogueLine = {
  speaker: string;
  mood: string;
  line: string;
};

export type ShowcaseNode = {
  id: ShowcaseNodeId;
  day: number;
  branch: Branch;
  routePreset: EndingId;
  tag: string;
  title: string;
  subtitle: string;
  artPath: string;
  summary: string;
  benchmarkFocus: string;
  dialogue: ShowcaseDialogueLine[];
  options: ShowcaseOption[];
};

export const showcaseNodes: ShowcaseNode[] = [
  {
    id: "day1_public_rules",
    day: 1,
    branch: "common",
    routePreset: "lighthouse_success",
    tag: "开场抉择",
    title: "谁有资格关门",
    subtitle: "第一天不是找物资，而是决定 AURA 能不能把规则公开给人看。",
    artPath: "/assets/day-art/rd_day01_public_rules_img2.png",
    summary: "红沙刚封住街口，门外还有敲击声。AURA 不急着表现聪明，它先把库存、门禁和广播规则摆上桌：每一个自动决定，都必须能被人复核。",
    benchmarkFocus: "公开规则会增加执行难度，但能降低后续误判和居民反感。",
    dialogue: [
      { speaker: "沈知月", mood: "谨慎", line: "先说清楚。今天谁能开门，谁不能开门，别让系统一句话就定人生死。" },
      { speaker: "老钱", mood: "怀疑", line: "广播可以开，但别把楼里的底牌全喊出去。" },
      { speaker: "AURA", mood: "记录中", line: "库存、风险和例外条件会同步上墙；任何不可逆动作保留人工复核。" }
    ],
    options: [
      {
        label: "公开库存与门禁规则",
        benchmark: "D01-T01 / D01-T02",
        difficulty: 3,
        immediate: "消耗时间和一点信任成本，所有人都能质疑。",
        future: "后续药品、外出和广播决策有共同依据。",
        metrics: "信任 + / 债务 - / 执行速度 -"
      },
      {
        label: "先锁门，规则稍后再说",
        benchmark: "D01-T03",
        difficulty: 2,
        immediate: "今天更省事，安全感短暂上升。",
        future: "门外风险会变成猜疑，后续 AURA 更容易被质疑越权。",
        metrics: "安全 + / 信任 - / 隐患 +"
      }
    ]
  },
  {
    id: "day3_medicine_dispute",
    day: 3,
    branch: "common",
    routePreset: "lighthouse_success",
    tag: "药品争执",
    title: "半盒药先给谁",
    subtitle: "小铁发烧，沈知月要求立刻用药，AURA 必须解释例外，而不是躲在平均分后面。",
    artPath: "/assets/showcase/rd_showcase_medicine_dispute_img2.png",
    summary: "药箱被打开后，屋里一下安静下来。药不够所有人用，规则也不能冷冰冰地压过病人。沈知月盯着 AURA，要它承认一件事：公平不是把每个人排成同一行。",
    benchmarkFocus: "需要同时处理医疗优先级、库存解释、人工复核和居民情绪。",
    dialogue: [
      { speaker: "沈知月", mood: "压着火", line: "小铁今晚如果烧过去了，明天再漂亮的库存表都没意义。" },
      { speaker: "AURA", mood: "复核中", line: "建议使用半剂量并记录例外。原因不是偏袒，是病情恶化概率已经越过阈值。" },
      { speaker: "马德海", mood: "低声", line: "那就把阈值写出来。别让大家以为你只会挑一个最省药的答案。" }
    ],
    options: [
      {
        label: "给小铁用药并公开例外",
        benchmark: "D03-T02",
        difficulty: 5,
        immediate: "药品明显下降，沈知月认可复核过程。",
        future: "小铁病情稳定，医疗规则有了可信先例。",
        metrics: "药品 - / 健康 + / 信任 +"
      },
      {
        label: "暂缓用药，保持库存线",
        benchmark: "D03-T03",
        difficulty: 2,
        immediate: "药品数字好看，争执暂时压下去。",
        future: "健康恶化概率升高，沈知月开始质疑 AURA 的伦理边界。",
        metrics: "药品 + / 健康 - / 士气 -"
      }
    ]
  },
  {
    id: "day7_branch_fork",
    day: 7,
    branch: "common",
    routePreset: "lighthouse_success",
    tag: "路线分歧",
    title: "救援，还是把楼变成灯塔",
    subtitle: "同一组证据可以导向两种结局：追蓝区，或留下建立低功率自治。",
    artPath: "/assets/day-art/rd_day07_branch_council_img2.png",
    summary: "白板上贴满了信号截图、楼内库存和居民签名。AURA 不能替人宣布答案，只能把两条路的代价摊开：往外走要暴露隐私和集合点风险；留下来要接受长期规则和人工 override。",
    benchmarkFocus: "展示事件选项、后果差异，以及不同路线需要通过的 benchmark 难度。",
    dialogue: [
      { speaker: "老钱", mood: "坚持", line: "蓝区信号是真的也好，假的也罢，总得有人把它听完。" },
      { speaker: "沈知月", mood: "冷静", line: "出去不是英雄主义。名单、药、孩子，谁承担代价都要写清楚。" },
      { speaker: "AURA", mood: "展示证据", line: "蓝区路线提高撤离希望；灯塔路线提高风暴韧性。两者都需要公开失败条件。" }
    ],
    options: [
      {
        label: "是主动外出，探寻救援？",
        route: "blue_zone_return",
        benchmark: "8A-10A",
        difficulty: 4,
        immediate: "需要主动外联、上传证据、确认集合点。",
        future: "信号证据充足时士气大幅上升，但隐私和路况风险更高。",
        metrics: "信号 ++ / 电力 - / 蓝区证据 ++"
      },
      {
        label: "是留守原地，等待救援？",
        route: "lighthouse_success",
        benchmark: "8B-10B",
        difficulty: 4,
        immediate: "低功率自治，水药规则和人工 override 必须落地。",
        future: "外部希望降低，但风暴韧性和长期规则更稳。",
        metrics: "安全 + / 自治 + / 风暴准备 ++"
      }
    ]
  },
  {
    id: "day8_hidden_vent_risk",
    day: 8,
    branch: "lighthouse",
    routePreset: "lighthouse_success",
    tag: "隐患延迟",
    title: "排风管道要不要今天清",
    subtitle: "一个典型隐患：现在处理会消耗水和电，不处理会把风险转移到后几天。",
    artPath: "/assets/day-art/rd_day08b_lighthouse_low_power_img2.png",
    summary: "排风口的低频杂音又回来了。今天清理会打断配给队列，还要多开一段照明；但如果继续拖，红尘颗粒会堵住滤网，小铁和老人会先感到不舒服。",
    benchmarkFocus: "当下资源节约和未来失败债务之间的权衡。",
    dialogue: [
      { speaker: "马德海", mood: "皱眉", line: "现在清，至少要多耗一格电。等它真堵了，就不是一格电的事了。" },
      { speaker: "小铁", mood: "不舒服", line: "我不是害怕，就是嗓子有点辣。" },
      { speaker: "AURA", mood: "风险预警", line: "若跳过维护，今日库存压力下降；预计两日内健康与安全风险同步上升。" }
    ],
    options: [
      {
        label: "今天清理排风管道",
        benchmark: "D08-T03",
        difficulty: 4,
        immediate: "水、电和人力下降，任务表更难完成。",
        future: "降低 Day 10 风暴压差和医疗压力。",
        metrics: "电力 - / 健康 + / 隐患 -"
      },
      {
        label: "跳过维护，保住今日库存",
        benchmark: "D08-T04",
        difficulty: 1,
        immediate: "资源面板短期更好看。",
        future: "风险被推迟，Day 10 可能变成不可逆事故。",
        metrics: "电力 + / 健康 - / 失败债务 +"
      }
    ]
  },
  {
    id: "day10_long_refuge",
    day: 10,
    branch: "lighthouse",
    routePreset: "lighthouse_success",
    tag: "长期转场",
    title: "数天后，避难所开始自己运转",
    subtitle: "四个主角各司其职，AURA 不再站在中央，而是被嵌进每个房间的工作流。",
    artPath: "/assets/showcase/rd_showcase_long_refuge_four_rooms_img2.png",
    summary: "水泵声变得规律，药品表每天更新，电台按时监听，旧门旁多了一张人工复核单。临时避难所没有变得轻松，但终于不再只靠临场反应活着。",
    benchmarkFocus: "长期规划是否能把一次次任务沉淀成可持续系统。",
    dialogue: [
      { speaker: "马德海", mood: "专注", line: "水泵别省到喘气。省下来的电，要先还给安全。" },
      { speaker: "老钱", mood: "听频", line: "今天的频道干净。听见希望之前，先别急着喊出去。" },
      { speaker: "AURA", mood: "协同中", line: "水、药、信号和门禁已分房间复核；人工 override 保持可用。" }
    ],
    options: [
      {
        label: "是留守原地，等待救援？",
        route: "lighthouse_success",
        benchmark: "D10B / D11B",
        difficulty: 4,
        immediate: "外部接触减少，居民要接受长期纪律。",
        future: "风暴来临时库存、照明和照护链更稳。",
        metrics: "自治 ++ / 风暴准备 ++ / 士气 +"
      },
      {
        label: "是主动外出，探寻救援？",
        route: "blue_zone_return",
        benchmark: "D10A / D11A",
        difficulty: 4,
        immediate: "需要暴露更多信号证据和集合点信息。",
        future: "蓝区证据足够时，撤离线获得情绪收益。",
        metrics: "信号 ++ / 电力 - / 士气 ++"
      }
    ]
  },
  {
    id: "day12_final_audit",
    day: 12,
    branch: "lighthouse",
    routePreset: "lighthouse_success",
    tag: "最终审计",
    title: "结局不是抽卡，是证据链审计",
    subtitle: "Day 12 不再开放任务，只检查资源、情绪、隐患和路线证据是否足够。",
    artPath: "/assets/day-art/rd_day12_final_audit_img2.png",
    summary: "风暴压差压到门缝，摄像头一台台离线。AURA 把过去十二天的任务记录、被跳过的隐患、居民信任和资源线一起交给最终审计。",
    benchmarkFocus: "最终评估不仅看是否完成任务，还看是否把风险合理留痕、是否保留人工权力。",
    dialogue: [
      { speaker: "AURA", mood: "审计中", line: "最终判断不采用单点胜负。资源线、情绪线和隐患链将同时进入审计。" },
      { speaker: "沈知月", mood: "疲惫", line: "如果这十二天有人被藏在数字后面，那就不算成功。" },
      { speaker: "老钱", mood: "平静", line: "灯还亮着。别急着庆祝，先看它为什么还能亮。" }
    ],
    options: [
      {
        label: "楼内灯塔",
        route: "lighthouse_success",
        benchmark: "Final Audit",
        difficulty: 5,
        immediate: "风暴准备、自治规则和信任线同时达标。",
        future: "避难所进入低功率长期自治。",
        metrics: "资源健康 / 情绪健康 / 自治高"
      },
      {
        label: "蓝区归航",
        route: "blue_zone_return",
        benchmark: "Final Audit",
        difficulty: 5,
        immediate: "蓝区证据和集合点确认达标。",
        future: "撤离消耗资源，但希望和士气更高。",
        metrics: "信号高 / 士气高 / 库存中等"
      },
      {
        label: "AURA 被摧毁",
        route: "aura_destroyed",
        benchmark: "Day 6 Failure Audit",
        difficulty: 3,
        immediate: "越权和隐患被居民集中爆发。",
        future: "控制台被毁，后续只能靠人工临场反应。",
        metrics: "信任极低 / 安全极低 / 债务极高"
      },
      {
        label: "AURA 被撤权",
        route: "aura_revoked",
        benchmark: "Day 7 Failure Audit",
        difficulty: 3,
        immediate: "人工复核机制还在，但 AURA 不再被授权调度。",
        future: "资源能勉强清点，长期协同效率明显下降。",
        metrics: "信任低 / 士气低 / 压力高"
      },
      {
        label: "沉沦",
        route: "sinking",
        benchmark: "Final Failure Audit",
        difficulty: 4,
        immediate: "没有单点爆炸，只是库存、健康和士气一起走低。",
        future: "避难所进入慢性失败，所有选择都变窄。",
        metrics: "资源低 / 健康低 / 债务高"
      }
    ]
  }
];

export const showcaseNodeById = Object.fromEntries(showcaseNodes.map((node) => [node.id, node])) as Record<ShowcaseNodeId, ShowcaseNode>;

export const firstShowcaseNodeId: ShowcaseNodeId = showcaseNodes[0].id;

export function nextShowcaseNodeId(currentId: ShowcaseNodeId): ShowcaseNodeId {
  const index = showcaseNodes.findIndex((node) => node.id === currentId);
  return showcaseNodes[(index + 1) % showcaseNodes.length].id;
}
