# Предложение: функционально-связная оценка планировки

**Статус:** Design proposal — без изменения production logic
**Дата:** 14 августа 2026 г.
**Цель:** дополнить стиль и проходы детерминированной оценкой того, могут ли предметы образовывать реалистичные функциональные зоны.

## Резюме

Текущая оценка верно обнаруживает пересечение проходов, но ошибочно использует один минимум `0.9 m` для **каждой** пары предметов. Поэтому стул, придвинутый к обеденному столу, получает тот же штраф, что шкаф, перекрывающий проход. Система видит только расстояние между прямоугольными footprint, а не назначение, сторону доступа, направление мебели или отношения между предметами.

> **Ключевое изменение:** заменить универсальное правило «предметы должны быть далеко» на модель из трёх независимых понятий: **коллизия и циркуляция**, **функциональная близость**, **доступ к предмету**.

## Диагностика текущей реализации

| Текущий компонент | Что он делает корректно | Почему этого недостаточно |
|---|---|---|
| `ClearanceEvaluator` | Измеряет edge-to-edge gap между footprints с учётом поворота. | Применяет одинаковый порог ко всем парам, не знает type, front, usable side или функциональную роль. Стул рядом со столом трактуется как закрытый проход. |
| `PassageZoneEvaluator` | Проверяет пересечение furniture и authored passage zones. | Не описывает, может ли игрок пользоваться столом, диваном или экраном. Это должен оставаться отдельный circulation signal. |
| `CompositionEvaluator` | Проверяет наличие грубых ролей `seating`, `surface`, `lighting` и minimum item count. | Не проверяет, связаны ли роли пространственно: стол может быть без стула, журнальный столик — в углу, диван — спиной к экрану. |
| Item catalog v2 | Содержит id, type, dimensions и feature vector. | В нём нет affordances, front direction, usable sides, capacity или правил связи. Domain не может вывести их по имени предмета. |
| `ErgonomicsScorer` | Детерминированно переводит violations в penalty. | Он не различает blocked circulation и missing functionality; новый тип нарушения нельзя просто добавить в общий список без явной балансировки. |

В level schema сейчас существуют только `minimumClearance` и `passageZones`. Следовательно, нужного authored contract для близости, facing и seat-to-table pairing также нет.

## Целевая модель: Functional Layout Graph

Каждый room state порождает **граф функциональных связей**. Вершины — placed items. Рёбра — доказанные пространственные отношения с explainable facts: расстояние между релевантными сторонами, угловая ошибка, свободность access envelope и item IDs.

| Слой | Вопрос | Пример положительного результата | Пример нарушения |
|---|---|---|---|
| Safety / collision | Не пересекаются ли physical footprints? | Стул не заходит под geometry стола. | Диван пересекает журнальный столик. |
| Circulation | Свободны ли authored проходы и обязательные зоны движения? | Нет мебели в entry passage. | Шкаф перекрывает вход. |
| Functional adjacency | Нужные предметы образуют рабочую пару/группу? | Стул стоит у usable side dining table. | Обеденный стол не имеет места для сидения. |
| Access envelope | Можно ли физически использовать предмет? | За стулом достаточно pull-back zone. | Стул у стола есть, но его нельзя отодвинуть из-за стены/дивана. |
| Orientation / sightline | Ориентированы ли предметы друг к другу по назначению? | Диван front-facing к TV/display target. | Диван обращён от экрана или поставлен экраном за спиной. |

Эта модель не требует скрытого AI inference. Все решения детерминированы из сохранённого room state, rotation, item metadata и versioned authored rules.

## Контракты content и Domain

### 1. Catalog capabilities: `item.v3`

Вместо inference по `name` каждый catalog item получает immutable `interactionProfile`. Это не score rule, а декларация того, что предмет **может** делать.

```json
{
  "schemaVersion": 3,
  "id": "chair-001",
  "type": "chair",
  "interactionProfile": {
    "frontAxis": "positiveZ",
    "affordances": ["dining-seat"],
    "capacity": 1,
    "accessEnvelopes": [
      { "id": "pull-back", "anchor": "back", "depth": 0.55, "widthFactor": 1.0 }
    ]
  }
}
```

Для dining table profile объявляет `dining-surface` и usable sides. Для sofa — `lounge-seat`, `frontAxis` и front-facing view. Для coffee table — `coffee-surface`. Для TV/display — `view-target` и front-facing audience zone. Schema v2 и v3 должны сосуществовать только через explicit migration/default policy; нет silent inference по `type` или русскому названию.

### 2. Authored level rules: `functionalLayoutRules`

Уровень решает, **какие** отношения требуются именно здесь. Catalog отвечает только за возможности. Это исключает hard-code «все table всегда dining».

```json
{
  "ergonomicsRules": {
    "functionalLayoutRules": [
      {
        "schemaVersion": 1,
        "id": "dining-table-seating",
        "kind": "adjacency",
        "anchorSelector": { "affordance": "dining-surface" },
        "partnerSelector": { "affordance": "dining-seat" },
        "minPartners": 2,
        "distance": { "min": 0.05, "max": 0.35 },
        "facing": { "required": true, "maxAngleDegrees": 35 },
        "weight": 1.2,
        "messageKey": "functional-dining-seat-required"
      },
      {
        "schemaVersion": 1,
        "id": "lounge-coffee-table",
        "kind": "adjacency",
        "anchorSelector": { "affordance": "lounge-seat" },
        "partnerSelector": { "affordance": "coffee-surface" },
        "minPartners": 1,
        "anchorSide": "front",
        "distance": { "min": 0.25, "max": 0.7 },
        "facing": { "required": false },
        "weight": 0.8,
        "messageKey": "functional-coffee-table-front"
      },
      {
        "schemaVersion": 1,
        "id": "sofa-faces-display",
        "kind": "facing",
        "anchorSelector": { "affordance": "lounge-seat" },
        "partnerSelector": { "affordance": "view-target" },
        "minPartners": 1,
        "maxAngleDegrees": 40,
        "weight": 1.0,
        "messageKey": "functional-seating-faces-display"
      }
    ]
  }
}
```

Значения расстояний здесь — authoring calibration inputs, а не непроверяемые universal facts. Они проходят playtest для размеров конкретных assets/rooms и могут различаться между уровнями.

### 3. Pure Domain geometry

Появляется набор tested, reusable primitives:

- `OrientedFootprint`: rotated local axes, front/back/left/right edges;
- `AccessEnvelope`: oriented rectangle outward from authored anchor side;
- `FunctionalLink`: compatible anchor-partner relation with distance/facing facts;
- `FunctionalLayoutEvaluator`: deterministic candidate generation, matching и violations;
- `FunctionalLayoutRule`: validates versioned rule data and selectors.

Для одной rule evaluator строит candidates, сортирует по stable tuple `(distance, angleError, itemId)` и выбирает maximum-cardinality/minimum-cost matching. Один chair не сможет одновременно засчитать два table, а один coffee table — все sofa. Порядок items в room state не влияет на результат.

## Как корректно обработать стул у стола

Успешно matched pair `dining-seat ↔ dining-surface` получает **narrow adjacency corridor**, а не exemption от физики:

1. Footprints по-прежнему не могут пересекаться.
2. Chair front должен находиться у usable side table и проходить direction/facing rule.
3. Для этого exact pair global `minimumClearance` не применяется как passage rule.
4. Pull-back `AccessEnvelope` позади стула оценивается отдельно; он не должен пересекать wall, furniture или authored passage zone.
5. Незамещённые proximity pairs сохраняют обычную circulation/collision оценку.

Именно это отличает «стул стоит у стола» от «стул зажат между столом и шкафом».

## Scoring и отсутствие double counting

Нельзя просто смешать functional violations с текущими clearance violations: одно и то же плохое размещение получило бы несколько непрозрачных штрафов. Рекомендуется сохранить верхний `style 70% / spatial 30%` contract в первом релизе и декомпозировать spatial channel явно:

| Spatial sub-score | Вес внутри spatial | Источники |
|---|---:|---|
| Safety & circulation | 40% | Footprint collision, passage zones, non-matched clearance. |
| Functional relationships | 45% | Missing dining seating, coffee-table placement, facing/sightline. |
| Access usability | 15% | Pull-back, cabinet/service and other functional access envelopes. |

Отдельный `SpatialScoreAggregator` должен получить already-deduplicated diagnostics. Hard collisions остаются high severity. Functional absence — значимый, но не catastrophic penalty. UI должен показывать sub-scores и конкретную actionable message, например: «Добавьте два стула к свободным сторонам обеденного стола» или «Разверните диван лицевой стороной к экрану».

## Presentation и explainability

Presentation не вычисляет relations. Она получает Domain diagnostics и визуализирует их:

- зелёная связь между предметами, если relation засчитан;
- янтарная access envelope, если предмет связан, но им нельзя пользоваться;
- красный passage/collision zone;
- preview affordance при selection: игрок видит полезные стороны table/sofa до placement;
- feedback всегда содержит `ruleId`, affected item IDs, expected relationship и next action.

Это превращает score из «магического штрафа за расстояние» в обучающий инструмент дизайна.

## Последовательность TDD vertical slices

| Slice | Scope | Acceptance criterion |
|---|---|---|
| `PROD-009a` | Item semantic profiles v3, JSON schema, migration/content validation, Domain `FunctionalLayoutRule`. | Невалидный/missing capability contract не загружается молча; v2 compatibility explicit. |
| `PROD-009b` | Oriented geometry + deterministic dining seat-to-table matching. | Стул у usable side table засчитывается и не получает pairwise passage penalty; overlap и blocked pull-back penalized. |
| `PROD-009c` | Coffee table front-of-sofa rule и access envelope diagnostics. | Coffee table впереди lounge seating засчитывается; table behind/too distant не засчитывается. |
| `PROD-009d` | Sofa-to-display facing/sightline rules. | Sofa front-facing display засчитывается; back-to-display имеет explainable violation. |
| `PROD-009e` | Spatial score aggregation, UI overlays/messages, authored level calibration and browser E2E. | Score is deterministic, feedback explainable, target rooms pass/fail according to reviewed fixtures. |

## Рекомендованный первый слайс

Начинать с **PROD-009a + PROD-009b: dining seating**. Он закрывает самый болезненный ложный штраф, проверяет весь new contract path и создаёт usable primitives. Coffee-table и TV rules нельзя добавлять в тот же слайс: им нужны иные affordances, orientation semantics и calibration fixtures.

## Definition of Done для первого implementation slice

1. У item/level content есть explicit schema versions; нет parsing semantics из `name`.
2. Room with table + correctly positioned chair passes functional adjacency and retains accessible pull-back zone.
3. Same chair/table pair cannot suppress collision, passage block or access violation.
4. One chair cannot satisfy two tables; result stable under item order permutation.
5. Existing levels preserve behaviour until authored `functionalLayoutRules` are added deliberately.
6. Full TDD suite, production build, audit, authored JSON validation и browser fixture verification зелёные.

## Решение

Рекомендую не «ослаблять minimum clearance». Это лишь заменит false negatives на furniture collisions. Нужна отдельная, versioned и authored **functional-layout graph** система: она позволит награждать осмысленную близость, штрафовать отсутствие связей, сохранять реальные проходы и объяснять игроку каждое решение оценки.
