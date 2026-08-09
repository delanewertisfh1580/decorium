# ADR-004: Style-Only Scoring for MVP

## Status
Accepted

## Date
2024-01-01

## Owner
Qwen Studio Engineering Team

## Title
Реализовать только оценку стиля для MVP, эргономика добавляется позже

## Context
Полная система оценки должна включать:
1. **Style Score** - соответствие стилевым ограничениям (цвета, материалы, формы)
2. **Ergonomics Score** - функциональность расстановки (проходы, доступность, расстояния)

Для MVP необходимо сосредоточиться на проверке ключевой гипотезы: игрок понимает связь между размещением предметов и оценкой стиля.

Проблемы реализации обоих систем в MVP:
- Усложнение разработки
- Больше тестов и данных
- Риск не успеть проверить основную гипотезу
- Эргономика требует дополнительных правил и валидации

## Decision
Для MVP реализовать **только Style Score**.

### Что входит
- Вектор комнаты на основе предметов
- Стилевые ограничения (wood_share >= 0.6, etc.)
- Штраф за нарушение ограничений
- Style Score = 1.0 - normalized(penalties)
- Star Rating на основе Style Score

### Что НЕ входит (заглушка)
- Ergonomics Score = 1.0 (всегда)
- TotalScore = StyleScore (для MVP)
- Правила проходов
- Проверка доступности
- Расстояния между предметами

### Формула MVP

```
Vroom = average(Vitems)

For each constraint i:
  if operator is >=:
    penalty_i = max(0, threshold_i - Vroom[feature_i])
  if operator is <=:
    penalty_i = max(0, Vroom[feature_i] - threshold_i)

total_penalty = sum(penalty_i)
normalized_penalty = total_penalty / num_constraints

StyleScore = 1.0 - normalized_penalty
ErgonomicsScore = 1.0  // заглушка для MVP

TotalScore = StyleScore  // для MVP

StarRating:
  5 stars: TotalScore >= 0.9
  4 stars: TotalScore >= 0.7
  3 stars: TotalScore >= 0.5
  2 stars: TotalScore >= 0.3
  1 star:  TotalScore < 0.3
```

## Consequences

### Positive
- Фокус на проверке основной гипотезы
- Быстрее время разработки MVP
- Меньше тестов и данных для поддержки
- Проще калибровать пороги

### Negative
- Оценка может казаться неполной игрокам
- Нельзя проверить эргономические сценарии
- Потребуется рефакторинг для добавления Ergonomics post-MVP

### Neutral
- Требуется явная документация о заглушке
- Нужно планировать добавление Ergonomics в post-MVP backlog

## Post-MVP Plan

Добавить Ergonomics Score после успешного MVP:

1. Определить правила эргономики (мин. проходы, расстояния)
2. Реализовать SpatialRules evaluator
3. Добавить ErgonomicsPenalty calculation
4. Обновить TotalScore формулу:
   ```
   TotalScore = w1 * StyleScore + w2 * ErgonomicsScore
   ```
5. Обновить обратную связь для эргономических нарушений

## Related Documents
- [[MVP Scope]](../mvp/scope.md)
- [[Scoring System]](../systems/scoring.md)
- [[MVP Acceptance Criteria]](../mvp/acceptance-criteria.md)

## Change History
| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-01-01 | 1.0 | Qwen Studio | Initial ADR |
