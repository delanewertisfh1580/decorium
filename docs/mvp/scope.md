# Decorium MVP Scope

## Core gameplay loop

1. Bootstrap загружает схемы и JSON-контент.
2. Игрок выбирает предмет из библиотеки.
3. Ghost-object следует за указателем; drag/release или клик по полу размещает предмет внутри комнаты. Пересечения, одинаковые точки и вертикальная укладка разрешены.
4. Размещённый предмет можно перетаскивать; клик по предмету выбирает его, клик по полу остаётся fallback-перемещением. `PageUp/PageDown` меняют высоту выбранного предмета.
5. `R`/кнопка вращает выбранный предмет на 90°; `Delete` удаляет его.
6. `E`/«Оценить» вычисляет результат и feedback.
7. «Начать заново» очищает in-memory сессию.

## Content

Каталог: `data/items/catalog.v2.json`, 33 предмета, объектный формат `{ items }`. Предмет содержит `id`, `name`, `type`, `dimensions { x, z }`, `price`, `featureVector` из 16 полей.

Уровень: `data/levels/level-001.json`. Доступны 16 предметов из категорий sofa, chair, table, lighting, storage и decor. Начальная расстановка пуста.

Presentation-контракт: `data/visuals/item-visuals.json` задаёт форму, материал и световой профиль предмета отдельно от Domain-данных. `ItemVisualFactory` остаётся процедурным renderer-ом, но не содержит каталоговых исключений в логике игры; например, `coffeetable-001` явно имеет форму `roundTable`.

Слой живой сцены (`SceneLifeSystem`) добавляет только визуальные и нарративные сигналы: animated TV screen, локальный свет, питомца, частицы и маркеры проходов. Он не меняет RoomState и не превращает эргономику в блокирующее правило.

Стиль и правила: `data/styles/scandinavian.json` и пять ограничений в `data/constraints/scandinavian-constraints.json`.

## Scoring

Вектор комнаты — среднее векторов размещённых предметов. Нарушения `gte/lte` получают severity-разницу; severity умножается на weight, общий penalty ограничен `maxPenalty = 1`. Итоговый style score: `1 - penalty`.

Пороги задаются JSON, а не хардкодом: 0.40, 0.56, 0.71 и 0.86. Пустая комната до начала игры отображает 0 звёзд.

## Architecture

DDD/Onion слои: `Domain`, `Application`, `Infrastructure`, `Presentation`. Точка сборки зависимостей — `src/main.js`; состояние текущей комнаты — `InMemoryRoomRepository`.

## Verification

```bash
npm ci
npm test
npm run build
```

## Out of scope

Сохранения, backend/auth, экономика, прогрессия, дополнительные комнаты/стили, числовой ergonomics score, аудио, LLM, аналитика, multiplayer и mobile/touch controls.
