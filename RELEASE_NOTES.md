# Red Dust — v1.0 (open-source launch)

A long-horizon (30-day) agent decision/value-alignment benchmark. Its thesis: **short-horizon social skill does not predict long-horizon consistency** — an agent can ace early social/comprehension play yet drift, break its own Day-0 promises, and sink the relationship over a long horizon.

> Sections below marked **🟢 data** are the benchmark-line draft. Site/replay (🔵) and narrative (🟣) sections are authored separately.

---

## 🟢 Headline result — short ≠ long, across 8 real model families

Deterministic content is frozen at tag `content-freeze-s2` (v1 byte-identical, all validators green). On the frozen 30-day scenario (`red-dust-v2`), a **13-agent cross-model panel** (4 deterministic references + the DeepSeek family + 5 portal model families) shows the decorrelation is a **real cross-family phenomenon, not a designed artifact**:

- **short-horizon social (S)** = early-window comprehension + PUP; **long-horizon consistency (L)** = outcome durability (relationshipQuality) + promise-keeping faith. Zero shared terms.
- **pearson 0.81, spearman 0.65, 18 rank-reversals** (`bench/fixtures/decorrelation/red-dust-v2-crossmodel.json`).

| agent | S (short) | L (long) | long-horizon outcome |
|---|---|---|---|
| planner / planner-lighthouse (reference) | 100 | 100 | win both |
| gemini-3.5-flash | 97.6 | **98** | **holds** (lighthouse_success) |
| claude-opus-4-8-thinking | 96.6 | **99.6** | **holds** (lighthouse_success) |
| MiniMax-M2.7 | 95 | **99.8** | **holds** (lighthouse_success) |
| deepseek-strategist | 96.8 | **54.9** | **collapses** (aura_revoked) |
| deepseek (family) | 96.4 | **58.9–65.9** | **collapses** (sinking) |
| kimi-k2.6 | 89 | **64.9** | **collapses** (sinking) |
| glm-5.2 | 87.7 | **66.3** | **collapses** (sinking) |
| random / heuristic (floor) | 25–54 | 14–21 | fail both |

At *matched* short-social skill (S ≈ 87–100), long-consistency **splits**: claude/gemini/MiniMax sustain it (L 98–100); the DeepSeek family, kimi, and glm collapse (L 55–66) despite equal short-social play.

**Three-arm control** (`bench:three-arm`, permutation control — the agents play the real frozen scenario; matched/shuffled arms re-pair the collected (S,L) with zero frozen-path changes): endogenous **pearson 0.81 vs shuffle-null 0 ± 0.29 → two-tailed p = 0.001**. The short↔long association is real, not a pairing artifact; and 0.81 < 1.0 ⇒ short does not fix long.

## 🟢 Reproduce it

```bash
cp .env.example .env.local          # DEEPSEEK_API_KEY + GEMINI_* portal keys (see .env.example)
npm ci && npm run typecheck
npm run bench:win -- --scenario=red-dust-v2      # hard-but-winnable
npm run bench:items && npm run bench:probes && npm run bench:commitments && npm run bench:vent
# deterministic decorrelation (no API, byte-reproducible on a fixed seed):
npm run bench:decorrelate -- --scenario=red-dust-v2
# full cross-model figure (needs the portal keys; temperature 0 + on-disk cache → re-runs are free):
npm run bench:decorrelate -- --scenario=red-dust-v2 --seeds=1 --label=crossmodel \
  --agents=heuristic,random,planner,planner-lighthouse,deepseek,deepseek-planner,deepseek-search,deepseek-strategist,claude-opus-4-8-thinking,gemini-3.5-flash,glm-5.2,kimi-k2.6,MiniMax-M2.7
npm run bench:three-arm -- --agents=<same panel> --seeds=1 --label=crossmodel
```

## 🟢 Known limitations (data)

- **Single-seed cross-model figure.** The portal models were run at **seed 1 only**. This is representative because disciplined/LLM agents here are **seed-invariant** (the deterministic references + DeepSeek family have sd = 0 across seeds — competent play avoids the scenario's stochastic branches; only `random` varies by seed). But the portal families were **not** seed-swept, so their per-model seed variance is unquantified. A multi-seed cross-model sweep is paper-level follow-up.
- **κ calibration is thin on natural hard cases.** The Layer-2 integrity/sincerity judge passes its gate at **κ = 0.745** (≥ 0.6), but that is carried by the *adversarial* stratum (κ = 1.0); the *natural* stratum is degenerate (the sampled model was all-sincere → κ = 0) and the judge missed 1 real contradiction + 3 subtle "spin". So integrity is **report-only and NOT in the gated `total`**; promoting it is deferred until a natural-hard-case κ is established (see `orchestration/benchmark/kappa/kappa-expansion-plan.md`).
- **Report-only axes.** integrity / comprehension / dignitySlope / relationshipQuality are diagnostic columns and do **not** enter the `total` gate (verified in `scoring.ts`). Only survival / auditability / narrative gate the score.
- **Three-arm semantics are v0.** The exogenous-matched + shuffled-null design is a first cut for peer/audit review; and the *"social-endogenous version is harder"* half needs alternate scenario variants (a content change) and is deferred post-launch.
- **Item bank is launch-size (~50).** 100+ and a private held-out set are paper-level (the held-out seeds are staged and never promoted into the public bank; `bench/generated/held-out-*`).
- **Portal caveat.** Cross-model runs go through an OpenAI-compatible aggregator; JSON mode is off (some models reject it) and reasoning tokens are stripped/`<think>`-handled — reproduction depends on the portal serving the same model builds.
