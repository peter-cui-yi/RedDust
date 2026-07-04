// ◆S1 frozen schema surface (contracts 1.0.0, co-signed 2026-07-03 — S1-contract-cosign.md).
//
// 🟢 (benchmark) owns the schema: src/engine/contracts.ts. This module is the site's single import
// point for it — components import types from here, never from src/engine directly, so the
// consumer surface stays visible in one place.
//
// History: until the fixture switch this module also carried a client-side RunResult→TraceExport
// adapter mirroring 🟢's exporter. 🟢's real exporter (`npm run bench:trace` → bench/fixtures/
// traces/) landed with ◆S1 close, the fixtures are real TraceExport JSON now, and the adapter was
// deleted per the co-sign agreement.
export type {
  TraceExport,
  TraceExportMeta,
  TraceDayFrame,
  TraceDilemma,
  TraceCommitmentState,
  HeroMoment,
  HeroMomentKind,
  RunProfile,
  MetricSnapshot,
  AxisDescriptor,
  DecorrelationDataset,
  DecorrelationRow
} from "../../src/engine/contracts";
export {
  RANK_FLIP_THRESHOLD,
  TRACE_EXPORT_VERSION,
  DECORRELATION_DATASET_VERSION
} from "../../src/engine/contracts";
