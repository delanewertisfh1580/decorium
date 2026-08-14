# PROD-003b — Authored passage-zone ergonomics

**Статус:** Implemented  
**Дата:** 14 августа 2026 г.  
**Срез:** Domain → Application → Infrastructure → Presentation feedback

## Пользовательский результат

Уровни теперь содержат авторские зоны движения. Если предмет перекрывает такую зону, игрок получает отдельную ergonomics-подсказку: **«Освободите входной проход»**. Правило работает вместе с minimum clearance и влияет на уже видимый ergonomics sub-score.

## Контракты

| Контракт | Ответственность |
|---|---|
| `PassageZone` | Immutable authored rectangle: `id`, label, origin, width, depth, weight и feedback key. |
| `PassageZoneEvaluator` | Проверяет 2D-footprint каждого предмета на положительное пересечение с zone rectangle. |
| `SpatialErgonomicsEvaluator` | Объединяет clearance и passage-zone violations в детерминированном порядке. |
| `LevelDTO.ergonomicsRules.passageZones` | Typed zones, гидратированные из level JSON в Application boundary. |
| `ergonomics-passage-zone-free` | Data-driven message key для feedback adapter. |

## Authoring model

`passageZones` использует координаты нижнего левого угла комнаты и представляет прямоугольник в метрах:

```json
{
  "id": "entry-passage",
  "label": "Входной проход",
  "x": 0,
  "z": 1.6,
  "width": 1.0,
  "depth": 1.8,
  "weight": 1.4
}
```

Каждый из трёх shipped levels имеет explicit `entry-passage`. JSON schema запрещает невалидные размеры, отсутствующие label/ID и неописанные поля.

## Evaluation behavior

Для каждой пары `(item, zone)` вычисляется площадь пересечения axis-aligned footprint объекта с authored zone. Если она больше нуля, создаётся violation. Severity равна доле занятой зоны и ограничена единицей. Поворот предмета на 90° учитывается до построения footprint.

Passage zones не блокируют placement. Они создают прозрачное quality signal и сохраняют creative sandbox-поведение игры. Это же правило является единственным production contract для current entry passage: визуальная разметка 3D-сцены, door swing и route planning не скрыты за неявной физикой и остаются будущими отдельными слайсами.

## TDD evidence

| Фаза | Красный тест | Зелёная реализация |
|---|---|---|
| Domain | `PassageZoneEvaluator.test.js`, `SpatialErgonomicsEvaluator.test.js` | Zone value object, evaluator, combined spatial evaluator |
| Application | расширенный `LoadLevelErgonomics.test.js`, `EvaluateRoomErgonomics.test.js` | Hydration zones и передача полного rules bundle |
| Infrastructure | `MvpContent.test.js` | Schema, authored zones всех levels, feedback key |
| Presentation/runtime | `ErgonomicsEvaluationWiring.test.js` | Spatial evaluator в composition root и существующий sub-score feedback path |

## Acceptance criteria

- Zone overlap диагностируется без Three.js, browser state или camera geometry.
- Rotation предмета участвует в overlap check.
- All authored levels поставляют хотя бы одну schema-valid passage zone.
- Runtime объединяет clearance и passage diagnostics в один ergonomics channel.
- Feedback catalog объясняет каждое violation data-driven сообщением.

## Не входит

Door swing, windows, furniture-to-wall spacing, route graph, turn radius, wheelchair turning circle, real-world accessibility certification, 3D zone overlays и automatic pathfinding остаются отдельными, измеримыми vertical slices.
