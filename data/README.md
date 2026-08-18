# Decorium data lifecycle guide

Этот каталог содержит **versioned authored data** Decorium. Наличие файла рядом с active JSON **не означает**, что runtime его загружает. Единственный deployment authority — [`src/Infrastructure/DataLoaders/staticDataAssets.js`](../src/Infrastructure/DataLoaders/staticDataAssets.js): build копирует в `dist/data/` только listed runtime assets.

> **Правило authoring:** перед изменением JSON сначала найдите active file в таблице ниже и в `staticDataAssets.js`. Не меняйте retained older version, ожидая изменения текущей игры.

## Active runtime contracts

| Area | Active files | Runtime owner |
|---|---|---|
| Items | `items/catalog.v4.json`, `items/item.v4.schema.json` | `JsonItemCatalog`, `SchemaLoader.loadItemSchema()` |
| Client briefs | `briefs/client-briefs.v2.json`, `briefs/client-brief.v2.schema.json` | `JsonClientBriefRepository`, `SchemaLoader.loadClientBriefSchema()` |
| Style profiles | `styles/style-constraint-catalog.v1.json`, `styles/style-constraint-catalog.v1.schema.json` | `JsonConstraintCatalog`, exact V2 brief hydration |
| Scoring | `scoring/scoring-parameters.json`, `schemas/scoring-parameters.schema.json` | Scoring parameter initialization and Domain policies |
| Levels | `levels/manifest.json`, `levels/level-*.json`, `schemas/level.schema.json` | `JsonLevelRepository` and `LoadLevelUseCase` |
| Presentation environments | `presentation/environment-profiles.v2.json`, `presentation/environment-profile.v2.schema.json` | Presentation environment repository |
| Feedback | `feedback/scandinavian-feedback.json` | Feedback catalog and explanation assembly |

`catalog.v4.json` has 34 items. Every item requires `InteractionProfile v1` and `SpatialBehavior v1`; any change to item roles, occupancy, clearance, support or placement behavior requires schema/content tests and a reviewed gameplay decision.[1]

## Retained historical versions

| Files | Status | Why they remain | Do not use them for |
|---|---|---|---|
| `items/catalog.v2.json`, `items/item.v2.schema.json` | Historical | Traceability for prior content contract. | Current catalog authoring or runtime behavior. |
| `items/catalog.v3.json`, `items/item.v3.schema.json` | Historical | Traceability before complete semantic `SpatialBehavior`. | Current item updates or build verification. |
| `briefs/client-briefs.v1.json`, `briefs/client-brief.v1.schema.json` | Historical/legacy fixtures | Backward-compatible test evidence and migration history. | Current client requirements or production brief fixes. |
| `items/scandinavian-items.json` | Historical starter data | Original MVP-derived starter content. | Current multi-style inventory policy. |

These files are retained deliberately. Their removal or relocation is a separate version-retirement migration and must not be mixed with ordinary data authoring.

## Safe version-bump procedure

1. Write a red schema/content test for the required public contract change.
2. Create a new versioned file; never silently mutate a previous public schema version.
3. Add Domain validation/hydration only where the new semantics require it.
4. Switch the active runtime loader and `staticDataAssets.js` together.
5. Update [Content model](../docs/systems/content-model.md), [Architecture overview](../docs/architecture/overview.md), product docs and an ADR when architecture ownership changes.
6. Run full tests, build, audit and verify the exact active files appear in `dist/data/`.
7. Keep prior versions as historical until a dedicated retirement slice proves no content, persistence or compatibility fixture still needs them.

## References

[1]: ../docs/adr/adr-031-semantic-catalog-spatial-behavior.md "Catalog V4 semantic behavior decision"
[2]: ../docs/systems/content-model.md "Current authored content contracts"
[3]: ../docs/architecture/overview.md "Runtime ownership and static asset delivery"
