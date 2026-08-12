# Decorium MVP Definition of Done

## MVP status

**Playable MVP implementation complete.** Domain contracts, free placement, visual interaction and automated checks are green; browser smoke/performance sign-off remains before release.

## Functional checklist

- [x] Одна Three.js-комната и один Scandinavian стиль.
- [x] `level-001` и V2 catalog loaded from JSON.
- [x] 16-field feature vectors validated and mapped to Domain `Item`.
- [x] Responsive pointer drag placement/move with ghost-preview.
- [x] Data-driven visual profiles define shape/material/light independently from Domain item data.
- [x] Procedural 3D visuals for the catalog types, including a genuinely round coffee table.
- [x] Living scene layer: animated TV, local light accents, wandering pet and passage narrative hints.
- [x] Placement, move, rotate, remove and reset have visible feedback animations.
- [x] Bounds validation; overlapping, same-point and stacked placement are intentionally allowed.
- [x] Room vector average and constraint evaluation.
- [x] Weighted style score and canonical star thresholds.
- [x] Russian feedback catalog.
- [x] Visible boot error instead of a blank screen.

## Technical checklist

- [x] DDD/Onion boundaries are preserved.
- [x] Domain does not import Three.js or browser APIs.
- [x] JSON level and item schema validation is enabled at bootstrap.
- [x] `npm test` passes: 134 tests in 17 files.
- [x] `npm run build` passes and emits a single static HTML file.

## Release checks still required

- [ ] Manual browser smoke test on a WebGL-capable desktop browser.
- [ ] Check interaction at target viewport sizes.
- [ ] Measure FPS and loading time on target hardware.
- [ ] Product/UX sign-off and content tuning.

## Explicitly post-MVP

Persistence, accounts, backend, economics, progression, more rooms/styles, numeric ergonomics scoring, audio, analytics, multiplayer, localization and mobile controls are not required for this MVP.
