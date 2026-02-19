# Agent Notes

## Running the game
- When asked to run or launch the game, use `tmux` and run `npm run dev` from the repo root.
- Before starting a new server, check whether it is already running in `tmux`; do not start duplicates.
- Prefer keeping the game server in `tmux` at all times so logs are easy to inspect.
- When the game is run/launched, always remind the user of the local URL printed by `npm run dev`.

## Codex context hygiene (critical)
- Do not let the main agent accumulate huge multimodal context from long screenshot review chains.
- Delegate screenshot/image QA work to sub-agents when possible.
- Hard cap image review to **8 screenshots per interaction**; then summarize and continue in a fresh interaction.
- Require sub-agent report-backs: what was reviewed, findings, exact files changed, and what remains.
- Keep summaries concise and path-based; avoid large inline dumps.
- After each batch, update `TODO.md` so state survives session resets.
