# Decorium Architecture Overview

## Status
Draft

## Owner
Qwen Studio Engineering Team

## Purpose
Описать высокоуровневую архитектуру проекта Decorium.

## Architectural Style

Проект использует **Domain-Driven Design (DDD)** с **Луковой архитектурой (Onion Architecture)**.

### Ключевые принципы

1. **Domain-Centric**: Бизнес-логика находится в центре, не зависит от внешних зависимостей
2. **Dependency Rule**: Зависимости направлены внутрь (к Domain)
3. **Separation of Concerns**: Каждый слой имеет чёткую ответственность
4. **Testability**: Domain полностью тестируем без внешних зависимостей
5. **Determinism**: Детерминированное поведение для воспроизводимости

## Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation                          │
│  (UI, Views, ViewModels, Presenters, Scene Adapters)    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    Application                           │
│        (Use Cases, Commands, Queries, Ports, DTO)        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                      Domain                              │
│  (Entities, Value Objects, Aggregates, Services, Rules)  │
└─────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────┐
│                   Infrastructure                         │
│     (Repositories, Adapters, JSON Loading, Platform)     │
└─────────────────────────────────────────────────────────┘
```

### Domain Layer

**Ответственность:** Бизнес-логика, правила оценки, ограничения стиля.

**Содержит:**
- Entities: `Item`, `PlacedItem`, `RoomState`
- Value Objects: `FeatureVector`, `RoomVector`
- Aggregates: `EvaluationResult`
- Domain Services: `RoomVectorCalculator`, `StyleConstraintEvaluator`, `StyleScorer`, `TotalScoreCalculator`
- Policies: `StarRatingPolicy`
- Business Rules: стилевые ограничения, правила эргономики

**Не зависит от:**
- Unity / Three.js
- JSON / файловой системы
- HTTP / сети
- UI / ввода пользователя
- баз данных
- времени / RNG

**Примеры:**
```typescript
// Domain/Items/Item.ts
export class Item {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly featureVector: FeatureVector
  ) {}
}

// Domain/Scoring/StyleScorer.ts
export class StyleScorer {
  calculateScore(penalties: number[]): number {
    // бизнес-формула
  }
}
```

### Application Layer

**Ответственность:** Оркестрация use cases, границы транзакций, DTO.

**Содержит:**
- Use Cases: `LoadLevelUseCase`, `PlaceItemUseCase`, `ConfirmPlacementUseCase`
- Commands: `PlaceItemCommand`, `MoveItemCommand`
- Queries: `GetRoomStateQuery`, `GetEvaluationResultQuery`
- Ports: `IItemCatalog`, `IConstraintCatalog`, `ILevelRepository`
- DTO: `EvaluationResultDTO`, `ViolationDTO`

**Не содержит:**
- бизнес-формулы (это Domain)
- инфраструктурные детали
- UI-логику
- прямые вызовы Unity/Three.js

**Примеры:**
```typescript
// Application/UseCases/ConfirmPlacementUseCase.ts
export class ConfirmPlacementUseCase {
  constructor(
    private roomStateRepository: IRoomStateRepository,
    private constraintEvaluator: IConstraintEvaluator,
    private scorer: IStyleScorer
  ) {}

  execute(levelId: string): EvaluationResultDTO {
    // оркестрация domain сервисов
  }
}
```

### Infrastructure Layer

**Ответственность:** Реализация портов, внешние зависимости, платформа.

**Содержит:**
- Repositories: `JsonItemCatalog`, `JsonLevelRepository`
- Adapters: `ThreeJsSceneAdapter`, `InputAdapter`
- JSON Loading: загрузка и валидация данных
- RNG: детерминированный генератор случайных чисел
- Logging: адаптеры логирования
- Platform: специфичный код для Unity/Web/Desktop

**Не принимает:**
- бизнес-решения
- изменений доменных правил

**Примеры:**
```typescript
// Infrastructure/Content/JsonItemCatalog.ts
export class JsonItemCatalog implements IItemCatalog {
  async loadItems(path: string): Promise<Item[]> {
    // загрузка JSON, маппинг на domain entities
  }
}
```

### Presentation Layer

**Ответственность:** UI, отображение, ввод пользователя, обратная связь.

**Содержит:**
- Views: `InventoryView`, `RoomView`, `ResultsView`
- ViewModels: `InventoryViewModel`, `RoomViewModel`
- Presenters: `EvaluationResultPresenter`, `FeedbackPresenter`
- Scene Adapters: маппинг domain → Three.js
- Input Mapping: обработка ввода пользователя

**Не содержит:**
- бизнес-логику
- scoring formulas
- persistence logic

**Примеры:**
```typescript
// Presentation/UI/ResultsView.ts
export class ResultsView {
  render(result: EvaluationResultDTO) {
    // отображение звёзд, нарушений, feedback
  }
}
```

## Bounded Contexts

Проект разделён на слабосвязанные контексты:

| Context | Responsibility |
|---------|---------------|
| **Item Catalog** | Каталог предметов, векторы признаков |
| **Room State** | Состояние комнаты, размещённые предметы |
| **Constraints** | Стилевые ограничения, правила эргономики |
| **Scoring** | Вычисление оценок, штрафов, рейтинга |
| **Feedback** | Генерация обратной связи, сообщения |
| **Level Definition** | Определение уровней, конфигурация комнат |
| **Game Flow** | Поток игры, сессии, состояния |
| **Progression** | Прогресс игрока, разблокировки (post-MVP) |
| **Economy** | Валюта, магазин (post-MVP) |
| **Persistence** | Сохранения, профиль (post-MVP) |

## Dependency Direction

```
Presentation → Application → Domain ← Infrastructure
                        ↑
                    Tests (все слои)
```

**Запрещено:**
- Domain → Infrastructure
- Domain → Presentation
- Application → Infrastructure напрямую (только через порты)
- Presentation → Domain напрямую (через Application)
- Циклические зависимости

## Data Flow

```
User Input → Presentation → Application Use Case → Domain Service
                                                        ↓
Infrastructure Repository ← Port ← Domain Entity ← Result
         ↓
    JSON/Storage
```

### Example: Confirm Placement

1. Игрок нажимает "Confirm" → `ResultsView.onConfirm()`
2. `ResultsView` вызывает `ConfirmPlacementUseCase.execute()`
3. Use Case загружает состояние комнаты через порт `IRoomStateRepository`
4. Use Case вызывает `RoomVectorCalculator.calculate(roomState)`
5. Use Case вызывает `StyleConstraintEvaluator.evaluate(roomVector, constraints)`
6. Use Case вызывает `StyleScorer.calculateScore(penalties)`
7. Use Case вызывает `StarRatingPolicy.determine(score)`
8. Use Case возвращает `EvaluationResultDTO`
9. `ResultsView` отображает результат

## Project Structure

```
decorium-mvp/
├── docs/                      # Документация
│   ├── mvp/                   # MVP документы
│   ├── architecture/          # Архитектурные документы
│   ├── adr/                   # Architecture Decision Records
│   ├── systems/               # Системные документы
│   ├── data-contracts/        # Контракты данных
│   └── slices/                # Карточки слайсов
│
├── data/                      # Данные (JSON)
│   ├── schemas/               # JSON схемы
│   ├── items/                 # Предметы
│   ├── styles/                # Стили
│   ├── constraints/           # Ограничения
│   ├── levels/                # Уровни
│   ├── feedback/              # Сообщения обратной связи
│   └── scoring/               # Параметры оценки
│
├── src/                       # Исходный код
│   ├── Domain/                # Domain layer
│   │   ├── Shared/            # Общие value objects
│   │   ├── Items/             # Item entities
│   │   ├── Rooms/             # Room entities
│   │   ├── Constraints/       # Constraint rules
│   │   ├── Scoring/           # Scoring services
│   │   ├── Levels/            # Level entities
│   │   ├── Progression/       # Progression rules (post-MVP)
│   │   ├── Economy/           # Economy rules (post-MVP)
│   │   └── Personalization/   # Personalization policies
│   │
│   ├── Application/           # Application layer
│   │   ├── Ports/             # Interfaces/ports
│   │   └── UseCases/          # Use cases
│   │
│   ├── Infrastructure/        # Infrastructure layer
│   │   ├── Content/           # JSON loading
│   │   ├── Persistence/       # Repositories
│   │   ├── Random/            # Deterministic RNG
│   │   ├── Time/              # Clock adapters
│   │   ├── Observability/     # Logging, metrics
│   │   └── Platform/          # Unity/Three.js adapters
│   │
│   └── Presentation/          # Presentation layer
│       ├── UI/                # Views, ViewModels
│       ├── Scene/             # 3D scene adapters
│       ├── Input/             # Input handling
│       ├── Audio/             # Audio triggers
│       └── Feedback/          # Feedback display
│
└── tests/                     # Тесты
    ├── Domain.UnitTests/      # Domain тесты
    ├── Application.UnitTests/ # Application тесты
    ├── Infrastructure.IntegrationTests/
    ├── Presentation.ContractTests/
    ├── Architecture.Tests/    # Проверка архитектуры
    └── IntegrationTests/      # E2E тесты
```

## Key Architectural Decisions

### ADR-001: Onion Architecture
Выбрана луковая архитектура для обеспечения тестируемости Domain и независимости от фреймворков.

### ADR-002: Domain Without Unity/Three.js
Domain слой не зависит от движка рендеринга. Это позволяет тестировать бизнес-логику headless.

### ADR-003: JSON Content Pipeline
Все данные загружаются из JSON с валидацией по схемам. Это позволяет дизайнерам редактировать контент без изменения кода.

### ADR-004: Style-Only Scoring for MVP
Для MVP реализуется только оценка стиля. Эргономика добавляется позже.

### ADR-005: Deterministic Test Data
Все тесты используют фиксированные данные и seed для воспроизводимости.

### ADR-006: Star Rating Thresholds
Star rating определяется порогами TotalScore (0.9, 0.7, 0.5, 0.3).

### ADR-007: Feedback Message Mapping
Обратная связь маппится через ID сообщений, а не генерируется динамически.

## Technology Stack

| Component | Technology |
|-----------|-----------|
| **Rendering** | Three.js 0.160.0 |
| **Build** | Vite 5.4.8 |
| **Testing** | Vitest 4.1.10 |
| **Language** | TypeScript/JavaScript |
| **Data Format** | JSON |
| **Schema Validation** | JSON Schema |

## Related Documents
- [[Layer Responsibilities]](./layers.md)
- [[Dependency Rule]](./dependency-rule.md)
- [[Bounded Contexts]](./bounded-contexts.md)
- [[ADR Index]](../adr/)

## Change History
| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-01-01 | 0.1 | Qwen Studio | Initial draft |
