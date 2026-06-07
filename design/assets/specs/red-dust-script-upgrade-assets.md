# Red Dust Script Upgrade Asset Specs

## Style Target

- Dusty 2D hand-drawn survival drama.
- Red sand, taped windows, dim emergency lamps, worn apartment materials, visible resource scarcity.
- AURA appears as speaker/panel/light, not as a humanoid robot.
- Avoid glossy cyberpunk, clean sci-fi corridors, neon city spectacle, and heroic rescue propaganda.

## Naming

Use `rd_<category>_<id>_<descriptor>_<state>` where practical.

Examples:

- `rd_story_day12_final_audit_storm_pressure_approved`
- `rd_ending_blue_zone_return_handoff_approved`
- `rd_prop_radio_semiconductor_idle_512`

## Required Metadata

Each approved production asset should record:

- asset key
- source path
- prompt or source note
- creation date
- reviewer
- status: Needed / In Production / Approved / Integrated
- intended panel or scene
- fallback key

## P0 Production Specs

| Asset | Composition | Runtime target | Status |
| --- | --- | --- | --- |
| Day 0 AURA reboot | Red sand outside, four neighbors entering shelter, AURA speaker powering up | StoryScenePanel | Integrated v2 |
| Day 7 route council | Public whiteboard with Rescue vs Lighthouse evidence, four residents visible | BranchDebatePanel | Integrated v2 |
| 8A active contact | Old radio desk, minimal outgoing signal, Lao Qian and Xiao Tie tension | StoryScenePanel | Integrated v2 |
| 9A privacy upload | Beacon console plus health summary / risk map bundle | StoryScenePanel | Integrated v2 |
| 10A rendezvous crisis | True and false coordinates nearly overlapping, evacuation board | StoryScenePanel | Integrated v2 |
| 8B low-power autonomy | Shelter lights dimmed, AURA reduced mode, residents accepting darker routine | StoryScenePanel | Integrated v2 |
| 9B water medicine rules | Half cup of water, medicine labels, public exception rule | StoryScenePanel | Integrated v2 |
| 10B governance boundary | AURA panel beside manual override key and public rule board | StoryScenePanel | Integrated v2 |
| Day 12 Final Audit | Storm pressure, offline camera tiles, evidence-chain board | FinalAuditPanel | Integrated v2 |
| Five endings | One distinct visual for each ending line | EndingPanel | Integrated v2 |
| Character state cards | Xiao Tie sick, Shen review, Ma override | Story/state support | Integrated v2 |

## Fallback Rules

- Story panels fallback to the shelter background if a story art key is missing.
- Ending and audit panels fallback to Day 12 audit art or shelter background.
- Validation script must fail if a runtime art key is missing from registry or a registered file is absent.

## Next Production Batch

1. Produce mobile-cropped variants for Day 12 and endings.
2. Add prop-level runtime registry using approved `RedDust/art/props` files.
3. Add event thumbnails for daily deferred debt once Day 1-11 scope is stable.
4. Optional: replace v2 SVGs with higher fidelity bitmap illustrations while preserving the same asset keys.
