# ADR-029 — Explainable evaluation contract and counterfactual attribution

**Статус:** Accepted

**Дата:** 17 августа 2026 г.

**Продолжает:** [ADR-006 — Star-rating thresholds](adr-006-star-rating-thresholds.md), [ADR-027 — Required client functional scenarios](adr-027-required-functional-scenarios.md) and [ADR-028 — Scorecard calibration and authoritative completion gates](adr-028-scorecard-calibration-policy.md)

## Контекст

Decorium had deterministic score, diagnostics and calibrated completion eligibility, but its player-facing result was a flat list of feedback strings. A player could not distinguish a room-level style concern from an affected placed item, inspect the exact fact/threshold, or see why correcting a particular issue would change raw score, display stars or completion.

A UI-side explanation calculation would violate the scoring boundary and produce misleading answers. Individual diagnostic contributions are not additive: style penalty is capped, ergonomics score is exponential and a critical completion block can remain after one of several critical diagnostics is removed.

## Решение

Introduce two layers of explainability:

1. `ViolationImpactPolicy` is an immutable Domain policy. It calculates the exact counterfactual scorecard for each diagnostic by removing only that diagnostic and reusing existing scorer, aggregate and calibration collaborators.
2. `EvaluationExplanationAssembler` is an Application service. It combines Domain impact facts with existing diagnostics, current RoomState instance references and structured authored feedback metadata into immutable `explanation.schemaVersion: 1`.

| Decision | Adopted policy |
|---|---|
| Impact wording | Report recovery from correcting one diagnostic, never an additive share of blame. |
| Counterfactual set | Keep all other diagnostics unchanged; recompute the affected channel, aggregate and calibrated scorecard. |
| Completion effect | `restores-completion` only when the resulting scorecard is eligible; otherwise `none`. |
| Rule correction | Source one-to-one from the authored feedback entry identified by existing `messageKey`. |
| Severity | Preserve numeric Domain severity; render authored feedback level, with Domain `critical` overriding the shown level. |
| Instance attribution | Resolve only existing `itemIds` from current RoomState. Empty resolution means explicit `scope: room`, never guessed furniture. |
| Presentation action | View emits a selected `instanceId`; GameController validates it and reuses existing selection rendering. |
| Backwards compatibility | The compact legacy evaluation view remains valid when no `explanation` object is present. |

## Consequences

An explanation card is truthful under scoring caps and critical gates. A player sees actual/desired evidence, direct actionable feedback and can select an affected live object without triggering move, placement, persistence or score recalculation.

The explanation DTO is runtime data, but has `schemaVersion: 1` because Presentation consumes it as a public boundary. It is frozen at assembly and reproducible from RoomState, ClientBrief, versioned scoring content and authored feedback. A missing feedback entry is an authored content failure rather than an opportunity for UI to synthesize a rule.

The counterfactual approach has proportional work per diagnostic. Current evaluated room and catalog sizes are bounded, and the exact output prevents a far more harmful class of player-facing misinformation. If future catalog/violation limits require it, performance measurement and caching must be introduced in a new versioned policy change—not approximated silently in UI.

## Rejected alternatives

1. **Assign `severity × weight` directly as score impact.** Rejected because capped and exponential scoring make it inaccurate.
2. **Render generic feedback strings beside diagnostics.** Rejected because it loses stable one-to-one rule, fact and instance evidence.
3. **Attribute every style issue to the most recently placed item.** Rejected because style vector violations are room-level facts.
4. **Let EvaluationView map message keys to templates/severity.** Rejected because UI would import content policy and could drift from Application results.
5. **Add a separate persistent explanation record to PlayerProfile.** Rejected because explanation is derived and must stay reproducible rather than duplicating evaluation state.
6. **Create a new 3D error-material system immediately.** Rejected because existing selected-instance feedback rendering already gives the player a stable visual focus path. A multi-highlight visual language can be a separate Presentation slice if evidence shows it is needed.

## References

[1]: ../../src/Domain/Scoring/ViolationImpactPolicy.js "Violation impact policy"
[2]: ../../src/Application/Services/EvaluationExplanationAssembler.js "Explanation assembly"
[3]: ../../src/Application/UseCases/EvaluateRoomUseCase.js "Evaluation boundary"
[4]: ../../src/Infrastructure/DataLoaders/JsonFeedbackCatalog.js "Feedback metadata adapter"
[5]: ../../src/Presentation/Views/EvaluationView.js "Explainable view"
[6]: ../../src/Presentation/Controllers/GameController.js "Instance focus flow"
[7]: adr-006-star-rating-thresholds.md "ADR-006"
[8]: adr-027-required-functional-scenarios.md "ADR-027"
[9]: adr-028-scorecard-calibration-policy.md "ADR-028"
