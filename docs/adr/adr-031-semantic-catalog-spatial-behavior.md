# ADR-031 — Semantic catalog spatial behavior

**Статус:** Accepted
**Дата:** 18 августа 2026 г.
**Продолжает:** [ADR-003 — JSON content pipeline](adr-003-json-content-pipeline.md), [ADR-015 — Functional layout graph](adr-015-functional-layout-graph.md) и [ADR-030 — Client-priority and multi-style scoring](adr-030-client-priority-multi-style-scoring.md)

## Контекст

Item catalog V3 требовал `InteractionProfile`, но для 25 из 34 shipped items он был полностью пустым. Все footprints, включая rugs, wall décor, ceiling lighting и surface-mounted lamps, автоматически участвовали в fixed-grid occupancy и minimum-clearance pairing. В результате визуально и пространственно разные объекты становились одинаковыми универсальными 2D obstacles, а future ergonomic rules не имели author-owned semantic boundary.

Имя, `type`, visual mesh и UI category не являются надёжными источниками gameplay policy. Runtime inference по ним нарушил бы reproducibility, позволил бы Presentation менять score и сделал бы authored data необозримыми.[1] [2]

## Решение

Вводится `SpatialBehavior v1` как immutable Domain value и обязательная часть каждого V4 catalog item. Catalog V4 также завершает closed affordance vocabulary: every shipped item declares at least one functional or semantic role.

| Поле `SpatialBehavior v1` | Значения | Решение |
|---|---|---|
| `placementKind` | `floor`, `floor-overlay`, `wall`, `ceiling`, `surface-mounted` | Author-owned physical placement class. |
| `occupancyMode` | `occupies`, `ignored` | Только floor obstacle может занимать floor grid. |
| `clearanceMode` | `obstacle`, `ignored` | Только floor obstacle участвует в generic minimum-clearance pairs. |
| `supportMode` | `none`, `surface` | Явно отмечает authored support surface для current/future semantic rules. |

Invalid combinations fail in Domain: `floor-overlay`, `wall`, `ceiling` and `surface-mounted` must ignore occupancy and clearance; a floor item that occupies grid must be a clearance obstacle. `CatalogValidator` requires this record for every authored catalog item and hydrates it into `Item`. A compatibility default remains confined to legacy direct `Item` construction; it is unavailable to V4 catalog data.[1] [3]

The V4 migration assigns a reviewed explicit record to all 34 item IDs. Floor furniture remains an obstacle; rugs are overlays; shelves/mirrors/curtains/clocks are wall artifacts; chandelier is ceiling artifact; the table lamp is surface-mounted. Existing/current functional roles remain, while storage, beds, lighting, décor and media support receive declared affordances in the same closed vocabulary.[4]

`ClearanceEvaluator` and `RoomOccupancyProfile` filter to `item.spatialBehavior.isFloorObstacle`. Their legacy input fallback is only for isolated old test doubles without semantic metadata; V4-loaded `Item` instances always carry authored behavior.[5] [6]

## Consequences

A rug overlapping a table no longer creates a false minimum-clearance violation or makes a compact room look artificially occupied. Wall, ceiling and surface-mounted content similarly stays out of floor occupancy/clearance while retaining declared roles for future rules. Floor furniture still produces the same generic spatial diagnostics unless an existing specific functional exclusion applies.[5] [6]

Catalog version V4, schema V4, loader fetch path and static asset inventory advance together. A Vite build ships only the active V4 catalog/schema runtime assets, preventing a valid source migration from producing a missing-content deployment.[3] [4]

This decision does not implement wall/ceiling placement interaction, object stacking, new score weights or new progression rules. `placementKind` describes author-owned semantic participation today and provides an explicit contract for a later placement-system slice; it does not make Three.js geometry, catalog UI or level topology score policy.

## Rejected alternatives

1. **Infer spatial behavior from `item.type`.** Rejected because `decor` includes both floor plants and wall mirrors, while `lighting` includes floor, ceiling and table-mounted objects.
2. **Treat every non-furniture item as ignored.** Rejected because floor plants, vases and free-standing lamps are genuine floor obstacles.
3. **Keep empty profiles as semantic «none».** Rejected because it hides the authoring decision and gives no contract to future ergonomic systems.
4. **Use visual mesh bounding boxes to choose clearance participation.** Rejected because Presentation assets are optional/fallback-capable and cannot define deterministic Domain rules.
5. **Require actual wall/ceiling placement UI in this slice.** Rejected because it would combine catalog semantics with a new interaction/scene feature; a subsequent slice can consume the already explicit placement contract.

## References

[1]: ../../src/Domain/Items/SpatialBehavior.js "SpatialBehavior v1 Domain value"
[2]: ../../src/Domain/Items/InteractionProfile.js "Closed semantic affordance vocabulary"
[3]: ../../src/Infrastructure/DataLoaders/JsonItemCatalog.js "V4 catalog loader"
[4]: ../../data/items/catalog.v4.json "Explicit 34-item semantic mapping"
[5]: ../../src/Domain/Ergonomics/ClearanceEvaluator.js "Clearance participation filter"
[6]: ../../src/Domain/Scoring/RoomOccupancyProfile.js "Occupancy participation filter"
[7]: adr-030-client-priority-multi-style-scoring.md "ADR-030"
