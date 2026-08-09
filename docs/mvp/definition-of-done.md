# Decorium MVP Definition of Done

## Status
Draft

## Owner
Qwen Studio Engineering Team

## Purpose
Определить критерии готовности для слайсов и MVP в целом.

## Slice Definition of Done

Каждый вертикальный слайс считается готовым, если выполнены ВСЕ критерии:

### Documentation
- [ ] Карточка слайса создана и заполнена
- [ ] Использованы релевантные документы проекта
- [ ] Извлечены ограничения из документов
- [ ] Документы обновлены после реализации
- [ ] ADR создан если требуется архитектурное решение

### Testing (TDD)
- [ ] Написаны failing tests до production кода
- [ ] Показано падение тестов (evidence)
- [ ] Написан минимальный implementation
- [ ] Показано прохождение тестов (evidence)
- [ ] Выполнен рефакторинг тестов и кода
- [ ] Тесты детерминированы и воспроизводимы
- [ ] Тесты независимы друг от друга
- [ ] Покрыты happy path, edge cases, ошибки

### Code Quality
- [ ] Код следует DDD и луковой архитектуре
- [ ] Нет нарушений dependency rule
- [ ] Нет неиспользуемых импортов
- [ ] Нет мёртвого кода (dead code)
- [ ] Нет закомментированных блоков
- [ ] Нет временных debug-вызовов
- [ ] Нет магических чисел без констант
- [ ] Нет секретов/токенов/ключей
- [ ] Комментарии объясняют "почему", а не "что"

### File Output
- [ ] Все изменённые файлы выданы полностью
- [ ] Нет patch/diff/hunk вывода
- [ ] Нет многоточий вместо кода
- [ ] Новые файлы имеют полный путь и содержимое
- [ ] Удалённые файлы документированы (DELETE FILE)

### Cleanup
- [ ] Удалён мусор в рамках слайса
- [ ] Найденный мусор вне слайса задокументирован (FOUND_TRASH)
- [ ] Нет дублирования кода
- [ ] Нет устаревших TODO/FIXME без ссылок

### Observability
- [ ] Добавлены логи где необходимо
- [ ] Добавлены метрики/события где необходимо
- [ ] Trace IDs / Request IDs где применимо
- [ ] Логи структурированы и полезны

### Risk Management
- [ ] Описаны риски слайса
- [ ] Описан план rollback
- [ ] Feature flag добавлен если требуется

### Architecture Check
- [ ] Domain не зависит от Unity/JSON/UI
- [ ] Application не содержит бизнес-формулы
- [ ] Infrastructure реализует порты
- [ ] Presentation не содержит бизнес-логику
- [ ] Зависимости направлены внутрь

## MVP Definition of Done

MVP считается готовым, если выполнены ВСЕ критерии:

### Functional Completeness
- [ ] Одна комната работает
- [ ] Один стиль (Scandinavian) реализован
- [ ] 5-10 предметов в каталоге
- [ ] 3-5 стилевых ограничений работают
- [ ] Размещение предметов работает
- [ ] Перемещение предметов работает
- [ ] Поворот предметов работает
- [ ] Удаление предметов работает
- [ ] Подтверждение расстановки работает
- [ ] Расчёт вектора комнаты работает
- [ ] Проверка ограничений работает
- [ ] Style Score вычисляется корректно
- [ ] Star Rating определяется по порогам
- [ ] Обратная связь отображается

### Testing
- [ ] Все unit тесты проходят
- [ ] Все integration тесты проходят
- [ ] Golden тесты проходят
- [ ] Coverage Domain > 90%
- [ ] Тесты детерминированы
- [ ] Тесты запускаются в CI

### Documentation
- [ ] MVP Charter создан
- [ ] MVP Scope определён
- [ ] Acceptance Criteria описаны
- [ ] Out of Scope задокументирован
- [ ] Risks идентифицированы
- [ ] Definition of Done определён
- [ ] Architecture Overview описан
- [ ] Системные документы созданы
- [ ] ADR приняты
- [ ] Контракты данных описаны

### Data
- [ ] JSON схемы созданы
- [ ] Seed data подготовлен
- [ ] Данные валидируются по схемам
- [ ] Items загружаются
- [ ] Styles загружаются
- [ ] Constraints загружаются
- [ ] Levels загружаются
- [ ] Feedback messages загружаются

### Code Quality
- [ ] Нет нарушений архитектуры
- [ ] Нет God objects
- [ ] Код следует SOLID
- [ ] Нет critical technical debt
- [ ] Code review проведён

### Performance
- [ ] Расчёт оценки < 100ms
- [ ] FPS >= 30 при взаимодействии
- [ ] Нет memory leaks
- [ ] Загрузка данных < 2s

### User Experience
- [ ] Игрок понимает как размещать предметы
- [ ] Игрок понимает обратную связь
- [ ] Сессия завершается за 2-5 минут
- [ ] Нет блокирующих багов

### Deployment
- [ ] Production сборка работает
- [ ] Инструкции по запуску описаны
- [ ] Зависимости задокументированы
- [ ] Environment variables описаны

## Checklist Templates

### Slice Checklist Template
```markdown
## Slice [ID] DoD Checklist

- [ ] Docs complete
- [ ] Tests written (TDD)
- [ ] Code implemented
- [ ] Refactored
- [ ] Cleanup done
- [ ] Observability added
- [ ] Risks documented
- [ ] Architecture verified
- [ ] Files output complete
```

### MVP Checklist Template
```markdown
## MVP DoD Checklist

- [ ] All slices complete
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Data seed ready
- [ ] Performance acceptable
- [ ] UX validated
- [ ] Ready for deployment
```

## Verification Process

### For Slices
1. Автор слайса проверяет DoD checklist
2. Tech Lead проводит review
3. Тесты запускаются автоматически
4. Архитектура проверяется автоматически (если возможно)
5. Слайс принимается или возвращается на доработку

### For MVP
1. Команда проверяет все slice checklists
2. Проводится интеграционное тестирование
3. Проводится UX тестирование
4. Проводится performance тестирование
5. PO принимает MVP

## Related Documents
- [[MVP Charter]](./charter.md)
- [[MVP Scope]](./scope.md)
- [[MVP Acceptance Criteria]](./acceptance-criteria.md)
- [[Test Policy]](../test-policy.md)

## Change History
| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-01-01 | 0.1 | Qwen Studio | Initial draft |
