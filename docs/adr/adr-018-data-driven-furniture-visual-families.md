# ADR-018 — Data-driven furniture visual families

**Статус:** Accepted
**Дата:** 15 августа 2026 г.

## Контекст

`ItemVisualFactory` previously chose a rich mesh primarily by broad item type. Detail count alone did not make variants legible: a dining chair and a lounge armchair could share the same chair construction, while several storage and sofa variants differed mostly by dimensions. This weakens both catalog browsing and spatial design readability.

The correction must not redefine gameplay. `type`, dimensions, `InteractionProfile`, functional layout rules and scoring are authored semantic contracts. Changing them to achieve a prettier mesh would violate the separation between presentation and evaluation.

## Решение

Version 3 of `data/visuals/item-visuals.json` adds explicit per-item `shape` and `visualFamily` mappings for priority furniture variants. `ItemVisualFactory` maps each family to deterministic Three.js primitive construction and exposes `visualFamily` as presentation metadata on the returned group.

Each family owns a small unique named-part signature. Examples include `dining-slat`, `lounge-arm`, `office-spoke`, `sectional-chaise`, `monitor-shelf` and `media-bay`. Tests verify those signatures rather than treating a fragile pixel screenshot as the sole proof of a family distinction.

> The visual resolver may read authored display profiles, but may not alter any item input or contribute to placement validity, scoring, progression or economy.

## Последствия

| Область | Последствие |
|---|---|
| Player readability | Item role and silhouette are more recognizable before a player reads a catalog label. |
| Content authoring | New visual variant requires an explicit profile entry and family builder rather than an accidental type fallback. |
| Testing | Family signatures give deterministic unit coverage; browser smoke remains required to validate the player-visible result. |
| Gameplay integrity | Footprint, interaction semantics and evaluation inputs are unchanged. |
| Performance | Geometry remains low-poly procedural primitives; no runtime image/GLB fetch or external service is introduced. |

## Alternatives

1. **Make every variant a scaled type-level mesh.** Rejected because it preserves the reported silhouette ambiguity.
2. **Encode visual role in `InteractionProfile`.** Rejected because functional semantics and display form evolve independently.
3. **Use generated images as item meshes.** Rejected because it weakens depth, selection/ghost feedback and deterministic Three.js ownership; generated imagery is used only for art direction.
4. **Adopt external GLB assets now.** Rejected because import, caching, asset pipeline and platform performance require a dedicated slice.
5. **Hard-code item ID branches in the scene.** Rejected because data-driven mapping is reviewable, versioned and scalable to future authoring.

## Follow-up

Future visual asset slices may replace or supplement procedural family builders with carefully managed assets, provided they preserve this presentation-only boundary and retain deterministic fallback coverage.
