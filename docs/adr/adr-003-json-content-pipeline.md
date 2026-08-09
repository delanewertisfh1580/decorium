# ADR-003: JSON Content Pipeline

## Status
Accepted

## Date
2024-01-01

## Owner
Qwen Studio Engineering Team

## Title
Использовать JSON с валидацией по схемам для загрузки контента

## Context
Контент игры (предметы, стили, ограничения, уровни) должен быть:
- Редактируемым дизайнерами без изменения кода
- Валидируемым на корректность
- Версионируемым вместе с кодом
- Загружаемым runtime

Альтернативы:
- ScriptableObjects (Unity-specific) - отклонено, т.к. Domain не должен зависеть от Unity
- Базы данных - избыточно для MVP
- Хардкод в коде - невозможно редактировать без пересборки

## Decision
Использовать JSON файлы с валидацией по JSON Schema для всего контента.

### Структура данных

```
data/
├── schemas/           # JSON схемы
│   ├── item.schema.json
│   ├── style.schema.json
│   ├── constraint.schema.json
│   └── level.schema.json
├── items/             # Предметы
│   └── items.json
├── styles/            # Стили
│   └── scandinavian.json
├── constraints/       # Ограничения
│   └── scandinavian-constraints.json
├── levels/            # Уровни
│   └── level-001.json
└── feedback/          # Сообщения
    └── client-comments.json
```

### Пример Item JSON

```json
{
  "id": "item-001",
  "name": "Wooden Chair",
  "featureVector": {
    "wood_share": 0.8,
    "metal_share": 0.1,
    "glass_share": 0.0,
    "lightcolorshare": 0.6,
    "warmpaletteshare": 0.7,
    "form_simplicity": 0.5
  }
}
```

### Процесс загрузки

1. Infrastructure читает JSON файл
2. Валидирует по соответствующей схеме
3. Маппит на Domain entities
4. Возвращает через порт Application слою

### Схема валидации

Использовать библиотеку для JSON Schema validation (например, `ajv` для JS).

## Consequences

### Positive
- Дизайнеры могут редактировать контент без кода
- Валидация обнаруживает ошибки рано
- Контент версионируется с кодом
- Domain не зависит от формата хранения

### Negative
- Необходимость поддерживать JSON схемы
- Runtime overhead на валидацию (минимальный)
- Дублирование структур (JSON schema ↔ TypeScript types)

### Neutral
- Требует инструмента для редактирования JSON (VS Code, etc.)
- Необходимо документировать схемы для дизайнеров

## Implementation Details

### JSON Schema Example (item.schema.json)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "name", "featureVector"],
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "featureVector": {
      "type": "object",
      "required": ["wood_share", "metal_share", "glass_share", "lightcolorshare", "warmpaletteshare", "form_simplicity"],
      "properties": {
        "wood_share": { "type": "number", "minimum": 0, "maximum": 1 },
        "metal_share": { "type": "number", "minimum": 0, "maximum": 1 },
        "glass_share": { "type": "number", "minimum": 0, "maximum": 1 },
        "lightcolorshare": { "type": "number", "minimum": 0, "maximum": 1 },
        "warmpaletteshare": { "type": "number", "minimum": 0, "maximum": 1 },
        "form_simplicity": { "type": "number", "minimum": 0, "maximum": 1 }
      }
    }
  }
}
```

### Repository Interface

```typescript
// Application/Ports/IItemCatalog.ts
export interface IItemCatalog {
  loadItems(path: string): Promise<Item[]>;
}

// Infrastructure/Content/JsonItemCatalog.ts
export class JsonItemCatalog implements IItemCatalog {
  async loadItems(path: string): Promise<Item[]> {
    const json = await fs.readFile(path, 'utf-8');
    const data = JSON.parse(json);
    
    // Validate against schema
    const valid = validate(data, itemSchema);
    if (!valid) throw new InvalidDataError();
    
    // Map to domain entities
    return data.map(item => new Item(item.id, item.name, new FeatureVector(...)));
  }
}
```

## Related Documents
- [[Architecture Overview]](../architecture/overview.md)
- [[Layer Responsibilities]](../architecture/layers.md)
- [[Data Contracts]](../data-contracts/)

## Change History
| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-01-01 | 1.0 | Qwen Studio | Initial ADR |
