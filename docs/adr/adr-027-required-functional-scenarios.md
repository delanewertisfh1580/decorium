# ADR-027 — Required client functional scenarios

**Статус:** Accepted

**Дата:** 16 августа 2026 г.

**Продолжает:** [ADR-015 — Functional layout graph](adr-015-functional-layout-graph.md) and [ADR-025 — ClientBrief as the source of design requirements](adr-025-client-brief-source-policy.md)

## Контекст

Functional layout rules already model spatial relationships such as a dining seat near an existing dining surface or a lounge seat facing an existing view target. Their anchor-first evaluation is correct for relationship quality, but it cannot detect a missing functional group: without an anchor there is nothing to evaluate.

Client briefs must be binding gameplay requirements. A brief for warm dinners, intimate media evenings or focused work needs an explicit answer to a separate question: **does the room contain the required scenario at all?** Counting categories or inferring function from mesh names cannot answer it reliably.

## Решение

A `ClientBrief` owns a non-empty `evaluationPolicy.ergonomicsRules.requiredFunctionalScenarios` array. Every V1 scenario has a versioned stable identity, role cardinality expressed through catalog `InteractionProfile` affordances, weight, `critical` flag and message key.

`RequiredFunctionalScenario` is an immutable Domain value object. `RequiredFunctionalScenarioEvaluator` counts placed instances for every declared role and returns one deterministic violation per unmet role. This evaluator is invoked by `SpatialErgonomicsEvaluator` before existing functional-layout, clearance and passage evaluators.

| Concern | Decision |
|---|---|
| Presence requirement | Scenario checks role counts even when no anchor object exists. |
| Relationship quality | Existing `FunctionalLayoutRule` remains responsible for distance, orientation and usable-side correctness after roles exist. |
| Semantic source | Only versioned catalog affordances may satisfy a role. |
| Cardinality | `minCount` is positive integer; repeat-placeable catalog items may fulfill a role more than once. |
| Criticality | Scenario emits `critical` diagnostic data. Enforcement in star/completion policy is deliberately deferred to calibration. |
| Diagnostics | Stable scenario-role ID, actual count, threshold, severity, matching item IDs and message key are carried to Application. |

## Consequences

The three shipped levels now have explicit client requirements: dining hosting, evening media and focused work. Missing groups lower ergonomics through the existing scorer and no longer appear ergonomically neutral. The evaluator remains deterministic from persisted brief plus room state.

The introduction of `work-seat` and `work-surface` expands catalog semantics only to satisfy the authored work scenario. It does not imply automatic broad scoring for every desk or chair; future catalog coverage remains a separate slice.

A critical scenario absence is now visible in evaluation data but does **not** yet cap stars or block progression. That policy needs numerical calibration across style/ergonomics channels and is owned by PROD-021.

## Rejected alternatives

1. **Use `minItems` or category coverage as scenario evidence.** Rejected because a room with decor and lighting can satisfy counts while lacking the client’s actual dining/media/work function.
2. **Make absent anchors a special case inside `FunctionalLayoutEvaluator`.** Rejected because it would conflate scenario existence with relationship geometry and complicate matching semantics.
3. **Infer scenarios from item names or GLB assets.** Rejected because visuals must not become gameplay policy; affordances remain authored semantic data.
4. **Let UI infer and display missing groups.** Rejected because UI must not calculate client requirements or score conditions.
5. **Immediately block completion for all critical diagnostics.** Rejected because score caps, star thresholds and progression timing need their own calibration contract.

## References

[1]: ../../data/briefs/client-brief.v1.schema.json "ClientBrief scenario schema"
[2]: ../../data/briefs/client-briefs.v1.json "Authored scenarios"
[3]: ../../src/Domain/Ergonomics/RequiredFunctionalScenario.js "Required scenario value object"
[4]: ../../src/Domain/Ergonomics/RequiredFunctionalScenarioEvaluator.js "Required scenario evaluator"
[5]: ../../src/Domain/Ergonomics/FunctionalLayoutEvaluator.js "Existing relationship evaluator"
[6]: ../../src/Domain/Ergonomics/SpatialErgonomicsEvaluator.js "Evaluator orchestration"
[7]: adr-015-functional-layout-graph.md "ADR-015"
[8]: adr-025-client-brief-source-policy.md "ADR-025"
