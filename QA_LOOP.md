# Monument Realms QA Loop

## 1) Launch and keep server in tmux

1. Check existing tmux sessions:
   ```bash
   tmux ls
   ```
2. If no dev server is running, start one from repo root:
   ```bash
   tmux new -s monument-realms-dev -d 'cd /home/yaroslav_volovich/projects/education-craft && npm run dev'
   ```
3. Attach for logs when needed:
   ```bash
   tmux attach -t monument-realms-dev
   ```

Expected local URL from `npm run dev` in this workspace: `http://127.0.0.1:4173`.

## 2) Capture debug screenshots

1. Ensure Chromium is installed for Playwright:
   ```bash
   npx playwright install chromium
   ```
2. Capture the baseline set:
   ```bash
  GAME_URL=http://127.0.0.1:4173 node scripts/capture_debug_screenshots.mjs
   ```
3. Review output in `docs/images/debug/`.
4. Canonical release/version route for QA docs and captures is `/version` (not `/release`).

## 3) Manual gameplay checks

- Desktop controls: WASD + Shift sprint + Space jump.
- Block loop: left click destroys, right click places.
- Touch controls: single tap places, two-finger tap destroys.
- Portal travel: step into portal core and verify biome transfer.
- Audio: confirm BGM switches by biome and volume sliders affect master/music/SFX.

## 4) Debug-render checks

Open and inspect:
- `/debug-render?biome=stonehenge-salisbury&radius=60&slice=0&layers=terrain,flora,monument,portal,special`
- `/debug-render?biome=colosseum-rome&radius=64&slice=0&layers=terrain,monument,portal,special`
- `/debug-render?biome=roman-aqueduct&radius=62&slice=8&layers=terrain,monument,portal,special`
- `/debug-render?biome=skara-brae&radius=60&slice=-3&layers=terrain,flora,monument,portal,special`

Focus on:
- Monument silhouettes readable from top and side views.
- Flora distribution around biomes.
- Portal and special blocks visible in dedicated layers.
- Texture family candidates and winner previews.

Version route checks:
- Open `/version` and verify commit hash/label + recent changelog entries are present and readable on desktop/mobile.
- Verify latest commit age (relative time) and explicit timestamps for latest + previous entries.

Texture proof checks:
- Verify `docs/images/debug/texture-proof-*-panel.png` show legacy-vs-winner plus candidate swatches.
- Verify `docs/images/debug/texture-proof/*before-after.png` side-by-side outputs.

Touch action checks:
- Verify `docs/images/debug/touch-destroy-proof.json` reports `success: true`.
- Verify `singleTapPlaceSuccess: true`.
- Verify `twoFingerDestroy.success: true` with `method: "cdp-two-finger"` (fallback should remain `false`).

## 5) Iteration loop

1. Capture screenshots.
2. Inspect captures (including codex `view_image` analysis).
3. Fix rendering/world/asset issues.
4. Re-capture and compare.
5. Commit only after the new capture set is verified.
