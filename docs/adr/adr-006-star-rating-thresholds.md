# ADR-006: Star Rating Thresholds

## Status
Accepted — implemented

## Decision

`StarRatingPolicy` получает пороги из `data/scoring/scoring-parameters.json`:

| Rating | Score |
|---|---:|
| 5★ | ≥ 0.86 |
| 4★ | ≥ 0.71 |
| 3★ | ≥ 0.56 |
| 2★ | ≥ 0.40 |
| 1★ | < 0.40 |

Это выбранная шкала из `docs/decomposition.md`. Значения `0.9 / 0.7 / 0.5 / 0.3` больше не являются контрактом Decorium.

## Implementation

Policy сортирует проверки от 5 к 2 и возвращает `{ stars, nextThreshold }`. Порог не дублируется в UI. Пустая комната обрабатывается `EvaluateRoomUseCase` отдельно и возвращает 0 stars до получения оценки.

## Rationale

Шкала делает 5★ достижимой только при почти полном соответствии стилю, оставляет понятные промежуточные уровни и хранится в JSON для калибровки контента без изменения кода.
