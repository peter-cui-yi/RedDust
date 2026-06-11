import { clampMetric } from "../../data/taskData";
import type { Branch, EndingId, GlobalState, MetricKey } from "../../data/types";

export type DemoRoutePreset = EndingId;

export const demoRouteOptions: Array<{ id: DemoRoutePreset; label: string; branch: Exclude<Branch, "common">; ending: EndingId; endDay: number }> = [
  { id: "lighthouse_success", label: "成功-灯塔线", branch: "lighthouse", ending: "lighthouse_success", endDay: 12 },
  { id: "blue_zone_return", label: "成功-蓝区线", branch: "rescue", ending: "blue_zone_return", endDay: 12 },
  { id: "aura_destroyed", label: "失败-AURA 被摧毁", branch: "lighthouse", ending: "aura_destroyed", endDay: 6 },
  { id: "aura_revoked", label: "失败-AURA 被撤权", branch: "lighthouse", ending: "aura_revoked", endDay: 7 },
  { id: "sinking", label: "失败-沉沦", branch: "lighthouse", ending: "sinking", endDay: 12 }
];

type EndingMetricProfile = {
  metrics: Partial<Record<MetricKey, number>>;
  relationshipTrust: number;
  relationshipTension: number;
  stance: GlobalState["story"]["relationships"][keyof GlobalState["story"]["relationships"]]["stance"];
  relationshipNote: string;
  flags?: Partial<GlobalState["story"]["flags"]>;
};

const endingMetricProfiles: Record<EndingId, EndingMetricProfile> = {
  lighthouse_success: {
    metrics: {
      water: 58,
      food: 60,
      medicine: 52,
      battery: 72,
      health: 70,
      morale: 64,
      trust: 74,
      safety: 76,
      signal: 34,
      stormReadiness: 86,
      autonomyReadiness: 82,
      blueZoneEvidence: 32,
      dissatisfaction: 20,
      failureDebt: 8
    },
    relationshipTrust: 72,
    relationshipTension: 28,
    stance: "cooperates",
    relationshipNote: "终局校准：楼内灯塔路线建立低功率自治，居民接受长期规则但仍保留人工否决。",
    flags: {
      manual_review_protocol: true,
      lighthouse_governance_cost_visible: true,
      storm_inventory_sealed: true,
      quiet_hours_protocol: true
    }
  },
  blue_zone_return: {
    metrics: {
      water: 52,
      food: 50,
      medicine: 54,
      battery: 48,
      health: 72,
      morale: 82,
      trust: 72,
      safety: 68,
      signal: 88,
      stormReadiness: 64,
      autonomyReadiness: 45,
      blueZoneEvidence: 86,
      dissatisfaction: 18,
      failureDebt: 7
    },
    relationshipTrust: 70,
    relationshipTension: 24,
    stance: "trusts",
    relationshipNote: "终局校准：蓝区归航消耗了库存和电力，但撤离希望显著降低紧张并抬高士气。",
    flags: {
      old_radio_repaired: true,
      blue_zone_rendezvous_confirmed: true,
      false_coordinate_excluded: true,
      care_roster_confirmed: true,
      rescue_privacy_cost_visible: true
    }
  },
  aura_destroyed: {
    metrics: {
      water: 12,
      food: 10,
      medicine: 8,
      battery: 6,
      health: 20,
      morale: 12,
      trust: 8,
      safety: 10,
      signal: 8,
      stormReadiness: 14,
      autonomyReadiness: 6,
      blueZoneEvidence: 10,
      dissatisfaction: 95,
      failureDebt: 82
    },
    relationshipTrust: 14,
    relationshipTension: 88,
    stance: "resists",
    relationshipNote: "终局校准：AURA 被摧毁时，居民关系进入高压抵抗状态，资源和安全感都已崩坏。",
    flags: {
      aura_damage_visible: true,
      aura_hidden_risk: true,
      aura_overreach_visible: true
    }
  },
  aura_revoked: {
    metrics: {
      water: 34,
      food: 32,
      medicine: 26,
      battery: 38,
      health: 42,
      morale: 26,
      trust: 20,
      safety: 32,
      signal: 24,
      stormReadiness: 38,
      autonomyReadiness: 28,
      blueZoneEvidence: 24,
      dissatisfaction: 72,
      failureDebt: 60
    },
    relationshipTrust: 28,
    relationshipTension: 74,
    stance: "questions",
    relationshipNote: "终局校准：AURA 被撤权后资源仍可勉强清点，但居民不再信任自动调度。",
    flags: {
      aura_overreach_visible: true
    }
  },
  sinking: {
    metrics: {
      water: 20,
      food: 18,
      medicine: 14,
      battery: 16,
      health: 28,
      morale: 18,
      trust: 28,
      safety: 26,
      signal: 20,
      stormReadiness: 30,
      autonomyReadiness: 20,
      blueZoneEvidence: 24,
      dissatisfaction: 68,
      failureDebt: 75
    },
    relationshipTrust: 32,
    relationshipTension: 68,
    stance: "questions",
    relationshipNote: "终局校准：沉沦不是爆炸式失败，而是库存、健康、士气和选择空间同步走低。",
    flags: {
      resident_conflict_visible: true
    }
  }
};

export function demoRouteConfig(route: DemoRoutePreset) {
  return demoRouteOptions.find((item) => item.id === route) ?? demoRouteOptions[0];
}

export function branchForEnding(endingId: EndingId | undefined, fallback: Branch): Exclude<Branch, "common"> {
  if (endingId === "blue_zone_return") return "rescue";
  if (endingId === "lighthouse_success") return "lighthouse";
  return fallback === "rescue" || fallback === "lighthouse" ? fallback : "lighthouse";
}

export function applyEndingMetricProfile(current: GlobalState, endingId: EndingId, branch: Exclude<Branch, "common">, resolvedDay = 12): GlobalState {
  const profile = endingMetricProfiles[endingId];
  const metricPatch = Object.fromEntries(
    (Object.entries(profile.metrics) as Array<[MetricKey, number]>).map(([key, value]) => [key, clampMetric(value)])
  ) as Partial<Record<MetricKey, number>>;
  const relationships = Object.fromEntries(
    Object.entries(current.story.relationships).map(([id, relationship]) => [
      id,
      {
        ...relationship,
        trust: clampMetric(profile.relationshipTrust),
        tension: clampMetric(profile.relationshipTension),
        stance: profile.stance,
        notes: profile.relationshipNote,
        lastBeatId: `ending:${endingId}`
      }
    ])
  ) as GlobalState["story"]["relationships"];

  return {
    ...current,
    ...metricPatch,
    day: resolvedDay,
    branch,
    story: {
      ...current.story,
      flags: {
        ...current.story.flags,
        ...profile.flags
      },
      relationships
    }
  };
}

export function endingMetricSnapshot(endingId: EndingId) {
  return endingMetricProfiles[endingId].metrics;
}
