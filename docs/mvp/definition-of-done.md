# Decorium MVP Definition of Done

## MVP status

**Playable MVP implementation complete.** Domain contracts, free placement, visual interaction and automated checks are green; browser smoke/performance sign-off remains before release.

## Functional checklist

- [x] Одна Three.js-комната и один Scandinavian стиль.
- [x] `level-001` и V2 catalog loaded from JSON.
- [x] 16-field feature vectors validated and mapped to Domain `Item`.
- [x] Responsive pointer drag placement/move with ghost-preview.
- [x] Camera distance limits, wall transparency from the camera side and right-click deselect are implemented in Presentation.
- [x] Ghost-preview rotation is preserved through placement.
- [x] Data-driven visual profiles define shape/material/light independently from Domain item data.
- [x] Rich procedural 3D visuals for catalog types, including detailed furniture/decor builders, a genuinely round coffee table, vase and clock profiles, plus selection/ghost feedback halo.
- [x] Room floor uses a calm matte surface without a visible debug grid.
- [x] Living scene layer: animated TV with content blocks/bars/scanlines/glow, local light accents and wandering pets; no permanent explanatory evaluation labels.
- [x] Living location layer: house facade, sidewalk, road, street lights, pedestrians with natural gait/arms, cars with stable wheel motion, running animal with gait/tail, interior details and resting cat.
- [x] Room architecture layer: transparent window opening and readable interior door with frame and handle.
- [x] Ambient mirror/bookshelf fixtures are separated from the TV and movable in Presentation; thin catalog items have stable hit areas.
- [x] Placement, move, rotate, remove and reset have visible feedback animations.
- [x] Keyboard and toolbar actions use one Presentation input-intent dispatcher.
- [x] Undo cancels the last successful placement, move, rotation or deletion.
- [x] Bounds validation; overlapping, same-point and stacked placement are intentionally allowed.
- [x] Room vector average and constraint evaluation.
- [x] Weighted style score, data-driven composition requirements and canonical star thresholds.
- [x] Russian feedback catalog covers style violations, composition incompleteness and success states.
- [x] Visible boot error instead of a blank screen.
- [x] Scene-first compact HUD with horizontal inventory, summary chip, action dock and responsive safe-area layout.
- [x] Evaluation result is presented as a calm, closable overlay without changing score data.

## Technical checklist

- [x] DDD/Onion boundaries are preserved.
- [x] Domain does not import Three.js or browser APIs.
- [x] JSON level and item schema validation is enabled at bootstrap.
- [x] `npm test` passes with the current Presentation animation contract.
- [x] `npm run build` passes and emits a single static HTML file.

## Release checks still required

- [ ] Manual browser smoke test on a WebGL-capable desktop browser.
- [ ] Check interaction at target viewport sizes.
- [ ] Measure FPS and loading time on target hardware.
- [ ] Product/UX sign-off and content tuning.

## Explicitly post-MVP

Persistence, accounts, backend, economics, progression, more rooms/styles, numeric ergonomics scoring, audio, analytics, multiplayer, localization and mobile controls are not required for this MVP.
