# TASK.md — Monument Realms Rebuild (Authoritative Spec)

## Objective
Rebuild this repo into an original, high-quality voxel first-person game with monument-themed biomes and portal travel, using modular SvelteKit architecture and iterative visual QA.

## Hard Constraints
1. Do **not** use the prohibited branded game name anywhere in code, UI text, docs, commit messages, or assets.
2. Keep this an **original** game while matching the requested gameplay style.
3. Keep the app runnable throughout development.

## Core Gameplay Requirements
- First-person movement + look.
- Block destruction and placement loop.
- Hotbar (no crafting table yet).
- Touch controls:
  - single tap = destroy
  - two-finger tap = place

## World / Content Requirements
- Biomes are themed around real monuments.
- Add portal travel between monument biomes.
- Monuments must be recognizable from multiple views.
- Add environmental details: trees, plants, foliage, natural decoration.
- Performance safeguards are required.

## Rendering / Visual Quality
- Avoid retro pixel-art direction.
- Use modern, clean, high-quality textures + lighting.
- **Strict requirement:** textures must be realistic/high-fidelity and must not look pixelated in final gameplay/debug captures.
- Add interaction VFX (hit/break particles, placement feedback, subtle ambient effects) with good performance.

## Texture Pipeline (Nano Banana via Gemini CLI extension)
- **Primary source mandate:** use Nano Banana-generated assets as the primary texture source for terrain, block, and monument material families.
- Use reference texture conditioning inputs to enforce style consistency.
- For each key texture family, generate >= 3 candidates.
- Render and compare candidates in-scene/debug views.
- Pick and integrate best-fitting candidates.
- Before finalizing texture selections, run screenshot QA loops and inspect captures with `view_image` to confirm de-pixelated, realistic fidelity.

## Audio
- Add satisfying block break/place SFX with variation and balanced volume.
- Add suitable background music aligned to monument historical eras.
- Use legally safe assets or generated audio.
- Add volume controls.

## Debug / QA Rendering
- Add dedicated debug rendering routes/tools:
  - top-down orthographic map view (e.g., `/debug-render?...`)
  - side-view inspections
  - special-block / scene-part inspection views
- Capture debug and in-game screenshots.
- Save captures **inside repo** (e.g., `docs/images/debug/`).
- Use codex-controlled browser QA loops to inspect captures and iteratively fix scene data/rendering.

## Code Organization (SvelteKit standard)
- Keep route files thin.
- Move TS logic into modular files under `src/lib/...`.
- Move scene/world/content data to `src/lib/data/...`.
- Keep textures/assets in separate directories and update references.

## Process / Delivery
- Maintain `TODO.md` continuously with progress and next steps.
- Use sub-agents in parallel where useful (textures, debug tooling, QA automation, scene tuning).
- **Image QA delegation rule:** when reviewing screenshots with `view_image`, delegate heavy image review to sub-agents instead of doing all reviews in the main thread.
- **Mandatory sub-agent usage:** for screenshot QA passes, assign sub-agents by batch/area (e.g., textures, monuments, lighting) and only aggregate in the main thread.
- **Batch size cap:** review at most **8 screenshots per interaction** before summarizing and continuing in a new interaction.
- **Report-back format:** after each image-review batch, sub-agents must return a concise report (findings, decisions, file edits made, remaining issues), and the main agent must update `TODO.md`/notes accordingly.
- **Context safety:** keep prompts/results short and structured; avoid large inline dumps and reference file paths instead.
- Avoid pasting large blobs/logs inline; prefer file paths + short summaries.
- Make incremental runnable commits and push to `origin/main` as progress is made.

## Definition of Done
- Builds and runs.
- Core gameplay loop works on desktop + touch.
- Monument biomes + portals are recognizably implemented.
- Texture/audio/VFX pipeline integrated and tuned.
- Debug render routes exist and screenshots are saved in-repo.
- `TODO.md` up to date.
