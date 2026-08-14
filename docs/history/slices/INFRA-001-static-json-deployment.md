# INFRA-001 — Static JSON delivery

## Problem

The browser runtime loads level, catalog, schema, scoring, style, constraint and feedback content with relative `fetch('./data/...')` URLs. The previous Vite build inlined JavaScript/CSS into `dist/index.html`, but did not copy the repository `data/` directory into the published `dist/` directory. Static hosts such as Render therefore returned 404 for the JSON requests and the game stopped during bootstrap.

## Decision

Keep JSON as runtime content and emit the exact runtime files under `dist/data/` during `vite build`.

The manifest is defined in:

```text
src/Infrastructure/DataLoaders/staticDataAssets.js
```

The Vite plugin in `vite.config.js` copies those files without changing their paths. `base: './'` keeps the existing relative URLs valid at the root of a Render Static Site and when the site is served from a subpath.

## Render Static Site settings

- Build command: `npm install && npm run build` (this repository intentionally has no lockfile)
- Publish directory: `dist`
- No environment variables or backend services are required for the MVP.

After changing the build configuration, redeploy with a clean build/cache. The published artifact must contain `dist/index.html` and `dist/data/**/*.json`.

## Acceptance criteria

- The production build succeeds.
- Every file in `STATIC_DATA_FILES` exists in `dist/data/` after build.
- Runtime JSON paths remain unchanged for local Vite dev and static hosting.
- No secrets, API keys or server-side runtime are introduced.
