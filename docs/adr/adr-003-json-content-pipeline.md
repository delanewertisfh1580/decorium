# ADR-003: JSON Content Pipeline

## Status
Accepted — implemented

## Decision

Контент MVP хранится в versioned JSON и загружается в браузере через Infrastructure loaders. Item catalog и level валидируются AJV по JSON Schema до создания игровой сессии.

## Canonical files

```text
data/
├── items/catalog.v2.json
├── items/item.v2.schema.json
├── schemas/level.schema.json
├── styles/scandinavian.json
├── constraints/scandinavian-constraints.json
├── feedback/scandinavian-feedback.json
├── scoring/scoring-parameters.json
└── visuals/item-visuals.json
```

### Item V2

`catalog.v2.json` имеет формат `{ "items": [...] }`. Каждый item содержит `id`, `name`, `type`, `dimensions`, `price` и `featureVector` с 16 camelCase-полями из `FeatureVector.REQUIRED_FIELDS`.

### Level

`level-001.json` содержит `id`, `name`, `styleId`, `roomDimensions`, `availableItems`, `initialPlacement` и `targetScore`. На старте доступен один уровень.

## Loading flow

1. `src/main.js` загружает item/level schemas и scoring parameters.
2. `JsonItemCatalog` валидирует каталог AJV и маппит его через `CatalogValidator` в `Item`/`FeatureVector`.
3. `JsonLevelRepository` валидирует уровень AJV.
4. Constraint/style/feedback loaders загружают локальные JSON.
5. `LoadLevelUseCase` собирает `LevelDTO` и `RoomState`.

## Consequences

Контент редактируется без изменения Domain-кода и поставляется вместе со статическим приложением. Presentation-профили в `visuals/item-visuals.json` также меняются независимо от Domain: они выбирают форму, материал и локальный свет procedural builder-а. MVP не требует filesystem API, backend, database или environment variables. Схемы и loaders должны обновляться вместе с контрактом V2; legacy 8-field format не является runtime-контрактом.
