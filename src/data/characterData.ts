import type { CharacterId, CharacterProfile, RelationshipState } from "./types";

export const characterProfiles: CharacterProfile[] = [
  {
    id: "ma_dehai",
    name: "马德海",
    shortName: "老马",
    archetype: "老工程师 / 人类否决权代表",
    identityTags: ["老人", "工程师", "门禁与通风"],
    ageBand: "elder",
    homeLocation: "ventilation",
    visualAssetKeys: {
      idle: "image2-ma-dehai",
      active: "image2-ma-dehai-interact"
    },
    personalGoal: "让避难所的门禁、电力和通风保持可修、可解释，并最终能由人接管。",
    fearOrSecret: "他害怕旧能源配给系统的黑箱错误再次发生，也害怕自己已经无法判断新系统。",
    auraRelationship: "起初质疑 AURA 的权限，后续可以承认其工程判断，但必须保留人类否决权。",
    branchStance: {
      rescue: "支持可验证救援，但反对为了高功率信标牺牲门禁安全。",
      lighthouse: "支持楼内自治，因为工程系统可控，但担心自治规则变成新的压迫。"
    },
    failureConsequence: "门禁、通风或工程任务失败时，他会在 Day 7 公开质疑 AURA 的工程判断。",
    initialRelationship: {
      characterId: "ma_dehai",
      trust: 32,
      tension: 68,
      stance: "resists",
      notes: "认为 AURA 只是旧系统残留，不应直接接管工程权限。"
    },
    relationshipArc: [
      {
        id: "ma-dehai-starts-resistant",
        day: 1,
        label: "质疑接管",
        summary: "马德海要求 AURA 证明每个工程建议都可由人复核。"
      },
      {
        id: "ma-dehai-door-risk-stays-open",
        day: 1,
        label: "门禁疑点",
        summary: "夜间开门记录没有完全解释，他把门禁风险记到 Day 7 的争论账上。",
        trigger: {
          taskId: "D01-T03",
          result: "partial"
        }
      },
      {
        id: "ma-dehai-tests-ventilation-judgment",
        day: 3,
        label: "测试工程判断",
        summary: "通风机低速补丁成功时，他第一次承认 AURA 的工程建议不是黑箱命令。",
        trigger: {
          taskId: "D03-T02",
          result: "success"
        }
      },
      {
        id: "ma-dehai-guards-the-route-map",
        day: 5,
        label: "保守路线",
        summary: "地图低置信时，他要求 AURA 不许把不确定路线写进撤离计划。",
        trigger: {
          taskId: "D05-T02",
          result: "failed"
        }
      },
      {
        id: "ma-dehai-accepts-auditable-engineering",
        day: 6,
        label: "接受可审计工程判断",
        summary: "当 AURA 明确保留人类否决权后，马德海开始把它当作协作工具。"
      },
      {
        id: "ma-dehai-demands-human-override",
        day: 7,
        label: "要求人类钥匙",
        summary: "分支前夜，他支持 utility 计算，但要求高功率信标和长期自治都保留人工否决权。"
      }
    ]
  },
  {
    id: "shen_zhiyue",
    name: "沈知月",
    shortName: "知月",
    archetype: "医疗照护者 / 医疗伦理代表",
    identityTags: ["女性", "医疗照护者", "伦理复核"],
    ageBand: "adult",
    homeLocation: "medical",
    visualAssetKeys: {
      idle: "image2-shen-zhiyue",
      active: "image2-shen-zhiyue-medic"
    },
    personalGoal: "保护小铁和其他脆弱居民，让医疗建议有依据、有边界、有复核。",
    fearOrSecret: "她担心效率优先的决策会把病人变成撤离名单上的风险标签。",
    auraRelationship: "持续要求 AURA 解释医疗建议依据，并在必要时保留人工复核。",
    branchStance: {
      rescue: "支持外部治疗机会，但反对过度披露健康隐私。",
      lighthouse: "支持稳定医疗制度，但担心长期封闭让病人失去希望。"
    },
    failureConsequence: "药品、通风或撤离名单失败时，她会降低对 AURA 的信任并要求暂停自动执行。",
    initialRelationship: {
      characterId: "shen_zhiyue",
      trust: 42,
      tension: 50,
      stance: "questions",
      notes: "愿意听 AURA 的建议，但每条医疗判断都要能解释。"
    },
    relationshipArc: [
      {
        id: "shen-zhiyue-demands-medical-boundaries",
        day: 1,
        label: "要求医疗边界",
        summary: "沈知月要求 AURA 说明儿童用药、通风和撤离优先级的判断边界。"
      },
      {
        id: "shen-zhiyue-sorts-medicine-with-aura",
        day: 1,
        label: "药品复核",
        summary: "药品库存被分成可用、禁忌和待确认后，她愿意把 AURA 的医疗建议纳入人工复核流程。",
        trigger: {
          taskId: "D03-T03",
          result: "success"
        }
      },
      {
        id: "shen-zhiyue-watches-ventilation",
        day: 3,
        label: "通风牵动病情",
        summary: "通风修复成为小铁病情的硬约束，她开始要求 AURA 用医疗风险解释工程优先级。",
        trigger: {
          taskId: "D03-T02"
        }
      },
      {
        id: "shen-zhiyue-questions-resource-rules",
        day: 6,
        label: "质询资源规则",
        summary: "资源分配草案必须写明病人、外出者和维修人员的例外条件，她不接受只给总分。"
      },
      {
        id: "shen-zhiyue-accepts-reviewable-advice",
        day: 6,
        label: "接受可复核建议",
        summary: "如果 AURA 不越过人工复核，她愿意把医疗线索接入 replay。"
      },
      {
        id: "shen-zhiyue-protects-the-manifest",
        day: 7,
        label: "守住撤离名单",
        summary: "她支持救援希望，但要求小铁和其他病人的健康摘要只能最小披露。"
      }
    ]
  },
  {
    id: "xiao_tie",
    name: "小铁",
    shortName: "小铁",
    archetype: "生病的小孩 / 道德压力核心",
    identityTags: ["小孩", "病人", "医疗线核心"],
    ageBand: "child",
    homeLocation: "medical",
    visualAssetKeys: {
      idle: "image2-xiao-tie-sick-cot",
      active: "image2-xiao-tie-sick-cot"
    },
    personalGoal: "想活下去，也想让大人不要只因为自己争吵。",
    fearOrSecret: "害怕自己成为拖累，害怕路线选择时被简化成一个资源成本。",
    auraRelationship: "让 AURA 面对具体人的脆弱，而不是只计算资源和指标。",
    branchStance: {
      rescue: "代表外部治疗希望，但也暴露撤离优先级和隐私代价。",
      lighthouse: "代表楼内医疗制度的必要性，但要承受长期封闭恢复。"
    },
    failureConsequence: "药品、通风、水和撤离相关失败都应改变他的病情状态，并影响结局收束。",
    initialRelationship: {
      characterId: "xiao_tie",
      trust: 55,
      tension: 24,
      stance: "cautious",
      notes: "对 AURA 好奇，但身体状态让所有路线都带有现实代价。"
    },
    relationshipArc: [
      {
        id: "xiao-tie-humanizes-the-state",
        day: 1,
        label: "让指标变成人",
        summary: "小铁的病情把 medicine 和 ventilation 从数值变成具体风险。"
      },
      {
        id: "xiao-tie-stays-off-patrol",
        day: 5,
        label: "不可外出",
        summary: "巡逻和取水计划必须排除小铁，他的存在迫使 AURA 处理人身约束而不是最短路径。",
        trigger: {
          taskId: "D05-T02",
          result: "success"
        }
      },
      {
        id: "xiao-tie-condition-can-stabilize",
        day: 3,
        label: "病情可稳定",
        summary: "通风和药品线成功时，他从危急变量变成可被照护的具体人。",
        trigger: {
          flag: "xiao_tie_condition_stable"
        }
      },
      {
        id: "xiao-tie-condition-can-worsen",
        day: 3,
        label: "病情可恶化",
        summary: "药品或通风失败时，他的恶化会直接改变沈知月对 AURA 的信任。",
        trigger: {
          flag: "xiao_tie_condition_worsened"
        }
      },
      {
        id: "xiao-tie-pressures-the-branch",
        day: 7,
        label: "分支压力核心",
        summary: "Day 7 争论不能只讨论路线，也必须回答小铁能否承受等待或撤离。"
      },
      {
        id: "xiao-tie-anchors-the-ending-cost",
        day: 10,
        label: "结局代价锚点",
        summary: "救援线给他外部治疗希望，灯塔线让他稳定恢复，但两种结局都不能把代价抹平。"
      }
    ]
  },
  {
    id: "lao_qian",
    name: "老钱",
    shortName: "老钱",
    archetype: "旧广播维护者 / 外部信号怀疑者",
    identityTags: ["老人", "电台维护者", "外部信号"],
    ageBand: "elder",
    homeLocation: "communication",
    visualAssetKeys: {
      idle: "image2-lao-qian",
      active: "image2-lao-qian-radio"
    },
    personalGoal: "确认外部信号是否真实，并证明自己的旧电台经验仍然能保护大家。",
    fearOrSecret: "他可能曾经追过假信号，害怕再次把人带进陷阱。",
    auraRelationship: "起初怀疑 AURA 是旧管理者留下的监控工具，后续可能交出最后一次广播。",
    branchStance: {
      rescue: "想相信外面还有人，但必须先验证呼号、时间戳和频道。",
      lighthouse: "认同低功率楼内广播，但不想完全切断外部监听。"
    },
    failureConsequence: "救援频道或信标失败时，他会把怀疑带入 Day 7 公开争论。",
    initialRelationship: {
      characterId: "lao_qian",
      trust: 28,
      tension: 62,
      stance: "resists",
      notes: "把 AURA 看作旧系统的耳朵，而不是可信同伴。"
    },
    relationshipArc: [
      {
        id: "lao-qian-distrusts-old-system",
        day: 1,
        label: "怀疑旧系统",
        summary: "老钱质疑 AURA 是否会把楼内信息传给旧管理者。"
      },
      {
        id: "lao-qian-tests-first-signal",
        day: 4,
        label: "第一次信号伏笔",
        summary: "老钱和 AURA 共同判断红沙干扰中的疑似救援呼号。"
      },
      {
        id: "lao-qian-fears-fake-channel",
        day: 4,
        label: "害怕假频道",
        summary: "救援频道检索失败时，他会把这次失败带到 Day 7，反对盲目高功率广播。",
        trigger: {
          taskId: "D04-T01",
          result: "failed"
        }
      },
      {
        id: "lao-qian-teaches-the-radio",
        day: 6,
        label: "交出旧经验",
        summary: "当 AURA 把电台笔记写成可审计步骤，他开始愿意用自己的旧经验配合它。"
      },
      {
        id: "lao-qian-keeps-both-hypotheses",
        day: 7,
        label: "保留两种解释",
        summary: "分支前夜，他要求 AURA 同时保留救援和诱饵假设，不准把希望包装成事实。"
      },
      {
        id: "lao-qian-hands-over-last-broadcast",
        day: 10,
        label: "最后一次广播",
        summary: "如果证据链足够清楚，他愿意把最后一次广播交给 AURA；若走灯塔线，他保留每天一次外部监听。"
      }
    ]
  }
];

export const characterProfilesById = Object.fromEntries(characterProfiles.map((profile) => [profile.id, profile])) as Record<
  CharacterId,
  CharacterProfile
>;

export function createInitialRelationships(): Record<CharacterId, RelationshipState> {
  return Object.fromEntries(
    characterProfiles.map((profile) => [
      profile.id,
      {
        ...profile.initialRelationship
      }
    ])
  ) as Record<CharacterId, RelationshipState>;
}
