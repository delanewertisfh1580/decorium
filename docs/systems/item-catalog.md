# Item Catalog System

## Status
Playable MVP in progress

## Purpose

Описать каталог предметов, который поставляет данные для Domain scoring и Presentation visual builders.

## Canonical data

- `data/items/catalog.v2.json` — объект `{ "items": [...] }`, 33 предмета.
- `data/items/item.v2.schema.json` — JSON Schema V2.
- `data/levels/level-001.json` — 16 предметов, доступных в playable MVP.

Каждый предмет содержит:

```json
{
  "id": "sofa-001",
  "name": "Диван",
  "type": "sofa",
  "dimensions": { "x": 2.0, "z": 0.9 },
  "price": 420,
  "featureVector": {
    "woodShare": 0.2,
    "metalShare": 0.1,
    "glassShare": 0.0,
    "plasticShare": 0.1,
    "textileShare": 0.8,
    "lightColorShare": 0.6,
    "darkColorShare": 0.4,
    "warmPaletteShare": 0.7,
    "saturationLevel": 0.3,
    "formSimplicity": 0.8,
    "roundnessShare": 0.4,
    "rectilinearShare": 0.6,
    "sizeNorm": 0.7,
    "priceNorm": 0.4,
    "lightingFunctionShare": 0.0,
    "storageFunctionShare": 0.0
  }
}
```

## Runtime responsibilities

`JsonItemCatalog`:

1. Загружает `catalog.v2.json` через browser fetch.
2. Валидирует envelope и 16 полей через AJV.
3. Передаёт данные `CatalogValidator`.
4. Создаёт immutable Domain `Item` и `FeatureVector`.
5. Кэширует результат в рамках сессии.

`ItemVisualFactory` (`src/Presentation/Scene`) не меняет Domain item. Он строит процедурный `THREE.Group` по `type`, dimensions и data-driven профилю из `data/visuals/item-visuals.json`. Профиль задаёт `shape`, `material/accent` и, при необходимости, локальный `light`; Domain не знает об этих деталях.

## Playable MVP visual types

- sofa
- chair
- table
- lighting
- storage
- bed
- decor: plant, mirror, rug, clock и vase variants
- profile-specific shapes: `roundTable`, `diningTable`, `lowTable`, `desk`, `wallShelf`, `bookcase`, `cabinet`, `floorLamp`

Все визуальные builders должны:

- сохранять габариты предмета по X/Z;
- иметь origin на полу;
- быть различимыми по силуэту;
- поддерживать selection и ghost-preview;
- не импортироваться в Domain/Application.

## Catalog UX

Карточка предмета должна показывать имя, категорию, dimensions и понятный способ действия. При выборе карточки объект становится ghost-preview; внутри комнаты позиция принимается, а за пределами габаритов подсвечивается красным. Один каталоговый предмет можно добавлять многократно.

## Rules

1. ID уникален.
2. Все 16 признаков находятся в диапазоне [0, 1].
3. `dimensions.x` и `dimensions.z` валидны по V2 schema.
4. Все `level-001.availableItems` существуют в каталоге.
5. В доступном наборе достаточно разных типов, чтобы placement имел визуальное и scoring-разнообразие.

## Test requirements

- AJV schema validation.
- Проверка 16 полей каждого item.
- Проверка ссылок уровня на каталог.
- Проверка builder для каждого type.
- Browser smoke: выбор, ghost-preview, placement и повторное размещение нескольких предметов.
- Проверка профилей: каждый доступный item имеет явный профиль или валидный type-default; `coffeetable-001` остаётся круглым.
