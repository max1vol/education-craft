# TODO

## In Progress
- [x] Fix touch single-tap mining reliability by raycasting from tap position and preserve two-finger placement.
- [x] Move placement VFX spawn outside placed block faces so effect remains visible.
- [x] Update touch input scheme: left joystick movement, right jump button, swipe-look on gameplay canvas, while preserving single-tap destroy and two-finger place.
- [x] Replace previous gameplay with first-person voxel sandbox baseline.
- [x] Refactor world generation into shared module for game + debug renderer.
- [x] Add `/debug-render` top-down and side-view inspection modes.
- [x] Add debug layers for terrain/flora/monument/portal/special scene blocks.
- [x] Add richer environmental detail (trees, foliage, natural decoration) with chunk-culling performance.
- [x] Integrate modern texture pipeline using Nano Banana (3+ variants per key texture family).
- [x] Add style-conditioning workflow using reference textures.
- [x] Select winning texture variants via in-scene/debug comparisons.
- [x] Add explicit run/verify workflow docs (launch app, open browser, interaction checks).
- [x] Add automated screenshot capture into `docs/images/debug`.
- [x] Run checks/build and fix issues.
- [x] Commit and push incremental runnable states to `origin/main`.

## Active Plan (Current Iteration)
- [x] Move gameplay route to thin wrapper and run game from `src/lib` modules/components.
- [x] Add shared world-state module consumed by both game runtime and debug renderer.
- [x] Implement `/debug-render` with orthographic top-down + side views and block-layer toggles.
- [x] Add foliage/detail generation hooks with existing chunk-based culling safeguards.
- [x] Implement texture candidate metadata + debug texture comparison controls.
- [x] Add audio manager with BGM/SFX variation + runtime volume controls.
- [x] Add screenshot automation into `docs/images/debug` and verify images in QA loop.

## Progress Log
- 2026-02-18: Completed repository + TASK audit, including parallel sub-agent gap analysis for architecture and asset/QA pipeline.
- 2026-02-18: Refactored gameplay into `src/lib/components`, added shared world-state module, added `/debug-render` with top + side views and debug layers.
- 2026-02-18: Integrated generated audio manager + runtime volume controls and procedural legal-safe audio assets.
- 2026-02-18: Ran Nano Banana texture candidate generation (style-conditioned references), staged 3+ candidates per key family, selected winners, wired texture pipeline metadata.
- 2026-02-18: Added QA workflow docs (`QA_LOOP.md`, `docs/texture-pipeline.md`, `docs/audio-sources.md`) and screenshot automation script.
- 2026-02-18: Ran browser QA loop with automated captures + `view_image` inspection, tuned spawn orientation and environment density, then re-captured verified screenshots.
- 2026-02-18: Pushed incremental runnable commits to `origin/main` (`e59d179`, `bae96d5`).
- 2026-02-18: Reworked touch controls to left joystick + right jump + swipe-look camera, preserved single-tap destroy/two-finger place, reran screenshot QA loop, and verified build success.
- 2026-02-18: Fixed touch tap mining to use screen-position raycasts and adjusted place VFX to emit outside placed block faces; reran screenshot QA loop.

## Notes
- Forbidden term must not appear in repo content, UI text, commit messages, or generated assets.
- Touch controls requirement: single tap destroys block, two-finger tap places selected block.
