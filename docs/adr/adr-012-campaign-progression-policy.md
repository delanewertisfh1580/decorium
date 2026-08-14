# ADR-012 — Domain-owned campaign progression with persisted completion facts

**Статус:** Accepted  
**Дата:** 14 августа 2026 г.

## Контекст

После появления authored level manifest и local player profile игра могла помнить последний выбранный уровень, но не могла безопасно выразить campaign availability. Проверка prerequisite в selector, `main.js` или `GameController` нарушила бы разделение слоёв: Presentation стала бы источником progression rules, а тот же unlock result было бы легко рассчитать неодинаково при resume, при клике и после evaluation.

Local persistence также должна хранить не transient UI state, а воспроизводимые факты. Для следующего запуска игре нужны уровень, лучший stars result и completion timestamp; одной текущей сессии недостаточно, чтобы принять unlock decision.

## Решение

Вводится schema v2 `PlayerProfile` с `progress.completedLevels`. `recordLevelCompletion()` создаёт новый immutable profile и сохраняет максимальный `bestStars` для level. Browser repository мигрирует v0 и v1 payloads в этот versioned contract.

`ProgressionPolicy` является чистой Domain policy. Она принимает authored level summaries и player profile, после чего возвращает availability records с `isUnlocked`, `prerequisiteLevelId` и `bestStars`. Уровень доступен только при completion prerequisite с best-stars, удовлетворяющими authored target. `GetCampaignLevelsUseCase` объединяет catalog boundary и policy; `RecordLevelCompletionUseCase` владеет сравнением evaluation stars с authored target и persistence через `SavePlayerProfileUseCase`.

Presentation не пересчитывает progression. Selector отображает availability DTO и блокирует action для `isUnlocked: false`; bootstrap возобновляет только unlocked session; controller передаёт facts оценки в completion use case и принимает возвращённый profile как актуальное состояние.

## Последствия

| Область | Последствие |
|---|---|
| Determinism | Одни и те же authored catalog и profile всегда дают одинаковую campaign availability. |
| Persistence | Completion facts имеют schema version и переживают browser restart; legacy profile получает пустой v2 progress. |
| Separation | UI не владеет threshold, prerequisite или best-stars rule; infrastructure не содержит unlock rule. |
| Failure behavior | Ошибка сохранения completion не отменяет рассчитанную оценку, но не обновляет in-memory profile и сообщается игроку. |
| Content evolution | Линейная chain является только данными; policy не требует изменения для будущего branching graph. |

## Альтернативы

1. **Вычислять unlock в `LevelSelectView`.** Отклонено: View получил бы domain policy и не мог бы корректно защищать resume или completion flow без duplication.
2. **Сохранять только ID последнего пройденного уровня.** Отклонено: это не хранит best-stars, не поддерживает non-linear prerequisites и плохо мигрирует к future campaign metadata.
3. **Проверять target в `GameController` перед вызовом use case.** Отклонено: evaluation decision стал бы presentation rule. Controller передаёт факты; application workflow возвращает `didComplete`.
4. **Хардкодить chain в policy.** Отклонено: content перестал бы быть source of truth, а добавление уровня потребовало бы program change вместо authored manifest edit.
