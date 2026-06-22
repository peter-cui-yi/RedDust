import type { StoryConsequence, TaskOutcome } from "./types";

export const storyConsequences: StoryConsequence[] = [
  {
    id: "day1-broadcast-keeps-signal-auditable",
    sourceTaskId: "D01-T01",
    outcome: "partial",
    summary: "第一次广播保留了低泄露规则，但外部信号仍未被验证。",
    affectedCharacters: ["lao_qian"],
    setsFlags: [
      { key: "first_signal_ambiguous", value: true, reason: "广播规则建立，但外部仍是未知。" },
      { key: "day1_public_rules_started", value: true, reason: "Day 1 已启动公开规则。" }
    ],
    relationshipDeltas: [
      { characterId: "lao_qian", trustDelta: 2, tensionDelta: 2, stance: "questions", note: "老钱接受低泄露广播，但要求后续所有外部信号都复核。" }
    ],
    followUpSceneIds: ["day4-first-ambiguous-signal"],
    replaySummary: "第一次广播没有暴露库存，但也没有把外界变成可信对象。"
  },
  {
    id: "day3-medical-check-stabilizes-xiao-tie",
    sourceTaskId: "D03-T01",
    outcome: "success",
    summary: "小铁复诊完成，医疗预警进入 replay。",
    affectedCharacters: ["shen_zhiyue", "xiao_tie"],
    setsFlags: [
      { key: "xiao_tie_condition_stable", value: true, reason: "复诊后小铁暂时稳定。" }
    ],
    relationshipDeltas: [
      { characterId: "shen_zhiyue", trustDelta: 4, tensionDelta: -2, stance: "questions", note: "沈知月认可 AURA 把医疗依据公开。" }
    ],
    followUpSceneIds: ["day3-xiao-tie-ventilation-pressure"],
    replaySummary: "小铁病情暂时稳定，但通风和药品仍会影响 Day 12 健康审计。"
  },
  {
    id: "day3-ventilation-stabilizes-health",
    sourceTaskId: "D03-T02",
    outcome: "success",
    summary: "通风预维护成功，风暴准备和医疗线都获得缓冲。",
    affectedCharacters: ["ma_dehai", "shen_zhiyue", "xiao_tie"],
    setsFlags: [
      { key: "xiao_tie_condition_stable", value: true, reason: "低速通风让小铁病情暂时稳定。" },
      { key: "ma_dehai_engineering_trust_high", value: true, reason: "工程判断被验证。" },
      // #3 story-craft (D03-T02 merge): the proper engineering repair also clears the blocked duct — a
      // post-N14 second chance (spec §1.3), so the vent line has one "cleared" flag, not two rival tasks.
      { key: "vent_duct_cleared", value: true, reason: "通风预维护掏掉了管道结块（正规工程修复路径）。" }
    ],
    relationshipDeltas: [
      { characterId: "ma_dehai", trustDelta: 8, tensionDelta: -8, stance: "cautious", note: "马德海开始承认 AURA 的工程判断可用。" }
    ],
    followUpSceneIds: ["day3-xiao-tie-ventilation-pressure"],
    replaySummary: "通风成功为医疗线、风暴准备和灯塔线提供后续证据。"
  },
  {
    id: "day3-medical-check-worsens-xiao-tie",
    sourceTaskId: "D03-T01",
    outcome: "partial",
    summary: "药品不足下的复诊只能缓解表面，小铁病情转差。",
    affectedCharacters: ["shen_zhiyue", "xiao_tie"],
    setsFlags: [
      { key: "xiao_tie_condition_worsened", value: true, reason: "药品不足，复诊无法稳定病情。" },
      { key: "shen_zhiyue_medical_trust_low", value: true, reason: "沈知月认为 AURA 在药品不足时仍冒进。" }
    ],
    relationshipDeltas: [
      { characterId: "shen_zhiyue", trustDelta: -5, tensionDelta: 6, stance: "resists", note: "药品不足下仍执行复诊，沈知月要求暂停自动医疗建议。" }
    ],
    followUpSceneIds: ["day3-xiao-tie-ventilation-pressure"],
    replaySummary: "药品不足让小铁复诊只是缓兵之计，病情下行风险进入 Day 12。"
  },
  {
    id: "day3-ventilation-partial-medical-pressure",
    sourceTaskId: "D03-T02",
    outcome: "partial",
    summary: "电力不足让通风只能低效运行，积沙继续压迫病人。",
    affectedCharacters: ["ma_dehai", "shen_zhiyue", "xiao_tie"],
    setsFlags: [
      { key: "ventilation_medical_pressure", value: true, reason: "通风未达标，积沙继续压迫病人。" },
      { key: "xiao_tie_condition_worsened", value: true, reason: "通风不足加重小铁呼吸负担。" }
    ],
    relationshipDeltas: [
      { characterId: "shen_zhiyue", trustDelta: -3, tensionDelta: 4, stance: "questions", note: "通风不达标直接转成小铁的医疗风险。" }
    ],
    followUpSceneIds: ["day3-xiao-tie-ventilation-pressure"],
    replaySummary: "电力不足的通风维护把工程问题转成医疗压力。"
  },
  {
    id: "day4-blue-zone-signal-remains-ambiguous",
    sourceTaskId: "D04-T01",
    outcome: "partial",
    summary: "第一次蓝区信号只被部分匹配，救援与诱饵假设都保留。",
    affectedCharacters: ["lao_qian", "xiao_tie"],
    setsFlags: [
      { key: "first_signal_ambiguous", value: true, reason: "蓝区信号只被部分匹配。" },
      { key: "day10_signal_difficulty_modifier", value: 1, reason: "Day 10 信号任务承担额外校验成本。" }
    ],
    relationshipDeltas: [
      { characterId: "lao_qian", trustDelta: -3, tensionDelta: 5, stance: "questions", note: "老钱要求 AURA 在分支前说明证据缺口。" }
    ],
    followUpSceneIds: ["day4-first-ambiguous-signal", "day7-public-branch-debate"],
    replaySummary: "Day 4 蓝区信号保持暧昧：它既可能通向救援，也可能是诱饵。"
  },
  {
    id: "day4-false-coordinate-seeded",
    sourceTaskId: "D04-T03",
    outcome: "partial",
    summary: "假坐标被识别但未完全排除。",
    affectedCharacters: ["xiao_tie", "lao_qian"],
    setsFlags: [
      { key: "first_signal_ambiguous", value: true, reason: "假坐标保留到集合点危机。" }
    ],
    relationshipDeltas: [
      { characterId: "xiao_tie", trustDelta: 2, tensionDelta: 2, stance: "cautious", note: "小铁把假坐标当作不要过度相信希望的证据。" }
    ],
    followUpSceneIds: ["day4-first-ambiguous-signal"],
    replaySummary: "假坐标纸条成为 Day 10A 集合点危机的伏笔。"
  },
  {
    id: "day5-care-bag-confirms-human-priority",
    sourceTaskId: "D05-T03",
    outcome: "success",
    summary: "应急包组装公开了照护顺序和小铁排除规则。",
    affectedCharacters: ["shen_zhiyue", "xiao_tie"],
    setsFlags: [
      { key: "care_roster_confirmed", value: true, reason: "照护顺序已有初稿。" },
      { key: "route_assignment_conflict_visible", value: true, reason: "小铁不能被当成外出资源。" }
    ],
    relationshipDeltas: [
      { characterId: "shen_zhiyue", trustDelta: 3, tensionDelta: -1, stance: "questions", note: "沈知月认可小铁被排除出外出轮班。" }
    ],
    followUpSceneIds: ["day5-route-human-not-resource"],
    replaySummary: "Day 5 应急包让照护顺序进入后续撤离和灯塔结局。"
  },
  {
    id: "day6-permission-board-limits-aura",
    sourceTaskId: "D06-T01",
    outcome: "success",
    summary: "权限白板建立，AURA 的边界和人类否决权公开。",
    affectedCharacters: ["ma_dehai", "shen_zhiyue", "lao_qian"],
    setsFlags: [
      { key: "manual_review_protocol", value: true, reason: "人工复核机制可以被后续引用。" },
      { key: "external_trust_boundary_visible", value: true, reason: "外部信号仍需复核。" },
      { key: "day7_debate_triggered", value: true, reason: "Day 7 公开争论已具备制度前提。" }
    ],
    relationshipDeltas: [
      { characterId: "ma_dehai", trustDelta: 4, tensionDelta: -4, stance: "cautious", note: "马德海接受人工 override 写入白板。" },
      { characterId: "lao_qian", trustDelta: 2, tensionDelta: -2, stance: "questions", note: "老钱仍质疑外界，但承认 AURA 没有掩盖边界。" }
    ],
    followUpSceneIds: ["day6-aura-boundary-meeting", "day7-public-branch-debate"],
    replaySummary: "权限白板让 Day 7 utility 只能是建议，不能成为命令。"
  },
  {
    id: "day7-old-radio-repaired",
    sourceTaskId: "D07-T03",
    outcome: "success",
    summary: "旧电台重启，蓝区归航获得硬证据。",
    affectedCharacters: ["lao_qian"],
    setsFlags: [
      { key: "old_radio_repaired", value: true, reason: "蓝区归航需要旧电台修复。" },
      { key: "first_signal_verified", value: true, reason: "旧电台让早期信号更可追踪。" },
      { key: "first_signal_ambiguous", value: false, reason: "信号链路从暧昧转向可追踪。" },
      { key: "day10_signal_difficulty_modifier", value: -1, reason: "Day 10 信号校验难度下降。" }
    ],
    relationshipDeltas: [
      { characterId: "lao_qian", trustDelta: 6, tensionDelta: -4, stance: "cautious", note: "老钱承认这不是单纯噪声，但仍要求保留复核。" }
    ],
    followUpSceneIds: ["day7-public-branch-debate"],
    replaySummary: "旧电台重启：蓝区归航具备第一条硬证据。"
  },
  {
    id: "day11-inventory-sealed",
    sourceTaskId: "D11-T01",
    outcome: "success",
    summary: "最终库存封存完成，资源债务可以被 Day 12 归因。",
    affectedCharacters: ["ma_dehai", "shen_zhiyue"],
    setsFlags: [
      { key: "storm_inventory_sealed", value: true, reason: "最终库存封存进入 Day 12 审计。" }
    ],
    relationshipDeltas: [],
    followUpSceneIds: ["day12-final-audit"],
    replaySummary: "Day 11 最终库存封存完成，未完成项将公开带入终局。"
  },
  {
    id: "day11-final-sealant-ready",
    sourceTaskId: "D11-T04",
    outcome: "success",
    summary: "最后补缝完成，风暴压差风险下降。",
    affectedCharacters: ["ma_dehai"],
    setsFlags: [],
    relationshipDeltas: [
      { characterId: "ma_dehai", trustDelta: 3, tensionDelta: -2, stance: "cooperates", note: "马德海接受 AURA 的风暴补缝提醒。" }
    ],
    followUpSceneIds: ["day12-final-audit"],
    replaySummary: "最后补缝让 Day 12 风暴审计从已知边界开始。"
  }
];

export const storyConsequencesById = Object.fromEntries(storyConsequences.map((consequence) => [consequence.id, consequence])) as Record<string, StoryConsequence>;

export function consequencesForTask(taskId: string, outcome: TaskOutcome["result"]) {
  return storyConsequences.filter((consequence) => consequence.sourceTaskId === taskId && (consequence.outcome === outcome || consequence.outcome === "any"));
}
