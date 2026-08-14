# ADR-013 — Versioned player settings and touch-equivalent input paths

**Статус:** Accepted  
**Дата:** 14 августа 2026 г.

## Контекст

Reduced motion уже существовал как единственный profile setting, но игрок не мог его менять. UI scale и render quality не имели persisted contract. Если бы preferences хранились отдельными `localStorage` keys или применялись напрямую в View, runtime state расходился бы с player profile, migration стала бы неполной, а выбор уровня мог бы случайно перезаписать обновлённые settings старым profile snapshot.

В то же время часть gameplay actions была доступна только с keyboard: `PageUp`, `PageDown` и `Home`. Pointer event path уже обслуживал scene interaction, но проверка `event.button` была mouse-centric и не формализовала primary touch behavior.

## Решение

`PlayerProfile` повышается до schema v3 и содержит полноценный immutable `PlayerSettings` value object. Поддерживаются `reducedMotion`, `uiScale` и `qualityTier`. Browser-local repository мигрирует v0/v1/v2 profiles к v3, добавляя defaults для новых fields.

`UpdatePlayerSettingsUseCase` принимает current `PlayerProfile` и plain change request, создаёт валидный `PlayerSettings`, возвращает immutable updated profile и сохраняет его через существующий `SavePlayerProfileUseCase`. Settings view является thin adapter: она отображает нативные form controls и передаёт request, не валидируя business values и не обращаясь к storage.

`GameController` владеет текущим persisted profile в runtime и передаёт settings в `RoomView`. `RoomView` преобразует quality tier в ограниченную renderer configuration, а reduced motion завершает visual animations немедленно. Последующая session persistence сначала считывает latest `gameController.playerProfile`, защищая settings от stale snapshot overwrite.

Для touch parity `InputIntent` публикует version 2, а toolbar surface предоставляет buttons для raise, lower и reset camera. `isPrimaryInteractionPointer()` принимает primary touch независимо от mouse button value; keyboard и touch UI вызывают один dispatch path.

## Последствия

| Область | Последствие |
|---|---|
| Persistence | Settings имеют один versioned source of truth вместе с profile, campaign progress и last session. |
| Accessibility | Крупный UI scale и reduced motion можно выбрать без keyboard; controls остаются нативными и semantic. |
| Rendering | Quality tier изменяет только presentation adapter, не влияет на Domain score или progression. |
| Input | Touch and keyboard actions не дублируют controller game logic. |
| Consistency | Level selection использует latest runtime profile и не отменяет новый settings save. |

## Альтернативы

1. **Отдельные browser storage keys для каждой настройки.** Отклонено: получились бы несколько миграционных/consistency boundaries вместо одного profile contract.
2. **Проверять allowed values в settings view.** Отклонено: UI стал бы business validator, а browser requests обходили бы Domain invariants.
3. **Изменять Three.js renderer напрямую из form handler.** Отклонено: persistence result, controller state и renderer могли бы расходиться при save failure.
4. **Полагаться на `event.button === 0` для touch.** Отклонено: это не является явным touch contract и привязывает mobile behavior к mouse representation.
5. **Добавить отдельную touch game-logic ветку.** Отклонено: existing InputIntent dispatch уже обеспечивает shared semantic actions.
