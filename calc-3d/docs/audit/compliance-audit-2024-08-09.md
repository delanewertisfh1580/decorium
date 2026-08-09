# Аудит соответствия кода Decorium стандартам Qwen Studio

**Дата аудита:** 2024-08-09  
**Проект:** calc-3d (Decorium)  
**Статус:** Частичное соответствие с критическими отклонениями

---

## 1. Общая структура проекта

### Текущая структура
```
calc-3d/
├── src/
│   ├── application/          ✅ Слой Application присутствует
│   │   ├── DecoriumApp.js
│   │   └── EvaluationService.js
│   ├── domain/               ✅ Слой Domain присутствует
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── ...
│   ├── infrastructure/       ⚠️ Слой Infrastructure минимален
│   │   └── state/
│   │       └── InMemoryItemRepository.js
│   ├── ui/                   ⚠️ Presentation смешан с Infrastructure
│   │   ├── dashboard.js
│   │   ├── feedbackPanel.js
│   │   └── ...
│   ├── items/                ❌ Неясная принадлежность к слою
│   ├── level/                ❌ Неясная принадлежность к слою
│   ├── scene/                ❌ Неясная принадлежность к слою
│   ├── controls/             ❌ Неясная принадлежность к слою
│   └── main.js               ⚠️ Композиционный корень
├── tests/                    ✅ Тесты присутствуют
│   ├── domain/
│   └── application/
├── docs/                     ❌ ОТСУТСТВУЕТ
├── data/                     ❌ ОТСУТСТВУЕТ
└── dist/                     ✅ Production сборка
```

### Критические замечания по структуре

| Проблема |Severity | Описание |
|----------|---------|----------|
| MISSING_DOCS | **CRITICAL** | Полностью отсутствует директория `docs/` |
| MISSING_DATA | **CRITICAL** | Отсутствует директория `data/` с JSON-контентом |
| LAYER_MIXING | **HIGH** | UI-компоненты находятся в `src/ui/` вместо `src/Presentation/UI/` |
| UNCLEAR_LAYERS | **HIGH** | `items/`, `level/`, `scene/`, `controls/` не следуют луковой архитектуре |
| NO_ADR | **CRITICAL** | Отсутствуют Architecture Decision Records |

---

## 2. Соответствие DDD и луковой архитектуре

### 2.1 Domain слой

**✅ Сильные стороны:**
- Value Objects реализованы правильно: `FeatureVector`, `Placement`, `StyleDefinition`
- Value Objects иммутабельны (`Object.freeze`)
- Entity `Item` корректно использует Value Objects
- Domain Services: `StyleScorer`, `ErgonomicsScorer` выделены отдельно
- Repository pattern: `StyleRepository`, `InMemoryItemRepository`
- Domain не зависит от Three.js, DOM, JSON

**⚠️ Проблемы:**
- `domain/state.js` — это mutable state с подписчиками, что нарушает принцип immutability
- `domain/styles.js` содержит hardcoded данные вместо загрузки извне
- `domain/itemCatalog.js` содержит hardcoded ITEM_CATALOG вместо загрузки из JSON
- `domain/repositories/StyleRepository.js` зависит от hardcoded `STYLES`

**❌ Критические нарушения:**
```javascript
// domain/state.js — mutable global state
const items = [];       // Мутируемый массив
let totalVolume = 0;    // Мутируемая переменная
let nextId = 1;         // Мутируемый счётчик

export function addItem(record) {
  record.id = nextId++;  // Мутация!
  items.push(record);    // Мутация!
  totalVolume += record.volume;  // Мутация!
}
```

### 2.2 Application слой

**✅ Сильные стороны:**
- `EvaluationService` оркестрирует доменные сервисы
- `DecoriumApp` — композиционный корень с инъекцией зависимостей
- Application не зависит от инфраструктуры напрямую

**⚠️ Проблемы:**
- `EvaluationService` содержит бизнес-формулы (веса STYLE_WEIGHT, ERGONOMICS_WEIGHT)
- Формула `0.7·стиль + 0.3·эргономика` должна быть в Domain, не в Application

```javascript
// application/EvaluationService.js — бизнес-логика в Application!
const totalScore = STYLE_WEIGHT * styleResult.score + ERGONOMICS_WEIGHT * ergoResult.score;
```

### 2.3 Infrastructure слой

**❌ Критические проблемы:**
- Инфраструктура минимальна: только `InMemoryItemRepository`
- Отсутствуют JSON-репозитории для загрузки данных
- Отсутствует загрузка из внешних источников
- `state.js` фактически является инфраструктурой, но находится в Domain

### 2.4 Presentation слой

**❌ Критические проблемы:**
- Папка `ui/` не следует именованию `Presentation/UI/`
- UI-компоненты импортируют напрямую из domain/application
- Отсутствует разделение на ViewModels/Views/Presenters

```javascript
// ui/dashboard.js — прямой импорт из application
import { evaluate } from '../application/EvaluationService.js';
```

---

## 3. Архитектурные нарушения

### 3.1 Нарушение Dependency Rule

| Нарушение | Файл | Описание |
|-----------|------|----------|
| DOMAIN → INFRASTRUCTURE | `domain/state.js` | Domain содержит инфраструктурный state management |
| APPLICATION → DOMAIN_FORMULAS | `EvaluationService.js` | Application содержит бизнес-формулы |
| PRESENTATION → APPLICATION | `ui/*.js` | UI импортирует напрямую Application сервисы |
| MAIN → EVERYWHERE | `main.js` | main.js импортирует из всех слоев без портов |

### 3.2 God Objects

**❌ Обнаружены:**
- `domain/state.js` — глобальное состояние со всеми операциями
- `main.js` — 243 строки, управляет всем приложением

### 3.3 Смешивание ответственностей

```javascript
// domain/itemCatalog.js — смешивает Domain и Infrastructure
export const ITEM_CATALOG = [ /* hardcoded данные */ ];
// Это должно загружаться из JSON через Infrastructure
```

---

## 4. Тестирование

### 4.1 Покрытие тестами

**✅ Присутствуют:**
- `tests/domain/FeatureVector.test.js` — 4 теста
- `tests/domain/Placement.test.js` — 4 теста
- `tests/domain/StyleScorer.test.js` — 3 теста
- `tests/domain/ErgonomicsScorer.test.js` — 5 тестов
- `tests/application/EvaluationService.test.js` — 3 теста

**Итого:** 19 тестов, все проходят ✅

**❌ Отсутствуют:**
- Integration tests для Infrastructure
- Contract tests для Presentation
- Architecture tests (проверка зависимостей между слоями)
- Golden tests для сценариев оценки
- Tests для Item, StyleDefinition, StyleRepository

### 4.2 Качество тестов

**✅ Сильные стороны:**
- Тесты детерминированные
- Используют AAA паттерн
- Проверяют edge cases

**⚠️ Проблемы:**
- Тесты не привязаны явно к требованиям GDD
- Отсутствуют тесты на violations business rules

---

## 5. Документы

### 5.1 Отсутствующая документация

**❌ CRITICAL:**
```
docs/                          — ОТСУТСТВУЕТ ПОЛНОСТЬЮ
├── mvp/
│   ├── charter.md
│   ├── scope.md
│   ├── acceptance-criteria.md
│   └── ...
├── architecture/
│   ├── overview.md
│   ├── layers.md
│   └── ...
├── adr/
│   ├── 0001-onion-architecture.md
│   └── ...
├── systems/
│   ├── item-catalog.md
│   ├── scoring.md
│   └── ...
└── data-contracts/
    ├── item.schema.json
    └── ...
```

### 5.2 Последствия отсутствия документов

- Невозможно верифицировать соответствие кода требованиям GDD
- Нет явных контрактов между слоями
- Нет документации по вертикальным слайсам
- Нет ADR для архитектурных решений

---

## 6. Данные

### 6.1 Отсутствующие данные

**❌ CRITICAL:**
```
data/                          — ОТСУТСТВУЕТ ПОЛНОСТЬЮ
├── schemas/
│   ├── item.schema.json
│   ├── style.schema.json
│   └── ...
├── items/
│   └── items.json
├── styles/
│   └── scandinavian.json
├── constraints/
│   └── scandinavian-constraints.json
├── levels/
│   └── level-001.json
└── feedback/
    └── client-comments.json
```

### 6.2 Hardcoded данные в коде

**❌ Нарушения:**
- `domain/styles.js` — hardcoded STYLES объект
- `domain/itemCatalog.js` — hardcoded ITEM_CATALOG массив
- `domain/scoringRules.js` — hardcoded константы (допустимо для правил)

---

## 7. Наблюдаемость

### 7.1 Отсутствующая наблюдаемость

**❌ Проблемы:**
- Нет structured logging
- Нет trace_id / request_id
- Нет domain events
- Нет metrics для оценки производительности
- Нет feature flags

---

## 8. Мусор и технический долг

### 8.1 Найденный мусор

**FOUND_TRASH:**
```
Location: domain/state.js
Risk: Нарушает immutability principle, создаёт скрытые зависимости
Recommended follow-up slice: Заменить на immutable repository pattern

Location: main.js (243 строки)
Risk: God object, смешивает все слои
Recommended follow-up slice: Рефакторинг в Composition Root с портами

Location: src/items/, src/level/, src/scene/, src/controls/
Risk: Неясная принадлежность к слоям архитектуры
Recommended follow-up slice: Перераспределить по слоям DDD

Location: src/ui/
Risk: Должно быть src/Presentation/UI/
Recommended follow-up slice: Переименовать и рефакторить
```

### 8.2 Неиспользуемый код

Требуется дополнительный анализ для выявления:
- Неиспользуемых импортов
- Неиспользуемых функций
- Закомментированного кода

---

## 9. Соответствие MVP Scope

### 9.1 Входит в MVP ✅

- [x] Одна комната (реализовано, есть мультикомнатность)
- [x] Размещение предметов
- [x] Перемещение предметов
- [x] Поворот предметов
- [x] Удаление предметов
- [x] Расчёт вектора комнаты
- [x] Расчёт стилевых нарушений
- [x] Расчёт style score
- [x] Расчёт star rating
- [x] Обратная связь

### 9.2 Не входит в MVP ❌

- [ ] Экономика — отсутствует (правильно)
- [ ] Магазин — отсутствует (правильно)
- [ ] Прогрессия — частично реализована (level system)
- [ ] Облачные сохранения — отсутствуют (правильно)
- [ ] LLM-персонализация — отсутствует (правильно)

### 9.3超出 MVP Scope

- [x] Мультикомнатность (apartment system) —超出 MVP
- [x] Персонализация клиента (client persona, tone) —超出 MVP
- [x] Анимации предметов —超出 MVP
- [x] Процедурные декорации —超出 MVP

---

## 10. Детерминированность

### 10.1 RNG

**✅ Правильно:**
- `level/rng.js` — детерминированный RNG с seed
- Персонализация использует seed для воспроизводимости

```javascript
const persona = pickClientPersona(clientId, new Rng(clientId + '·persona'));
```

### 10.2 State Management

**❌ Проблемы:**
- `domain/state.js` — глобальное изменяемое состояние
- Нет явного управления состоянием через Application layer

---

## 11. Сводка нарушений

### Critical (требуется немедленное исправление)

| ID | Нарушение | Impact |
|----|-----------|--------|
| C01 | Отсутствует docs/ | Невозможна верификация требований |
| C02 | Отсутствует data/ | Hardcoded данные в коде |
| C03 | domain/state.js mutable | Нарушение DDD принципов |
| C04 | Отсутствие ADR | Нет документации архитектурных решений |
| C05 | Смешанные слои в src/ | Нарушение Onion Architecture |

### High (требуется исправление в ближайших слайсах)

| ID | Нарушение | Impact |
|----|-----------|--------|
| H01 | EvaluationService содержит бизнес-формулы | Нарушение separation of concerns |
| H02 | UI импортирует напрямую Application | Нарушение dependency rule |
| H03 | Отсутствуют integration tests | Низкое покрытие критических путей |
| H04 | Отсутствуют architecture tests | Нет гарантии соблюдения архитектуры |
| H05 | Hardcoded STYLES и ITEM_CATALOG | Невозможность конфигурации без пересборки |

### Medium (технический долг)

| ID | Нарушение | Impact |
|----|-----------|--------|
| M01 | main.js god object | Сложность тестирования и расширения |
| M02 | Неправильная структура папок | Путаница для новых разработчиков |
| M03 | Отсутствует observability | Сложность отладки в production |
| M04 |超出 MVP функциональность | Увеличение поверхности атаки и поддержки |

---

## 12. Рекомендации

### Приоритет 1: Документация (Phase 0-4)

1. **Создать Slice DOC-001:** Генерация MVP документации
   - `docs/mvp/charter.md`
   - `docs/mvp/scope.md`
   - `docs/mvp/acceptance-criteria.md`

2. **Создать Slice DOC-002:** Генерация архитектурной документации
   - `docs/architecture/overview.md`
   - `docs/adr/0001-onion-architecture.md`

3. **Создать Slice DATA-001:** Создание data schemas
   - `data/schemas/item.schema.json`
   - `data/schemas/style.schema.json`

4. **Создать Slice DATA-002:** Migration hardcoded данных в JSON
   - `data/items/items.json`
   - `data/styles/scandinavian.json`

### Приоритет 2: Рефакторинг архитектуры (Phase 5)

5. **Создать Slice ARCH-001:** Исправление domain/state.js
   - Заменить mutable state на immutable repository pattern
   - Переместить state management в Infrastructure

6. **Создать Slice ARCH-002:** Исправление EvaluationService
   - Переместить бизнес-формулы в Domain
   - Оставить в Application только оркестрацию

7. **Создать Slice ARCH-003:** Рефакторинг структуры папок
   - `src/ui/` → `src/Presentation/UI/`
   - `src/items/` → распределить по слоям
   - `src/level/` → распределить по слоям

### Приоритет 3: Тесты и наблюдаемость (Phase 6)

8. **Создать Slice TEST-001:** Integration tests
   - JSON loading tests
   - Repository integration tests

9. **Создать Slice TEST-002:** Architecture tests
   - Dependency direction tests
   - Layer isolation tests

10. **Создать Slice OBS-001:** Observability
    - Structured logging
    - Domain events

---

## 13. Заключение

**Общая оценка соответствия: 45/100**

**Сильные стороны:**
- ✅ Правильная реализация Value Objects
- ✅ Наличие TDD для Domain слоя
- ✅ Композиционный корень с DI
- ✅ Детерминированный RNG
- ✅ Все текущие тесты проходят

**Критические проблемы:**
- ❌ Полное отсутствие документации
- ❌ Полное отсутствие внешних данных (JSON)
- ❌ Mutable global state в Domain
- ❌ Смешанные слои архитектуры
- ❌ Бизнес-логика в Application слое

**Рекомендация:** Начать с Phase 0 (документация) и Phase 1 (ADR), затем перейти к рефакторингу архитектуры через вертикальные слайсы с соблюдением TDD.

---

## Приложение A: Карта файлов проекта

```
src/
├── application/              # ✅ Application Layer
│   ├── DecoriumApp.js        # Composition Root
│   └── EvaluationService.js  # ⚠️ Содержит бизнес-формулы
│
├── domain/                   # ⚠️ Domain Layer с нарушениями
│   ├── entities/
│   │   └── Item.js           # ✅ Correct Entity
│   ├── value-objects/
│   │   ├── FeatureVector.js  # ✅ Correct VO
│   │   ├── Placement.js      # ✅ Correct VO
│   │   └── StyleDefinition.js # ✅ Correct VO
│   ├── services/
│   │   ├── StyleScorer.js    # ✅ Correct Domain Service
│   │   └── ErgonomicsScorer.js # ✅ Correct Domain Service
│   ├── repositories/
│   │   └── StyleRepository.js # ⚠️ Зависит от hardcoded STYLES
│   ├── state.js              # ❌ Mutable state — должно быть в Infrastructure
│   ├── styles.js             # ❌ Hardcoded данные — должно быть в data/
│   ├── itemCatalog.js        # ❌ Hardcoded данные — должно быть в data/
│   ├── features.js           # ✅ Domain constants (допустимо)
│   ├── scoringRules.js       # ✅ Domain constants (допустимо)
│   ├── feedback.js           # ? Требуется анализ
│   ├── dims.js               # ? Требуется анализ
│   └── stacking.js           # ? Требуется анализ
│
├── infrastructure/           # ⚠️ Minimal Infrastructure
│   └── state/
│       └── InMemoryItemRepository.js # ✅ Correct Repository Adapter
│
├── ui/                       # ❌ Should be Presentation/UI/
│   ├── dashboard.js          # ⚠️ Direct imports from Application
│   ├── feedbackPanel.js      # ? Требуется анализ
│   ├── sizePanel.js          # ? Требуется анализ
│   ├── library.js            # ? Требуется анализ
│   ├── roomTabs.js           # ? Требуется анализ
│   ├── clientBrief.js        # ? Требуется анализ
│   └── evaluateButton.js     # ? Требуется анализ
│
├── items/                    # ❌ Unclear layer归属
│   ├── manager.js
│   ├── factory.js
│   ├── builders.js
│   ├── animation.js
│   └── animated.js
│
├── level/                    # ❌ Unclear layer归属
│   ├── levelLoader.js
│   ├── apartment.js
│   ├── bsp.js
│   ├── palettes.js
│   ├── rng.js                # ✅ Deterministic RNG
│   ├── schema.js
│   ├── task.js
│   └── tone.js
│
├── scene/                    # ❌ Should be Infrastructure/Platform или Presentation/Scene
│   └── renderer.js
│
├── controls/                 # ❌ Should be Presentation/Input
│   └── drag.js
│
└── main.js                   # ⚠️ Composition Root но слишком большой
```

---

*Документ сгенерирован в соответствии со стандартами Qwen Studio Audit Report*
