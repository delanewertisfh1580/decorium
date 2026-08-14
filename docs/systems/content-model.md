# Content model

**Статус:** Active production reference
**Обновлено:** 15 августа 2026 г.

Этот документ — единственный current guide для authored JSON Decorium. Content rules не должны копироваться в Presentation и не должны выводиться из display names, visual meshes или UI category labels.

## Runtime content inventory

| Область | Canonical files | Version / validation |
|---|---|---|
| Items | `data/items/catalog.v3.json`, `data/items/item.v3.schema.json` | Catalog schema V3 |
| Levels | `data/levels/manifest.json`, `data/levels/level-*.json`, `data/schemas/level.schema.json` | Manifest V1 and level schema |
| Scoring | `data/scoring/scoring-parameters.json` | Versioned scoring parameters loader |
| Style | `data/styles/scandinavian.json`, `data/constraints/scandinavian-constraints.json` | Authored style and constraint catalogs |
| Feedback | `data/feedback/scandinavian-feedback.json` | Message id lookup |
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

Adding a catalog item requires: V3 schema validity, a complete feature vector, semantic profile, optional visual profile, catalog content test and level references only after the item is valid. Do not infer semantics from `id` or `name`.

## Levels and functional layout

A level definition declares geometry, available items, required composition roles, optional prerequisites and `ergonomicsRules`. A rule in a level is policy; evaluators are generic Domain code.

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

Style and ergonomics are separate deterministic inputs aggregated by parameters authored in `scoring-parameters.json`, presently **70% style / 30% ergonomics**. Ergonomics violations include generic clearance, passage zones and functional layouts. The same violation flows to `ErgonomicsScorer` and to the feedback catalog; feedback never changes its score.

Every new rule must have a matching feedback entry with a stable `id`, category, severity and player-actionable template. `EvaluationView` resolves and renders the authored result; it does not contain fallback rule text.

## Visual profiles

`item-visuals.json` only controls Three.js representation. The `tv-001 → television` profile selects a dedicated frame/screen/stand builder, but that geometry is not a source of gameplay semantics. A visual profile may be added or changed without changing scoring unless the separate semantic catalog/level contracts change.

## Authoring checklist

1. Decide whether the change is a catalog item, a level policy, a scoring parameter, feedback or visual-only profile.
2. Update the relevant versioned JSON and schema only if its public contract changes.
3. Add a red content/schema test and minimal Domain test for a new rule kind.
4. Register new runtime data in static asset inventory.
5. Add feedback for every user-visible violation.
6. Run full tests, build and dependency audit; test the affected level in browser before release.

See [Architecture overview](../architecture/overview.md) for layer ownership and [Product overview](../product/overview.md) for shipped player scenarios.
