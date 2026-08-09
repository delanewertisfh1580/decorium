# Decorium Layer Responsibilities

## Status
Draft

## Owner
Qwen Studio Engineering Team

## Purpose
Детально описать ответственность каждого слоя архитектуры.

## Domain Layer

### Responsibility
Бизнес-логика, правила предметной области, сущности, value objects.

### Contains

#### Entities
- `Item` - предмет каталога с вектором признаков
- `PlacedItem` - размещённый предмет с трансформацией
- `RoomState` - состояние комнаты (список размещённых предметов)

#### Value Objects
- `FeatureVector` - вектор признаков предмета (wood_share, metal_share, etc.)
- `RoomVector` - агрегированный вектор комнаты
- `LinearConstraint` - линейное ограничение (feature, operator, threshold)
- `Violation` - нарушение ограничения
- `EvaluationResult` - результат оценки (score, rating, violations)

#### Domain Services
- `RoomVectorCalculator` - вычисление вектора комнаты
- `StyleConstraintEvaluator` - проверка ограничений стиля
- `StyleScorer` - вычисление style score
- `TotalScoreCalculator` - вычисление total score
- `StarRatingPolicy` - определение рейтинга по порогам

#### Business Rules
- Формула вычисления вектора комнаты: `Vroom = average(Vitems)`
- Формула штрафа: `penalty = max(0, threshold - value)` для `>=`
- Пороги star rating: 0.9, 0.7, 0.5, 0.3

### Does NOT Contain
- Зависимости от Unity/Three.js
- Загрузку JSON
- UI логику
- Работу с файловой системой
- HTTP запросы
- Время / RNG

### Testing Strategy
- Unit тесты без внешних зависимостей
- Детерминированные данные
- Покрытие > 90%

### Example Structure
```
Domain/
├── Shared/
│   ├── FeatureVector.ts
│   └── RoomVector.ts
├── Items/
│   ├── Item.ts
│   └── PlacedItem.ts
├── Rooms/
│   └── RoomState.ts
├── Constraints/
│   ├── LinearConstraint.ts
│   └── ConstraintOperator.ts
├── Scoring/
│   ├── StyleScorer.ts
│   ├── TotalScoreCalculator.ts
│   └── StarRatingPolicy.ts
└── Evaluation/
    └── EvaluationResult.ts
```

---

## Application Layer

### Responsibility
Оркестрация use cases, границы транзакций, DTO, порты.

### Contains

#### Use Cases
- `LoadLevelUseCase` - загрузка уровня
- `PlaceItemUseCase` - размещение предмета
- `MoveItemUseCase` - перемещение предмета
- `RotateItemUseCase` - поворот предмета
- `RemoveItemUseCase` - удаление предмета
- `ConfirmPlacementUseCase` - подтверждение и оценка

#### Commands
- `PlaceItemCommand` (itemId, position, rotation)
- `MoveItemCommand` (itemId, newPosition)
- `RotateItemCommand` (itemId, newRotation)
- `RemoveItemCommand` (itemId)

#### Queries
- `GetRoomStateQuery`
- `GetAvailableItemsQuery`
- `GetEvaluationResultQuery`

#### Ports (Interfaces)
- `IItemCatalog` - каталог предметов
- `IConstraintCatalog` - каталог ограничений
- `ILevelRepository` - хранилище уровней
- `IRoomStateRepository` - хранилище состояния комнаты
- `IFeedbackRepository` - хранилище сообщений обратной связи

#### DTOs
- `EvaluationResultDTO` - для передачи в Presentation
- `ViolationDTO` - информация о нарушении
- `ItemDTO` - данные предмета для UI
- `LevelDTO` - данные уровня

### Does NOT Contain
- Бизнес-формулы (это Domain)
- Реализацию портов (это Infrastructure)
- UI логику
- Прямые вызовы Three.js/Unity

### Testing Strategy
- Unit тесты с моками портов
- Тестирование оркестрации
- Проверка маппинга DTO

### Example Structure
```
Application/
├── Ports/
│   ├── IItemCatalog.ts
│   ├── IConstraintCatalog.ts
│   ├── ILevelRepository.ts
│   └── IRoomStateRepository.ts
└── UseCases/
    ├── LoadLevelUseCase.ts
    ├── PlaceItemUseCase.ts
    ├── MoveItemUseCase.ts
    ├── RotateItemUseCase.ts
    ├── RemoveItemUseCase.ts
    └── ConfirmPlacementUseCase.ts
```

---

## Infrastructure Layer

### Responsibility
Реализация портов, внешние зависимости, платформа, загрузка данных.

### Contains

#### Repositories (Implementations)
- `JsonItemCatalog` implements `IItemCatalog`
- `JsonConstraintCatalog` implements `IConstraintCatalog`
- `JsonLevelRepository` implements `ILevelRepository`
- `JsonFeedbackRepository` implements `IFeedbackRepository`
- `InMemoryRoomStateRepository` implements `IRoomStateRepository`

#### Adapters
- `ThreeJsSceneAdapter` - маппинг domain → Three.js
- `InputAdapter` - обработка ввода
- `AudioAdapter` - воспроизведение звуков

#### Content Loading
- Загрузка JSON файлов
- Валидация по JSON Schema
- Парсинг и маппинг на domain entities

#### Platform Specific
- Deterministic RNG с seed
- Clock adapter для времени
- Logging adapter
- Metrics adapter

#### Storage
- Local storage adapter
- File system adapter (для desktop)

### Does NOT Contain
- Бизнес-решения
- Изменения доменных правил
- UI логику

### Testing Strategy
- Integration тесты с реальными данными
- Тестирование загрузки JSON
- Проверка валидации схем

### Example Structure
```
Infrastructure/
├── Content/
│   ├── JsonItemCatalog.ts
│   ├── JsonConstraintCatalog.ts
│   ├── JsonLevelRepository.ts
│   └── JsonFeedbackRepository.ts
├── Persistence/
│   └── InMemoryRoomStateRepository.ts
├── Random/
│   └── DeterministicRng.ts
├── Time/
│   └── SystemClock.ts
├── Observability/
│   ├── Logger.ts
│   └── Metrics.ts
└── Platform/
    ├── ThreeJsAdapter.ts
    └── InputHandler.ts
```

---

## Presentation Layer

### Responsibility
UI, отображение, ввод пользователя, обратная связь.

### Contains

#### Views
- `InventoryView` - отображение каталога предметов
- `RoomView` - 3D сцена комнаты
- `ResultsView` - экран результатов
- `FeedbackView` - отображение обратной связи

#### ViewModels
- `InventoryViewModel` - состояние инвентаря для UI
- `RoomViewModel` - состояние комнаты для UI
- `ResultsViewModel` - результаты оценки для UI

#### Presenters
- `InventoryPresenter` - логика инвентаря
- `RoomPresenter` - логика комнаты
- `EvaluationResultPresenter` - презентация результатов
- `FeedbackPresenter` - презентация обратной связи

#### Scene Adapters
- Маппинг `PlacedItem` → Three.js Mesh
- Маппинг координат domain ↔ Three.js
- Обработка коллизий визуальных

#### Input Mapping
- Mouse/keyboard input → команды приложения
- Gesture recognition (для mobile post-MVP)
- Camera controls

#### Feedback Display
- Отображение звёзд
- Список нарушений
- Текстовая обратная связь
- Визуальные подсказки

### Does NOT Contain
- Бизнес-логику
- Scoring formulas
- Persistence logic
- Прямые вызовы Domain сервисов

### Testing Strategy
- Contract тесты для ViewModels
- Integration тесты с моками Use Cases
- Визуальное тестирование (опционально)

### Example Structure
```
Presentation/
├── UI/
│   ├── InventoryView.ts
│   ├── RoomView.ts
│   ├── ResultsView.ts
│   └── FeedbackView.ts
├── ViewModels/
│   ├── InventoryViewModel.ts
│   ├── RoomViewModel.ts
│   └── ResultsViewModel.ts
├── Presenters/
│   ├── InventoryPresenter.ts
│   ├── RoomPresenter.ts
│   └── FeedbackPresenter.ts
├── Scene/
│   ├── SceneFactory.ts
│   └── ObjectMapper.ts
├── Input/
│   ├── MouseHandler.ts
│   └── KeyboardHandler.ts
└── Feedback/
    └── FeedbackDisplayer.ts
```

---

## Tests Layer

### Responsibility
Тестирование всех слоёв, проверка архитектуры.

### Contains

#### Unit Tests
- `Domain.UnitTests/` - тесты Domain слоя
- `Application.UnitTests/` - тесты Application слоя

#### Integration Tests
- `Infrastructure.IntegrationTests/` - тесты Infrastructure
- `IntegrationTests/` - E2E сценарии

#### Contract Tests
- `Presentation.ContractTests/` - тесты контрактов Presentation

#### Architecture Tests
- `Architecture.Tests/` - проверка зависимостей между слоями

### Testing Principles
- TDD: тесты до кода
- AAA: Arrange → Act → Assert
- Детерминизм: одинаковые результаты
- Независимость: тесты не зависят друг от друга
- Скорость: быстрые тесты

### Example Structure
```
tests/
├── Domain.UnitTests/
│   ├── FeatureVector.test.ts
│   ├── Item.test.ts
│   ├── RoomVectorCalculator.test.ts
│   ├── LinearConstraint.test.ts
│   ├── StyleScorer.test.ts
│   └── StarRatingPolicy.test.ts
├── Application.UnitTests/
│   ├── PlaceItemUseCase.test.ts
│   └── ConfirmPlacementUseCase.test.ts
├── Infrastructure.IntegrationTests/
│   ├── JsonItemCatalog.test.ts
│   └── JsonSchemaValidation.test.ts
├── Presentation.ContractTests/
│   └── ResultsViewModel.test.ts
├── Architecture.Tests/
│   ├── DependencyDirection.test.ts
│   └── DomainIndependence.test.ts
└── IntegrationTests/
    └── HeadlessMvpScenario.test.ts
```

---

## Cross-Cutting Concerns

### Observability
- Логирование: Infrastructure/Observability
- Метрики: Infrastructure/Observability
- Trace IDs: Application (передаются через Use Cases)

### Error Handling
- Domain: бросает domain exceptions
- Application: ловит, маппит на DTO
- Infrastructure: ловит, логирует, переупаковывает
- Presentation: отображает пользователю

### Validation
- Domain: валидация бизнес-правил
- Application: валидация входных данных
- Infrastructure: валидация JSON схем
- Presentation: валидация ввода пользователя

---

## Dependency Matrix

| From \ To | Domain | Application | Infrastructure | Presentation |
|-----------|--------|-------------|----------------|--------------|
| **Domain** | - | ❌ | ❌ | ❌ |
| **Application** | ✅ | - | ⚠️ (через порты) | ❌ |
| **Infrastructure** | ✅ | ✅ | - | ⚠️ (адаптеры) |
| **Presentation** | ❌ | ✅ | ❌ | - |
| **Tests** | ✅ | ✅ | ✅ | ✅ |

✅ = разрешено, ❌ = запрещено, ⚠️ = только через интерфейсы

---

## Related Documents
- [[Architecture Overview]](./overview.md)
- [[Dependency Rule]](./dependency-rule.md)
- [[Bounded Contexts]](./bounded-contexts.md)

## Change History
| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-01-01 | 0.1 | Qwen Studio | Initial draft |
