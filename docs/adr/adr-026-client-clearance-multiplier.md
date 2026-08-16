# ADR-026 — Client-specific minimum-clearance threshold

**Статус:** Accepted

**Дата:** 16 августа 2026 г.

**Продолжает:** [ADR-025 — ClientBrief as the source of design requirements](adr-025-client-brief-source-policy.md)

## Контекст

PROD-018 made `ClientBrief` the deterministic source of client requirements and introduced `spatialPreferences.clearanceMultiplier`. The value was validated and visible in the brief, but the runtime still evaluated every level with the authored `minimumDistance` unchanged. Consequently, an intimate client preference could not affect the actual clearance penalty.

A direct replacement of authored values would lose auditability and make it impossible to distinguish universal design policy from client-specific accommodation. The evaluator must retain both the authored rule and the effective rule used for this particular client.

## Решение

`MinimumClearanceRule` now accepts a positive `clientMultiplier` with neutral default `1` and exposes:

```text
effectiveMinimumDistance = minimumDistance × clientMultiplier
```

`LoadLevelUseCase` obtains the multiplier only from the resolved `ClientBrief` and injects it while constructing the Domain rule. `ClearanceEvaluator` uses `effectiveMinimumDistance` for gap comparison, violation threshold and severity normalization.

| Concern | Decision |
|---|---|
| Authored policy | `minimumDistance` remains unchanged and inspectable. |
| Client policy | `clientMultiplier` is immutable Domain data derived from the resolved brief. |
| Diagnostics | A violation reports effective `threshold`; rule identity and weight remain stable. |
| Compatibility | Missing multiplier means `1`, preserving existing behavior for neutral/legacy in-memory rules. |
| Validation | Non-positive, non-finite values are rejected by Domain construction. |
| Scope | Only universal minimum-clearance channel changes in this slice. |

## Consequences

An intimate brief can intentionally tolerate a smaller edge gap without changing the global authored rule. An open-space brief can later use a multiplier above `1` to require more separation. Both decisions remain deterministic and reproducible from the persisted ClientBrief and level placement.

Severity now reflects distance from the client-specific threshold. This is necessary for explainable scoring: a 0.1 m deficit against a 0.6 m threshold and the same deficit against a 0.8 m threshold are not equivalent violations.

The multiplier does not alter functional adjacency, passage zones, item collision blocking or presentation. It also does not yet activate `density` or `emptySpacePreference`; those fields require independent contracts and calibration.

## Rejected alternatives

1. **Multiply inside Presentation.** Rejected because UI must not calculate or reinterpret score policy.
2. **Overwrite `minimumDistance` in JSON or level data.** Rejected because client policy would be duplicated and the authored universal rule would no longer be auditable.
3. **Apply the multiplier globally.** Rejected because each level must resolve its own brief and client policy.
4. **Use the multiplier for all spatial rules.** Rejected because functional relationships and passage zones have different semantics and require separate calibration.
5. **Clamp silently when the multiplier is invalid.** Rejected because malformed client policy must fail deterministically at Domain validation rather than changing gameplay invisibly.

## Verification

The level-002 authored brief (`clearanceMultiplier: 0.75`) produces an effective threshold of `0.6 m` from its authored `0.8 m` rule. A real catalog scenario with a `0.7 m` sofa/table edge gap now produces no minimum-clearance violation, while gaps below `0.6 m` continue to produce normalized violations.

## References

[1]: ../../data/briefs/client-brief.v1.schema.json "ClientBrief v1 schema"
[2]: ../../data/briefs/client-briefs.v1.json "Authored client preferences"
[3]: ../../src/Domain/Ergonomics/MinimumClearanceRule.js "Effective clearance rule"
[4]: ../../src/Domain/Ergonomics/ClearanceEvaluator.js "Clearance penalty evaluator"
[5]: ../../src/Application/UseCases/LoadLevelUseCase.js "Brief hydration boundary"
[6]: ../slices/PROD-018-client-brief-source-foundation.md "ClientBrief source foundation"
[7]: ../slices/PROD-019-client-clearance-multiplier.md "PROD-019 delivery report"
