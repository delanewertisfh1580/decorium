# Decorium — Декомпозиция игры на системы и подсистемы

## 1. Общее описание проекта

**Decorium** — 3D-таймкиллер о дизайне интерьеров с AI-driven системой оценки. Игрок размещает предметы в комнате, стараясь удовлетворить стилевые ограничения и эргономические требования клиента.

**Цель MVP (v1.0):** Реализовать полный цикл геймплея от выбора уровня до получения оценки с обратной связью на русском языке.

**Стек:** Vite 5 · three 0.160 · ajv 8 · vitest 4

---

## 2. Архитектурные принципы

### 2.1. DDD / Onion Architecture
- **Domain Layer**: Чистые бизнес-правила, сущности, value objects. Не зависит от внешних библиотек.
- **Application Layer**: Use-cases, порты для инфраструктуры. Оркестрация доменной логики.
- **Infrastructure Layer**: Адаптеры (localStorage, файловая система, HTTP).
- **Presentation Layer**: UI, 3D-рендеринг, ввод пользователя. Тонкий слой, делегирующий логику вниз.

### 2.2. Направленность зависимостей
Все зависимости направлены внутрь (к Domain). Внешние слои зависят от внутренних, но не наоборот.

### 2.3. Детерминизм
Вся случайность контролируется через явный seed (`Domain/Personalization/Rng`). Запрещены `Math.random`, `Date.now`, `fetch`, `localStorage` в Domain и Application слоях.

### 2.4. Явные ошибки
Типизированные коды ошибок (INVALID_INPUT, LEVEL_NOT_FOUND, etc.). Пустые catch запрещены. Boot-ошибка отображается как оверлей, а не белый экран.

---

## 3. Системы и подсистемы

### 3.1. Item System (Предметы)
- **Item**: Сущность предмета с feature vector (16 полей), dimensions {x, z}, price.
- **FeatureVector**: Нормализованные признаки предмета (materials, colors, geometry, ergonomics).
- **CatalogValidator**: Валидация каталога предметов против схемы item.v2.json.

### 3.2. Room System (Комната)
- **RoomBounds**: Границы комнаты, позиции дверей/окон, clearance зоны.
- **OccupancyGrid**: Сетка занятости (шаг 0.5 м) для проверки размещения.
- **SpatialQuery**: Проверка зазоров, пересечений, дисперсии расстановки.
- **RoomState**: Состояние комнаты, валидация place/move/rotate операций.

### 3.3. Scoring System (Оценка)
- **ConstraintEvaluator**: Оценка соответствия предметам стилевым ограничениям.
- **StylePenaltyCalculator**: Расчёт штрафа за нарушение ограничений.
- **ErgonomicsPenaltyCalculator**: Расчёт штрафа за эргономические нарушения.
- **SubScoreAggregator**: Агрегация под-оценок по 4 осям radar chart.
- **EvaluationResultBuilder**: Формирование итогового результата (total, stars, violations).

### 3.4. Feedback System (Обратная связь)
- **ViolationPrioritizer**: Приоритизация нарушений для обратной связи.
- **ClientCommentGenerator**: Генерация комментариев клиента на русском языке (детерминированно по seed).
- **RadarChartDataBuilder**: Подготовка данных для radar chart.
- **HighlightDirectiveBuilder**: Директивы для подсветки проблемных зон.

### 3.5. Level System (Уровни)
- **Level v2**: Определение уровня (roomTemplate, clientTier, budget, targetStars, ergoEnabled, seed, availableItems, constraints).
- **ClientProfile**: Профиль клиента с предпочтениями.
- **LevelValidator**: Валидация уровня на решаемость.

### 3.6. Game Flow (Игровой поток)
- **SessionStateMachine**: Машина состояний (MainMenu → LevelSelect → Placement → Evaluation → Results → Retry/Next/Menu).
- **TransitionRules**: Правила переходов между состояниями.
- **UseCaseDispatcher**: Диспетчер use-cases.
- **SessionEventsPublisher**: Публикация событий сессии.

### 3.7. 3D & Input (Рендеринг и ввод)
- **RoomView3D**: Three.js сцена комнаты (IView, emissive-подсветка).
- **InputIntentMapper**: Маппинг ввода пользователя в интенты.
- **SelectionService**: Выделение предметов.
- **RotationController**: Поворот предметов (кратно 90°).
- **CommandHistory**: История команд (undo 20, redo подготовлен).

### 3.8. Persistence (Сохранение)
- **LocalStorageAdapter**: Адаптер для localStorage.
- **SaveSerializer**: Сериализация/десериализация сохранений (save.v1.json).
- **ProfileRepository**: Репозиторий профиля игрока.
- **Integrity Validation**: Проверка целостности данных, fallback при повреждении.

### 3.9. Personalization (Персонализация)
- **Rng**: Детерминированный RNG (mulberry32 + hash).
- **Seed Strategy**: seed = `level.seed + ':' + playerSeed`.

---

## 4. Запрещённые перекрёстные зависимости

1. **UI не считает score/penalty/stars** — только отображает результаты из Application layer.
2. **Input не меняет score/экономику напрямую** — только через use-cases.
3. **Persistence без бизнес-правил** — только хранение/загрузка данных.
4. **Domain не зависит от three/ajv/JSON/HTTP/FS/UI** — чистая логика.
5. **Observability не влияет на score** — логирование/метрики не меняют бизнес-правила.
6. **Personalization скрыто не меняет правила** — seed влияет только на выбор контента, не на формулы.

---

## 5. Формулы оценки (GDD)

### 5.1. Value предмета
```
value = dot(a_i, V_room)
```
где `a_i` — вектор признаков предмета, `V_room` — целевой вектор стиля комнаты.

### 5.2. Penalty за нарушение ограничения
```
gte: max(0, b − v)
lte: max(0, v − b)
eq: |v − b|
penalty = Σ(penalty_type × weight)
```

### 5.3. Score
```
score = exp(−λ × penalty)
```
λ читается из `data/scoring/parameters.json`.

### 5.4. Total score
```
total = 0.7 × style_score + 0.3 × ergo_score  (если ergoEnabled: true)
total = 1.0 × style_score                     (если ergoEnabled: false)
```

### 5.5. Звёзды
| Звёзды | Диапазон total |
|--------|----------------|
| 1      | < 0.40         |
| 2      | 0.40 – 0.55    |
| 3      | 0.56 – 0.70    |
| 4      | 0.71 – 0.85    |
| 5      | 0.86 – 1.00    |

---

## 6. Контракты и имена

### 6.1. FeatureVector (16 полей)
1. woodShare
2. metalShare
3. glassShare
4. plasticShare
5. textileShare
6. lightColorShare
7. darkColorShare
8. warmPaletteShare
9. saturationLevel
10. formSimplicity
11. roundnessShare
12. rectilinearShare
13. sizeNorm
14. priceNorm
15. lightingFunctionShare
16. storageFunctionShare

### 6.2. Item структура
```typescript
interface Item {
  id: string;
  name: string;
  featureVector: number[]; // 16 элементов
  dimensions: { x: number; z: number }; // метры
  price: number;
}
```

### 6.3. EvaluationResult структура
```typescript
interface EvaluationResult {
  total: number;           // 0..1
  score_style: number;     // 0..1
  score_ergo: number;      // 0..1 или undefined
  stars: number;           // 1..5
  sub_scores: Record<string, number>;
  violations: Violation[];
  diagnostics: Diagnostics;
}
```

---

## 7. Слои архитектуры (детализация)

### 7.1. Domain Layer
- **Сущности**: Item, RoomState, Level, ClientProfile
- **Value Objects**: FeatureVector, RoomBounds, Violation
- **Services (чистые)**: ConstraintEvaluator, PenaltyCalculator, Rng
- **Запреты**: Нет импортов three, ajv, fetch, localStorage, document, window, console

### 7.2. Application Layer
- **Use Cases**: PlaceItem, MoveItem, RotateItem, EvaluateLevel, GenerateFeedback
- **Ports**: ICatalogLoader, IRoomSerializer, IFeedbackRepository
- **DTO**: EvaluationResult, LevelConfig, SaveData
- **Запреты**: Нет импортов Infrastructure层的具体实现

### 7.3. Infrastructure Layer
- **Адаптеры**: LocalStorageAdapter, FileCatalogLoader, AjvValidator
- **Реализации портов**: Конкретные реализации ICatalogLoader, IRoomSerializer
- **Запреты**: Нет бизнес-правил, только адаптация

### 7.4. Presentation Layer
- **Views**: RoomView3D, ResultsView, MainMenuView
- **Controllers**: InputHandler, CameraController
- **ViewModels**: Результаты без пересчёта, только маппинг DTO → UI
- **Запреты**: Нет расчёта score/penalty/stars, нет импортов Infrastructure

---

## 8. Guard-тесты

### 8.1. no-nondeterminism.test.js
Сканирует Domain/Application на запрещённые вызовы:
- Math.random
- Date.now / new Date(
- fetch
- localStorage
- document
- window
- console (в Domain)

### 8.2. layer-imports.test.js
Сканирует импорты:
- Domain: запрет three, ajv, fetch, localStorage, document, window
- Application: запрет импортов Infrastructure
- Presentation: запрет импортов Infrastructure

### 8.3. determinism.test.js
Проверяет, что одинаковый seed даёт идентичный EvaluationResult.

---

## 9. Roadmap слайсов (MVP v1.0)

| Слайс | Название | Статус |
|-------|----------|--------|
| S0 | Initial Setup | ✅ |
| S1 | Project Structure | ✅ |
| S2 | Item Catalog v2 | ✅ |
| S-F1...S-F4 | Documentation Fixes | 🔄 |
| S3 | Room State | ⏳ |
| S4 | Стилевые ограничения v2 | ⏳ |
| S5 | Scoring | ⏳ |
| S6 | Эргономика-базис | ⏳ |
| S7 | Feedback RU | ⏳ |
| S8 | Level Definition v2 | ⏳ |
| S9 | Game Flow | ⏳ |
| S10 | 3D и ввод | ⏳ |
| S11 | Результаты в UI | ⏳ |
| S12 | Persistence | ⏳ |
| S13 | Детерминизм | ⏳ |
| S14 | Релиз v1.0-mvp | ⏳ |

---

## Приложения

### A. Источники истины (приоритет)
1. Настоящая декомпозиция
2. GDD «Decorium: Проектирование AI-Driven системы дизайнерских оценок»
3. «Динамическая персонализация без состояния»
4. README.md

### B. Контакты и доступы
- Репозиторий: https://github.com/delanewertisfh1580/decorium
- CI/CD: GitHub Actions
- Deploy: Render (decorium.onrender.com)
