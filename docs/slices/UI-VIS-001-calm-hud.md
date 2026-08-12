# UI-VIS-001 — Calm HUD Redesign

## Status
COMPLETED

## Requirement

Сделать HUD менее навязчивым: сцена должна оставаться главным визуальным пространством, а каталог, статус комнаты и действия — быть компактными, спокойными и доступными на desktop и узких экранах.

## Acceptance criteria

- [x] HUD не перекрывает центр 3D-комнаты постоянной панелью.
- [x] Библиотека предметов представлена горизонтальным inventory-dock с прокруткой.
- [x] Toolbar представлен компактным action-dock с сохранением rotate, delete, undo, clear и evaluate callbacks.
- [x] Dashboard показывает только краткий контекст комнаты, количество предметов, стиль, score и stars.
- [x] Результат оценки открывается отдельным спокойным overlay и не меняет evaluation data contract.
- [x] Touch targets интерактивных действий остаются не меньше 44 px.
- [x] На узких viewport-ах inventory и action-dock переходят в нижние thumb-friendly зоны.
- [x] Safe area учитывается через `env(safe-area-inset-*)`.
- [x] `prefers-reduced-motion` отключает выразительные UI-анимации.

## Presentation contract

`src/Presentation/UI/hudLayout.js` задаёт детерминированный контракт:

- reference surface: `scene-first`;
- regions: brand `top-left`, summary `top-right`, inventory `bottom-left`, actions `bottom-right`;
- panel opacity не выше `0.9`;
- action controls не меньше `44 px`;
- action labels не крупнее `16 px`;
- inventory card width не меньше `132 px`;
- mobile breakpoint: `720 px`.

Контракт валидируется во время bootstrap вместе с UI-VIS-000 design tokens. Он не содержит gameplay, scoring, constraints или persistence правил.

## TDD evidence

### Failing test

```text
Error: Cannot find module '../../src/Presentation/UI/hudLayout.js'
```

### Passing test

```text
npm test -- tests/Presentation/HudLayout.test.js
✓ 3 tests passed
```

Additional targeted verification:

```text
npm test -- tests/Presentation/HudLayout.test.js tests/Presentation/DesignTokens.test.js tests/Presentation/InputIntent.test.js
✓ 3 files, 10 tests passed
```

## Changed presentation files

- `src/Presentation/UI/hudLayout.js`;
- `src/main.js` — runtime validation of the HUD contract;
- `src/Presentation/Views/ToolbarView.js`;
- `src/Presentation/Views/ItemCatalogView.js`;
- `src/Presentation/Views/EvaluationView.js`;
- `src/Presentation/Controllers/GameController.js` — compact summary markup only;
- `src/styles.css`;
- `tests/Presentation/HudLayout.test.js`.

## Manual QA checklist

1. Open the preview at approximately `1280×720`; confirm the room remains visible behind all HUD regions.
2. Add several items and horizontally scroll the inventory dock; confirm each card still invokes the existing selection callback.
3. Select an item; confirm rotate/delete become enabled and undo state remains correct.
4. Run evaluation; confirm the result overlay is centered, closable and readable without changing score behavior.
5. Resize below `720 px`; confirm inventory spans the lower area, actions remain reachable, and no panel covers the room center.
6. Test a device/browser with a safe-area inset and `prefers-reduced-motion` enabled.

## Out of scope

No Domain, Application use case, scoring formula, constraints, level generation, economy, persistence schema, or input intent behavior was changed.
