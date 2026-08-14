# UI-ROOM-001 — Camera and Placement Interaction

## Status
IN PROGRESS — implementation complete, browser smoke pending

## Requirement

Сделать работу с комнатой более понятной и сочной в Presentation-слое: камера не должна терять сцену, ближайшие к камере стены должны мягко просвечивать, ghost-preview должен вращаться до размещения, а ПКМ должна отменять выделение.

## Scope

Входит:

- camera distance limits `4..16`;
- резервирование ПКМ под deselect вместо camera pan;
- детерминированный wall visibility helper;
- opacity `0.18` для стены между внешней камерой и комнатой;
- возврат opacity `1` при нахождении камеры внутри комнаты;
- `R/Q` rotation ghost-preview на 90°;
- передача ghost rotation в placement;
- ПКМ отменяет ghost placement и selected item.

Не входит:

- изменение Domain bounds/collision/stacking rules;
- scoring или ergonomics evaluation;
- mobile gestures;
- snapping и новая camera persistence.

## Behavior contract

- Camera outside `front/back/left/right` fades only the corresponding wall.
- Camera inside room keeps all walls opaque.
- Ghost rotation is local Presentation state until placement.
- Placement receives the selected ghost rotation through the existing Application use case.
- Right mouse button calls deselect, cancels pending placement and prevents browser context menu/camera pan.

## TDD evidence

### Failing test

```text
Error: Cannot find module '../../src/Presentation/Scene/WallVisibility.js'
```

### Passing tests

```text
npm test -- tests/Presentation/WallVisibility.test.js tests/Presentation/InputIntent.test.js tests/Presentation/KeyboardShortcuts.test.js
3 test files passed
9 tests passed
```

## Architecture

- `WallVisibility.js` is a pure Presentation helper and has no Three.js or Domain dependency.
- `RoomView` owns camera, wall materials, ghost rotation and pointer events.
- `GameController` translates ghost rotation to the existing `PlaceItemUseCase` input.
- No Domain/Application business rule was changed.

## Manual QA checklist

1. Orbit to the outside of the back wall: back wall becomes semi-transparent.
2. Orbit to the outside of the right wall: right wall becomes semi-transparent.
3. Move camera inside the room: all walls become opaque again.
4. Select a catalog item and press `R`/`Q`: ghost rotates by 90° without placing it.
5. Rotate ghost, place it, and confirm the placed object keeps that orientation.
6. Right-click a selected object: selection is cleared and context menu does not open.
7. Right-click during ghost placement: ghost disappears and no item is placed.
8. Middle mouse camera pan and left mouse drag remain functional.
9. Confirm evaluation and free overlap/stacking behavior are unchanged.

## Follow-ups

- UI-ROOM-002: soft snapping and placement feedback.
- UI-CTRL-002: mobile adapter only after explicit MVP scope decision.
- Browser/WebGL smoke and camera comfort review on target viewport sizes.
