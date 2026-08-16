# PROD-019 — Client-specific clearance multiplier

**Статус:** Completed

**Дата:** 16 августа 2026 г.

**Связанное решение:** [ADR-026](../adr/adr-026-client-clearance-multiplier.md)

## Цель

PROD-019 активирует первый spatial preference из `ClientBrief v1`: `spatialPreferences.clearanceMultiplier`. До этого слайса brief level-002 корректно загружался, но множитель оставался сохранённым входом и не участвовал в штрафе. В результате intimate-клиент с `clearanceMultiplier: 0.75` получал тот же minimum-clearance threshold, что и нейтральный клиент.

Слайс изменяет только universal minimum-clearance channel. Functional-layout, passage zones, empty-space preference, density, style mixing и client priorities остаются отдельными системами.

> Authored distance — это базовое требование правила. Effective distance = authored distance × client multiplier. Оба значения сохраняются в Domain diagnostics: базовое правило остаётся аудируемым, а violation сообщает effective threshold.

## Поставленный contract

`MinimumClearanceRule` принимает положительный `clientMultiplier`, по умолчанию `1`, и предоставляет неизменяемое вычисляемое значение `effectiveMinimumDistance`.

| Input | Behavior |
|---|---|
| `minimumDistance: 0.8`, `clientMultiplier: 1` | Effective threshold `0.8 м`; backward-compatible behavior. |
| `minimumDistance: 0.8`, `clientMultiplier: 0.75` | Effective threshold `0.6 м`; intimate client can place objects closer. |
| `actual edge gap >= effective threshold` | No clearance violation. |
| `actual edge gap < effective threshold` | Violation severity is normalized against effective threshold, not authored threshold. |
| Invalid or non-positive multiplier | Domain validation fails; no silent fallback to arbitrary client policy. |

`LoadLevelUseCase` derives the multiplier exclusively from the resolved, schema-validated `ClientBrief`. No level-side fallback and no Presentation interpretation were introduced.

## Level-002 acceptance case

The authored level-002 brief is `brief-intimate-media-002`, owned by client Денис. It declares `density: intimate`, `clearanceMultiplier: 0.75` and an authored minimum-clearance rule of `0.8 м`.

The production-content probe places `sofa-002` and `table-002` with an actual edge gap of `0.7 м`:

```text
Authored threshold: 0.8 m
Client multiplier: 0.75
Effective threshold: 0.8 × 0.75 = 0.6 m
Actual edge gap: 0.7 m
Expected result: no minimum-clearance violation
Actual result after PROD-019: no minimum-clearance violation
```

The same probe confirms that level-002 still hydrates its two functional rules, `lounge-seat-faces-view-target` and `coffee-surface-in-front-of-lounge-seat`. PROD-019 does not alter their evaluation.

## Architecture and ownership

| Boundary | Responsibility |
|---|---|
| ClientBrief | Owns the authored client preference and its versioned bounds. |
| Application | Resolves the brief and passes its multiplier into the ergonomics rule at level hydration. |
| Domain `MinimumClearanceRule` | Validates the positive multiplier and computes the effective threshold. |
| Domain `ClearanceEvaluator` | Compares edge gaps to the effective threshold and normalizes severity against it. |
| Presentation | Receives existing diagnostics; it does not calculate or reinterpret the multiplier. |

The Domain remains independent of JSON, browser APIs, storage and network. The Application is the only boundary that translates hydrated brief policy into Domain rule construction.

## TDD and verification

| Evidence | Result |
|---|---|
| Red Domain contract | Failed before implementation because `clientMultiplier` and `effectiveMinimumDistance` did not exist, and violations still used `0.8`. |
| Domain implementation | `MinimumClearanceRule` now stores authored distance and multiplier, while exposing effective distance. |
| Evaluator implementation | Gap comparison, violation threshold and normalized severity use effective distance. |
| Application contract | Hydrated ClientBrief multiplier is injected into `MinimumClearanceRule`. |
| Focused regression | **3 files / 12 tests passed** for new multiplier, existing clearance behavior and ClientBrief hydration. |
| Real level-002 probe | `loadSuccess: true`; `dynamicBriefAppliedToPenalty: true`; 0.7 m gap produces no clearance violation. |

## Explicit non-goals

PROD-019 does not classify rugs, walls, ceilings or surface layers; it does not modify overlap semantics, passage-zone thresholds, functional adjacency, density scoring, empty-space scoring, style mixing, feedback text or completion gates. Those remain separate vertical slices so each policy channel receives its own red contract and acceptance matrix.

## References

[1]: ../../data/briefs/client-brief.v1.schema.json "ClientBrief v1 schema"
[2]: ../../data/briefs/client-briefs.v1.json "Authored ClientBrief catalog"
[3]: ../../src/Domain/Ergonomics/MinimumClearanceRule.js "MinimumClearanceRule Domain contract"
[4]: ../../src/Domain/Ergonomics/ClearanceEvaluator.js "ClearanceEvaluator Domain implementation"
[5]: ../../src/Application/UseCases/LoadLevelUseCase.js "ClientBrief-to-rule Application hydration"
[6]: ../../tests/Domain/Ergonomics/ClientClearanceMultiplier.test.js "PROD-019 Domain tests"
[7]: ../../tests/Application/UseCases/LoadLevelClientBrief.test.js "ClientBrief hydration tests"
[8]: ../adr/adr-026-client-clearance-multiplier.md "ADR-026"
