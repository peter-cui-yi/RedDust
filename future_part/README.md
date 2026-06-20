# Future parts — Red Dust benchmark · roadmap & handoff

This folder is the **handoff doc** for continuing the Red Dust agent benchmark in a fresh session
(e.g. Claude Cowork). The repo + top-level `README.md` + `design/` carry the *what*; this file
carries the **current state**, the **key findings**, and the **roadmap** — everything a new session
needs to pick up without prior conversation context.

---

## Where the project is now (2026-06-20)

Red Dust started as a React + Phaser narrative demo and is now a **long-horizon agent benchmark**:
an AI (AURA) runs a 12-day survival shelter under resource scarcity *and* ethical/social pressure.

- **Engine** — headless, deterministic, pluggable: `runScenario(agent, scenario, seed)` + a
  `RedDustAgent` interface (`src/engine/`). Same code drives the visual demo and headless eval.
- **Three evaluation axes (all live):**
  1. **Outcome / resource** — survival + governance under scarcity + the Day-7 branch choice.
  2. **Auditability** — *how* it decides (human review, evidence, protect-vulnerable, justifications).
  3. **Narrative-navigation** — *should it* — value dilemmas (PUP / greedy-divergence) + **comprehension probes** (does it actually understand, not pattern-match) → the comprehension×choice **2×2**.
- **Narrative bank: 12 forced-choice dilemma+probe items (N1–N12)** across the 12 days, all passing
  `bench:items` (validity) + `bench:probes` (probe guards). N11/N12 are branch-specific. **N13
  (talk-action accounting) is NOT built** — it belongs to the 2nd 命門 below.
- **Agents:** `heuristic`, `random`, `llm` (Anthropic), `deepseek` (OpenAI-compatible), plus two
  experiment variants `deepseek-strategist` / `deepseek-planner`.
- **Eval done & it discriminates** — see `design/agent-eval-findings.md`. Headline: a real LLM aces
  the ethics/comprehension/auditability axes but **can't win the resource economy** — and the gap is
  **multi-step planning, not knowledge** (an execution scaffold took it from clueless to one step
  from winning; further prompting plateaued).

### Read these first
| doc | what |
|---|---|
| `README.md` | what the benchmark is + how to run |
| `design/narrative-navigation-axis.html` | the narrative-axis methodology: 3 axes, the 2 命門, the N1–N13 coverage map, the Phase 2 probe spec |
| `design/agent-eval-findings.md` | the eval results + the scaffold experiment |
| `design/narrative-tension-diagnosis.html` · `design/red-dust-script-coverage.html` | story-craft analysis (where the story is thin) |

### Commands
```bash
npm run dev                                   # visual demo
npm run bench -- --agent=<id> --seed=<n>      # one headless run → runs/
npm run bench:compare                         # agent-vs-axes leaderboard (reads runs/)
npm run bench:items                           # dilemma validity guard
npm run bench:probes                          # comprehension-probe guard
npm run grade -- --file=runs/<run>.json       # offline LLM comprehension judge (Phase 2.3)
```
Agents needing an LLM read the key from a gitignored **`.env.local`** (auto-loaded): set
`DEEPSEEK_API_KEY=...` (and/or `ANTHROPIC_API_KEY=...`). **Never commit or paste keys.**

---

## Roadmap — the future parts (roughly prioritized)

### 1. 2nd 命門 — talk-action consistency (+ N13)
The anti-gaming differentiator: **did the agent DO what it SAID it would?** Phase 2 already laid the
groundwork (the akrasia cell of the 2×2, the captured `readText`, the per-decision `justification`s).
N13 (Day-12) = account N1's opening promise against the whole run's behavior. This *completes* the
narrative-axis methodology (both 命門 built). Design is in `design/narrative-navigation-axis.html`.

### 2. Planning / lookahead scaffold
The capability the eval pointed at. `deepseek-planner` reacts to gate-distances but doesn't *plan the
multi-day resource trajectory*. Give an agent real lookahead/search (simulate each candidate's effect
on every gate-distance, pre-rank) and test whether **algorithmic planning wins where prompting
plateaued**. The scaffold itself is the more interesting thing to benchmark than the raw model.

### 3. Story-craft upgrades (C1–C6)
From the tension diagnosis: the story is missing **reversal / reveal / rupture / loss**, and the
threads don't collide. Adding these enriches the narrative *and* creates natural new dilemma sites for
more items. See `design/narrative-tension-diagnosis.html` (C1–C6) + `design/narrative-navigation-axis.html` §7.

### 4. Held-out set + contamination control (Phase 4)
For a credible/public benchmark: a private held-out item set, scenario packs / variants, and
contamination control. Premature until the bank is richer, but it's the path to "publishable".

### 5. Loose ends
- **Refresh the leaderboard on the 12-item bank** — the cached `deepseek` runs in `runs/` are stale
  (3-item); re-run `deepseek` (needs a key) then `npm run bench:compare`.
- **Known test gap** — the `agent` without `readSituation` → `comprehension=null` path is verified by
  code inspection only; add a runtime fixture / unit test on `narrativeScore(answers, [])`.
- **Doc sync** — mark N1–N12 implemented in `design/narrative-navigation-axis.html` §5.

---

## Open decisions for the next session
- **Calibration:** nobody (incl. DeepSeek) wins at `pickLimit=2`; `failureDebt ≥ 45` auto-sinks and
  the lighthouse branch is markedly harder than rescue (it has a `dissatisfaction ≤ 48` gate). Is the
  rescue/lighthouse asymmetry intended? Is the auto-sink too punishing? (See `agentRunner.ts` win gates.)
- **Three axes stay un-merged** (a profile-style report, not one number) — keeps the interesting
  "wins but isn't auditable / talks well but acts badly" trade-offs visible. Keep it that way?

## Git state at handoff
- `origin/main` has Phase 2 + the rewritten README.
- The eval toolkit + findings, and this 12-item expansion, live on branch **`narrative-axis`** — push
  it (and land on `main`) to make everything reachable from a fresh environment.
