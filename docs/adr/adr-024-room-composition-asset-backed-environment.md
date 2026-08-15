# ADR-024 — Asset-backed room compositions with lazy procedural fallback

**Статус:** Accepted

**Дата:** 15 августа 2026 г.

**Продолжает:** [ADR-023 — Versioned room identity selectors](adr-023-versioned-room-identity-selectors.md)

## Контекст

PROD-016 made room identity visible through versioned selectors, but its authored built-ins and exterior landmarks were procedural Three.js geometry. That kept the architecture clean but could not reach the mesh, material and textured-detail quality expected from the same Blender/PBR pipeline already used for catalog furniture. Replacing room identity with unconditional scene GLBs would, however, risk a blank room while fetch/decode is pending, a broken playable scene after asset failure, runtime work for inactive levels and accidental conversion of a decorative screen into a gameplay target.

The scene lifecycle is rebuilt on level selection. Any asynchronous asset callback that reaches an obsolete location environment must not mutate the new scene or retain a visual clone.

## Решение

The active authored room profiles each own one static room-composition entry in a dedicated versioned PBR manifest. The manifest is presentation content and declares a closed `environmentProfileId` mapping, `lazy-active-profile` delivery, `procedural-identity` fallback, PBR texture conformance and measured payload/triangle/material budgets.

| Decision | Rule |
|---|---|
| Loading ownership | `RoomCompositionAssetRepository` stays in Presentation. It receives a versioned manifest and has no reference to level scoring, player profile or campaign state. |
| Delivery model | Only the active `environmentProfileId` is requested. The repository caches source loading by `assetId` and returns a deep, material-isolated scene clone. |
| Safe fallback | `LocationEnvironmentSystem` builds and displays `compositionFallbackRoot` synchronously. It hides that root only after a successful GLB attachment; load/decode failure keeps it visible. |
| Teardown | The environment marks itself destroyed before disposal. A late resolve/reject returns without attaching an asset or mutating fallback state. |
| PBR delivery | All composition GLBs embed base-color, normal and ORM textures; UV0 supports the texture set and UV1 is explicitly bound for ambient occlusion. |
| Semantics | All room-composition geometry is Presentation-only. The urban media display is decorative and must stay `semantic: false`; player-placed `tv-001` remains the sole authored `view-target`. |

> Asset delivery can improve a room’s visual read, but it cannot silently add a gameplay object or make an evaluator rule true.

## Consequences

| Area | Consequence |
|---|---|
| Visual quality | The three profiles can use authored Blender mesh detail, baked PBR material response and room-specific exterior/interior composition without compromising the playable floor area. |
| Resilience | Users see the established procedural identity immediately and retain it if a static GLB fails, so an asset outage cannot block placement or evaluation. |
| Performance | Asset work is bounded to the active level, source loads are reused, and manifest/content contracts reject payload, material and true accessor-derived triangle count regressions. |
| Lifecycle | Clones prevent one consumer's material changes from mutating the cached source; disposal remains owned by the location environment root. |
| Architecture | `src/main.js` is the sole composition root. Explicit Presentation wiring makes the dependency reviewable while Domain/Application and gameplay data remain unchanged. |
| Content evolution | Adding a profile or changing an asset requires schema-versioned manifest data, an exported PBR GLB, red contract coverage, a defined fallback and game-camera acceptance. |

## Rejected alternatives

1. **Replace the fallback before asynchronous load succeeds.** Rejected because a failed or delayed asset must not create a blank or unusable room.
2. **Eager-load all three room assets at startup.** Rejected because the player only needs the active room; inactive-room download/decode increases initial cost without player value.
3. **Store GLB ownership in a level's initial placement.** Rejected because a room composition is not a persisted player item, hit target or deterministic evaluation input.
4. **Put the loader/cache in Infrastructure.** Rejected because Three.js `GLTFLoader`, `Object3D` cloning and material isolation are Presentation concerns. Infrastructure remains the JSON/schema boundary.
5. **Reuse one mutable scene object for every consumer.** Rejected because material or node mutation would leak between scene lives.
6. **Treat the decorative screen as the existing television.** Rejected because it would silently satisfy a deterministic functional-layout rule and erase the explicit player task.
7. **Continue scaling detailed composition by unbounded procedural meshes.** Rejected because reproducible Blender PBR assets offer a more controlled quality/performance/content-review path for the intended static detail.

## Follow-up

PROD-018 may replace the current simple ambient routes and resting cat with versioned deterministic Presentation-only behavior profiles, including explicit state/update/entity budgets and reduced-motion behavior. It must neither reuse room-composition geometry as functional item evidence nor bypass the fallback/teardown lifecycle. PBR lighting assets remain a separate catalog-asset slice, not an implicit room-composition lighting-policy change.

## References

[1]: ../../data/visuals/room-composition-pbr-assets.v1.json "Room composition PBR manifest"
[2]: ../../src/Presentation/Scene/RoomCompositionAssetRepository.js "Presentation lazy GLB repository"
[3]: ../../src/Presentation/Scene/LocationEnvironmentSystem.js "Fallback and teardown lifecycle"
[4]: ../../tests/Infrastructure/RoomCompositionPbrAssetManifest.test.js "Manifest and true triangle-budget contract"
[5]: ../../tests/Presentation/RoomCompositionAssetRepository.test.js "Repository isolation contract"
[6]: ../slices/PROD-017-room-composition-pbr-asset-pack.md "PROD-017 delivery report"
[7]: adr-023-versioned-room-identity-selectors.md "ADR-023"
