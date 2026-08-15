# ADR-019 — Asset-backed furniture presentation

**Статус:** Accepted
**Дата:** 15 августа 2026 г.

## Контекст

Type-level procedural primitives were adequate for early interaction feedback but cannot provide the silhouette fidelity, bevels, upholstery construction, material separation and authored proportions required by the production furniture reference. At the same time, item dimensions, interaction metadata and all evaluators must remain deterministic and independent of render assets.

## Решение

Priority furniture rendering uses a versioned GLB manifest. Each entry maps an existing catalog item ID to a presentation asset identifier, public runtime path, format and explicit byte/triangle budgets. `FurnitureAssetRepository` caches source GLB scenes and supplies material-isolated clones. `RoomView` upgrades a procedural visual after placement; the procedural visual is still immediately available as a compatibility fallback.

`ItemVisualFactory` retains ownership of the visual group’s interaction overlay, feedback state and semantic raycast metadata. On upgrade it hides fallback render parts, attaches the asset clone and applies the same feedback lifecycle to both procedural and asset mesh types.

## Consequences

| Area | Consequence |
|---|---|
| Player-facing quality | Furniture can use authored contours, cushion construction and material separation rather than only generic primitives. |
| Runtime resilience | Placement remains interactive before loading completes and remains functional if a GLB load fails. |
| Gameplay integrity | GLB paths, asset IDs and rendering failure states do not enter Domain, Application or persisted room semantics. |
| Content workflow | New asset packs require reproducible source, manifest entry, measured budget validation and game-camera inspection. |
| Performance | Byte/triangle ceilings become authoring gates; repository caching prevents duplicate source downloads for repeated item placement. |

## Rejected alternatives

1. **Continue extending procedural primitives.** Rejected because complexity increases faster than perceptual fidelity.
2. **Use generated image cards as furniture.** Rejected because placement, shadows, rotation, depth and interaction would not be robust.
3. **Make render model bounds the gameplay collision source.** Rejected because scoring and placement must remain reproducible from content semantics.
4. **Block placement until the full GLB loads.** Rejected because transient network/asset latency must not break core interaction.
5. **Load unversioned external assets at runtime.** Rejected because release reproducibility, integrity and offline development would be weakened.

## Follow-up

Future sofa, table, storage and decor packs must reuse this architecture. Compression, texture baking or PBR map introduction may be introduced as a separate asset-optimization slice, with an updated manifest contract and benchmark evidence.
