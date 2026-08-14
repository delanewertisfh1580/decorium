# ADR-010 — Minimum-clearance as scored ergonomics rule

**Статус:** Accepted  
**Дата:** 14 августа 2026 г.

## Контекст

MVP проверяет только границы комнаты. Production target требует ergonomics, но немедленное введение жёсткой collision-политики сломало бы creative experimentation, undo flow и существующий контракт размещения.

## Решение

Minimum clearance вводится как **scored, not blocked** Domain rule. `ClearanceEvaluator` анализирует расстояние между 2D-footprints предметов после размещения или перемещения; он создаёт typed violation при недостаточном проходе. `ErgonomicsScorer` получает violations независимо от existing style scorer, а `EvaluationScoreAggregator` объединяет channels с versioned configuration weights 0.7 style / 0.3 ergonomics.

Уровни объявляют `ergonomicsRules.minimumClearance` в JSON, `LoadLevelUseCase` гидратирует правило в Domain object, а `GameController` передаёт active-level rules в `EvaluateRoomUseCase`.

## Последствия

- Игрок не теряет возможность размещать предметы намеренно близко или с overlap, но получает объяснимую оценочную обратную связь.
- Geometric diagnostics не основаны на Three.js, DOM или browser layout и полностью проверяемы unit tests.
- Existing style-only consumers сохраняют compatibility: extended fields появляются, только если ergonomics dependencies включены.
- Двери, окна и passage zones не должны быть добавлены как ad-hoc исключения в clearance evaluator; для них требуется следующий explicit spatial-fixtures contract.

## Альтернативы

1. **Запрещать placement при любом overlap.** Отклонено: это меняет игровой UX, не покрывает реальные passage cases и лишает игрока оценочной обратной связи.
2. **Использовать Three.js raycasts в scoring.** Отклонено: presentation geometry станет источником Domain rules, что нарушит determinism и тестируемость.
3. **Смешать clearance violations со style constraints.** Отклонено: sub-scores, feedback и future tuning требуют отдельного channel.
