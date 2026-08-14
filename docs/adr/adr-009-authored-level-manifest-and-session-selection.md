# ADR-009 — Versioned authored-level manifest and resumable selection

**Статус:** Accepted  
**Дата:** 14 августа 2026 г.

## Контекст

MVP жёстко загружал `level-001` в bootstrap. Production-путь требует authored content, понятный выбор уровня и возможность восстановить последнюю сессию без помещения navigation или storage в Domain.

## Решение

Уровни перечисляются через versioned `data/levels/manifest.json`, а полный level payload продолжает загружаться через существующий `JsonLevelRepository.loadLevel(id)`. `LevelSummary` отделяет лёгкие данные selector от runtime `LevelDTO`. Manifest и каждый перечисленный level обязательно добавляются в `STATIC_DATA_FILES`.

`PlayerProfile.lastSession.levelId` является единственным persisted input для resume. При bootstrap система выбирает сохранённый ID, только если он присутствует в актуальном manifest; иначе использует первый authored level по детерминированному sort order. Любой новый выбор сохраняется через `SavePlayerProfileUseCase`.

## Последствия

- Content authors могут добавлять authored levels через manifest + level JSON без изменения GameController.
- Появляется явный Application port `listLevels`, который cloud/content service может реализовать позже без изменения Presentation.
- Статус доступа пока не является progression: все опубликованные levels доступны.
- Runtime сохраняет только ID сессии, а не сложный serialised `RoomState`; полноценный resume-in-progress остаётся отдельным слайсом.

## Альтернативы

1. **Hardcode array of levels in `main.js`.** Отклонено: контент становится кодом и не валидируется build pipeline.
2. **Хранить navigation state в GameController.** Отклонено: view/controller получает responsibility persistence и content policy.
3. **Сразу реализовать progression/locks.** Отклонено: это следующий вертикальный продуктовый результат с отдельными правилами и тестами.
