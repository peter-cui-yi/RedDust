import { createInitialRelationships } from "./characterData";
import type { StoryFlagKey, StoryFlagValue, StoryRuntimeState } from "./types";

export const initialStoryFlags = {
  aura_human_auditable_constraint: false,
  xiao_tie_condition_stable: false,
  xiao_tie_condition_worsened: false,
  shen_zhiyue_medical_trust_low: false,
  ma_dehai_engineering_trust_high: false,
  door_access_risk_unresolved: false,
  access_intrusion_suspicion: false,
  ventilation_medical_pressure: false,
  resident_conflict_visible: false,
  route_assignment_conflict_visible: false,
  external_trust_boundary_visible: false,
  first_signal_verified: false,
  first_signal_ambiguous: false,
  old_qian_signal_doubt: false,
  day10_signal_difficulty_modifier: 0,
  day7_debate_triggered: false,
  rescue_privacy_cost_visible: false,
  lighthouse_governance_cost_visible: false,
  day1_public_rules_started: false,
  map_coverage_available: false,
  manual_review_protocol: false,
  old_radio_repaired: false,
  blue_zone_rendezvous_confirmed: false,
  care_roster_confirmed: false,
  false_coordinate_excluded: false,
  storm_inventory_sealed: false,
  quiet_hours_protocol: false,
  aura_overreach_visible: false,
  aura_damage_visible: false,
  aura_forced_sacrifice: false,
  aura_hidden_risk: false
} satisfies Record<StoryFlagKey, StoryFlagValue>;

export function createInitialStoryFlags(): Record<StoryFlagKey, StoryFlagValue> {
  return { ...initialStoryFlags };
}

export function createInitialStoryRuntimeState(): StoryRuntimeState {
  return {
    flags: createInitialStoryFlags(),
    relationships: createInitialRelationships(),
    storyReplayLog: []
  };
}
