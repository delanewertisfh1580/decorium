# ADR-030 — Client-priority and multi-style scoring

**Статус:** Accepted
**Дата:** 17 августа 2026 г.
**Продолжает:** [ADR-025 — ClientBrief source policy](adr-025-client-brief-source-policy.md), [ADR-028 — Scorecard calibration policy](adr-028-scorecard-calibration-policy.md) и [ADR-029 — Explainable evaluation contract](adr-029-explainable-evaluation-contract.md)

## Контекст

`ClientBrief v1` уже был единственным источником клиентских требований, но production evaluator использовал только primary style target. Secondary/accent targets, client priorities, density и preference к свободному пространству оставались сохранёнными, но неактивными данными. Это создавало разрыв между тем, что обещает brief игроку, и тем, что реально меняет детерминированный score.

Также двухканальная формула не различала эстетическое соответствие, собственные приоритеты клиента и общую эргономику. Простое добавление весов в Presentation либо дублирование composition penalty для каждой style target нарушило бы архитектурные границы и исказило бы итог. В частности, density должна измеряться из геометрии текущего `RoomState`, а не из названий предметов или визуального меша.[1] [2]

## Решение

Вводится production evaluation на основе versioned authored content. `ClientBrief v2` требует явное правило у каждого client priority, а versioned style-constraint catalog хранит exact profile ID, authored display label и constraints. `LoadLevelUseCase` гидрирует эти records в immutable `evaluationSpec`; level продолжает владеть topology, inventory и presentation reference, но не выводит client policy.[3] [4]

| Решение | Принятая политика |
|---|---|
| Style targets | `MultiStyleEvaluator` independently evaluates every exact hydrated target and normalizes its weighted fit. Unknown profile is a deterministic content error; prefix/fuzzy fallback is prohibited. |
| Composition | `StyleChannelPolicy` blends weighted target fit with composition exactly once: `0.75 × targetFit + 0.25 × composition`. Composition is not reapplied per target. |
| Client priorities | `ClientPriorityEvaluator` evaluates `functional-scenario` and `spatial-preferences` rule kinds, normalizes positive priority weights and returns stable diagnostics. |
| Spatial facts | `RoomOccupancyProfile` measures occupancy using a fixed `0.1 m` grid, counts overlapping floor cells once and exposes reproducible free-area ratio. |
| Density semantics | `SpatialPreferenceEvaluator` makes authored `intimate`/`balanced`/`open` bounds the active satisfaction baseline; `discourage-excess` narrows the upper bound and `require-open` raises the lower bound. Priority importance is expressed only by `clientPriorities[].weight`. |
| Aggregate | `ThreeChannelScoreAggregator` uses the authored weights `style: 0.5`, `clientPriorities: 0.2`, `ergonomics: 0.3`; values are strictly validated and normalized. |
| Calibration | Existing `ScorecardCalibrationPolicy` remains the sole owner of display-star caps and completion eligibility after the three-channel raw score is calculated. |
| Explainability | `MultiChannelViolationImpactPolicy` recomputes the exact V2 counterfactual per style, priority or ergonomics diagnostic. `MultiChannelEvaluationExplanationAssembler` returns `explanation.schemaVersion: 2`. |
| Display labels | Style profile and priority labels are authored presentation metadata transported through immutable DTOs. Labels never alter score, weights, thresholds, completion or progression. |

The resulting formula is:

> `StyleScore = 0.75 × WeightedTargetFit + 0.25 × CompositionScore`
> `ClientPriorityScore = Σ(priorityWeight × satisfaction) / Σ(priorityWeight)`
> `TotalScore = 0.5 × StyleScore + 0.2 × ClientPriorityScore + 0.3 × ErgonomicsScore`

The numeric parameters, spatial grid and density profiles are all versioned content in `scoring-parameters.json` schema version 2 rather than UI constants.[5]

## Consequences

A player’s authored brief now changes all three visible score channels. An intimate brief can penalize excess empty space, an open brief can require it, and a functional or spatial client priority contributes through a declared rule—not a generic feedback tag. Multi-style rooms receive independently visible target scores while composition remains fairly counted once.[1] [2]

The explanation result preserves the prior trust boundary: UI renders supplied three-channel facts, target labels and priority provenance, and can focus only supplied live instances. It does not calculate occupancy, satisfaction, weights, counterfactual recovery, stars or unlocks.[6] [7]

V1 scoring parameters and legacy evaluation tests remain supported by the parameter normalizer and legacy evaluation path. Production bootstrap, however, loads only the V2 brief catalog, V2 schema and multi-style catalog. The static asset inventory explicitly publishes these runtime JSON files into `dist/data`, preventing a build that passes compilation but fails after deployment.[3] [8]

Exact counterfactual attribution costs work proportional to active diagnostics. It is retained because capped style penalties, normalized priorities, exponential ergonomics scoring and critical completion gates make proportional UI estimates false. Any future caching or performance change must preserve deterministic V2 inputs and be introduced as a separate versioned policy decision.[6]

## Rejected alternatives

1. **Score only the primary style target.** Rejected because it leaves authored secondary/accent policy inert and contradicts the product’s multi-style brief model.
2. **Blend composition into every target score.** Rejected because it counts the same room-level composition result multiple times.
3. **Treat priority labels as rule kinds.** Rejected because labels are player-facing metadata; `rule.kind` is the deterministic policy contract.
4. **Use mesh bounds, UI categories or item names for density.** Rejected because they break the semantic/content boundary and are not stable gameplay geometry.
5. **Apply a universal preference for open rooms.** Rejected because client briefs explicitly permit compact/intimate requirements.
6. **Calculate client-priority recovery in EvaluationView.** Rejected because it would duplicate aggregate and calibration policy in Presentation.
7. **Silently fall back to a similar style ID.** Rejected because a typo in authored content must fail deterministically rather than score against a guessed aesthetic.

## References

[1]: ../../src/Domain/Scoring/MultiStyleEvaluator.js "Independent weighted target evaluator"
[2]: ../../src/Domain/Scoring/StyleChannelPolicy.js "Once-only composition blend"
[3]: ../../src/Application/UseCases/LoadLevelUseCase.js "V2 client brief and profile hydration"
[4]: ../../src/Domain/Briefs/ClientBrief.js "ClientBrief V2 priority-rule contract"
[5]: ../../data/scoring/scoring-parameters.json "Versioned three-channel scoring parameters"
[6]: ../../src/Domain/Scoring/MultiChannelViolationImpactPolicy.js "Exact V2 counterfactual attribution"
[7]: ../../src/Presentation/Views/EvaluationView.js "Pure V2 score and explanation renderer"
[8]: ../../src/Infrastructure/DataLoaders/staticDataAssets.js "Published runtime JSON inventory"
[9]: adr-025-client-brief-source-policy.md "ADR-025"
[10]: adr-028-scorecard-calibration-policy.md "ADR-028"
[11]: adr-029-explainable-evaluation-contract.md "ADR-029"
