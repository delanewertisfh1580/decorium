# Item Catalog System

## Status
Draft

## Owner
Qwen Studio Engineering Team

## Purpose
Описать систему каталога предметов для Decorium MVP.

## Scope
Каталог предметов содержит все доступные для размещения предметы с их векторами признаков.

## Inputs
- JSON файл с данными предметов (`data/items/items.json`)
- JSON схема валидации (`data/schemas/item.schema.json`)

## Outputs
- Список объектов `Item` доменного слоя
- Векторы признаков для каждого предмета

## Domain Model

### FeatureVector (Value Object)
```typescript
export class FeatureVector {
  constructor(
    public readonly woodShare: number,        // 0.0-1.0
    public readonly metalShare: number,       // 0.0-1.0
    public readonly glassShare: number,       // 0.0-1.0
    public readonly lightColorShare: number,  // 0.0-1.0
    public readonly warmPaletteShare: number, // 0.0-1.0
    public readonly formSimplicity: number    // 0.0-1.0
  ) {
    this.validate();
  }

  private validate() {
    // Все значения должны быть в диапазоне [0, 1]
  }

  add(other: FeatureVector): FeatureVector {
    // Возвращает сумму векторов
  }

  divide(scalar: number): FeatureVector {
    // Возвращает вектор, делённый на скаляр
  }
}
```

### Item (Entity)
```typescript
export class Item {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly featureVector: FeatureVector
  ) {}

  equals(other: Item): boolean {
    return this.id === other.id;
  }
}
```

## Application Layer

### Ports
```typescript
export interface IItemCatalog {
  loadItems(path: string): Promise<Item[]>;
  getItemById(id: string): Promise<Item | null>;
  getAllItems(): Promise<Item[]>;
}
```

### Use Cases
- Загрузка каталога при старте уровня
- Получение предмета по ID для размещения

## Infrastructure Layer

### JsonItemCatalog
```typescript
export class JsonItemCatalog implements IItemCatalog {
  constructor(
    private schemaValidator: SchemaValidator,
    private fileSystem: FileSystem
  ) {}

  async loadItems(path: string): Promise<Item[]> {
    const json = await this.fileSystem.readJson(path);
    this.schemaValidator.validate(json, itemSchema);
    
    return json.items.map(data => 
      new Item(
        data.id,
        data.name,
        new FeatureVector(
          data.featureVector.wood_share,
          data.featureVector.metal_share,
          data.featureVector.glass_share,
          data.featureVector.lightcolorshare,
          data.featureVector.warmpaletteshare,
          data.featureVector.form_simplicity
        )
      )
    );
  }
}
```

## Data Contract

### Item JSON Format
```json
{
  "items": [
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
  ]
}
```

### JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["items"],
  "properties": {
    "items": {
      "type": "array",
      "items": {
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
    }
  }
}
```

## Rules

1. **Уникальность ID**: Каждый предмет должен иметь уникальный ID
2. **Диапазон признаков**: Все значения вектора должны быть в диапазоне [0, 1]
3. **Сумма материалов**: wood_share + metal_share + glass_share ≈ 1.0 (допускается небольшая погрешность)
4. **Минимальный каталог**: MVP должен содержать 5-10 предметов

## Test Requirements

### Unit Tests
- `FeatureVectorTests`: конструктор, валидация, операции
- `ItemTests`: создание, сравнение
- `JsonItemCatalogTests`: загрузка, валидация, маппинг

### Integration Tests
- Загрузка реального JSON файла
- Валидация по схеме
- Обработка ошибок (невалидные данные, отсутствующий файл)

## Observability

### Logs
- Info: "Loaded N items from catalog"
- Error: "Failed to load item catalog: {reason}"
- Warning: "Item {id} has invalid feature vector"

### Metrics
- `item_catalog_load_time_ms` - время загрузки каталога
- `item_catalog_size` - количество предметов

## Related Documents
- [[Data Contracts]](../data-contracts/)
- [[Scoring System]](./scoring.md)
- [[ADR-003: JSON Content Pipeline]](../adr/adr-003-json-content-pipeline.md)

## Open Questions
- Нужно ли кэшировать загруженный каталог?
- Нужна ли поддержка нескольких каталогов (разные уровни)?

## Change History
| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-01-01 | 0.1 | Qwen Studio | Initial draft |
