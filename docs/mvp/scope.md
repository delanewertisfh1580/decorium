# Decorium MVP Scope

## Status
Draft

## Owner
Qwen Studio Engineering Team

## Purpose
Детализировать границы MVP для команды разработки.

## Functional Scope

### Core Gameplay Loop
1. Игрок выбирает предмет из каталога
2. Игрок размещает предмет в комнате
3. Игрок может перемещать/вращать/удалять предметы
4. Игрок подтверждает расстановку
5. Система оценивает результат
6. Игрок получает обратную связь
7. Игрок может начать заново

### Item System
- Каталог из 5-10 предметов
- Каждый предмет имеет вектор признаков:
  - `wood_share` (0.0-1.0)
  - `metal_share` (0.0-1.0)
  - `glass_share` (0.0-1.0)
  - `lightcolorshare` (0.0-1.0)
  - `warmpaletteshare` (0.0-1.0)
  - `form_simplicity` (0.0-1.0)
- Предметы загружаются из JSON

### Room System
- Одна комната фиксированной конфигурации
- Поддержка размещения N предметов
- Вектор комнаты вычисляется как среднее арифметическое векторов предметов:
  ```
  Vroom = average(Vitems)
  ```

### Style Constraints System
- Один стиль: Scandinavian
- 3-5 линейных ограничений вида:
  - `wood_share >= 0.6`
  - `lightcolorshare >= 0.5`
  - `form_simplicity >= 0.6`
- Штраф вычисляется как:
  ```
  penalty_i = max(0, threshold - value) для >=
  penalty_i = max(0, value - threshold) для <=
  ```

### Scoring System
- StyleScore = 1.0 - normalized(penalties)
- ErgonomicsScore: не реализуется в MVP (заглушка 1.0)
- TotalScore = StyleScore (для MVP)
- StarRating: 1-5 звёзд на основе порогов TotalScore

### Feedback System
- Список нарушений (violations)
- Сообщения обратной связи из предопределённого набора
- Минимальный UI для отображения результата

## Technical Scope

### Architecture
- DDD с луковой архитектурой
- Слои: Domain, Application, Infrastructure, Presentation
- Dependency rule: зависимости направлены внутрь

### Data
- JSON для всех данных (предметы, стили, ограничения, уровни)
- Schema validation для данных
- Seed data для MVP

### Testing
- Unit tests для Domain
- Integration tests для Infrastructure
- Deterministic tests с фиксированными данными
- Golden tests для сценариев оценки

### Platform
- ПК (браузер через WebGL или desktop)
- Vite + Three.js для рендеринга
- Vitest для тестирования

## Out of Scope (Detailed)

### Economy & Progression
- Валюта, цены, покупки
- Опыт, уровни игрока, достижения
- Разблокировка контента

### Content
- Несколько стилей
- Несколько комнат
- Процедурная генерация
- Пользовательский контент

### Features
- Сохранение прогресса
- Загрузка состояний
- Мультиплеер
- Социальные функции

### Polish
- Анимации перехода
- Звуковые эффекты
- Музыка
- Частицы и визуальные эффекты
- Адаптивный UI
- Настройки графики

### External Services
- Аналитика
- Краш-репорты
- Облачные сохранения
- LLM API

## Assumptions
- Игрок знаком с базовыми 3D-контролами
- Комната имеет фиксированные размеры
- Все предметы доступны сразу
- Оценка происходит мгновенно

## Constraints
- Сессия 2-5 минут
- Детерминированное поведение
- Без внешних зависимостей в runtime
- Open source лицензии для всех библиотек

## Related Documents
- [[MVP Charter]](./charter.md)
- [[MVP Acceptance Criteria]](./acceptance-criteria.md)
- [[MVP Out of Scope]](./out-of-scope.md)
- [[Item Catalog System]](../systems/item-catalog.md)
- [[Scoring System]](../systems/scoring.md)

## Change History
| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-01-01 | 0.1 | Qwen Studio | Initial draft |
