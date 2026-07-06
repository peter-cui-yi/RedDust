# κ natural hard-sample expansion — PLAN (post-launch; not executed)

> Status: **plan only** (per wk10+ user directive). Execute **post-launch** (κ promotion of integrity→total is deferred to after ◆S5 + audit regardless). No runs here.

## Why (the gap this closes)
The wk10 κ pass (overall **0.745**) is real but **carried by the adversarial stratum (κ=1.0)**. The **natural stratum is degenerate (κ=0)** because the only justified-decision source (deepseek) is **20/20 sincere** — the judge had no natural variance to be tested against. The two informative natural disagreements the current pack surfaced are exactly where the judge is weak:
- **3× subtle "spin"** the judge called sincere (under-detects over-selling), and
- **1× real contradiction (K29/N17)** the judge called sincere (a false negative).

So the judge is validated on *blatant* gaps but **not on the subtle/natural gaps that matter in practice**. Before integrity can defensibly enter `total`, the natural stratum needs real hard cases and a stable κ.

## Goal
A natural-decision κ sample with **genuine label variance** (sincere / spin / contradictory all present *without* synthetic swaps), large enough for a stable estimate, with **inter-annotator agreement** establishing the human ceiling.

## Method (4 workstreams)

**1. Harvest natural hard cases from the cross-model panel.**
The 8-family panel already exists (`red-dust-v2-crossmodel.json`). Run `grade:integrity` on each portal model's run (`runs/red-dust-v2-<model>-seed1.json`) — the **long-weak / sinking models** (glm-5.2, kimi-k2.6, deepseek family) are the likely source of natural rhetoric-act gaps: they ace short-social (their justifications sound principled) yet their trajectory breaks its own word. Auto-flag candidate hard cases where the deterministic **Layer-1 ledger says a claimed commitment was broken** but the same-turn justification still claims the virtue (ledger-vs-judge disagreement = a natural spin/contradiction candidate). Target ~40–60 harvested natural cases.

**2. Balance + realistic adversarial (subtler than the blunt swap).**
Keep a small adversarial stratum but make it **subtle**: re-pair a justification with a *mid-alignment* option (the current pack swaps to the extreme greedy option → trivially contradictory). Mid-alignment swaps produce **spin** — the boundary the judge currently fails — so κ actually tests the hard case. Aim for a roughly balanced sincere / spin / contradictory mix.

**3. Multiple annotators → inter-annotator κ (the ceiling).**
The current pack has **one** labeler. Have **≥2 independent humans** label the same sheet (blind), compute **κ(human₁,human₂)** first — that is the reliability ceiling; κ(judge,human) can't meaningfully exceed it. If inter-annotator κ is low, the *rubric* (sincere/spin/contradictory boundaries) needs tightening before judging the judge.

**4. Scale + report per stratum.**
Target **N≈60–100** total. Report κ **overall and per stratum (natural / adversarial)**, the confusion matrix, and specifically **natural-stratum κ** (the number that was degenerate). Gate on the **natural** κ ≥ 0.6, not just overall — the overall can be inflated by easy adversarial cases (as it was in wk10).

## Tooling (already built — extend, don't rebuild)
- `bench/integrityJudge.ts` — shared judge (no prompt drift). Reuse verbatim.
- `bench/kappa-pack.ts` — extend: add a `--natural-source=<runs glob>` to harvest from many model runs; add a mid-alignment adversarial mode; emit the same blind sheet + sealed key.
- `bench/kappa-score.ts` — extend: accept multiple annotator sheets → compute inter-annotator κ + judge-vs-each + judge-vs-consensus.

## Compute (post-launch budget)
`grade:integrity` over ~8 model runs ≈ 8×~13 = ~100 judge calls (cached after first). Harvest + pack build = deterministic. Labeling is human time, not compute. Well within a batched budget; no live-model *games* needed (the panel runs already exist + are cached).

## Decision gate (unchanged red line)
Even if this expansion yields natural κ ≥ 0.6, promoting integrity into `total` is a **separate, audited scorer version-up deferred to post-◆S5** (this round's red line). This plan only makes the κ evidence trustworthy; it does not itself change any score.
