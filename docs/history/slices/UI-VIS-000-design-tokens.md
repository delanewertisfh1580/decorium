# UI-VIS-000 — Presentation Design Tokens

## Status
COMPLETED

## Requirement

Создать минимальный формальный presentation-контракт для спокойного и читаемого Decorium UI. Контракт должен задавать reference resolution, spacing, radius, typography, touch targets, colors и motion без изменения Domain/Application правил.

## Scope

В слайс входят:

- `src/Presentation/UI/designTokens.js`;
- применение токенов к CSS custom properties во время bootstrap;
- базовое выравнивание `src/styles.css` под токены;
- детерминированные unit-тесты контракта.

В слайс не входят:

- изменение scoring, constraints, level generation или persistence;
- mobile/touch gameplay, которые остаются post-MVP согласно `docs/history/mvp/out-of-scope.md`;
- новые игровые экраны, audio или внешние сервисы.

## Canonical token values

- Reference resolution: `1280 × 720`.
- Spacing: `4 / 8 / 12 / 16 / 24 / 32 / 48 px`.
- Radius: `8 / 12 / 16 / 18 px`.
- Typography: body `20 px`, secondary `16 px`, button `20 px`, heading `32 px`.
- Touch target: minimum `44 px`, comfortable `64 px`.
- Motion: micro `100 ms`, panel `200 ms`, result `420 ms`, invalid `220 ms`.
- Palette: warm background, sage accent, muted text, calm warm/danger states.

## TDD evidence

### Failing test

```text
Error: Cannot find module '../../src/Presentation/UI/designTokens.js'
```

The failure established that the presentation token contract did not exist.

### Passing test

```text
npm test -- tests/Presentation/DesignTokens.test.js
✓ tests/Presentation/DesignTokens.test.js (4 tests)
Tests 4 passed
```

## Architecture

- Contract lives under Presentation.
- Domain and Application remain unchanged.
- `main.js` validates and applies the contract at composition/bootstrap time.
- CSS consumes custom properties; it does not introduce new business rules.

## Manual QA checklist

1. Open the browser preview at desktop reference size.
2. Verify panels use warm pastel surfaces and sage accents.
3. Verify catalog cards and toolbar buttons are easy to target without precision clicks.
4. Verify catalog text remains readable at the reference viewport.
5. Resize to a narrow viewport and confirm the existing responsive layout still loads without a blank screen.
6. Confirm that gameplay actions and evaluation behavior are unchanged.

## Known follow-ups

- Extract inventory/HUD/result components into dedicated presentation contracts.
- Add a radar-chart view model only when a readable result data contract exists.
- Add touch interaction only through a separate input slice; current MVP documentation marks mobile controls post-MVP.
- Add automated contrast and screenshot/browser smoke evidence in a later slice.
