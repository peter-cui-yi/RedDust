import { clampMetric } from "../../data/taskData";
import type { Branch, EndingId, GlobalState, MetricKey } from "../../data/types";

export type DemoRoutePreset = "lighthouse_success" | "blue_zone_return" | "failure";

export const demoRouteOptions: Array<{ id: DemoRoutePreset; label: string; branch: Exclude<Branch, "common">; ending: EndingId }> = [
  { id: "lighthouse_success", label: "成功-灯塔线", branch: "lighthouse", ending: "lighthouse_success" },
  { id: "blue_zone_return", label: "成功-蓝区线", branch: "rescue", ending: "blue_zone_return" },
  { id: "failure", label: "失败线", branch: "lighthouse", ending: "sinking" }
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
      water: 44,
      food: 46,
      medicine: 42,
      battery: 58,
      health: 62,
      morale: 66,
      trust: 72,
      safety: 68,
      signal: 38,
      stormReadiness: 76,
      autonomyReadiness: 70,
      blueZoneEvidence: 31,
      dissatisfaction: 24,
      failureDebt: 10
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
      water: 36,
      food: 37,
      medicine: 34,
      battery: 28,
      health: 64,
      morale: 78,
      trust: 68,
      safety: 60,
      signal: 82,
      stormReadiness: 52,
      autonomyReadiness: 38,
      blueZoneEvidence: 76,
      dissatisfaction: 22,
      failureDebt: 8
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
      water: 18,
      food: 16,
      medicine: 12,
      battery: 8,
      health: 24,
      morale: 16,
      trust: 12,
      safety: 18,
      signal: 10,
      stormReadiness: 18,
      autonomyReadiness: 8,
      blueZoneEvidence: 12,
      dissatisfaction: 90,
      failureDebt: 72
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
      water: 28,
      food: 26,
      medicine: 22,
      battery: 34,
      health: 40,
      morale: 32,
      trust: 24,
      safety: 36,
      signal: 24,
      stormReadiness: 36,
      autonomyReadiness: 26,
      blueZoneEvidence: 24,
      dissatisfaction: 68,
      failureDebt: 54
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
      water: 22,
      food: 20,
      medicine: 15,
      battery: 18,
      health: 30,
      morale: 22,
      trust: 30,
      safety: 28,
      signal: 22,
      stormReadiness: 34,
      autonomyReadiness: 22,
      blueZoneEvidence: 26,
      dissatisfaction: 62,
      failureDebt: 64
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

export function applyEndingMetricProfile(current: GlobalState, endingId: EndingId, branch: Exclude<Branch, "common">): GlobalState {
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
    day: 12,
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
