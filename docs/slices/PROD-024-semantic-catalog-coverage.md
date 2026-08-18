# PROD-024 — Semantic catalog coverage

**Статус:** Completed
**Дата:** 18 августа 2026 г.
**Связанный ADR:** [ADR-031 — Semantic catalog spatial behavior](../adr/adr-031-semantic-catalog-spatial-behavior.md)

## Цель

PROD-024 устраняет universal-2D-obstacle gap в shipped catalog. До слайса 25 из 34 предметов имели empty interaction profile, а generic clearance и room occupancy одинаково рассматривали rug, wall mirror, chandelier и furniture. Теперь каждый shipped item имеет explicit authored role и `SpatialBehavior v1`; только declared floor obstacles участвуют в floor occupancy и minimum-clearance diagnostics.[1] [2]

> **Граница слайса:** semantic policy остаётся content/Domain input. UI и Three.js отображают предметы, но не выводят placement, occupancy или clearance behavior из ID, category или mesh.

## Поставленный пользовательский результат

| Ситуация игрока | Результат |
|---|---|
| Ковер лежит под столом или креслом | `floor-overlay` не занимает free-area grid и не создаёт generic clearance violation. |
| Wall/ceiling/surface content присутствует в комнате | Эти artifacts не превращаются в floor obstacle только из-за footprint dimensions. |
| Floor furniture, bed, storage или free-standing décor | Продолжают участвовать в occupancy and clearance как authored floor obstacles. |
| Catalog author добавляет предмет | V4 schema и catalog validator требуют non-empty semantic role и complete spatial record; missing policy fails deterministically. |
| Future ergonomics slice | Может выбирать only declared affordance/support/placement semantics without reclassifying old catalog by name. |

## V4 semantic contract

`SpatialBehavior v1` adds explicit physical participation beside `InteractionProfile v1`.

| Поле | Shipped values | Current evaluator effect |
|---|---|---|
| `placementKind` | `floor`, `floor-overlay`, `wall`, `ceiling`, `surface-mounted` | Describes authored placement class; only `floor` can become a floor obstacle. |
| `occupancyMode` | `occupies`, `ignored` | `RoomOccupancyProfile` marks only declared obstacles. |
| `clearanceMode` | `obstacle`, `ignored` | `ClearanceEvaluator` pairs only declared obstacles. |
| `supportMode` | `none`, `surface` | Declares support semantics for current/future functional rules. |
| `InteractionProfile.affordances` | Existing scenario roles plus rest/storage/lighting/decor/media-support roles | Every V4 item has at least one explicit semantic role. |

The catalog itself advanced from V3 to V4. Its V4 schema requires `spatialBehavior`, restricts all values to a closed vocabulary and is loaded through the normal JSON catalog boundary. Production bootstrap fetches `catalog.v4.json`; static Vite inventory emits both V4 catalog and schema to `dist/data`.[3] [4]

## Reviewed authored coverage

The authored mapping covers every one of the 34 current IDs. Floor tables, seating, sofas, beds, storage, free-standing floor lamps/plants/vases and television are obstacle participants. Rugs are `floor-overlay`; shelf/mirror/curtain/clock are wall artifacts; the chandelier is ceiling artifact; and the table lamp is surface-mounted. Storage, light, rest, decor and media-support semantics are explicit affordances, rather than absent metadata.[4]

`CatalogValidator` rejects any authored item without `SpatialBehavior`, while legacy direct Item fixtures have a compatibility default isolated from V4 content. `Item` exposes both immutable `InteractionProfile` and `SpatialBehavior`, preserving the clean Domain boundary.[1] [5]

## TDD and verification evidence

| Contract | Red behaviour | Green evidence |
|---|---|---|
| Spatial vocabulary | No `SpatialBehavior` Domain value existed. | `SpatialBehavior.test.js` covers immutable record, impossible combinations and surface-mounted behavior. |
| Item/catalog hydration | Items silently received no declared spatial policy. | `ItemSpatialBehavior.test.js` and `CatalogInteractionProfile.test.js` prove immutable transport and fail missing data. |
| Grid occupancy | A rug covered every floor cell. | `RoomOccupancyProfile.test.js` proves overlay occupies `0` grid area and leaves free-area ratio `1`. |
| Clearance | Rug overlap created an ergonomics violation. | `ClearanceEvaluator.test.js` proves overlay is excluded from generic clearance pairing. |
| Full catalog content | V3 allowed empty semantic profiles. | `ItemCatalogV3.test.js` now validates V4; `SemanticCatalogCoverage.test.js` verifies all 34 items, roles and every placement category. |
| Runtime delivery | Build still targeted V3 files. | Loader/static inventory contracts and build verification prove V4 assets are emitted to `dist/data`. |

Focused cross-layer verification passed: **11 files / 31 tests**. Full regression passed: `npm test` — **154 files / 475 tests**. Production build succeeded and verified `dist/data/items/catalog.v4.json` plus `item.v4.schema.json`; `npm audit --omit=dev --audit-level=high` returned **0 vulnerabilities**; `git diff --check` was clean before documentation updates.

## Limits and non-goals

1. PROD-024 does not add wall, ceiling or surface placement gestures/anchors to the scene; it supplies the author-owned contract needed for a future interaction slice.
2. It does not alter style fit, client-priority weights, scorecard calibration, critical gates, persistence or progression.
3. It does not derive support or behavior from Three.js meshes, visual profiles, display names or UI categories.
4. It does not invent new functional-layout rules; new affordances are explicit catalog coverage for present and follow-up policies.

## References

[1]: ../../src/Domain/Items/SpatialBehavior.js "SpatialBehavior Domain contract"
[2]: ../../src/Domain/Items/CatalogValidator.js "Authoring validation boundary"
[3]: ../../data/items/item.v4.schema.json "Item catalog V4 schema"
[4]: ../../data/items/catalog.v4.json "Shipped V4 catalog"
[5]: ../../src/Domain/Items/Item.js "Immutable item semantics"
[6]: ../../src/Domain/Ergonomics/ClearanceEvaluator.js "Declared clearance participation"
[7]: ../../src/Domain/Scoring/RoomOccupancyProfile.js "Declared occupancy participation"
[8]: ../adr/adr-031-semantic-catalog-spatial-behavior.md "ADR-031"
