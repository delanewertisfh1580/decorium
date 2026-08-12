# UI-VIS-002 — Context Actions in Room Summary

## Status
COMPLETED

## Requirement

Убрать постоянные кнопки «Повернуть», «Удалить» и «Отменить» из нижнего action-dock. Эти действия относятся к выбранному предмету и должны быть доступны компактно, через раскрываемый блок в правом верхнем room summary.

## Acceptance criteria

- [x] Нижний dock содержит только действия комнаты: «Сначала» и «Оценить».
- [x] Действия выбранного предмета находятся в закрытом по умолчанию `<details>` внутри верхнего summary.
- [x] Раскрытие summary показывает «Повернуть», «Удалить» и «Отменить».
- [x] Disabled-состояние rotate/delete/undo и Undo label продолжают синхронизироваться с controller.
- [x] Existing callbacks и InputIntent-контракт не изменены.
- [x] Contextual `boot-status` подсказки после действий сохранены.

## Implementation

`ToolbarView` теперь разделяет persistent session actions и contextual item actions. `GameController._renderDashboard()` создаёт summary spoiler и передаёт его в `ToolbarView.renderContextActions()`. CSS минимизирует нижний dock и оформляет spoiler как часть room summary.

## TDD evidence

```text
npm test -- tests/Presentation/ToolbarView.test.js tests/Presentation/HudLayout.test.js
✓ 2 files, 5 tests passed
```

```text
npm test
✓ 24 files, 155 tests passed
```

```text
npm run build
✓ успешно
```

## Manual QA checklist

1. Открыть Preview и убедиться, что в нижнем правом dock видны только «Сначала» и «Оценить».
2. Нажать «Действия предмета» в правом верхнем summary.
3. Проверить, что открываются «Повернуть», «Удалить» и «Отменить».
4. Выбрать предмет и убедиться, что rotate/delete активируются.
5. Выполнить действие и проверить contextual popup-подсказку в центре/нижней части сцены.
