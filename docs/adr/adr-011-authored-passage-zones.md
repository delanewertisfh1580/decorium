# ADR-011 — Authored passage zones as explicit spatial contracts

**Статус:** Accepted  
**Дата:** 14 августа 2026 г.

## Контекст

Minimum clearance измеряет расстояние только между предметами. Он не знает, что определённая часть комнаты должна оставаться свободной для входа или движения. Использование visual door meshes, raycasts или hard-coded coordinate checks в controller сделало бы rule неявным и нетестируемым.

## Решение

Каждый authored level может объявлять `ergonomicsRules.passageZones` в level JSON. Зона представляет immutable 2D rectangle в координатах комнаты, имеет понятный label, weight и data-driven feedback key. `LoadLevelUseCase` гидратирует raw JSON в `PassageZone`; `SpatialErgonomicsEvaluator` добавляет passage diagnostics после clearance diagnostics; existing `ErgonomicsScorer` и presentation sub-score отображают результат без отдельной UI-ветки.

## Последствия

- Контент авторов, а не Three.js scene, является single source of truth для critical movement spaces.
- Валидация schema и domain invariants предотвращает невалидные зоны до runtime.
- Пересечение зоны остаётся scoring signal, а не placement blocker.
- Current level data описывает только entry passages. Двери, route graph, visual overlays и hard safety constraints требуют новых explicit contracts.

## Альтернативы

1. **Запретить placement на уровне GameController.** Отклонено: interaction policy смешивается с authored content и не даёт игроку объяснения.
2. **Использовать фактическую визуальную геометрию дверей.** Отклонено: Presentation становится source of Domain facts и усложняет deterministic tests.
3. **Не вводить zones до полного navmesh.** Отклонено: explicit rectangle закрывает значимый risk incremental slice без преждевременной complexity.
