# PROD-021 — Scorecard calibration and completion gates

**Статус:** Completed  
**Дата:** 16 августа 2026 г.  
**Связанный ADR:** [ADR-028 — Scorecard calibration policy](../adr/adr-028-scorecard-calibration-policy.md)

## Цель

PROD-020 сделал отсутствие обязательного client scenario наблюдаемым: evaluator создавал `critical` ergonomics diagnostic для отсутствующей dining, media или work-группы. Однако до этого слайса идеальное style-соответствие могло оставить оценку в пять звёзд и открыть следующий уровень, несмотря на критически невыполненный сценарий клиента.

PROD-021 вводит детерминированный **calibrated scorecard**. Он сохраняет raw результат каналов, отдельно вычисляет отображаемые звёзды и возвращает явное `completionEligible`. Completion больше не выводится Presentation-слоем из сравнения звёзд: Application получает готовое авторитетное решение.

## Versioned calibration contract

Авторский файл [`data/scoring/scoring-parameters.json`](../../data/scoring/scoring-parameters.json) теперь имеет schema version и проходит schema/runtime validation.

| Поле | Значение V1 | Назначение |
|---|---:|---|
| `schemaVersion` | `1` | Совместимость persisted scoring content. |
| `starRatingThresholds` | `0`, `0`, `0.40`, `0.56`, `0.71`, `0.86` | Публичные пороги рейтинга 0–5. |
| `scoreEpsilon` | `0.000001` | Узкая tolerance для floating-point шума при сравнении с authored threshold. |
| `criticalStarCap` | `2` | Верхняя граница отображаемых звёзд для критического cap-mode. |

> `scoreEpsilon` не изменяет authored threshold и не является скрытым бонусом. `StarRatingPolicy` применяет только проверку `clampedScore + epsilon >= threshold`; диапазон параметра ограничен `0..0.01`.

## Scorecard behavior

`ScorecardCalibrationPolicy` — immutable Domain value object. Он принимает общий score, `StarRatingPolicy`, completion policy из `ClientBrief` и полный набор diagnostics. На выходе он сохраняет `rawScore` / `rawStars`, а также выдаёт calibrated `stars`, `nextThreshold`, `completionEligible`, `completionBlockReason` и sorted/deduplicated `criticalViolationIds`.

| `criticalRuleMode` | Есть `critical` diagnostic | Display stars | `completionEligible` |
|---|---|---|---|
| `block-completion` | Нет | Raw stars | `stars >= minimumStars` |
| `block-completion` | Да | `min(rawStars, minimumStars - 1, criticalStarCap)` | `false`; reason `critical-rule` |
| `cap-stars` | Нет | Raw stars | `stars >= minimumStars` |
| `cap-stars` | Да | `min(rawStars, criticalStarCap)` | По capped rating относительно `minimumStars` |
| `informational` | Да или нет | Raw stars | `stars >= minimumStars` |

Все shipped ClientBrief V1 используют `block-completion`. Поэтому отсутствие `dining-hosting`, `evening-media` или `focused-work` может быть увидено и исправлено, но не скрыто стилевым score.

## Runtime flow and boundaries

| Слой | Ответственность PROD-021 | Явно не делает |
|---|---|---|
| Content | Хранит versioned thresholds, epsilon и cap; ClientBrief хранит `minimumStars` / `criticalRuleMode`. | Не исполняет score/progression. |
| Domain | Нормализует rating epsilon и применяет deterministic critical-rule calibration. | Не знает browser API, JSON, storage или Three.js. |
| Application | `EvaluateRoomUseCase` объединяет channel score и diagnostics в scorecard; `RecordLevelCompletionUseCase` использует `completionEligible`, сохраняя stars fallback для legacy callers. | Не выводит policy из UI state. |
| Presentation | `GameController` только forwards brief completion policy и calculated eligibility между use cases. | Не вычисляет score, cap, eligibility или unlock. |
| Infrastructure | Доставляет versioned JSON/schema. | Не содержит scoring/progression rule. |

Raw и calibrated поля возвращаются в `evaluationData`. Это сохраняет explainability для следующего слайса: интерфейс может честно показать, что style score был высоким, а completion заблокирован конкретным critical rule, без повторного расчёта policy.

## TDD and verification evidence

| Contract | Red behavior | Green evidence |
|---|---|---|
| Domain scorecard calibration | Perfect raw rating with critical media diagnostic wrongly remained eligible. | `ScorecardCalibrationPolicy.test.js`: block cap, no-critical normal path и informational path. |
| Numerical boundary | Score just below threshold did not receive authored epsilon tolerance. | `StarRatingPolicy.test.js`: tolerance promotes only sub-epsilon noise, not material gap. |
| Versioned scoring content | Parameters had no schema version, cap or epsilon at runtime. | `ScoringPolicy.test.js`: validates retained values and rejects unsupported/out-of-range inputs without global initialization. |
| Completion persistence | A high star value was persisted despite an explicit `completionEligible: false`. | `RecordLevelCompletionUseCase.test.js`: explicit gate blocks persistence and omitted flag preserves legacy fallback. |
| Evaluation composition | Evaluation lacked raw/calibrated facts and critical block result. | `EvaluateRoomUseCase.test.js`: returns capped stars, raw facts, reason and critical IDs. |
| Presentation handoff | Controller omitted brief policy and calibrated eligibility. | `GameControllerCompletion.test.js`: forwards both verbatim while keeping policy outside UI. |

Focused verification passed: **6 files / 29 tests**. Full release gates passed before commit: `npm test` (**132 files / 430 tests**), `npm run build`, `npm audit --omit=dev --audit-level=high` (**0 vulnerabilities**) and `git diff --check`.

## Limits and non-goals

1. This slice does not define the player-facing explanation surface; PROD-022 will render causal rule evidence and remediation.
2. It does not yet change weighted multi-style evaluation, priorities or empty-space preferences; those are PROD-023.
3. It does not reclassify catalog semantics; PROD-024 owns coverage completeness.
4. No completion decision is persisted independently from the existing player-profile completion record. The decision is reproducible from versioned scoring data, ClientBrief, room state and diagnostics at evaluation time.

## References

[1]: ../../data/scoring/scoring-parameters.json "Versioned scoring parameters"
[2]: ../../src/Domain/Scoring/ScoringPolicy.js "Immutable scoring-policy validation"
[3]: ../../src/Domain/Scoring/ScorecardCalibrationPolicy.js "Domain calibration policy"
[4]: ../../src/Domain/Scoring/StarRatingPolicy.js "Numerically calibrated rating policy"
[5]: ../../src/Application/UseCases/EvaluateRoomUseCase.js "Evaluation composition"
[6]: ../../src/Application/UseCases/RecordLevelCompletionUseCase.js "Authoritative completion persistence"
[7]: ../../src/Presentation/Controllers/GameController.js "Presentation forwarding boundary"
[8]: ../adr/adr-028-scorecard-calibration-policy.md "ADR-028"
