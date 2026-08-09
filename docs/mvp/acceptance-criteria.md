# Decorium MVP Acceptance Criteria

## Status
Draft

## Owner
Qwen Studio Engineering Team

## Purpose
Определить конкретные критерии приёмки для MVP.

## MVP Acceptance Scenario

### Given
- Уровень level-001 загружен
- Каталог предметов содержит 5-10 предметов с векторами признаков
- Стиль Scandinavian определён с 3-5 ограничениями
- Комната пуста или частично заполнена

### When
- Игрок размещает предметы в комнате
- Игрок перемещает/вращает предметы (опционально)
- Игрок удаляет предметы (опционально)
- Игрок нажимает кнопку "Confirm"

### Then
1. Система вычисляет вектор комнаты:
   - `Vroom = average(Vitems)` для всех размещённых предметов
2. Система проверяет стилевые ограничения:
   - Для каждого ограничения вычисляется нарушение
3. Система вычисляет штраф:
   - `penalty_i = max(0, threshold - value)` для `>=`
   - `penalty_i = max(0, value - threshold)` для `<=`
4. Система вычисляет StyleScore:
   - `StyleScore = 1.0 - normalized(total_penalty)`
   - Диапазон: 0.0 - 1.0
5. Система вычисляет TotalScore:
   - `TotalScore = StyleScore` (для MVP)
6. Система определяет StarRating:
   - 5 звёзд: TotalScore >= 0.9
   - 4 звезды: TotalScore >= 0.7
   - 3 звезды: TotalScore >= 0.5
   - 2 звезды: TotalScore >= 0.3
   - 1 звезда: TotalScore < 0.3
7. Система возвращает EvaluationResult:
   - `score`: число 0.0-1.0
   - `starRating`: целое 1-5
   - `violations`: список нарушений
   - `feedbackMessageIds`: список ID сообщений обратной связи
8. Игрок видит результат и обратную связь

## Functional Acceptance Criteria

### AC-001: Item Placement
**Given:** Каталог предметов загружен  
**When:** Игрок выбирает предмет и размещает в комнате  
**Then:** Предмет отображается в комнате, состояние обновляется

### AC-002: Item Movement
**Given:** Предмет размещён в комнате  
**When:** Игрок перетаскивает предмет  
**Then:** Предмет перемещается, состояние обновляется

### AC-003: Item Rotation
**Given:** Предмет размещён в комнате  
**When:** Игрок вращает предмет  
**Then:** Предмет поворачивается, состояние обновляется

### AC-004: Item Removal
**Given:** Предмет размещён в комнате  
**When:** Игрок удаляет предмет  
**Then:** Предмет исчезает, состояние обновляется

### AC-005: Room Vector Calculation
**Given:** В комнате размещено N предметов с векторами V1...Vn  
**When:** Запрошен расчёт вектора комнаты  
**Then:** Возвращается `Vroom = (V1 + ... + Vn) / N`

### AC-006: Constraint Evaluation
**Given:** Вектор комнаты и набор ограничений  
**When:** Ограничения проверяются  
**Then:** Для каждого ограничения определяется нарушение (если есть)

### AC-007: Style Score Calculation
**Given:** Список штрафов за нарушения  
**When:** Вычисляется StyleScore  
**Then:** Возвращается значение 0.0-1.0

### AC-008: Star Rating
**Given:** TotalScore 0.0-1.0  
**When:** Определяется рейтинг  
**Then:** Возвращается 1-5 звёзд согласно порогам

### AC-009: Feedback Generation
**Given:** Список нарушений  
**When:** Генерируется обратная связь  
**Then:** Возвращаются конкретные сообщения для игрока

### AC-010: Deterministic Behavior
**Given:** Фиксированные входные данные  
**When:** Оценка выполняется多次  
**Then:** Результат одинаковый каждый раз

## Non-Functional Acceptance Criteria

### NF-001: Performance
- Расчёт оценки занимает < 100ms
- FPS не падает ниже 30 при взаимодействии

### NF-002: Testability
- Все доменные функции покрыты unit-тестами
- Тесты детерминированы и воспроизводимы
- Покрытие Domain слоя > 90%

### NF-003: Code Quality
- Нет нарушений архитектуры (Domain не зависит от Unity/JSON)
- Нет dead code
- Нет неиспользуемых импортов
- Код следует SOLID принципам

### NF-004: Documentation
- Все системы задокументированы
- ADR приняты для ключевых решений
- Контракты данных описаны

### NF-005: Data Integrity
- Все JSON данные валидируются по схемам
- Seed data корректно загружается
- Нет магических чисел в коде

## Test Requirements

### Unit Tests Required
- `FeatureVectorTests`
- `ItemTests`
- `RoomVectorCalculatorTests`
- `LinearConstraintTests`
- `StyleConstraintEvaluatorTests`
- `StyleScorerTests`
- `TotalScoreCalculatorTests`
- `StarRatingPolicyTests`

### Integration Tests Required
- `JsonSchemaValidationTests`
- `JsonItemCatalogTests`
- `JsonConstraintCatalogTests`
- `JsonLevelRepositoryTests`
- `HeadlessMvpScenarioTest`

### Golden Tests Required
- Фиксированный уровень + фиксированные предметы → ожидаемый score
- Фиксированные нарушения → ожидаемые feedback messages

## Definition of Done for MVP

Слайс считается готовым, если:
- [ ] Есть карточка слайса
- [ ] Использованы документы
- [ ] Извлечены ограничения
- [ ] Написаны падающие тесты
- [ ] Показано падение тестов
- [ ] Написан минимальный код
- [ ] Показано прохождение тестов
- [ ] Выполнен рефакторинг
- [ ] Удалён мусор
- [ ] Добавлена наблюдаемость
- [ ] Обновлены документы
- [ ] Нет нарушений архитектуры
- [ ] Нет неиспользуемых импортов
- [ ] Нет мёртвого кода
- [ ] Все файлы выданы полностью

MVP считается готовым, если:
- [ ] Все acceptance criteria выполнены
- [ ] Все тесты проходят
- [ ] Документация полная
- [ ] Код соответствует архитектуре
- [ ] Seed data загружается
- [ ] Обратная связь понятна

## Related Documents
- [[MVP Charter]](./charter.md)
- [[MVP Scope]](./scope.md)
- [[Scoring System]](../systems/scoring.md)
- [[Feedback System]](../systems/feedback.md)

## Change History
| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-01-01 | 0.1 | Qwen Studio | Initial draft |
