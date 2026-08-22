# Content model

**Статус:** Active production reference
**Обновлено:** 22 августа 2026 г.

Этот документ — canonical guide для authored JSON Decorium. Content policy не должна копироваться в Presentation и не выводится из display label, visual mesh, asset family или UI category. `ClientBrief v3` — единственный источник style, functional и client-priority policy.[1]

## Runtime inventory

| Область | Canonical files | Runtime responsibility |
|---|---|---|
| Items | `data/items/catalog.v5.json`, `data/items/item.v5.schema.json` | Semantic items, finite variants, base variant и unlock IDs. |
| Levels | `data/levels/level-*.json`, `data/schemas/level.v2.schema.json` | Bounds, catalog subset, recipe, seed, surface defaults, brief/environment references. |
| Interior recipes | `data/interior/interior-recipes.v1.json`, `interior-recipe.v1.schema.json` | Deterministic initial player-owned catalog placements. |
| Surface finishes | `data/interior/surface-finishes.v1.json`, `surface-finish.v1.schema.json` | Floor/wall slots with visual data and `unlockId`. |
| Progression rewards | `data/progression/rewards.v1.json`, `reward-catalog.v1.schema.json` | Idempotent grants after authored completion. |
| Presentation environments | `data/presentation/environment-profiles.v3.json`, `environment-profile.v3.schema.json` | Shell, openings, camera, light, exterior and atmosphere only. |
| Client briefs | `data/briefs/client-briefs.v3.json`, `client-brief.v3.schema.json` | Identity, style targets, priorities, spatial preferences and typed evaluation policy. |
| Style/scoring/feedback | `data/styles/style-constraint-catalog.v1.json`, `data/scoring/scoring-parameters.json`, `data/feedback` | Exact styles, validated `ScoringPolicy` V3 and authored remediation. |
| Release | `public/release-manifest.json` | Generated/validated operational build identity. |

`src/Infrastructure/DataLoaders/staticDataAssets.js` is the deployment inventory. Every runtime JSON/schema must be registered there or Vite will not publish it next to `dist/index.html`.[2]

## Item catalog V5

A V5 item preserves semantic contracts—footprint, 16-field `featureVector`, `InteractionProfile v1` and `SpatialBehavior v1`—and adds a finite authored variant registry. `type` stays a content/visual grouping and never becomes policy.[3]

```json
{
  "id": "chair-001",
  "baseVariantId": "base",
  "variants": [
    {
      "id": "base",
      "label": "Базовый",
      "unlockId": "base-interior",
      "visual": { "materialId": "oak-light", "color": "#a97956", "assetId": null, "scale": 1 }
    },
    {
      "id": "compact",
      "label": "Компактный размер",
      "unlockId": "size-compact",
      "visual": { "materialId": "oak-light", "color": "#a97956", "assetId": null, "scale": 0.85 },
      "dimensions": { "x": 0.43, "z": 0.43 }
    }
  ]
}
```

| Field | Rule | Effect |
|---|---|---|
| `baseVariantId` | Must name one `variants` record. | Deterministic initial configuration. |
| `variants[].id` | Unique lowercase item-local ID. | Sole discrete configuration selection. |
| `variants[].unlockId` | Must be in PlayerProfile V4 inventory. | Application entitlement boundary. |
| `visual` | Authored material/color/asset/scale. | Presentation-only unless feature-vector delta exists. |
| optional `dimensions` | Schema-valid footprint. | Resolved placement/occupancy dimensions. |
| optional `featureVector` | Complete valid vector. | Only visual variant change that can affect score. |

Never add arbitrary sliders, colors or materials from UI. A new option requires V5 schema/content test, unlock path and browser verification. Domain rejects absent semantic behavior and never infers role, clearance or occupancy from name/type/mesh.[3]

## Level V2 and recipe V1

Level V2 contains no `initialPlacement`. It references `interiorRecipeId`, a deterministic `generationSeed` and player-owned `surfaceDefaults`.

```json
{
  "schemaVersion": 2,
  "id": "level-001",
  "roomId": "room-001",
  "roomDimensions": { "width": 8, "depth": 6 },
  "availableItems": ["chair-001", "sofa-001"],
  "interiorRecipeId": "living-starter",
  "generationSeed": 101,
  "surfaceDefaults": { "floorFinishId": "floor-light-oak", "wallFinishId": "wall-warm-plaster" },
  "clientBriefId": "brief-warm-host-001",
  "presentationProfileId": "warm-starter-living"
}
```

A recipe contains catalog `itemId`, optional selected `variantId`, stable slot ID, position and right-angle rotation. `RoomInteriorGenerator` creates deterministic `RoomState`; all resulting entities are editable player-owned instances with canonical `catalogItemId#ordinal` identity.[4]

## Surfaces, rewards and V4 profile

Surface finish records are player-owned floor/wall slots rather than ambient wallpaper/floor presets. `RoomState.surfaceConfiguration` stores selected IDs only; renderer resolution belongs to the finish catalog. Reward records bind completion to finite unlock IDs. `GrantProgressionRewardsUseCase` writes `grantedRewardIds` and merges `unlockedIds` immutably, making replays idempotent.

```json
{
  "inventory": {
    "unlockedIds": ["base-interior", "floor-light-oak", "wall-warm-plaster"],
    "grantedRewardIds": []
  }
}
```

V3→V4 browser migration seeds mandatory base item/surface unlocks. UI may display locked options, but only Application decides whether a variant/finish is entitled.[5] [6]

## Presentation environment V3

Every level resolves one V3 profile. It may define `openingsPreset`, `cameraPreset`, `exteriorCompositionPreset`, lighting, exterior and scene life. It must **not** contain surface presets, wall treatments, built-ins, ambient fixtures, TV, shelf, mirror, cat or any player-visible room interior object.[7]

> A V3 profile controls atmosphere and structural context. It never materializes a playable interior item and never changes feature vectors, score, economy, reward eligibility or progression.

The sole authoring path for initial TV, shelf, decor, rug or media item is a V5 catalog record in an interior recipe.

## ClientBrief V3, function and scoring

`ClientBrief v3` is validated in Infrastructure, normalized by a Domain value object and owns a typed immutable `EvaluationPolicy` graph. The graph contains completion, composition, hydrated ergonomics rules and mandatory `functionalSatisfactionPolicy`; `LoadLevelUseCase` resolves exact style profiles without deriving nested policy from topology/UI.[1]

| Field group | Active policy |
|---|---|
| Style targets | Unique weighted primary/secondary/accent profiles; each receives independent target fit. |
| Client priorities | Stable label/weight plus explicit `functional-scenario` or `spatial-preferences` rule. |
| Spatial preferences | Density, client clearance multiplier and directional empty-space policy. |
| Evaluation policy | Completion, composition, passages, function, required scenarios and typed `functionalSatisfactionPolicy`. |
| Functional satisfaction | `{ schemaVersion: 1, mode: "demand-weighted-coverage" }`. | Priority satisfaction is `Σ min(actualCount, requiredCount) / Σ requiredCount`; hard required-scenario completion remains separate. |

Composition selects explicit affordances, never item `type`. `adjacency` and `front-adjacency` rules consume semantic selectors, partner count, distance and authored message keys. Required scenarios independently declare role/cardinality even if no anchor exists.

`ScoringPolicy` V3 validates and freezes numeric parameters, including capped-square-root style influence constants, before explicit bootstrap injection—there is no mutable module-global scoring singleton. For every placed visual instance, `StyleInfluenceProfile` computes `area = x × z`, `weight = clamp(sqrt(area / referenceAreaM2), minimumWeight, maximumWeight)`, then builds each room feature as `Σ(weight × feature) / Σ(weight)`. All placed visual instances participate; occupancy, clearance and passage filters remain limited to physical diagnostics. Evaluation results expose the immutable applied constants, total influence weight and per-instance area, weight and share. The deterministic evaluator remains three-channel: style, client priorities and ergonomics. Visual assets, profile labels and ambient scene never enter a scorer. `EvaluationExplanation v2` carries diagnostic/remediation/canonical instance references to Presentation; UI does not infer score or unlock.[8]

## Authoring checklist

1. Choose the versioned contract; never add interior to environment V3.
2. For an item option, author V5 variant, unlock ID and valid resolved dimensions/features.
3. For pre-arranged design, create a recipe placement—not fixture, built-in or GLB prop.
4. For a finish, author surface type, render data and unlock route.
5. Register runtime JSON/schema in static asset inventory.
6. Add schema/content, Domain/Application and renderer/UI coverage.
7. Run full tests, production build, dependency audit and browser smoke before release.

See [Architecture overview](../architecture/overview.md) for ownership/persistence/runtime flows.

## References

[1]: ../../data/briefs/client-brief.v3.schema.json "ClientBrief V3 schema"
[2]: ../../src/Infrastructure/DataLoaders/staticDataAssets.js "Static runtime inventory"
[3]: ../../data/items/item.v5.schema.json "Item V5 schema"
[4]: ../../data/interior/interior-recipe.v1.schema.json "Interior recipe V1 schema"
[5]: ../../src/Domain/Profile/PlayerProfile.js "PlayerProfile V4 inventory"
[6]: ../../src/Application/UseCases/GrantProgressionRewardsUseCase.js "Idempotent grants"
[7]: ../../data/presentation/environment-profile.v3.schema.json "Environment V3 schema"
[8]: ../../src/Domain/Scoring/ScoringPolicy.js "Explicit validated scoring policy"
