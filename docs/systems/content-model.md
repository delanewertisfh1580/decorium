# Content model

**Статус:** Active production reference
**Обновлено:** 15 августа 2026 г.

Этот документ — единственный current guide для authored JSON Decorium. Content rules не должны копироваться в Presentation и не должны выводиться из display names, visual meshes или UI category labels.

> **Контентный canon:** стиль — это policy конкретного заказа. Current Scandinavian files являются starter dataset, а не глобальным стилем игры. Production content pipeline должен поддерживать несколько стилей и их controlled mixing через versioned client brief.

## Runtime content inventory

| Область | Current canonical files | Version / validation |
|---|---|---|
| Items | `data/items/catalog.v3.json`, `data/items/item.v3.schema.json` | Catalog schema V3 |
| Levels | `data/levels/manifest.json`, `data/levels/level-*.json`, `data/schemas/level.schema.json` | Manifest V1 and level schema, including required presentation profile reference |
| Presentation environments | `data/presentation/environment-profiles.v1.json`, `data/presentation/environment-profile.v1.schema.json` | Profile catalog V1 and strict closed-vocabulary schema |
| Scoring | `data/scoring/scoring-parameters.json` | Versioned scoring parameters loader |
| Current starter style | `data/styles/scandinavian.json`, `data/constraints/scandinavian-constraints.json` | One current MVP-derived dataset; not product-wide canon |
| Current starter feedback | `data/feedback/scandinavian-feedback.json` | One current feedback catalog; not future client-brief scope |
| Visuals | `data/visuals/item-visuals.json` | Presentation-only visual profile |
| Release | `public/release-manifest.json` | Generated from BuildInfo during dev/build |

`src/Infrastructure/DataLoaders/staticDataAssets.js` is the deployment inventory. When a runtime JSON file is added, it must be added there and covered by a content test; otherwise Vite may not publish it into `dist/data/`.

## Item catalog V3

The catalog currently has **34** items. Each item contains a stable `id`, display fields, two-dimensional footprint, price, 16-field `featureVector` and required `interactionProfile` V1. Catalog item `type` is a content/visual grouping; gameplay semantics are carried by interaction affordances.

```json
{
  "id": "tv-001",
  "type": "media",
  "dimensions": { "x": 1.6, "z": 0.3 },
  "interactionProfile": {
    "schemaVersion": 1,
    "affordances": ["view-target"],
    "frontAxis": "negativeZ",
    "usableSides": []
  }
}
```

| Interaction field | Allowed values | Meaning |
|---|---|---|
| `affordances` | `dining-seat`, `dining-surface`, `lounge-seat`, `coffee-surface`, `view-target` | Semantic roles used by functional layout evaluation. |
| `frontAxis` | `positiveX`, `negativeX`, `positiveZ`, `negativeZ`, `null` | Local front direction before placed-item rotation. |
| `usableSides` | Cardinal local axes | Sides on which adjacency partners may satisfy the anchor. |

Adding a catalog item requires V3 schema validity, a complete feature vector, semantic profile, optional visual profile, catalog content test and level references only after the item is valid. Do not infer semantics from `id` or `name`.

## Target: ClientBrief v1

`ClientBrief v1` is the planned versioned content contract for every design order. It is not yet loaded by runtime and must be delivered as a separate vertical slice with schema, Domain value object, content loaders, scoring policy, feedback and UI presentation. Its purpose is to make multiple styles, style mixing and client-specific restrictions deterministic, inspectable and replayable.

| Field group | Required policy | Why it exists |
|---|---|---|
| Identity | `schemaVersion`, `briefId`, client-facing title and level binding | Stable persisted/content identity. |
| Style targets | One or more style IDs, roles (`primary`/`secondary`/`accent`) and weights | A room can intentionally combine aesthetics. |
| Mix policy | Allowed style combinations, balance ranges and conflict rules | Separates deliberate eclecticism from incoherent mixing. |
| Client priorities | Ordered goals and score weights | Makes the same room evaluate differently for different clients. |
| Functional scenarios | Dining, media, work, family, accessibility or storage needs | Connects aesthetic scoring to intended use. |
| Constraints | Mandatory, forbidden, inherited-item, space and budget rules | Encodes non-negotiable customer requirements. |
| Feedback mapping | Brief-specific message keys and success criteria | Keeps results explainable without UI rule logic. |

A target shape, intentionally **not a runtime schema yet**, is:

```json
{
  "schemaVersion": 1,
  "briefId": "client-urban-family-001",
  "styleTargets": [
    { "styleId": "mid-century", "role": "primary", "weight": 0.65 },
    { "styleId": "japandi", "role": "secondary", "weight": 0.35 }
  ],
  "mixPolicy": {
    "allowedPairs": [["mid-century", "japandi"]],
    "requiredBalance": { "minActiveStyles": 2, "maxDominantWeight": 0.75 }
  },
  "functionalScenarios": ["media-viewing", "family-dining"],
  "hardConstraints": ["preserve-window-passage", "retain-heirloom-item"]
}
```

The eventual evaluator must consume only this authored policy, style catalogs and RoomState. It must not infer client taste from item names, use an LLM at runtime or encode a default aesthetic in Presentation.

## Authored presentation environments

Every shipped level must declare `presentationProfileId`. `LoadLevelUseCase` resolves the reference through the validated PresentationEnvironment repository and returns the hydrated profile in `LevelDTO.presentationEnvironment`. The profile catalog is `schemaVersion: 1`; each profile is likewise versioned and selects only closed presets for floor, wall, openings, camera, lighting, exterior and scene-life.

```json
{
  "presentationProfileId": "urban-media-corner"
}
```

The catalog also declares explicit `ambientFixtures`. In V1 the resting cat is owned only by `warm-starter-living`; television is not an ambient fixture in any profile and remains player-placeable catalog content. Presentation resolver output is immutable and is consumed only by Three.js scene assembly. It must not become a feature vector, scorer input, ergonomics rule, progression condition or economy input.

## Levels and functional layout

A level definition declares geometry, available items, required composition roles, `presentationProfileId`, optional prerequisites and `ergonomicsRules`. A rule in a level is policy; evaluators are generic Domain code. In the future, the level will reference one `ClientBrief`; current levels instead rely on their single starter style dataset.

| Rule kind | Required extra field | Use case |
|---|---|---|
| `adjacency` | none | Dining table requires sufficient seats on declared usable sides. |
| `front-adjacency` | `maxAngleDegrees` in `(0, 90]` | Sofa faces TV; coffee surface lies in front of the sofa. |

All functional rules use semantic selectors, `minPartners`, edge-to-edge `distance`, positive `weight` and an authored `messageKey`. Partners are consumed one-to-one for a rule. Successful functional pairs are passed to the clearance evaluator as narrow exclusions; unrelated tight pairs retain their clearance penalties.

```json
{
  "schemaVersion": 1,
  "id": "coffee-surface-in-front-of-lounge-seat",
  "kind": "front-adjacency",
  "anchorSelector": { "affordance": "lounge-seat" },
  "partnerSelector": { "affordance": "coffee-surface" },
  "minPartners": 1,
  "distance": { "min": 0.1, "max": 0.6 },
  "maxAngleDegrees": 30,
  "weight": 0.9,
  "messageKey": "functional-coffee-surface-in-front-of-lounge-seat"
}
```

## Scoring and feedback

Style fit, client-priority satisfaction and ergonomics must remain separate deterministic inputs. Current parameters aggregate one starter style score and ergonomics as **70% / 30%**. When `ClientBrief v1` arrives, it must replace the single-style input with explicit multi-style/client-constraint channels without changing the invariant that feedback never changes score.

Ergonomics violations include generic clearance, passage zones and functional layouts. The same violation flows to `ErgonomicsScorer` and to the feedback catalog. Every new policy requires a matching feedback entry with a stable `id`, category, severity and player-actionable template; `EvaluationView` only resolves and renders it.

## Visual profiles

`item-visuals.json` only controls Three.js representation. The `tv-001 → television` profile selects a dedicated frame/screen/stand builder, but that geometry is not a source of gameplay semantics. A visual profile may be added or changed without changing scoring unless the separate semantic catalog/level/brief contracts change.

## Authoring checklist

1. Decide whether the change is a catalog item, a client brief, a level policy, a scoring parameter, feedback or visual-only profile.
2. Update the relevant versioned JSON and schema only if its public contract changes.
3. Add a red content/schema test and minimal Domain test for a new rule kind.
4. Register new runtime data in static asset inventory.
5. Add feedback for every user-visible violation and every client constraint.
6. Run full tests, build and dependency audit; test the affected brief in browser before release.

See [Architecture overview](../architecture/overview.md) for layer ownership and [Product overview](../product/overview.md) for current versus target player scenarios.
