# TODO

## In Progress
- [x] Replace generated BGM set with licensed downloaded tracks and in-repo attribution/license notes.
- [x] Add iPhone-safe-area layout handling for touch controls/HUD in portrait and landscape.
- [x] Add `/version` route with commit hash, human-readable label, and recent changelog history.
- [x] Keep FPS as compact corner indicator (no top banner HUD).
- [x] Rework desktop screenshot capture settings/state and recapture representative desktop screenshots.
- [x] Make `/version` canonical and redirect `/release` to `/version`.
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
- 2026-02-18: Replaced generated BGM files with licensed OpenGameArt tracks, added audio attribution/license docs, and verified browser audio asset loading.
- 2026-02-18: Added safe-area-aware iPhone HUD/touch layout (`viewport-fit=cover` + `env(safe-area-inset-*)`) and validated portrait/landscape screenshots.
- 2026-02-18: Added canonical `/version` route with repo-linked commit/changelog data and redirected `/release` to `/version`.
- 2026-02-18: Simplified HUD to compact FPS corner chip and reworked desktop screenshot capture settings, then recaptured/validated desktop game/debug/version images.
- 2026-02-18: Monument Realms screenshot QA Batch 1 reviewed 8 specified captures; flagged low exposure/underlit monuments, texture tiling seams in closeups, and confirmed iPhone portrait touch HUD fit.
- 2026-02-18: Monument Realms screenshot QA Batch 2 reviewed 8 specified captures; found path-content mismatches (monument-labeled files showing version texture compare UI), `/version` screenshots showing skeleton/loading state, and destroy-after gameplay frames still underexposed but with clear desktop/touch HUD controls.
- 2026-02-18: Monument Realms screenshot QA Batch 3 reviewed 8 specified captures; found persistent underexposure, weak colosseum/aqueduct framing, Skara closeup filename-content mismatch (Stonehenge shown), and clear destroy before/after state change evidence.
- 2026-02-18: Monument Realms screenshot QA Batch 4 reviewed 8 mobile/debug/version/texture captures; confirmed touch HUD fit and single-tap evidence, while flagging missing explicit two-finger proof plus debug/version capture mismatches.
- 2026-02-18: Monument Realms screenshot QA Batch 5 reviewed 8 desktop gameplay/destroy captures; confirmed improved monument framing and texture fidelity, but still flagged uneven exposure (especially Stonehenge/Skara), distant Skara spawn framing, and subtle destroy before/after delta.
- 2026-02-18: Monument Realms screenshot QA Batch 6 reviewed 8 mobile/debug/version captures; confirmed iPhone HUD fit plus destroy/place evidence, but flagged debug render structure visibility as weak and `/version` capture still appearing as skeleton/loading.
- 2026-02-18: Monument Realms screenshot QA Batch 7 reviewed 8 texture panel/before-after captures; passed fidelity and legacy-vs-winner clarity, with minor follow-up notes on a marble candidate artifact and a subtle aqueduct-water seam.
- 2026-02-18: Monument Realms screenshot QA Batch 8 re-checked prior failures across 8 captures; confirmed touch-place proof, improved destroy clarity, and improved debug visibility, but `/version` screenshot remained textless in headless capture.
- 2026-02-18: Monument Realms screenshot QA Batch 9 confirmed `/version` readability fix via explicit metadata overlay (headless text-render workaround) and debug Roman side pass; flagged Stonehenge top-down debug framing as still too sparse.
- 2026-02-18: Monument Realms screenshot QA Batch 10 (2-image verification) confirmed both `debug-stonehenge-topdown.png` and `debug-roman-aqueduct-side.png` are now clearly visible and correct; no remaining screenshot QA issues.

## Notes
- Forbidden term must not appear in repo content, UI text, commit messages, or generated assets.
- Touch controls requirement: single tap destroys block, two-finger tap places selected block.
