# Decorium data lifecycle guide

Этот каталог содержит **только active versioned authored data** для текущего production baseline Decorium. Единственный deployment authority — [`src/Infrastructure/DataLoaders/staticDataAssets.js`](../src/Infrastructure/DataLoaders/staticDataAssets.js): production build публикует перечисленные там fetch-based contracts, а visual manifests импортируются непосредственно из `src/main.js`.

> **Правило authoring:** меняйте только актуальные файлы из таблицы ниже. При изменении публичного контракта создавайте новую schema version, переключайте runtime одним vertical slice и удаляйте retired version только после доказательства отсутствия content, persistence и compatibility consumers.

## Active runtime contracts

| Area | Active files | Runtime owner |
|---|---|---|
| Items | `items/catalog.v4.json`, `items/item.v4.schema.json` | `JsonItemCatalog`, `SchemaLoader.loadItemSchema()` |
| Client briefs | `briefs/client-briefs.v2.json`, `briefs/client-brief.v2.schema.json` | `JsonClientBriefRepository`, `SchemaLoader.loadClientBriefSchema()` |
| Style profiles | `styles/style-constraint-catalog.v1.json`, `styles/style-constraint-catalog.v1.schema.json` | `JsonConstraintCatalog`, exact V2 brief hydration |
| Scoring | `scoring/scoring-parameters.json` | Scoring parameter initialization and Domain policies |
| Levels | `levels/manifest.json`, `levels/level-*.json`, `schemas/level.schema.json` | `JsonLevelRepository` and `LoadLevelUseCase` |
| Presentation environments | `presentation/environment-profiles.v2.json`, `presentation/environment-profile.v2.schema.json` | Presentation environment repository |
| Feedback | `feedback/scandinavian-feedback.json` | Feedback catalog and explanation assembly |
| Visual asset manifests | `visuals/*.json` | Furniture and room-composition asset repositories |

`catalog.v4.json` has 34 items. Every item requires `InteractionProfile v1` and `SpatialBehavior v1`; any change to item roles, occupancy, clearance, support or placement behavior requires schema/content tests and a reviewed gameplay decision.[1]

## Version-retirement policy

Retired data contracts, legacy fixtures and one-off migration inputs do not remain beside active content. Their provenance is preserved in Git history and versioned slice/ADR documentation, not in the deployment repository. Any future version retirement must update this guide, the static asset inventory, content tests and all active documentation together.

## References

[1]: [Catalog V4 semantic behavior decision](../docs/adr/adr-031-semantic-catalog-spatial-behavior.md)
[2]: [Current content model](../docs/systems/content-model.md)
[3]: [Architecture overview](../docs/architecture/overview.md)
