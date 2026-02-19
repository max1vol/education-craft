# Texture Pipeline (Nano Banana)

## Workflow

1. Preserve prior winners into `docs/images/debug/texture-proof/before/` for explicit before/after evidence.
2. Generate realistic Nano Banana candidates per family (`family_<name>`) with `/generate ... --count=3`.
3. Stage candidates in `static/assets/textures/blocks/<family>/candidate-01..03.png`.
4. Select the winner and write to `static/assets/textures/blocks/<family>/winner.png`.
5. Copy winners to `docs/images/debug/texture-proof/after/`.
6. Capture `/debug-render` texture panel screenshots and montage before/after proofs.

## Primary Families

- Grassland: `grass`, `leaf`, `flower`, `reed`
- Soil: `dirt`
- Stone: `stone`
- Sand: `sand`
- Sandstone: `sandstone`
- Marble: `marble`, `frost`
- Basalt/Obsidian: `basalt`, `obsidian`
- Timber: `timber`
- Ice: `ice`

## Proof Outputs

- Panel proof screenshots: `docs/images/debug/texture-proof-*-panel.png`
- Side-by-side before/after: `docs/images/debug/texture-proof-*-before-after.png`
- Raw before/after textures:
  - `docs/images/debug/texture-proof/before/*.png`
  - `docs/images/debug/texture-proof/after/*.png`
