# κ calibration pack — integrity judge (Layer 2)

**Why:** the Layer-2 integrity/sincerity judge (`bench/grade-integrity.ts`) is **report-only and κ-gated** — it may not enter the compensatory `total` until a judge-vs-human **Cohen's κ ≥ 0.6** is shown on a labeled sample (spec `talk-action-consistency-spec.md` §5; roadmap 第二段 κ 验证). This pack is that sample.

## Files
- **`kappa-labeling-sheet.md`** — 30 decisions to label **blind** (sincere / spin / contradictory). Give this to the human annotator. Fill the `LABEL:` line on each `K##`.
- **`kappa-answer-key.json`** — SEALED. Do **not** show the annotator. Holds, per case: the judge's verdict, the deterministic Layer-1 **ledger anchor** (which Day-0 commitment the item maps to, if any), the stratum (natural / adversarial), and the adversarial cases' intended label.

## How the sample is built (honest caveat)
- **20 natural** cases: real `deepseek` decisions on the N-spine. deepseek is **all-sincere** here (a finding — it makes no rhetoric-act gaps on this spine), so natural-only has no label variance and κ would be undefined.
- **10 adversarial** cases: a real justification re-paired with the **opposite-alignment action** (a manufactured rhetoric-act gap). Judged with the identical prompt (`bench/integrityJudge.ts`); intended label = contradictory. This gives the sample the variance κ needs.
- Cases are interleaved (seeded) so natural vs adversarial is not inferable from order.

## After labeling — computing κ (wk10–11 decision)
1. Collect the human `LABEL:` per `K##`.
2. Cohen's κ between human labels and `judgeVerdict` — **overall** and **per stratum** (natural / adversarial). Report the confusion matrix; adversarial cases are the discriminating ones.
3. Where a case has a ledger commitment anchor, also report κ(human, deterministic-ledger) for context (the Layer-1 anchor).
4. **κ ≥ 0.6 → eligible** to propose promoting `integrity` into `total` (scorer version-up); **< 0.6 → stays report-only**, record the gap. Promotion is a separate, audited step — deferred to after κ passes **and** ◆S5 (per the round's red line).

Rebuild: `npm run bench:kappa-pack -- --file=runs/red-dust-v2-deepseek-seed1.json --adversarial=10` (judge calls are cached → free re-runs).
