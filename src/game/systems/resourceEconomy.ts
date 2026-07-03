// Re-export shim. The resource-economy core MIGRATED to src/engine/resourceEconomy.ts (◆S1 wk2,
// user/audit-approved 2026-07-03) so the 🟢 benchmark line owns "经济口径" in src/engine/*. This shim
// preserves the historical import path `game/systems/resourceEconomy` for the UI/game consumers, which
// remain 12-day (they call the upkeep fns without an UpkeepPhases arg → DEFAULT_UPKEEP_PHASES_V1).
export * from "../../engine/resourceEconomy";
