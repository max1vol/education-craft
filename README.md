# education-craft

An educational game built with SvelteKit.

## Development

```bash
npm run dev
```

## Build + `/version` snapshot generation

```bash
npm run build
```

`npm run build` automatically runs `npm run generate:version` first (via `prebuild`).
That script generates `src/lib/data/version-snapshot.ts` from git metadata so `/version`
always ships with the latest commit + previous 10 commits from build/deploy time, without
runtime git access.

## Deploy

```bash
npm run deploy
```

`npm run deploy` runs `wrangler deploy`.

For Vercel, use the standard build command:

```bash
npm run build
```
