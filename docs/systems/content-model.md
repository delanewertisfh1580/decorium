# Content model

**Статус:** Active production reference
**Обновлено:** 17 августа 2026 г.

Этот документ — единственный current guide для authored JSON Decorium. Content rules не должны копироваться в Presentation и не должны выводиться из display names, visual meshes или UI category labels.

> **Контентный canon:** стиль — это policy конкретного заказа. Scandinavian, Japandi и Eclectic profiles являются authored targets, а не глобальными правилами игры. Controlled mixing и personal client requests задаются только versioned `ClientBrief v2`.[1] [2]

## Runtime content inventory

| Область | Current canonical files | Version / validation |
|---|---|---|
| Items | `data/items/catalog.v3.json`, `data/items/item.v3.schema.json` | Catalog schema V3 |
| Levels | `data/levels/manifest.json`, `data/levels/level-*.json`, `data/schemas/level.schema.json` | Manifest V1 and topology-only level schema, including required ClientBrief and presentation references |
| Client briefs | `data/briefs/client-briefs.v2.json`, `data/briefs/client-brief.v2.schema.json` | ClientBrief catalog V2: identity, weighted targets, explicit priority rules, spatial preferences and evaluation policy |
| Style profiles | `data/styles/style-constraint-catalog.v1.json`, `data/styles/style-constraint-catalog.v1.schema.json` | Exact multi-style profile IDs, authored labels and constraints; no fuzzy lookup |
| Presentation environments | `data/presentation/environment-profiles.v2.json`, `data/presentation/environment-profile.v2.schema.json` | Profile catalog V2 and strict closed-vocabulary schema |
| Scoring | `data/scoring/scoring-parameters.json`, `data/schemas/scoring-parameters.schema.json` | Scoring parameters V2: channels, style blend, occupancy and density profiles |
| Feedback | `data/feedback/scandinavian-feedback.json` | Versioned authored remediation for style, ergonomics and client-priority diagnostics |
| Visuals | `data/visuals/item-visuals.json` | Presentation-only visual profile |
| Release | `public/release-manifest.json` | Generated from BuildInfo during dev/build |

`src/Infrastructure/DataLoaders/staticDataAssets.js` is the deployment inventory. Every runtime JSON file must be added there and covered by a content test; otherwise Vite may not publish it into `dist/data/`.[3]

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

## ClientBrief v2 and style profiles

`ClientBrief v2` is the runtime-loaded, versioned contract for every shipped design order. It is validated in Infrastructure, normalized by the Domain value object and hydrated into immutable `LevelDTO.evaluationSpec` before V2 evaluation. It makes requirements reviewable, deterministic and replayable.[1] [4]

| Field group | Shipped V2 policy | Active behavior |
|---|---|---|
| Identity | `schemaVersion`, stable brief ID, level binding, client ID and display name. | Active loading and player presentation. |
| Style targets | Unique primary/secondary/accent profile IDs with positive normalized weights. | Every target is independently scored; weighted fit feeds style channel. |
| Profile label | `style-constraint-catalog.v1` profile `label`. | Hydrated through evaluation result for display only; label does not change policy. |
| Client priorities | Stable ID, label, positive weight and required explicit rule. | Independently evaluated and normalized into client-priority channel. |
| `functional-scenario` rule | Scenario ID plus message key. | Satisfaction comes from the matching hydrated required scenario. |
| `spatial-preferences` rule | Priority references authored spatial preferences. | Satisfaction comes from fixed-grid occupancy and density/free-area rules. |
| Spatial preferences | Density, clearance multiplier and empty-space target/mode/weight. | Clearance multiplier, density and empty-space policy are active. |
| Evaluation policy | Completion target, `criticalRuleMode`, composition and ergonomics rules. | Active source of evaluation inputs; critical results calibrate completion. |

Style profile IDs must resolve exactly. `JsonConstraintCatalog.getStyleProfileById()` returns an immutable profile `{ id, label, constraints }`, and unknown IDs resolve to `null`; application treats a referenced unknown/empty profile as a deterministic content error. The style profile schema is versioned separately because profile content evolves independently of ClientBrief records.[2] [5]

## Authored presentation environments

Every shipped level declares `presentationProfileId`. `LoadLevelUseCase` resolves the reference through the validated PresentationEnvironment repository and returns the hydrated profile in `LevelDTO.presentationEnvironment`. The profile catalog is `schemaVersion: 2`; each profile selects only closed presets for floor, wall, openings, camera, lighting, exterior and scene-life.

Presentation resolver output is immutable and is consumed only by Three.js scene assembly. It must not become a feature vector, scorer input, ergonomics rule, progression condition or economy input.

## Levels and functional layout

A level definition declares geometry, available items, initial placement and `presentationProfileId`; it references exactly one `clientBriefId`. ClientBrief owns style targets, priority rules, spatial preferences, completion, composition and ergonomics policy. Evaluators are generic Domain code: they consume hydrated policy and must never recover an evaluation rule from level topology or UI state.

| Rule kind | Required extra field | Use case |
|---|---|---|
| `adjacency` | none | Dining table requires sufficient seats on declared usable sides. |
| `front-adjacency` | `maxAngleDegrees` in `(0, 90]` | Sofa faces TV; coffee surface lies in front of the sofa. |

All functional relationship rules use semantic selectors, `minPartners`, edge-to-edge `distance`, positive `weight` and an authored `messageKey`. Partners are consumed one-to-one for a rule. Successful functional pairs are passed to the clearance evaluator as narrow exclusions; unrelated tight pairs retain their clearance penalties.

A required functional scenario is separate policy: it declares one or more affordance roles and `minCount` cardinality even when no anchor is present. `RequiredFunctionalScenarioEvaluator` emits a critical role-level diagnostic for each missing role. Scenarios are client-owned in `ClientBrief`, not inferred from level topology.

## Scoring, explanations and feedback

The V2 evaluator has three deterministic channels. All numeric policy is versioned content, validated before bootstrap and consumed outside Presentation.[6] [7]

| Channel | Input | Authoritative calculation |
|---|---|---|
| Style | Exact profile constraints for every style target plus composition rules. | `0.75 × weightedTargetFit + 0.25 × compositionScore`; composition participates once. |
| Client priorities | Explicit priority rules, required-scenario result and spatial-preference result. | `Σ(weight × satisfaction) / Σ(weight)`. |
| Ergonomics | Clearance, passage, functional relationships and required scenarios. | Existing deterministic ergonomics scorer. |
| Total | The three channel scores. | `0.5 × style + 0.2 × clientPriorities + 0.3 × ergonomics`. |

`RoomOccupancyProfile` uses the versioned `0.1 m` cell size to mark occupied floor cells once. `SpatialPreferenceEvaluator` applies the authored `intimate`, `balanced` or `open` density profile and empty-space preference. A compact room is therefore valid when the client requests it; no global openness preference exists.[8]

`EvaluationExplanation v2` is a runtime Application-to-Presentation contract, not persisted JSON. It includes existing stable diagnostic ID, channel, priority identity when applicable, rule description, actual/desired fact, numeric/authored severity, authored remediation, exact counterfactual recovery and current RoomState instance references. Feedback severity uses `low`, `medium` or `high`; Domain `critical: true` remains the authoritative override.[9]

`MultiChannelViolationImpactPolicy` calculates recovery by recomputing the V2 result without only that diagnostic. It is neither a content-authored weight nor additive per-item blame. `ScorecardCalibrationPolicy` preserves raw values and derives display stars, critical caps and `completionEligible`; Presentation forwards the result and never compares stars or derives an unlock.[7] [9]

## Visual profiles

`item-visuals.json` controls only Three.js representation. Geometry is not a source of gameplay semantics. A visual profile may be added or changed without changing scoring unless a separate semantic catalog/brief contract changes.

## Authoring checklist

1. Decide whether the change is a catalog item, a client brief, a style profile, a scoring parameter, feedback or visual-only profile.
2. Update the relevant versioned JSON and schema only if its public contract changes.
3. Add a red content/schema test and minimal Domain test for a new rule kind.
4. Register new runtime data in static asset inventory.
5. Add feedback for every user-visible violation and every client constraint.
6. Run full tests, build and dependency audit; test the affected brief in browser before release.

See [Architecture overview](../architecture/overview.md) for layer ownership and [Product overview](../product/overview.md) for current player scenarios.

## References

[1]: ../../data/briefs/client-brief.v2.schema.json "ClientBrief V2 schema"
[2]: ../../data/styles/style-constraint-catalog.v1.schema.json "Style catalog schema"
[3]: ../../src/Infrastructure/DataLoaders/staticDataAssets.js "Static runtime data inventory"
[4]: ../../src/Domain/Briefs/ClientBrief.js "ClientBrief Domain value"
[5]: ../../src/Infrastructure/DataLoaders/JsonConstraintCatalog.js "Exact profile adapter"
[6]: ../../data/scoring/scoring-parameters.json "Scoring parameters V2"
[7]: ../../src/Application/UseCases/EvaluateRoomUseCase.js "Evaluation application boundary"
[8]: ../../src/Domain/Scoring/RoomOccupancyProfile.js "Fixed-grid occupancy measurement"
[9]: ../../src/Application/Services/MultiChannelEvaluationExplanationAssembler.js "Explanation V2 assembly"
