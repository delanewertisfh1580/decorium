# UI-VIS-003 — Expressive Item Visuals

## Status
COMPLETED

## Requirement

Предметы в Three.js-сцене должны быть выразительными и читаемыми без внешних asset-пакетов. Процедурный renderer должен использовать data-driven visual profiles, а selection/ghost feedback — отдельный визуальный слой, не меняющий Domain или scoring.

## Acceptance criteria

- [x] Все основные shape profiles строятся отдельными builders: sofa, chair, dining/round/low table, desk, lamps, storage, bed, plant, mirror, rug, vase, clock и decor.
- [x] Каждый созданный предмет имеет `detailLevel: rich` и не менее пяти визуальных parts.
- [x] Мебель получила вторичные детали: cushions, seams, rails, handles, shelves, books, inlays, trim и feet.
- [x] Декор получил отдельные визуальные модели: листья растения, отражение зеркала, узор ковра, lathe-ваза и часы со стрелками.
- [x] Круглый журнальный столик остаётся круглым и получает edge/inlay/column/base.
- [x] Явные `vase` и `clock` profiles больше не сваливаются в общий decor fallback.
- [x] Selection использует отдельный `selection-halo`, который не участвует в raycast.
- [x] Ghost valid/invalid и selected states используют отдельные цветовые/эмиссive feedback states.
- [x] Тонкие mirror/shelf/bookcase сохраняют прозрачные hit proxies.
- [x] Профили остаются presentation-only JSON-контрактом; `RoomState`, placement rules и scoring не изменены.

## Implementation

Основная реализация находится в `src/Presentation/Scene/ItemVisualFactory.js`. Factory создаёт детализированные процедурные группы из Three.js primitive geometry и помечает видимые части как `item-part`. Корневая группа сообщает `visualShape`, `detailLevel` и `detailCount` для deterministic validation.

`data/visuals/item-visuals.json` по-прежнему выбирает shape/material/light profile. Для обычных table items default shape закреплён как `diningTable`, поэтому generic `table` не теряется в decor builder.

`selection-halo` — отдельный `MeshBasicMaterial` с отключённым raycast. Его цвет и opacity меняются вместе с feedback state, поэтому placement status читается не только по цвету объекта.

## TDD evidence

```text
npm test -- tests/Presentation/ItemVisualFactory.test.js
✓ 1 file, 4 tests passed

npm test
✓ 29 files, 170 tests passed

npm run build
✓ production build passed
```

## Manual QA checklist

1. Открыть сцену в браузере и выбрать по очереди sofa, chair, table, lamp, shelf, bed, plant, mirror, rug, vase и clock.
2. Проверить, что у мебели читаются вторичные детали: подушки, ножки, ручки, книги, обводки и вставки.
3. Выбрать предмет и убедиться, что появляется мягкий halo без изменения положения камеры.
4. Создать ghost-preview, повернуть его и проверить valid/invalid feedback.
5. Проверить, что тонкие mirror/shelf выбираются кликом по стабильной hit-зоне.
6. Включить `prefers-reduced-motion` и убедиться, что feedback не создаёт агрессивных вспышек.

## Known limitation

Внешние фототекстуры и artist-authored GLTF assets не добавлялись: текущий MVP должен оставаться самодостаточным и не требовать внешнего asset hosting. Следующий visual pass может заменить отдельные procedural builders на оптимизированные GLTF, сохранив этот profile contract.
