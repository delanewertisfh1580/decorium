# ADR-028 — Scorecard calibration and authoritative completion gates

**Статус:** Accepted

**Дата:** 16 августа 2026 г.

**Продолжает:** [ADR-006 — Star-rating thresholds](adr-006-star-rating-thresholds.md), [ADR-025 — ClientBrief as the source of design requirements](adr-025-client-brief-source-policy.md) and [ADR-027 — Required client functional scenarios](adr-027-required-functional-scenarios.md)

## Контекст

Decorium evaluates independent style and ergonomics channels, aggregates them into one score and maps that score to stars. PROD-020 added `critical` functional-scenario diagnostics from client-owned requirements. Without a separate calibration step, a room could receive a perfect rating from style and still complete a level while omitting the client’s required media, dining or work function.

A direct UI-side comparison (`stars >= targetScore`) cannot safely encode this policy. It loses the distinction between raw and calibrated results, duplicates rules outside the Domain/Application boundary, and makes a future explainable interface depend on inference rather than evidence.

## Решение

Introduce an immutable `ScorecardCalibrationPolicy` in Domain. It receives a raw aggregate score, a `StarRatingPolicy`, a typed `ClientBrief.evaluationPolicy.completion` value and all evaluation violations. It returns a deterministic scorecard containing raw facts, calibrated display stars and a separate completion decision.

| Decision | Adopted policy |
|---|---|
| Raw facts | Preserve `rawScore` and `rawStars`; calibration must not overwrite analytical channel facts. |
| Authored parameters | `criticalStarCap` and `scoreEpsilon` are required fields in versioned `scoring-parameters.json` V2 and are validated/frozen by explicit `ScoringPolicy`. |
| Threshold noise | `StarRatingPolicy` uses `score + epsilon >= threshold`, bounded to `0..0.01`. |
| Critical identifiers | Include only `critical === true` concrete `diagnosticId` values, sorted and deduplicated; each authored `constraintId` remains a separate rule reference. |
| `block-completion` | Cap stars below the brief target and `criticalStarCap`; return `completionEligible: false` and reason `critical-rule`. |
| `cap-stars` | Cap display stars at `criticalStarCap`; eligibility follows capped rating against `minimumStars`. |
| `informational` | Preserve raw stars; eligibility follows normal target comparison. |
| Persistence input | `RecordLevelCompletionUseCase` uses explicit `completionEligible` when supplied; it retains stars/target fallback solely for legacy callers. |

`EvaluateRoomUseCase` is the application composition boundary. It sends score, violations and brief completion policy to the Domain calibration policy, then returns calibrated fields in `evaluationData`. `GameController` only forwards the brief policy to evaluation and the resulting boolean to completion persistence. It neither derives nor alters the decision.

## Consequences

A successful completion now means both that the scorecard is eligible and that its persistence succeeds. Critical functional failures cannot be masked by a style-perfect placement in block mode. Existing values remain inspectable: player-facing explanation can state that a raw high rating was capped because of a named critical rule.

The decision is reproducible from saved/versioned inputs: scoring parameter version, ClientBrief completion rule, room state and deterministic diagnostic set. Infrastructure continues to deliver data only; it contains no cap or progression decision.

All currently shipped briefs use `block-completion`, but `cap-stars` and `informational` are supported semantic modes so future briefs can express weaker enforcement without branching Presentation code.

## Rejected alternatives

1. **Check `stars >= targetScore` in GameController.** Rejected because UI would own progression policy and has no structured raw/calibrated audit trail.
2. **Change only the aggregate score for critical violations.** Rejected because it conflates channel evidence with presentation/progression calibration and hides why an otherwise strong room was blocked.
3. **Treat every violation as critical.** Rejected because severity is an authored requirement; ordinary quality issues must remain soft feedback rather than blanket progression blockers.
4. **Persist a standalone eligibility flag in player profile.** Rejected because eligibility is derived, must stay reproducible, and profile persistence should record achieved completion rather than duplicate scoring state.
5. **Apply a global hard block without ClientBrief mode.** Rejected because enforcement strength belongs to client-owned requirements and future briefs may legitimately choose capped or informational treatment.

## References

[1]: ../../data/scoring/scoring-parameters.json "Versioned scoring parameters"
[2]: ../../src/Domain/Scoring/ScoringPolicy.js "Immutable scoring-policy validation"
[3]: ../../src/Domain/Scoring/ScorecardCalibrationPolicy.js "Scorecard calibration policy"
[4]: ../../src/Domain/Scoring/StarRatingPolicy.js "Star threshold policy"
[5]: ../../src/Application/UseCases/EvaluateRoomUseCase.js "Evaluation application boundary"
[6]: ../../src/Application/UseCases/RecordLevelCompletionUseCase.js "Completion persistence boundary"
[7]: ../../src/Presentation/Controllers/GameController.js "Presentation forwarding"
[8]: adr-006-star-rating-thresholds.md "ADR-006"
[9]: adr-025-client-brief-source-policy.md "ADR-025"
[10]: adr-027-required-functional-scenarios.md "ADR-027"
