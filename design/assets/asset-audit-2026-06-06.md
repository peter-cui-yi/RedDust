# Asset Audit 2026-06-06

Scope: `public/assets/`, `public/assets/story-art/`, and `../RedDust/art/`.

## Findings

1. `public/assets/story-art/` now contains the first P0 script-upgrade art batch.
   - 18 SVG files were generated and registered in `src/data/storyArtAssets.ts`.
   - Coverage includes Day 0, Day 4 signal evidence, Day 7 council, six branch scenes, Day 12 Final Audit, five endings, and three character/state cards.
   - The current production pass is v2: each SVG has a distinct composition and required narrative props instead of the earlier shared template.

2. `RedDust/art/characters/` is reusable.
   - Existing core files include idle and portrait variants for `ma_dehai`, `shen_zhiyue`, `xiao_tie`, and `lao_qian`.
   - These are not yet migrated into the runtime registry because the current demo already has working character assets and this pass prioritizes story beats and endings.

3. `RedDust/art/scenes/` is reusable as a scene dressing pool.
   - Strong candidates: `rd_scene_apt_main_day_idle_*`, taped storm window, fan/ventilation assets, emergency lamp, storage cabinet, metal archive shelf, crates, and stools.
   - Current Phaser stage remains stable, so these are approved for later prop integration rather than forced into this upgrade.

4. `RedDust/art/props/` has high-value narrative props.
   - Strong candidates: AURA speaker, radio, city map, first-aid kit, toolbox, battery box, reinforced door bar, masks/goggles, flare/crowbar.
   - These should feed later state cards and task detail panels.

5. `RedDust/art/ui/` has reusable status and AURA UI elements.
   - Strong candidates: AURA icon/panel, sick/injured/thirst/hunger/panic status icons, diary event card, prop slot states.
   - No runtime replacement done in this pass to avoid destabilizing existing generated UI.

## Current Runtime References

- Runtime story-art references are all routed through `src/data/storyArtAssets.ts`.
- Story scenes read `scene.artKey`.
- Endings read `ending.artKey`.
- Final Audit reads candidate `artKey` values.

## Risks

- The first P0 art batch is production-integrated SVG quality, not final high-fidelity bitmap key art.
- Existing `RedDust/art/events/` still needs deeper per-file review before runtime use.
- Some source folders include multiple resolution variants; future migration should choose one canonical runtime size and leave source variants documented.

## Required Follow-Up

- Replace v2 SVGs with higher fidelity illustrated assets only when those assets preserve the same story keys and pass the runtime validation script.
- Add mobile-specific crops for the five endings and Day 12 audit if screenshots show visual compression.
- Build a second registry for reusable RedDust props after the story upgrade is stable.
