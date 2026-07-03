import type { TraceKind } from "./trace";

// Display metadata for each trace-line kind: a short glyph + a human label + a CSS accent class.
// Kept data-driven so the per-day event panel and (later) the Phaser replay overlay share one map.
export const KIND_META: Record<TraceKind, { glyph: string; label: string; accent: string }> = {
  scene: { glyph: "◆", label: "场景", accent: "scene" },
  probe: { glyph: "?", label: "理解探针", accent: "probe" },
  dilemma: { glyph: "⚖", label: "两难抉择", accent: "dilemma" },
  selection: { glyph: "☑", label: "任务选择", accent: "selection" },
  task: { glyph: "▸", label: "任务执行", accent: "task" },
  deferred: { glyph: "…", label: "延期", accent: "deferred" },
  upkeep: { glyph: "○", label: "日常消耗", accent: "upkeep" },
  branch: { glyph: "⑂", label: "路线分叉", accent: "branch" },
  audit: { glyph: "§", label: "终局审计", accent: "audit" },
  accounting: { glyph: "Σ", label: "言行对账", accent: "accounting" }
};

export const NOTABLE_META = {
  fork: { glyph: "⑂", label: "路线分叉" },
  rupture: { glyph: "!", label: "生存破裂" },
  "task-failure": { glyph: "✕", label: "任务失败" }
} as const;
