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

Expected local URL from `npm run dev`: `http://127.0.0.1:5173`.

## 2) Capture debug screenshots

1. Ensure Chromium is installed for Playwright:
   ```bash
   npx playwright install chromium
   ```
2. Capture the baseline set:
   ```bash
   GAME_URL=http://127.0.0.1:5173 node scripts/capture_debug_screenshots.mjs
   ```
3. Review output in `docs/images/debug/`.

## 3) Manual gameplay checks

- Desktop controls: WASD + Shift sprint + Space jump.
- Block loop: left click destroys, right click places.
- Touch controls: single tap destroys, two-finger tap places.
- Portal travel: step into portal core and verify biome transfer.
- Audio: confirm BGM switches by biome and volume sliders affect master/music/SFX.

## 4) Debug-render checks

Open and inspect:
- `/debug-render?biome=ring-plains&radius=56&slice=0&layers=terrain,flora,monument,portal,special`
- `/debug-render?biome=dune-pyramid&radius=52&slice=0&layers=terrain,monument,portal`
- `/debug-render?biome=frost-citadel&radius=60&slice=14&layers=terrain,flora,special`

Focus on:
- Monument silhouettes readable from top and side views.
- Flora distribution around biomes.
- Portal and special blocks visible in dedicated layers.
- Texture family candidates and winner previews.

## 5) Iteration loop

1. Capture screenshots.
2. Inspect captures (including codex `view_image` analysis).
3. Fix rendering/world/asset issues.
4. Re-capture and compare.
5. Commit only after the new capture set is verified.
