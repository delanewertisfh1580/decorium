# Content model

**Статус:** Active production reference
**Обновлено:** 16 августа 2026 г.

Этот документ — единственный current guide для authored JSON Decorium. Content rules не должны копироваться в Presentation и не должны выводиться из display names, visual meshes или UI category labels.

> **Контентный canon:** стиль — это policy конкретного заказа. Current Scandinavian files являются starter dataset, а не глобальным стилем игры. Production content pipeline должен поддерживать несколько стилей и их controlled mixing через versioned client brief.

## Runtime content inventory

| Область | Current canonical files | Version / validation |
|---|---|---|
| Items | `data/items/catalog.v3.json`, `data/items/item.v3.schema.json` | Catalog schema V3 |
| Levels | `data/levels/manifest.json`, `data/levels/level-*.json`, `data/schemas/level.schema.json` | Manifest V1 and topology-only level schema, including required ClientBrief and presentation references |
| Client briefs | `data/briefs/client-briefs.v1.json`, `data/briefs/client-brief.v1.schema.json` | ClientBrief catalog V1: client identity, style targets, priorities, spatial preferences and evaluation policy |
| Presentation environments | `data/presentation/environment-profiles.v2.json`, `data/presentation/environment-profile.v2.schema.json` | Profile catalog V2 and strict closed-vocabulary schema |
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
| `affordances` | `dining-seat`, `dining-surface`, `lounge-seat`, `coffee-surface`, `view-target`, `work-seat`, `work-surface` | Semantic roles used by functional relationships and required client scenarios. |
| `frontAxis` | `positiveX`, `negativeX`, `positiveZ`, `negativeZ`, `null` | Local front direction before placed-item rotation. |
| `usableSides` | Cardinal local axes | Sides on which adjacency partners may satisfy the anchor. |

Adding a catalog item requires V3 schema validity, a complete feature vector, semantic profile, optional visual profile, catalog content test and level references only after the item is valid. Do not infer semantics from `id` or `name`.

## ClientBrief v1

`ClientBrief v1` is the runtime-loaded, versioned contract for every shipped design order. It is validated in Infrastructure, normalized by the Domain value object and hydrated into `LevelDTO` before any current evaluation input is assembled. Its purpose is to make client requirements reviewable, deterministic and replayable.

| Field group | Shipped V1 policy | Activation state |
|---|---|---|
| Identity | `schemaVersion`, stable brief ID, level binding, client ID and display name. | Active loading and player presentation. |
| Style targets | One primary and optional secondary/accent IDs with normalized weights. | Primary target feeds the current starter-style channel; weighted mixing follows in its own evaluator slice. |
| Client priorities | Stable labels and positive weights. | Visible in the player brief; scoring activation follows in a dedicated priority channel. |
| Spatial preferences | Density, clearance multiplier and empty-space target/mode/weight. | Clearance multiplier actively scales `MinimumClearanceRule`; density and empty-space channels remain staged. |
| Evaluation policy | Completion target, composition, existing ergonomics rules and required functional scenarios. | Active source of current evaluator inputs; required scenarios emit critical diagnostics. |

Future V1 extensions may add explicit mix compatibility, hard constraints and additional feedback mapping only through schema evolution, red contracts and deterministic evaluators. The evaluator must consume only authored brief policy, style catalogs and RoomState. It must not infer client taste from item names, use an LLM at runtime or encode a default aesthetic in Presentation.

## Authored presentation environments

Every shipped level must declare `presentationProfileId`. `LoadLevelUseCase` resolves the reference through the validated PresentationEnvironment repository and returns the hydrated profile in `LevelDTO.presentationEnvironment`. The profile catalog is `schemaVersion: 2`; each profile is likewise versioned and selects only closed presets for floor, wall, openings, camera, lighting, exterior and scene-life.

```json
{
  "presentationProfileId": "urban-media-corner"
}
```

The catalog also declares explicit `ambientFixtures`. In V1 the resting cat is owned only by `warm-starter-living`; television is not an ambient fixture in any profile and remains player-placeable catalog content. Presentation resolver output is immutable and is consumed only by Three.js scene assembly. It must not become a feature vector, scorer input, ergonomics rule, progression condition or economy input.

## Levels and functional layout

A level definition declares geometry, available items, initial placement and `presentationProfileId`; it must reference exactly one `clientBriefId`. ClientBrief owns style targets, completion, composition and ergonomics policy. Evaluators are generic Domain code: they consume hydrated policy and must never recover an evaluation rule from level topology or UI state.

| Rule kind | Required extra field | Use case |
|---|---|---|
| `adjacency` | none | Dining table requires sufficient seats on declared usable sides. |
| `front-adjacency` | `maxAngleDegrees` in `(0, 90]` | Sofa faces TV; coffee surface lies in front of the sofa. |

All functional relationship rules use semantic selectors, `minPartners`, edge-to-edge `distance`, positive `weight` and an authored `messageKey`. Partners are consumed one-to-one for a rule. Successful functional pairs are passed to the clearance evaluator as narrow exclusions; unrelated tight pairs retain their clearance penalties.

A required functional scenario is separate policy: it declares one or more affordance roles and `minCount` cardinality even when no anchor is present. `RequiredFunctionalScenarioEvaluator` emits a critical role-level diagnostic for each missing role. Scenarios are client-owned in `ClientBrief`, not inferred from level topology; `dining-hosting`, `evening-media` and `focused-work` are the shipped initial scenarios.

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

Style fit, client-priority satisfaction and ergonomics remain separate deterministic inputs. Current parameters aggregate the ClientBrief primary-style starter score and ergonomics as **70% / 30%**. ClientBrief V1 has replaced level-side policy ownership; clearance multiplier and required scenarios are active client-owned ergonomics inputs. Later slices activate weighted secondary/accent targets, client priorities, density and empty-space preference without changing the invariant that feedback never changes score.

Ergonomics violations include generic clearance, passage zones, functional relationships and required functional scenarios. The same violation flows to `ErgonomicsScorer` and to the feedback catalog. Every new policy requires a matching feedback entry with a stable `id`, category, severity and player-actionable template; `EvaluationView` only resolves and renders it.

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
