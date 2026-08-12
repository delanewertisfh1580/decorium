# ADR-004: Style-Only Scoring for MVP

## Status
Accepted — implemented

## Decision

MVP считает соответствие стилевым ограничениям и минимальной завершённости композиции уровня. Отдельный ergonomics score и spatial rules отложены post-MVP; композиционные требования не блокируют свободное размещение.

## Implemented formula

```text
Vroom = average(Vitems)
penalty_i = max(0, threshold - value) для >=
penalty_i = max(0, value - threshold) для <=
penalty = min(maxPenalty, Σ(penalty_i × constraint.weight))
styleScore = clamp(1 - penalty, 0, 1)
totalScore = styleScore
```

`maxPenalty`, weights и star thresholds приходят из `data/scoring/scoring-parameters.json` и constraints JSON. Минимальная композиция приходит из `compositionRules` level JSON и проверяется `CompositionEvaluator`.

## User-visible result

`EvaluateRoomUseCase` возвращает score, penalty, stars, room vector, violations и русские feedback messages. Пустая комната возвращает score 0 и 0 stars, чтобы явно показать необходимость разместить предметы.

## Post-MVP

Ergonomics может добавить отдельный evaluator для проходов, доступности и расстояний, после чего нужно будет пересмотреть total score и feedback contracts. До этого style + composition score остаётся единственной оценкой; проходы не объясняются постоянными scene labels.
