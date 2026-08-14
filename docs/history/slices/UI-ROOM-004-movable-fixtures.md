# UI-ROOM-004 — Movable Fixtures

## Status
COMPLETED

## Requirement

Убрать пересечение встроенной книжной полки с телевизором и сделать встроенные зеркало/полку доступными для мягкого перемещения по стене. Тонкие каталоговые mirror/shelf также должны стабильно попадать в raycast.

## Acceptance criteria

- [x] Встроенная полка находится с безопасным зазором от телевизора.
- [x] Встроенное зеркало больше не лежит поверх оконного проёма.
- [x] Встроенное зеркало можно выбрать и переместить по горизонтали стены.
- [x] Встроенную книжную полку можно выбрать и переместить по горизонтали стены.
- [x] Каталоговые mirror/shelf получили невидимые interaction hit areas.
- [x] Встроенные fixtures остаются Presentation-only и не участвуют в RoomState или scoring.
- [x] Свободное overlap/stacking-размещение пользовательских предметов сохранено.

## Implementation

`FixtureLayout.js` задаёт safe positions для TV, bookshelf и mirror и валидирует зазор между TV и bookshelf. `LocationEnvironmentSystem` группирует ambient fixtures и предоставляет `getInteractableObjects()`/`moveFixture()`. `RoomView` raycast-ит эти группы отдельно от furniture items и передаёт перемещение через presentation callbacks.

`ItemVisualFactory` добавляет прозрачные StandardMaterial hit proxies для тонких `mirror`, `wallShelf` и `bookcase`; они не влияют на визуальный рендер и не видны в ghost preview.

## TDD evidence

```text
npm test -- tests/Presentation/FixtureLayout.test.js tests/Presentation/FixtureInteraction.test.js
✓ 2 files, 5 tests passed
```

## Manual QA checklist

1. Кликнуть по встроенной полке с книгами и перетащить её вдоль задней стены.
2. Кликнуть по встроенному зеркалу справа от окна и переместить его вдоль стены.
3. Выбрать каталоговое зеркало или полку у стены и убедиться, что объект подсвечивается и двигается.
4. Проверить, что TV и shelf не пересекаются в начальной сцене.
5. Убедиться, что перемещение встроенного декора не меняет количество предметов и score.
