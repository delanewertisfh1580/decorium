# PROD-009b — Deterministic functional dining layout evaluator

**Статус:** Implemented
**Дата:** 14 августа 2026 г.
**Срез:** Domain → Application → Infrastructure feedback → Presentation

## Пользовательский результат

Игрок больше не получает противоречивый ergonomics penalty за корректно придвинутый к обеденному столу стул. Если стул расположен на author-declared usable side стола и edge-to-edge distance входит в authored interval, пара получает functional match и исключается только из универсального `minimumClearance` penalty. При этом шкаф, проход или любая другая близкая, но не связанная functional pair продолжают оцениваться прежним правилом.

Если стол остаётся без достаточного числа мест для сидения, игра создаёт violation в уже существующем ergonomics channel. Этот violation уменьшает ergonomics score через имеющийся `ErgonomicsScorer`, участвует в агрегированном score и показывает игроку конкретную подсказку: **«Добавьте места для сидения у обеденного стола.»**

## Evaluation model

| Шаг | Детерминированное действие | Результат |
|---|---|---|
| 1 | Отобрать placed anchors и partners по `InteractionProfile.affordances`. | Отсутствуют name/id/category heuristics. |
| 2 | Стабильно отсортировать anchors и candidates по instance `id`. | Reproducible matching order. |
| 3 | Проверить footprint edge distance against `[min, max]` и world-rotated usable side anchor. | Стул учитывается только у допустимой стороны стола. |
| 4 | При successful match пометить partner consumed for the current rule. | Один стул не удовлетворяет одновременно два стола. |
| 5 | Создать `FunctionalLayoutViolation`, если `matchedPartners < minPartners`. | Weighted ergonomics input с authored `messageKey`. |
| 6 | Передать successful matched pairs как `excludedPairs` в clearance evaluator. | Нет двойного наказания за intented functional adjacency. |

`FunctionalLayoutEvaluator` является pure Domain service: он принимает только `RoomState` и typed `FunctionalLayoutRule[]`, не зависит от Three.js, DOM, fetch, JSON parsing или storage. Violation содержит instance-level `itemIds`, minimum partner threshold, actual matched count, severity and authored message key. Повторные экземпляры одного catalog item имеют stable instance IDs (`chair-001`, `chair-001#2`) и потому корректно участвуют в one-to-one consumption.

> Functional pair exclusion узкое и positive-only: исключаются лишь пары, которые уже прошли semantic selector, distance и usable-side matching. Любая несвязанная близкая пара по-прежнему получает clearance penalty.

## Layer integration

| Слой | Реализация |
|---|---|
| Domain | `FunctionalLayoutEvaluator` создаёт functional violations и canonical sorted matched pairs. `ClearanceEvaluator` принимает optional `excludedPairs`. `SpatialErgonomicsEvaluator` запускает functional evaluation до clearance. |
| Application | `EvaluateRoomUseCase` активирует existing ergonomics channel даже для level с одним `functionalLayoutRules` bundle; serialization marks violations as `type: ergonomics`. |
| Infrastructure | `functional-dining-seat-required` added to authored feedback catalog. `level-001` rule from PROD-009a remains the current shipped functional policy. |
| Presentation | Composition root injects `FunctionalLayoutEvaluator` explicitly. `EvaluationView` renders its authored message in the existing feedback surface and continues to display the ergonomics sub-score. |

## Current authored scope

The shipped campaign enables only the dining requirement in `level-001`: a `dining-surface` needs two `dining-seat` partners. `level-002` supplies a coffee table and lounge seating but no dining seat; `level-003` supplies a dining table but no dining-seat. No impossible rule is authored for these levels.

Sofa-to-view-target orientation and coffee-surface-in-front-of-lounge-seat are explicitly deferred: the current catalog has no `view-target` item, and their directional relation needs a separately authored relation kind rather than overloading `adjacency`.

## TDD evidence

| Фаза | Red test | Green implementation |
|---|---|---|
| Functional matching | `FunctionalLayoutEvaluator.test.js` | Usable-side edge-distance matching, deterministic consumption and typed violation. |
| Clearance semantics | extended `ClearanceEvaluator.test.js` | Canonical `excludedPairs` gate leaves unrelated clearance penalties intact. |
| Spatial orchestration | extended `SpatialErgonomicsEvaluator.test.js` | Functional-first ordering and matched-pair clearance exclusion. |
| Application scoring | extended `EvaluateRoomErgonomics.test.js` | Functional-only rule bundle activates ergonomics scoring and violation serialization. |
| Feedback content | `FunctionalFeedbackContent.test.js` | Authored high-severity dining message. |
| Presentation | extended `EvaluationViewErgonomics.test.js`, `ErgonomicsEvaluationWiring.test.js` | Message visibility and explicit composition-root dependency. |

## Acceptance criteria

- A dining chair at a table's configured usable side and within the authored distance range produces no functional violation.
- A chair at a non-usable side does not satisfy the table.
- A partner is consumed once per rule, preventing one chair from serving multiple tables.
- A confirmed functional pair has no universal clearance violation, but unrelated tight pairs still do.
- A missing dining partner affects the existing ergonomics score and visible player feedback.
- Evaluation and matching remain replayable from persisted rule, semantic catalog profile and room transforms.

## Не входит

This slice does not infer item semantics, add a television/view-target asset, enforce 3D collisions, block placement, auto-arrange furniture, add sofa orientation or coffee-table-facing relations, or modify style/progression/economy rules. Those capabilities require their own typed rule kinds, authored assets and TDD vertical slices.
