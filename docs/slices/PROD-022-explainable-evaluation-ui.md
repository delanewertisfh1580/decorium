# PROD-022 — Explainable evaluation UI

**Статус:** Completed  
**Дата:** 17 августа 2026 г.  
**Связанный ADR:** [ADR-029 — Explainable evaluation contract](../adr/adr-029-explainable-evaluation-contract.md)

## Цель

После PROD-021 результат комнаты мог корректно cap stars и блокировать completion для critical ClientBrief requirement, но игрок видел только aggregate score и flat feedback. PROD-022 делает результат причинно объяснимым: каждый diagnostic теперь поставляет правило, measured fact, severity, concrete authored correction, counterfactual recovery impact и привязку к affected room instances.

> **Правило границы:** интерфейс рендерит immutable explanation DTO и эмитит намерение выбрать instance. Он не вычисляет score, cap, eligibility, remediation или unlock.

## Runtime explanation V1

`EvaluateRoomUseCase` возвращает `evaluationData.explanation` с `schemaVersion: 1` только когда composition root supplied calibrated `ViolationImpactPolicy`. Existing scorecard and legacy `violations` fields remain intact for backwards compatibility.

| Поле | Значение и ответственность |
|---|---|
| `scorecard` | Raw score/stars, display stars, completion eligibility and block reason already produced by PROD-021. |
| `violations[].id` | Existing stable diagnostic/constraint ID. |
| `channel` | `style` or `ergonomics`; Application assigns it from evaluator source. |
| `scope` | `instances` when resolved placed instances exist; otherwise `room`. UI never invents a target for missing scenario or aggregate style fact. |
| `rule` / `fact` | Authored message key/description plus existing operator, actual and desired values. |
| `severity` | Domain numeric value plus authored level; `critical: true` is displayed as `critical`. |
| `impact` | Exact counterfactual channel/total score recovery, display-star delta and completion effect. |
| `remediation` | Formatted author-owned feedback template, one-to-one with message key. |
| `instances` | Current RoomState-derived `{ instanceId, itemId, displayName }` records only. |

All nested DTO data are frozen at assembly. `EvaluationExplanationAssembler` fails deterministically if an active diagnostic has no authored violation feedback record or impact result; the UI is never asked to guess.

## Counterfactual impact semantics

For a diagnostic `v`, `ViolationImpactPolicy` recomputes the current scorecard without only `v`, using the existing `StyleScorer`, `ErgonomicsScorer`, `EvaluationScoreAggregator` and `ScorecardCalibrationPolicy` instances. The reported delta is therefore `without(v) − current`.

| Why this is necessary | Result |
|---|---|
| Style penalty can cap | A simple proportional share would misrepresent the recovery once a channel penalty reaches its maximum. |
| Ergonomics score is exponential | Numeric severity is not equivalent to a linear total-score loss. |
| Critical rules cap display stars and completion | Removing one critical diagnostic can restore stars but still leave completion blocked by another; the DTO reports the actual `completionEffect`. |

The player-facing label is **«Улучшение при исправлении»**, not an additive claim of individual blame. Presentation rounds the supplied facts only for display.

## Presentation behaviour

| Player state | UI result |
|---|---|
| Critical requirement blocks completion | Card shows raw versus displayed stars, a blocked status, critical rule and authored correction. |
| Instance-bound violation | Rule card shows fact/desired values, impact and one native focus button per live instance. |
| Missing functional scenario | Card explicitly says that no placed object is selectable; it does not show a false target. |
| Room-level style diagnostic | Shows room-scoped evidence and correction, with no arbitrary furniture attribution. |
| Selected explanation instance was removed | Controller keeps current selection, renders no mutation and reports that the player should evaluate again. |
| Legacy evaluation result | Existing compact score, channels and feedback rendering remains available when `explanation` is absent. |

`GameController` validates the requested `instanceId`, calls existing RoomViewModel selection and existing selection rendering, then refreshes Presentation. The focus action neither mutates `RoomState` nor invalidates the current evaluation.

## Authored feedback contract

`JsonFeedbackCatalog.getViolationExplanation()` now delivers `{ messageKey, severity, remediation }` from existing versioned feedback content. The new coverage test proves that all currently shipped style constraints, composition diagnostics, clearance/passage rules and ClientBrief message keys resolve a non-empty violation template with `low`, `medium` or `high` authored severity. Criticality stays a ClientBrief/Domain rule and overrides the shown level to `critical`.

## TDD and verification evidence

| Contract | Red behaviour | Green evidence |
|---|---|---|
| Counterfactual impact | No impact policy existed. | `ViolationImpactPolicy.test.js`: ordinary style recovery and last-critical-diagnostic completion restoration. |
| Application DTO | Evaluation lacked explanation version, facts, impact and resolved instances. | `EvaluateRoomUseCase.test.js`: immutable explanation V1 assembled only from supplied policy/data. |
| Feedback metadata | Adapter could only return detached strings. | `JsonFeedbackCatalogExplanation.test.js`: structured remediation/severity and unknown-key behavior. |
| Content coverage | Explainability could silently lose a shipped message key. | `FeedbackExplanationContent.test.js`: every current production diagnostic source maps to an authored violation record. |
| Presentation | Evaluation card had no calibrated status, causal cards or instance action. | `EvaluationViewErgonomics.test.js`: card rendering, room scope and pure focus event. |
| Controller | Evaluation had no safe instance focus boundary. | `GameControllerExplainability.test.js`: live selection, no mutation/invalidation and stale-ID handling. |

Focused cross-layer verification passed: **8 files / 30 tests**. Full release verification passed: `npm test` — **136 files / 439 tests**, `npm run build` — successful Vite production build with shipped feedback/brief/scoring data, `npm audit --omit=dev --audit-level=high` — **0 vulnerabilities**, and `git diff --check` — clean. A live empty-room smoke opened the result panel with an intentional missing dining scenario; subsequent sandbox screenshot retrieval was unavailable and browser console exposed no runtime error, so automated Presentation contracts remain the recorded detailed UI evidence.

## Limits and non-goals

1. PROD-022 does not alter any scoring formula, rating threshold, critical rule mode or campaign progression decision.
2. It does not activate weighted multi-style, client priorities, density or empty-space scoring; PROD-023 owns those mechanics.
3. It does not declare semantics for unmodeled catalog items; PROD-024 owns semantic catalog coverage.
4. Explanation results are runtime DTO data, not a new player-profile persistence record.

## References

[1]: ../../src/Domain/Scoring/ViolationImpactPolicy.js "Counterfactual impact policy"
[2]: ../../src/Application/Services/EvaluationExplanationAssembler.js "Explanation V1 assembly"
[3]: ../../src/Application/UseCases/EvaluateRoomUseCase.js "Evaluation application composition"
[4]: ../../src/Infrastructure/DataLoaders/JsonFeedbackCatalog.js "Authored remediation adapter"
[5]: ../../src/Presentation/Views/EvaluationView.js "Explainable presentation card"
[6]: ../../src/Presentation/Controllers/GameController.js "Instance focus controller"
[7]: ../../data/feedback/scandinavian-feedback.json "Current feedback content"
[8]: ../adr/adr-029-explainable-evaluation-contract.md "ADR-029"
