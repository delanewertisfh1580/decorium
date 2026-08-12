# Decorium Layer Responsibilities

## Status
Playable MVP baseline with living-scene presentation

## Domain

**Path:** `src/Domain`

Содержит чистые правила без Three.js и browser APIs:

- `Items/FeatureVector.js` — immutable V2 vector из 16 полей.
- `Items/Item.js`, `Items/CatalogValidator.js` — сущность предмета и validation.
- `Rooms/RoomBounds.js`, `Rooms/RoomState.js` — размещение, move по X/Y/Z, rotate, remove и bounds; overlap/stacking намеренно разрешены.
- `Constraints/*` — линейные ограничения и violations.
- `Scoring/*` — constraint evaluation, data-driven `CompositionEvaluator`, weighted score и star policy.

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

UI-VIS-001 добавляет `hudLayout.js` как чистый контракт scene-first HUD. Он валидируется на bootstrap и используется только для компоновки UI; он не содержит правил Domain/Application.

**Path:** `src/Presentation`

- `GameController` связывает input, use cases и views.
- `RoomView` — Three.js scene, OrbitControls, raycasting, room geometry, visual meshes, dynamic wall visibility, ghost rotation и animation loop.
- `Scene/WallVisibility.js` — pure Presentation helper для прозрачности стен относительно camera position.
- `SceneLifeSystem` — presentation-only TV animation, local lights, pet movement and particles; `lifeAnimationConfig.js` supplies deterministic gait/TV motion profiles. Permanent explanatory evaluation labels are intentionally absent.
- `LocationEnvironmentSystem` — street entities, natural pedestrian arm/leg gait and route motion; `roomSurfaceConfig.js` defines the matte non-grid floor contract used by `RoomView`.
- `ItemVisualFactory` — rich procedural builders driven by the bundled `data/visuals/item-visuals.json` profile contract; detail parts and selection/ghost feedback remain Presentation-only.
- Catalog/toolbar/evaluation views — DOM-представление; `EvaluationView` показывает все причины и результаты из feedback catalog.
- `UI/designTokens.js` — formal presentation token contract, runtime validation and CSS custom-property application.
- ViewModels преобразуют DTO/Domain state к данным UI.

Presentation не пересчитывает score и не меняет Domain state напрямую; visual profile JSON — единственное presentation-data исключение и бандлится вместе с procedural renderer-ом.

## Composition root

`src/main.js` — единственная точка bootstrap. `index.html` содержит только DOM-контейнеры и импорт `src/main.js`; старого inline bootstrap нет.

## Tests

`tests/Domain`, `tests/Domain.UnitTests`, `tests/Application`, `tests/guards` покрывают Domain/Application contracts, operation error paths, scoring, star thresholds и архитектурные ограничения. Интеграционные loader tests пока оставлены как skipped legacy tests и не считаются green acceptance evidence.
