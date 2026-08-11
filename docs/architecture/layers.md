# Decorium Layer Responsibilities

## Status
Implemented MVP baseline

## Domain

**Path:** `src/Domain`

Содержит чистые правила без Three.js и browser APIs:

- `Items/FeatureVector.js` — immutable V2 vector из 16 полей.
- `Items/Item.js`, `Items/CatalogValidator.js` — сущность предмета и validation.
- `Rooms/RoomBounds.js`, `Rooms/RoomState.js` — размещение, move, rotate, remove, bounds, collision и gap.
- `Constraints/*` — линейные ограничения и violations.
- `Scoring/*` — constraint evaluation, weighted style score и star policy.

Domain не загружает JSON и не обращается к UI.

## Application

**Path:** `src/Application`

Use cases:

- `LoadLevelUseCase`
- `PlaceItemUseCase`
- `MoveItemUseCase`
- `RotateItemUseCase`
- `RemoveItemUseCase`
- `EvaluateRoomUseCase`

DTO (`LevelDTO`, operation result DTOs, `EvaluationResultDTO`) стабилизируют границу с Presentation. Порты описывают level/room/catalog contracts; конкретные loaders сюда не импортируются.

## Infrastructure

**Path:** `src/Infrastructure`

- JSON loaders: item, level, constraint, style, feedback, scoring.
- `SchemaLoader` и AJV runtime validation для item/level.
- `InMemoryRoomRepository` хранит текущую сессию без persistence.

Infrastructure адаптирует сеть/JSON и не меняет бизнес-правила.

## Presentation

**Path:** `src/Presentation`

- `GameController` связывает input, use cases и views.
- `RoomView` — Three.js scene, OrbitControls, raycasting, room geometry и visual meshes.
- Catalog/toolbar/evaluation views — DOM-представление.
- ViewModels преобразуют DTO/Domain state к данным UI.

Presentation не пересчитывает score и не читает JSON-файлы напрямую.

## Composition root

`src/main.js` — единственная точка bootstrap. `index.html` содержит только DOM-контейнеры и импорт `src/main.js`; старого inline bootstrap нет.

## Tests

`tests/Domain`, `tests/Domain.UnitTests`, `tests/Application`, `tests/guards` покрывают Domain/Application contracts, operation error paths, scoring, star thresholds и архитектурные ограничения. Интеграционные loader tests пока оставлены как skipped legacy tests и не считаются green acceptance evidence.
