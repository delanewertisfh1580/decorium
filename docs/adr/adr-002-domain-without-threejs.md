# ADR-002: Domain Without Three.js

## Status
Accepted

## Date
2024-01-01

## Owner
Qwen Studio Engineering Team

## Title
Domain слой не должен зависеть от Three.js или любого движка рендеринга

## Context
Для обеспечения тестируемости и независимости бизнес-логики необходимо исключить зависимости от графических библиотек в Domain слое.

Проблемы при смешивании:
- Невозможность headless тестирования
- Зависимость тестов от наличия WebGL контекста
- Сложность мокирования в unit тестах
- Нарушение принципа единственной ответственности

## Decision
Domain слой НЕ должен:
- Импортировать `three` или любые Three.js модули
- Использовать типы `THREE.Mesh`, `THREE.Vector3`, `THREE.Quaternion`
- Знать о сценах, камерах, рендерерах
- Содержать логику рендеринга

Вместо этого:
- Использовать собственные value objects (`FeatureVector`, `RoomVector`)
- Использовать простые координаты (plain objects или arrays)
- Выносить маппинг в Infrastructure/Presentation слои

### Пример правильного подхода

**Domain (правильно):**
```typescript
export class PlacedItem {
  constructor(
    public readonly itemId: string,
    public readonly position: { x: number; y: number; z: number },
    public readonly rotation: { x: number; y: number; z: number; w: number }
  ) {}
}
```

**Infrastructure (маппинг на Three.js):**
```typescript
export function toThreeJsMesh(placedItem: PlacedItem): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(placedItem.position.x, placedItem.position.y, placedItem.position.z);
  mesh.quaternion.set(placedItem.rotation.x, placedItem.rotation.y, placedItem.rotation.z, placedItem.rotation.w);
  return mesh;
}
```

## Consequences

### Positive
- Domain тестируется без Three.js
- Быстрые unit тесты
- Возможность замены Three.js на другую библиотеку
- Чёткое разделение ответственности

### Negative
- Необходимость маппинга между domain и Three.js объектами
- Дублирование структур данных (domain position vs THREE.Vector3)

### Neutral
- Требует дисциплины при ревью кода
- Необходимость в architecture tests

## Validation
Architecture tests должны проверять:
- Domain файлы не импортируют `three`
- Domain файлы не используют типы Three.js
- Domain файлы не зависят от Presentation/Infrastructure

## Related Documents
- [[Architecture Overview]](../architecture/overview.md)
- [[Layer Responsibilities]](../architecture/overview.md)
- [[ADR-001: Onion Architecture]](./adr-001-onion-architecture.md)

## Change History
| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-01-01 | 1.0 | Qwen Studio | Initial ADR |
