# Texture Pipeline (Nano Banana)

## Workflow

1. Use Nano Banana image editing with reference conditioning inputs:
   - `docs/texture-refs/style-ref-modern.png`
   - `docs/texture-refs/style-ref-pattern.png`
2. Generate >=3 candidates per key family (dirt, grass, stone, sand, marble, basalt/obsidian).
3. Stage candidates in `static/assets/textures/blocks/<family>/candidate-*.png`.
4. Select winners (`winner.png`) and wire them in `src/lib/data/monument-realms/blocks.ts`.
5. Compare candidates from `/debug-render` texture panel before final selection.

## Key Family Outputs

- Dirt: `static/assets/textures/blocks/dirt/candidate-01..03.png`
- Grass: `static/assets/textures/blocks/grass/candidate-01..03.png`
- Stone: `static/assets/textures/blocks/stone/candidate-01..03.png`
- Sand: `static/assets/textures/blocks/sand/candidate-01..03.png`
- Marble: `static/assets/textures/blocks/marble/candidate-01..03.png`
- Basalt/Obsidian: `static/assets/textures/blocks/basalt/candidate-01..03.png`

Selected winners are tracked in:
- `src/lib/data/monument-realms/texture-pipeline.ts`
