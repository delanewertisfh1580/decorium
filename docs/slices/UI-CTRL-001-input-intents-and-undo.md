# UI-CTRL-001 — Input Intents and Undo

## Status
IN PROGRESS — implementation complete, browser smoke pending

## Requirement

Сделать PC-ввод единым и отменяемым: клавиатура и экранные кнопки должны отправлять одинаковые Presentation intents, а последнее изменение композиции должно отменяться через Undo.

## Scope

Входит:

- единый `InputIntent` contract;
- keyboard mapping через physical `event.code` с fallback по `event.key`;
- общий dispatch для keyboard и toolbar actions;
- LIFO Undo buffer для placement, move, rotate и delete;
- disabled/label state кнопки Undo;
- `Z` и UI-кнопка как способы отмены;
- детерминированные unit-тесты.

Не входит:

- изменение Domain, scoring, constraints, level generation или persistence;
- mobile gestures, pinch и haptics;
- snapping и новая camera model;
- redo, profile history и долговременное сохранение.

## Behavior contract

| Intent | PC / UI source |
|---|---|
| rotate | `R`, `Q`, toolbar |
| delete | `Delete`, `Backspace`, toolbar |
| evaluate | `E`, toolbar |
| raise/lower | `PageUp`, `PageDown` |
| reset camera | `Home` |
| cancel | `Escape` |
| undo | `Z`, toolbar |

Undo хранит только успешно завершённые mutating actions. Новое действие добавляется поверх истории; при пустой истории кнопка disabled. При ошибке undo команда возвращается в buffer и ошибка показывается через status feedback.

Удаление отменяется обратным placement через существующий `PlaceItemUseCase`; runtime instance ID может быть новым уникальным ID, что не меняет Domain scoring или пользовательский результат.

## TDD evidence

### Failing tests

```text
InputIntent.test.js: Cannot find module InputIntent.js
UndoBuffer.test.js: Cannot find module UndoBuffer.js
```

### Passing tests

```text
npm test -- tests/Presentation/InputIntent.test.js tests/Presentation/UndoBuffer.test.js tests/Presentation/KeyboardShortcuts.test.js
3 test files passed
10 tests passed
```

## Architecture

- Input mapping and command history находятся в Presentation.
- `GameController` только dispatch-ит intents и вызывает существующие Application use cases.
- Domain/Application scoring contracts не изменены.
- `UndoBuffer` не знает о комнате, Three.js или бизнес-правилах.

## Manual QA checklist

1. Разместить предмет и нажать `Z`: предмет удаляется с мягкой анимацией.
2. Переместить предмет и нажать `Z`: он возвращается в предыдущую позицию.
3. Повернуть предмет через `R` или toolbar и нажать `Z`: поворот отменяется.
4. Удалить предмет и нажать `Z`: предмет восстанавливается.
5. Выполнить несколько действий: Undo отменяет их в обратном порядке.
6. Очистить комнату: Undo history становится пустой.
7. Нажать `Z` без истории: ничего не ломается, кнопка disabled.
8. Проверить `R/Q/Z/E` на русской раскладке.
9. Убедиться, что scoring и feedback после Undo пересчитываются только при явном `E`.

## Follow-ups

- UI-ROOM-001: snapping/placement feedback contract.
- UI-CTRL-002: mobile adapter only after explicit MVP scope decision.
- UI-RESULT-001: result view model and radar chart.
