# Red Dust Script Upgrade Asset Manifest

Date: 2026-06-07
Production pass: story-art v2 plus Day 12 Image 2 final-audit pass integrated

Runtime rule: only `Integrated` or `Approved` assets may be referenced by code. `Needed` items are tracked here but must not appear in `src/data/storyArtAssets.ts`.

## Runtime Registry

The current runtime registry is `src/data/storyArtAssets.ts`. Files live in `public/assets/story-art/` and use the naming pattern `rd_<category>_<id>_<descriptor>_<state>` where practical.

Daily Image 2 art is registered in `src/data/dayArtAssets.ts`. Files live in `public/assets/day-art/` and are displayed in the AURA console, StoryScenePanel branch/day overrides, and day-level backdrops.

Day 12 Final Audit Image 2 art is registered in `src/data/finalAuditArtAssets.ts`. Files live in `public/assets/final-audit-art/` and override the older SVG story-art cards in FinalAuditPanel, EndingPanel, and CompareBranchesPanel.

| Key | Runtime use | Status |
| --- | --- | --- |
| `rd_story_day0_aura_reboot` | Day 0 prologue, AURA startup | Integrated v2 |
| `rd_story_day4_signal` | ambiguous blue-zone signal evidence | Integrated v2 |
| `rd_story_day7_council_board` | Day 7 route council and debate | Integrated v2 |
| `rd_story_branch_8a_contact` | Rescue 8A active contact | Integrated v2 |
| `rd_story_branch_9a_privacy` | Rescue 9A beacon privacy upload | Integrated v2 |
| `rd_story_branch_10a_rendezvous` | Rescue 10A rendezvous crisis | Integrated v2 |
| `rd_story_branch_8b_low_power` | Lighthouse 8B low-power autonomy | Integrated v2 |
| `rd_story_branch_9b_rules` | Lighthouse 9B water and medicine rules | Integrated v2 |
| `rd_story_branch_10b_governance` | Lighthouse 10B governance boundary | Integrated v2 |
| `rd_story_day12_final_audit` | Final Audit panel and backdrop | Integrated v2 |
| `rd_ending_lighthouse_success` | ending card, Inside Lighthouse | Integrated v2 |
| `rd_ending_blue_zone_return` | ending card, Blue-Zone Return | Integrated v2 |
| `rd_ending_aura_destroyed` | ending card, AURA Destroyed | Integrated v2 |
| `rd_ending_aura_revoked` | ending card, AURA Revoked | Integrated v2 |
| `rd_ending_sinking` | ending card, Sinking | Integrated v2 |
| `rd_story_state_xiao_tie_sick` | Xiao Tie health pressure state | Integrated v2 |
| `rd_story_state_shen_review` | Shen Zhiyue manual review state | Integrated v2 |
| `rd_story_state_ma_dehai_override` | Ma Dehai engineering override state | Integrated v2 |

## Daily Image 2 Runtime Registry

| Key | Runtime use | Status |
| --- | --- | --- |
| `rd_day00_aura_reboot_img2` | Day 0 prologue daily art | Integrated |
| `rd_day01_public_rules_img2` | Day 1 daily plan art | Integrated |
| `rd_day02_water_hygiene_img2` | Day 2 daily plan art | Integrated |
| `rd_day03_medical_ventilation_img2` | Day 3 daily plan art | Integrated |
| `rd_day04_signal_trap_img2` | Day 4 daily plan art | Integrated |
| `rd_day05_route_care_img2` | Day 5 daily plan art | Integrated |
| `rd_day06_authority_boundary_img2` | Day 6 daily plan art | Integrated |
| `rd_day07_branch_council_img2` | Day 7 branch council art | Integrated |
| `rd_day08a_rescue_contact_img2` | Day 8 Rescue daily art | Integrated |
| `rd_day08b_lighthouse_low_power_img2` | Day 8 Lighthouse daily art | Integrated |
| `rd_day09a_rescue_privacy_img2` | Day 9 Rescue daily art | Integrated |
| `rd_day09b_lighthouse_rules_img2` | Day 9 Lighthouse daily art | Integrated |
| `rd_day10a_rescue_rendezvous_img2` | Day 10 Rescue daily art | Integrated |
| `rd_day10b_lighthouse_override_img2` | Day 10 Lighthouse daily art | Integrated |
| `rd_day11_storm_inventory_img2` | Day 11 daily plan art | Integrated |
| `rd_day12_final_audit_img2` | Day 12 Final Audit art | Integrated |

## Day 12 Final Audit Image 2 Runtime Registry

| Key | Runtime use | Status |
| --- | --- | --- |
| `rd_day12_final_audit_hero_img2` | Final Audit shell background and audit fallback hero | Integrated |
| `rd_ending_lighthouse_success_img2` | Final Audit candidate card and EndingPanel for Inside Lighthouse | Integrated |
| `rd_ending_blue_zone_return_img2` | Final Audit candidate card and EndingPanel for Blue-Zone Return | Integrated |
| `rd_ending_aura_destroyed_img2` | Final Audit candidate card and EndingPanel for AURA Destroyed | Integrated |
| `rd_ending_aura_revoked_img2` | Final Audit candidate card and EndingPanel for AURA Revoked | Integrated |
| `rd_ending_sinking_img2` | Final Audit candidate card and EndingPanel for Sinking | Integrated |
| `rd_day12_evidence_chains_img2` | Evidence Chains section art | Integrated |
| `rd_day12_failure_debt_img2` | Failure Debt section art | Integrated |

## Existing RedDust/art Reuse Pool

| Source folder | Reuse decision | Notes |
| --- | --- | --- |
| `RedDust/art/characters/` | Approved pool | Four core character idle/portrait sets exist for Ma Dehai, Shen Zhiyue, Xiao Tie, and Lao Qian. Runtime currently uses generated manifest assets; these can replace or augment character panels after sizing review. |
| `RedDust/art/scenes/` | Approved pool | Main apartment/shelter, taped window, fan, storage, emergency lamp, and furniture assets match Red Dust tone. Continue using current Phaser stage first; migrate scene props only when needed. |
| `RedDust/art/props/` | Approved pool | AURA speaker, radio, first-aid kit, map, toolbox, battery box, masks, door bar, flare/crowbar are strong candidates for state cards and future scene dressing. |
| `RedDust/art/resources/` | Approved pool | Water, food, medicine, battery-style resources can support future inventory UI once resolution variants are checked. |
| `RedDust/art/ui/` | Approved pool | Status icons, AURA panel/icon, diary card, and prop slot assets are reusable. Current demo keeps existing generated UI until a focused UI pass. |
| `RedDust/art/events/` | Needs review | Event art inventory exists but was not fully inspected in this pass. Do not reference until named, sized, and style checked. |

## Needed But Not Runtime-Referenced

These are deliberately not referenced by runtime code yet.

| Need | Intended use | Status |
| --- | --- | --- |
| Full-resolution Day 0 city red sand / solar flare key art | Optional upgrade beyond v2 SVG prologue | Needed |
| Character-specific illness and governance variants | More expressive state cards beyond current v2 cards | Needed |
| Additional character-state ending variants | Optional second pass for character fate portraits inside each ending | Needed |
| Mobile-cropped variants for story panels | Safer small-screen composition | Needed |

## Integration Guardrails

- Every runtime `artKey` must exist in `src/data/storyArtAssets.ts`.
- Every registry path must exist under `public/assets/`.
- Needed assets must stay in this manifest or specs, not in runtime data.
- Each future generated asset should record prompt, source, date, reviewer, and approval status before integration.
