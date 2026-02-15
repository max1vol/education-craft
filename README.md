# education-craft

An educational game built with SvelteKit.

## Cloudflare deployment

This project is configured for Cloudflare Workers using `@sveltejs/adapter-cloudflare`.

### Build

```bash
npm run build
```

### Deploy

```bash
npm run deploy
```

`npm run deploy` runs `wrangler deploy`, which publishes the worker generated at `.svelte-kit/cloudflare/_worker.js`.
