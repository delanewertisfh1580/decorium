# ADR-004: Style-Only Scoring for MVP

## Status
Accepted — implemented

## Decision

MVP считает только соответствие стилевым ограничениям. Эргономика не является заглушкой в пользовательском UI: отдельный ergonomics score и spatial rules отложены post-MVP.

## Implemented formula

```text
Vroom = average(Vitems)
penalty_i = max(0, threshold - value) для >=
penalty_i = max(0, value - threshold) для <=
penalty = min(maxPenalty, Σ(penalty_i × constraint.weight))
styleScore = clamp(1 - penalty, 0, 1)
totalScore = styleScore
```

`maxPenalty`, weights и star thresholds приходят из `data/scoring/scoring-parameters.json` и constraints JSON.

## User-visible result

`EvaluateRoomUseCase` возвращает score, penalty, stars, room vector, violations и русские feedback messages. Пустая комната возвращает score 0 и 0 stars, чтобы явно показать необходимость разместить предметы.

## Post-MVP

Ergonomics может добавить отдельный evaluator для проходов, доступности и расстояний, после чего нужно будет пересмотреть total score и feedback contracts. До этого style score остаётся единственной оценкой.
