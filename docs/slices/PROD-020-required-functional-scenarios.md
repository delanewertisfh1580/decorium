# PROD-020 — Required functional scenarios

**Статус:** Completed

**Дата:** 16 августа 2026 г.

**Связанное решение:** [ADR-027](../adr/adr-027-required-functional-scenarios.md)

## Цель

PROD-020 делает требования клиента к **реальному функциональному сценарию** обязательной частью детерминированной ergonomic evaluation. До слайса существующие `FunctionalLayoutRule` проверяли связь только у уже установленного anchor: если обеденный стол, телевизор или рабочий стол отсутствовал, правило не создавало violation. Комната могла не содержать требуемую группу, но не получать direct ergonomic penalty за её отсутствие.

`ClientBrief.evaluationPolicy.ergonomicsRules.requiredFunctionalScenarios` теперь задаёт versioned complete-group requirements. Отсутствующий anchor, partner или целая группа даёт violation независимо от того, размещён ли хотя бы один предмет сценария.

> Functional-layout отвечает на вопрос «корректно ли связаны уже размещённые предметы?». Required scenario отвечает на вопрос «есть ли вообще группа, необходимая этому клиенту?». Это разные, дополняющие друг друга Domain rules.

## Versioned contract

Каждый scenario включает `schemaVersion: 1`, stable ID, player-readable label, роли с cardinality, positive weight, critical flag и message key. Роль задаётся только declared catalog affordance; UI не выводит её из имени или визуального mesh.

| Field | Meaning |
|---|---|
| `requiredRoles[].affordance` | Семантическая роль, которую должен уметь выполнять каталоговый item. |
| `requiredRoles[].minCount` | Минимальное число instance(s) роли в комнате; repeat-placeable items могут обеспечить cardinality. |
| `weight` | Deterministic weight ergonomics violation. |
| `critical` | Явно помечает absence как critical diagnostic для будущего completion/score-cap slice. |
| `messageKey` | Stable feedback mapping key; Presentation не составляет policy. |

`RequiredFunctionalScenario` валидирует эти поля как immutable Domain value object. `RequiredFunctionalScenarioEvaluator` считает matching placed instances для каждой роли и выпускает violation только для unmet roles. Diagnostics содержат stable constraint ID, actual/threshold count, normalized severity, matching instance IDs, weight и `critical` flag.

## Authored client scenarios

| Level | ClientBrief | Required scenario | Roles | Missing-group violations | Completed-group violations |
|---|---|---|---|---:|---:|
| level-001 | Марина и Алексей | `dining-hosting` | 1 dining surface; 2 dining seats | 2 | 0 |
| level-002 | Денис | `evening-media` | 1 lounge seat; 1 view target; 1 coffee surface | 3 | 0 |
| level-003 | София | `focused-work` | 1 work surface; 1 work seat | 2 | 0 |

Level-003 receives explicit `work-surface` on `desk-001` and `work-seat` on repeat-placeable `chair-001`; this is declared semantic content, not a visual inference. The item V3 schema and `InteractionProfile` supported-affordance contract were extended accordingly.

## Runtime flow

```text
level.clientBriefId → validated ClientBrief v1
  → RequiredFunctionalScenario data → LoadLevelUseCase
  → immutable Domain RequiredFunctionalScenario values in LevelDTO
  → SpatialErgonomicsEvaluator → required-scenario violations
  → EvaluateRoomUseCase serialized ergonomics diagnostics
```

| Boundary | Responsibility |
|---|---|
| Content + Infrastructure | Versioned JSON is schema-validated. Every shipped brief owns exactly one scenario with at least one inventory semantic source per role. |
| Domain | Validates scenario policy, evaluates counts and emits deterministic role-level violations. |
| Application | Hydrates validated brief scenarios into Domain objects and serializes the resulting diagnostics. |
| Presentation | Receives violations through existing evaluation data. It does not count roles, decide criticality or calculate score policy. |

## TDD and verification

| Evidence | Result |
|---|---|
| Required scenario Domain red contract | Initially failed because neither value object nor evaluator existed. It now verifies missing-role diagnostics, cardinality, severity, item evidence and complete-group success. |
| Spatial orchestration red contract | Initially failed because required scenarios were ignored. It now returns missing media roles for an empty room before clearance, layout and passage checks. |
| ClientBrief validation red contract | Initially accepted malformed scenario JSON. It now validates and freezes canonical scenario data before Application. |
| Work affordance red contract | Initially rejected `work-seat` / `work-surface`. Item semantics and item-v3 schema now accept the required work vocabulary. |
| Application hydration red contract | Initially omitted scenarios from `LevelDTO.ergonomicsRules`. It now constructs immutable Domain scenario values. |
| Evaluation orchestration red contract | Initially ignored scenario-only ergonomics rules. It now activates the channel and serializes the critical diagnostic. |
| Real authored-content probe | All three briefs load successfully; missing groups emit 2/3/2 role violations and complete groups emit zero required-scenario violations. |
| Final release regression | `npm test` passed **130 files / 422 tests**; production build, high-severity dependency audit and whitespace integrity also passed. |

## Explicit limits

PROD-020 marks missing scenario roles as **critical diagnostics**, but does not yet change star caps or progression completion rules. Numerical score calibration and `criticalRuleMode` enforcement remain the separate **PROD-021 — Scorecard calibration and completion gates** slice. It also does not classify physical clearance layers, calculate density/empty-space preferences, mix secondary/accent style targets, or add interactive explanation UI.

## References

[1]: ../../data/briefs/client-brief.v1.schema.json "ClientBrief v1 schema"
[2]: ../../data/briefs/client-briefs.v1.json "Authored required client scenarios"
[3]: ../../data/items/catalog.v3.json "Catalog interaction profiles"
[4]: ../../src/Domain/Ergonomics/RequiredFunctionalScenario.js "Scenario Domain value object"
[5]: ../../src/Domain/Ergonomics/RequiredFunctionalScenarioEvaluator.js "Scenario evaluator"
[6]: ../../src/Domain/Ergonomics/SpatialErgonomicsEvaluator.js "Ergonomics orchestration"
[7]: ../../src/Application/UseCases/LoadLevelUseCase.js "ClientBrief hydration"
[8]: ../../src/Application/UseCases/EvaluateRoomUseCase.js "Evaluation diagnostics"
[9]: ../adr/adr-027-required-functional-scenarios.md "ADR-027"
