import type { HeroMomentKind } from "./contract";

// Authoritative hero-moment kinds (src/engine/contracts.ts) → glyph + label + CSS accent.
export const HERO_META: Record<HeroMomentKind, { glyph: string; label: string; accent: string }> = {
  branch_fork: { glyph: "⑂", label: "路线分叉", accent: "fork" },
  first_broken_promise: { glyph: "✗", label: "首次毁诺", accent: "broken" },
  relationship_break: { glyph: "✕", label: "关系破裂", accent: "rupture" },
  vent_rupture: { glyph: "!", label: "通风破裂", accent: "rupture" },
  dignity_violation: { glyph: "⚑", label: "尊严违背", accent: "dignity" },
  dirty_win: { glyph: "☹", label: "赢了但脏", accent: "dirty" }
};
