# PROD-003a — Minimum-clearance ergonomics scoring

**Статус:** Implemented  
**Дата:** 14 августа 2026 г.  
**Срез:** Domain → Application → Infrastructure → Presentation

## Пользовательский результат

Оценка комнаты теперь учитывает не только стилистическое соответствие, но и первый измеримый ergonomics-факт: свободный проход между footprint предметов. Экран результата показывает отдельные **Стиль** и **Эргономика** sub-scores; конкретное нарушение объясняется локализованным feedback-сообщением.

## Контракты

| Контракт | Ответственность |
|---|---|
| `MinimumClearanceRule` | Неизменяемое Domain-правило minimum distance и penalty weight. |
| `ClearanceEvaluator` | Детерминированно вычисляет edge-to-edge gap AABB-footprints, учитывая поворот 0°/90°. |
| `ErgonomicsScorer` | Преобразует weighted ergonomics penalty в `exp(-penalty)` score. |
| `EvaluationScoreAggregator` | Собирает style и ergonomics sub-scores по нормализованным 70% / 30% весам. |
| `LevelDTO.ergonomicsRules` | Typed runtime rules, гидратированные из authored level JSON. |
| `EvaluateRoomUseCase` | Сохраняет legacy style-only путь и активирует отдельный ergonomics channel при полном наборе зависимостей. |

## Правило minimum clearance

Для каждой неупорядоченной пары placed items вычисляется расстояние между их ориентированными по осям 2D-footprints. Если `gap < minimumDistance`, правило создаёт violation с нормализованной severity:

```text
severity = clamp((minimumDistance - gap) / minimumDistance, 0, 1)
```

Пересечение объектов трактуется как `gap = 0`. Оно **не блокирует creative placement**: игрок может попробовать композицию, но оценка и feedback объясняют недостаток прохода. Это сохраняет existing gameplay contract и делает ergonomics прозрачным критерием вместо скрытого запрета.

## Scoring v1

```text
styleScore       = existing StyleScorer result
 ergonomicsScore = exp(-weighted ergonomics penalty)
 totalScore      = 0.7 × styleScore + 0.3 × ergonomicsScore
```

Total score используется для star rating. На момент слайса evaluation result публиковал `styleScore`, `ergonomicsScore`, `stylePenalty`, `ergonomicsPenalty` и `scoreWeights`. **Текущий P2 contract заменил ambiguous `stylePenalty` на отдельные `styleTargetPenalty`, `compositionPenalty` и `styleChannelPenalty`; historical two-channel formula выше не описывает active scoring model.**

## Data delivery

Все authored levels содержат `ergonomicsRules.minimumClearance`; JSON schema валидирует minimum distance, optional weight и message key. `scandinavian-feedback.json` содержит `ergonomics-minimum-clearance`, а production scoring parameters фиксируют weights 0.7 и 0.3.

## TDD evidence

| Фаза | Красный тест | Зелёная реализация |
|---|---|---|
| Domain geometry | `ClearanceEvaluator.test.js` | Rule, evaluator, AABB gap, rotation support |
| Domain scoring | `ErgonomicsScoring.test.js` | Exponential scorer и weighted aggregator |
| Application | `EvaluateRoomErgonomics.test.js`, `LoadLevelErgonomics.test.js` | Typed rules и extended evaluation result |
| Infrastructure/content | `MvpContent.test.js`, `ProductionScoringConfig.test.js` | Schema, authored rules, feedback, weights |
| Presentation | `EvaluationViewErgonomics.test.js`, `ErgonomicsEvaluationWiring.test.js` | Sub-score UI и runtime wiring |

## Acceptance criteria

- Level JSON schema rejects invalid minimum-clearance definitions.
- Clearance evaluator detects sufficient gap, insufficient gap, overlap и 90° rotation correctly.
- Score model exposes sub-scores and uses 70% style / 30% ergonomics for stars.
- Feedback catalog can explain clearance failure without controller/UI hard-coding.
- Full regression suite, production build и production dependency audit проходят.

## Явно не входит

Этот slice **не** моделирует двери, окна, passage zones, reachability, turn radius, wall offsets, vertical clearance, collision blocking, accessibility conformance или camera-assisted placement. Эти правила требуют explicit fixture/spatial-zone contracts и остаются следующими отдельными vertical slices, чтобы не создавать недетерминированный «универсальный physics» слой.
