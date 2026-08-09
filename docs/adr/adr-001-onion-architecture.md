# ADR-001: Onion Architecture

## Status
Accepted

## Date
2024-01-01

## Owner
Qwen Studio Engineering Team

## Title
Использовать луковую архитектуру (Onion Architecture) для проекта Decorium

## Context
Проект Decorium требует:
- Чёткого разделения бизнес-логики и инфраструктурных деталей
- Возможности тестирования доменной логики без внешних зависимостей
- Независимости от фреймворков (Three.js, Vite, etc.)
- Поддерживаемости и расширяемости кода

Ранее проект имел смешанные слои, что приводило к:
- Сложности тестирования
- Нарушению единственной ответственности
- Трудностям при изменении технологий

## Decision
Использовать луковую архитектуру с четырьмя слоями:

1. **Domain** (центр) - бизнес-логика, сущности, правила
2. **Application** - use cases, оркестрация, порты
3. **Infrastructure** - реализация портов, внешние зависимости
4. **Presentation** - UI, отображение, ввод

Зависимости направлены внутрь:
```
Presentation → Application → Domain ← Infrastructure
```

## Consequences

### Positive
- Domain полностью тестируем без моков Three.js/Unity
- Возможность замены инфраструктуры без изменения Domain
- Чёткая ответственность каждого слоя
- Упрощённое понимание кодовой базы
- Поддержка SOLID принципов

### Negative
- Больше файлов и слоёв абстракции
- Требуется дисциплина для соблюдения архитектуры
- Начальные затраты на настройку структуры

### Neutral
- Требует обучения команды
- Необходимость в architecture tests для проверки зависимостей

## Compliance
Все новые файлы должны следовать этой архитектуре. Существующий код должен быть рефакторирован постепенно через вертикальные слайсы.

## Related Documents
- [[Architecture Overview]](../architecture/overview.md)
- [[Layer Responsibilities]](../architecture/layers.md)
- [[Dependency Rule]](./adr-002-domain-without-threejs.md)

## Change History
| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-01-01 | 1.0 | Qwen Studio | Initial ADR |
