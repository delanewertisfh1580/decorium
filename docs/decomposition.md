# Decorium — декомпозиция MVP

## 1. Общее описание

Decorium — браузерная 3D-игра на Vite и Three.js. MVP проверяет цикл: выбрать предмет → разместить комнату → изменить композицию → получить стилевую оценку и feedback.

**Канон MVP:** Three.js 0.160, JavaScript ES modules, JSON V2 с 16 признаками, один уровень `level-001`, Scandinavian, пороги звёзд 0.86 / 0.71 / 0.56 / 0.40.

## 2. Архитектура

Используется DDD/Onion Architecture:

```text
Presentation → Application → Domain ← Infrastructure
```

Domain не зависит от Three.js, AJV, HTTP или DOM. Infrastructure реализует загрузку JSON и repository. Presentation отвечает за Three.js и UI.

## 3. Реализованные системы

### Item System
`Item`, `FeatureVector` и `CatalogValidator` поддерживают V2-вектор из 16 полей: `woodShare`, `metalShare`, `glassShare`, `plasticShare`, `textileShare`, `lightColorShare`, `darkColorShare`, `warmPaletteShare`, `saturationLevel`, `formSimplicity`, `roundnessShare`, `rectilinearShare`, `sizeNorm`, `priceNorm`, `lightingFunctionShare`, `storageFunctionShare`.

### Room System
`RoomBounds` и `RoomState` реализуют размещение, перемещение по X/Y/Z, поворот на 90° и удаление. Границы комнаты проверяются, но collision/minimum-gap не блокируют композицию: наложение и stacking — валидные творческие действия. Состояние сессии хранится в `InMemoryRoomRepository`.

### Scoring System
`FeatureVector.average()` рассчитывает вектор комнаты. `ConstraintEvaluator` проверяет пять `LinearConstraint` для Scandinavian. `CompositionEvaluator` проверяет data-driven минимальную композицию уровня: для `level-001` минимум 4 предмета и роли seating/surface/lighting. `StyleScorer` суммирует взвешенные стилевые и композиционные нарушения, ограничивает штраф единицей и вычисляет `score = 1 - penalty`. `StarRatingPolicy` использует пороги из `data/scoring/scoring-parameters.json`.

### Feedback System
`JsonFeedbackCatalog` сопоставляет `messageKey` нарушения с русским шаблоном, подставляет threshold/value и добавляет success/tip-сообщение.

### Level System
`JsonLevelRepository` валидирует `data/levels/level-001.json` и `LoadLevelUseCase` собирает `LevelDTO` с размером комнаты, доступными предметами, состоянием и ограничениями.

### 3D & Input
`RoomView` создаёт Three.js-сцену комнаты, освещение, пол, стены, сетку и rich-detail процедурные группы предметов из primitives через `ItemVisualFactory`. Factory использует profile-driven builders для мебели, света, storage и декора; отдельные profiles существуют для roundTable, vase и clock. Предметы получают вторичные детали, `detailCount` и отдельный selection halo, а valid/invalid ghost states имеют собственный feedback layer. Pointer events и raycasting обеспечивают drag/drop, ghost-preview, выбор и перемещение; OrbitControls отвечает за камеру с ограничением дистанции. `WallVisibility` мягко делает стену между внешней камерой и комнатой прозрачной. `InputIntent` объединяет keyboard и toolbar actions: `R/Q`, `Delete`, `E`, `Escape`, `Home`, `PageUp`, `PageDown`, `Z`. Ghost-preview вращается на `R/Q`, ПКМ отменяет ghost/выделение. `UndoBuffer` отменяет последнее успешное placement/move/rotate/delete действие. Появление, перемещение, вращение, удаление и восстановление анимируются.

`hudLayout.js`, `ToolbarView`, `ItemCatalogView`, `EvaluationView` и summary-разметка `GameController` образуют scene-first HUD. Inventory — горизонтальный dock, actions — компактный action-dock, summary — небольшой статус; CSS учитывает safe area, узкие viewport-ы и reduced-motion. HUD не содержит игровых или scoring-решений.

`LocationEnvironmentSystem` расширяет `SceneLifeSystem` процедурным окружением дома: фасадом с окнами и дверью, тротуаром, дорогой, фонарями и фиксированными маршрутами двух людей, двух машин и животного. В интерьер добавлены бытовые детали и отдыхающий кот. Все route phases/speeds заданы в `locationLifeConfig.js`; слой остаётся визуальным и не влияет на `RoomState`. `lifeAnimationConfig.js` задаёт детерминированные gait-позы людей/животного, естественный темп, pivot-движение рук, направление маршрута, frame-rate independent колёса и многослойную анимацию телевизора с content blocks, bars, scanlines и glow. `roomSurfaceConfig.js` запрещает debug grid и задаёт матовую тёплую поверхность пола. `RoomArchitecture` задаёт реальные оконный проём и боковую дверь; прозрачное стекло и сегментированная стена не меняют placement rules. `FixtureLayout` разносит TV/bookshelf/mirror и даёт ambient mirror/bookshelf presentation-only перемещение; тонкие catalog items получают hit proxies. `EvaluationView` и feedback JSON остаются единственным источником объяснений результата; scene-side passage label удалён.

## 4. Границы зависимостей

- UI не рассчитывает score/stars.
- Application не импортирует Infrastructure.
- Domain не знает о Three.js, JSON и браузере.
- Presentation не обращается к JSON напрямую: bootstrap собирает зависимости через use cases.

## 5. Формулы оценки

```text
Vroom = average(Vitems)
penalty_i = max(0, threshold - value) для >=
penalty_i = max(0, value - threshold) для <=
penalty = min(maxPenalty, Σ(penalty_i × weight))
score = clamp(1 - penalty, 0, 1)
```

Пустая комната получает score 0 и 0 звёзд как отдельное состояние до начала игры. Одна стилистически подходящая мебель не считается завершённой композицией: требования уровня добавляют composition violations и feedback.

## 6. Контракты данных

- `data/items/catalog.v2.json` — объект `{ "items": [...] }`, минимум 30 предметов; каждый `featureVector` содержит 16 полей.
- `data/levels/level-001.json` — `roomDimensions`, 16 `availableItems`, `initialPlacement`, `styleId`.
- `data/constraints/scandinavian-constraints.json` — пять ограничений с feature/operator/threshold/weight/messageKey.
- `data/feedback/scandinavian-feedback.json` — русские шаблоны feedback.
- `data/scoring/scoring-parameters.json` — пороги звёзд и параметры штрафа.

## 7. Тесты и проверки

`npm test` запускает полный suite Domain/Application, scoring, constraints, Presentation contracts, UI guards и документации; UI-VIS-001 и UI-VIS-003 добавляют отдельные проверки HUD и rich item-visual контрактов, UI-ROOM-002 — living-location контракт, UI-ROOM-005 — deterministic animation contract, UI-ROOM-006 — animation/surface polish contract. `npm run build` проверяет `src/main.js` и собирает единый `dist/index.html`.

## 8. Не входит в MVP

Не реализуются и не должны считаться готовыми: эргономический score, сохранения, профиль, экономика, прогрессия, несколько уровней/стилей, multiplayer, аудио, LLM-персонализация, аналитика, мобильное управление и production telemetry.

## 9. Источники истины

1. Выбранные решения MVP в задаче: Three.js, V2/16 признаков, пороги Decomposition.
2. Этот документ и `docs/mvp/*`.
3. JSON-схемы и фактический runtime-код.
4. ADR-документы, обновлённые под текущий MVP.
