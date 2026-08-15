# ADR-022 — Catalog-family completeness for asset-backed PBR packs

**Статус:** Accepted

**Дата:** 15 августа 2026 г.

**Продолжает:** [ADR-019 — Asset-backed furniture presentation](adr-019-asset-backed-furniture-presentation.md) and [ADR-021 — PBR asset-manifest conformance](adr-021-pbr-asset-manifest-conformance.md)

## Контекст

The seating, lounge and dining/table deliveries established a reliable PBR asset pipeline. A partial migration of a functional catalog family, however, makes release quality dependent on which arbitrary item a player chooses: two catalog items with comparable role can render with incompatible quality despite identical gameplay semantics. It also leaves review unable to determine whether a category was intentionally scoped or accidentally incomplete.

The `storage` family exposes this risk clearly. It contains wall shelving, enclosed shelving, drawer storage, open rack, sideboard, media stand and bedside stand. Those items share storage-oriented catalog semantics but require visibly different silhouettes. They should migrate together without teaching gameplay layers about visual delivery.

## Решение

A production asset pack owns a **declared complete catalog family** for its stated scope. Its versioned manifest must enumerate every selected catalog item ID, and its red contract asserts exact set equality rather than a subset. The pack must preserve each item’s existing catalog ID, gameplay dimensions and semantic metadata; it only maps the item to a PBR prefab and its conformance metadata.

| Rule | Consequence |
|---|---|
| Exact item-set ownership | A missing or unexpected category member fails the manifest contract before visual review. |
| Existing item metadata remains authoritative | Dimensions, affordances, constraints, score, placement and persistence remain in catalog/Domain/Application data, never GLB geometry. |
| Each family member needs a distinct readable silhouette | Shared PBR material logic is acceptable; identical generic geometry is not. |
| One pack has one budget | The versioned aggregate byte ceiling makes category-level performance impact reviewable. |
| Fallback remains per placement | A delivery failure retains procedural geometry and must not make a complete manifest block gameplay. |

> Completeness is a content-delivery guarantee, not a new gameplay category or a reason to migrate visual data into deterministic game state.

## Consequences

| Area | Consequence |
|---|---|
| Player experience | All storage choices receive a consistent visual-quality floor while remaining visually distinguishable. |
| Content review | The exact catalog IDs and pack budget provide an auditable definition of what is shipped. |
| Architecture | The multi-manifest repository stays Presentation-only; no Domain or Application contract learns about render packs. |
| Future slices | Lighting, beds and decor may use the same pattern only after their scopes are declared and red-tested. |
| Failure handling | The authored pack improves the happy path but never replaces the procedural degradation path. |

## Rejected alternatives

1. **Migrate only hero storage objects.** Rejected because user choice, not gameplay importance, would decide whether a storage item receives production quality.
2. **Treat all furniture as a single unlimited pack.** Rejected because budget and validation failures would be harder to localise, review and revert.
3. **Infer family completeness from item `type` at runtime.** Rejected because visual scope is a versioned content decision and must remain reviewable; runtime inference couples renderer behavior to catalog evolution.
4. **Use GLB bounds as placement bounds.** Rejected because exported visual geometry is not a stable gameplay contract; authored catalog dimensions retain authority.
5. **Disable unavailable catalog items when PBR loading fails.** Rejected because visual failure must remain graceful and gameplay-neutral.

## Follow-up

The lighting pack should declare all currently catalog-visible lighting items as a complete next family, with a separate versioned manifest, red contract, measured budget and real room-camera smoke. When catalog content grows, a new pack version must be introduced rather than silently mutating a released family contract.

## References

[1]: ../../data/visuals/storage-pbr-assets.v1.json "Storage PBR asset manifest v1"
[2]: ../../tests/Infrastructure/StoragePbrAssetManifest.test.js "Storage PBR manifest contract"
[3]: adr-019-asset-backed-furniture-presentation.md "ADR-019 asset-backed furniture presentation"
[4]: adr-021-pbr-asset-manifest-conformance.md "ADR-021 PBR asset manifest conformance"
