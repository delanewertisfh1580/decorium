# Decorium MVP Scope

## Core gameplay loop

1. Bootstrap загружает схемы и JSON-контент.
2. Игрок выбирает предмет из библиотеки.
3. Ghost-object следует за указателем; drag/release или клик по полу размещает предмет внутри комнаты. Пересечения, одинаковые точки и вертикальная укладка разрешены.
4. Размещённый предмет можно перетаскивать; клик по предмету выбирает его, клик по полу остаётся fallback-перемещением. `PageUp/PageDown` меняют высоту выбранного предмета. Камера имеет комфортные distance limits, а стена со стороны внешней камеры мягко просвечивает.
5. `R`/`Q`/кнопка вращает выбранный предмет на 90°; те же клавиши вращают ghost-preview до размещения; `Delete` удаляет его. ПКМ отменяет выделение или ghost placement.
6. `Z`/«Отменить» отменяет последнее placement, move, rotate или delete в текущей сессии.
7. `E`/«Оценить» вычисляет результат и feedback.
8. «Начать заново» очищает in-memory сессию и историю Undo.

## Content

Каталог: `data/items/catalog.v2.json`, 33 предмета, объектный формат `{ items }`. Предмет содержит `id`, `name`, `type`, `dimensions { x, z }`, `price`, `featureVector` из 16 полей.

Уровень: `data/levels/level-001.json`. Доступны 16 предметов из категорий sofa, chair, table, lighting, storage и decor. Начальная расстановка пуста.

Presentation-контракт: `data/visuals/item-visuals.json` задаёт форму, материал и световой профиль предмета отдельно от Domain-данных. `ItemVisualFactory` остаётся rich-detail процедурным renderer-ом с отдельными builders для мебели и декора, но не содержит каталоговых исключений в логике игры; например, `coffeetable-001` явно имеет форму `roundTable`, а vase/clock имеют собственные shapes.

HUD-контракт: `src/Presentation/UI/hudLayout.js` задаёт scene-first компоновку. Каталог работает как компактный горизонтальный inventory-dock, room summary — как небольшой статус в верхнем углу, а действия — как нижний action-dock. На узких viewport-ах зоны переходят в нижнюю thumb-friendly раскладку с учётом safe area.

Слой живой сцены (`SceneLifeSystem` + `LocationEnvironmentSystem`) добавляет только визуальные сигналы: animated TV screen с content blocks/bars/scanlines/glow, локальный свет, частицы, фасад дома, тротуар, дорогу, фонари, двух пешеходов с естественным шагом рук/ног, две машины с независимым от FPS вращением колёс, пробегающее животное с gait и хвостом, интерьерные бытовые детали и второго питомца. Пол комнаты — спокойная matte-warm поверхность без debug grid. Сцена не объясняет результат оценки постоянными текстовыми плашками; все причины и успехи показывает Evaluation UI.

Стиль и правила: `data/styles/scandinavian.json` и пять ограничений в `data/constraints/scandinavian-constraints.json`.

## Scoring

Вектор комнаты — среднее векторов размещённых предметов. Нарушения `gte/lte` получают severity-разницу; severity умножается на weight. Дополнительно `CompositionEvaluator` применяет требования уровня из `compositionRules`: минимум 4 предмета и роли seating/surface/lighting. Это не блокирует размещение, но незавершённая композиция снижает итоговый penalty/score. Общий penalty ограничен `maxPenalty = 1`. Итоговый score: `1 - penalty`.

Пороги задаются JSON, а не хардкодом: 0.40, 0.56, 0.71 и 0.86. Пустая комната до начала игры отображает 0 звёзд. Одна стилистически подходящая мебель не считается решённой задачей и получает feedback о недостающей композиции.

## Architecture

DDD/Onion слои: `Domain`, `Application`, `Infrastructure`, `Presentation`. Точка сборки зависимостей — `src/main.js`; состояние текущей комнаты — `InMemoryRoomRepository`.

## Verification

```bash
npm ci
npm test
npm run build
```

## Out of scope

Сохранения, backend/auth, экономика, прогрессия, дополнительные комнаты/стили, числовой ergonomics score, аудио, LLM, аналитика и multiplayer. Mobile/touch gameplay остаётся out of scope; UI-VIS-001 только адаптирует HUD-layout к узким viewport-ам и safe area.
