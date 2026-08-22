# Product overview

**Статус:** Active production vision and current baseline
**Обновлено:** 18 августа 2026 г.

Decorium — браузерная Three.js-игра о проектировании интерьеров **для конкретных заказчиков**. Игрок собирает комнату из authored catalog, размещает и поворачивает предметы, а затем получает детерминированную оценку того, насколько решение отвечает смешению эстетик, личным приоритетам и эргономическим требованиям `ClientBrief`.[1] [2]

> **Product canon:** Decorium — мультистилевая игра. Один стиль не является правилом продукта, а «хороший» интерьер определяется explicit brief заказчика, а не универсальным шаблоном.

## Игровой цикл

| Шаг | Действие игрока | Результат системы |
|---|---|---|
| 1 | Открывает профиль и выбирает заказ/уровень кампании. | Восстанавливаются settings, completed levels и session context. |
| 2 | Читает brief: стили, запросы клиента, сценарии и ограничения. | Hydrated `ClientBrief v2` supplies versioned authored policy; UI displays it without interpretation. |
| 3 | Выбирает, размещает и поворачивает предметы в 3D-комнате. | `RoomState` создаёт canonical stable instance IDs вида `catalogItemId#n`; move, rotate, remove и feedback focus принимают только этот ID, а catalog Item ID используется лишь для поиска всех экземпляров. |
| 4 | Нажимает «Оценить». | Application вычисляет multi-style fit, composition, client-priority satisfaction и spatial ergonomics, затем калибрует scorecard. |
| 5 | Читает результат и уточняет композицию. | UI показывает total score, calibrated stars, три канала, style targets и actionable explanation. |
| 6 | Выполняет условия заказа. | Profile records completion только при `completionEligible`; campaign availability пересчитывается и открывает следующий brief. |

## Production vision: styles and client briefs

Каждый заказ имеет versioned `ClientBrief`, который делает вкусы и ограничения клиента явными authored data. Brief назначает primary/secondary/accent style targets с весами, client priorities с explicit rules, spatial preferences, functional scenarios и completion criteria. Это позволяет поощрять осмысленный eclectic интерьер или нужную компактность комнаты, а не наказывать их за отклонение от скрытого global default.[2] [3]

| Слой policy | Shipped contract | Пример результата |
|---|---|---|
| Style palette | Exact primary/secondary/accent targets with normalized weights. | Скандинавский primary, Japandi secondary и Эклектика accent получают отдельные target scores. |
| Composition blend | Authoritative `0.75/0.25` target-fit/composition blend. | Room-level composition участвует один раз, а не дублируется для каждого стиля. |
| Client priorities | `functional-scenario` или `spatial-preferences` rule with weight and label. | Готовность принять гостей или камерная атмосфера видимо меняет channel «Запросы клиента». |
| Spatial preferences | Fixed-grid occupancy plus authored density/free-area parameters. | Клиент может предпочитать собранную или открытую комнату. |
| Hard completion | `minimumStars` and `criticalRuleMode` in brief policy. | Missing critical scenario caps display stars and blocks completion. |

## Current production baseline

В репозитории существуют три authored levels, три `ClientBrief v2` records, exact profile catalog для Scandinavian, Japandi и Eclectic, а также V4 catalog из 34 предметов с explicit semantic roles и spatial behavior. Level владеет только topology, inventory и presentation reference; immutable `evaluationSpec` гидрирует client identity, style targets, priorities, spatial preferences, composition, ergonomics и completion в Application boundary.[1] [4] [10]

Score имеет три независимых канала: **50% style**, **20% client priorities** и **30% ergonomics**. Style channel сочетает normalized weighted target fit и composition с весами **75% / 25%**. Client-priority channel нормализует положительные weights, а fixed `0.1 m` occupancy grid измеряет free-area ratio без двойного счёта перекрывающихся footprints. `ScorecardCalibrationPolicy` по-прежнему единолично выводит display stars и `completionEligible`; UI не сравнивает stars и не открывает уровни.[5] [6]

`EvaluationExplanation v2` отражает source каждого active diagnostic: style, client priority или ergonomics. Card показывает supplied fact/desired value, severity, authored remediation, exact counterfactual recovery и—если applicable—priority label или live instance focus. Presentation форматирует только эти данные и не выводит policy из label, mesh или category.[6] [7]

V4 catalog отделяет visual footprint от gameplay obstacle policy. Floor furniture, beds, storage и free-standing décor declare floor occupancy/clearance; rugs are floor overlays; wall, ceiling and surface-mounted artifacts are ignored by generic floor diagnostics. Эта классификация authored per item и делает компактность комнаты, passages и будущие functional rules воспроизводимыми без inference from `type` or mesh.[10]

| Текущий уровень | Функциональный сценарий | Клиентский акцент |
|---|---|---|
| `level-001` | Тёплые ужины: 1 `dining-surface` и 2 `dining-seat`. | Готовность принимать гостей; missing critical scenario blocks completion. |
| `level-002` | Камерный медиа-вечер: `lounge-seat`, `view-target` и `coffee-surface`. | Камерная плотность и media comfort могут влиять через brief-owned priority rules. |
| `level-003` | Светлая рабочая студия: `work-surface` и `work-seat`. | Открытость пространства и поддержка focused work оцениваются явно, а не из визуальной догадки. |

## Границы продукта

Decorium является static web-приложением: ему не требуются backend, пользовательский аккаунт, environment variables или внешние API. Контент загружается вместе с приложением, а игровые решения воспроизводимы из authored versioned data и сохранённого `RoomState`.[4] [8]

Cloud sync, multiplayer, платежи, runtime AI-judge, непрозрачная автоматическая расстановка, pathfinding, аудио и native packaging не входят в current baseline. Следующий отдельный production slice — authored level style labels, чтобы presentation использовала content-owned names for every style target; это не изменяет уже активный multi-style brief или V4 semantic catalog pipeline.[9]

## Продуктовые инварианты

1. UI отображает brief и результат, но не вычисляет style fit, priority satisfaction, progression или economy.
2. Игровая оценка детерминированна и объяснима через authored feedback messages.
3. Семантика мебели и её floor participation задаются authored `InteractionProfile` и `SpatialBehavior`, а не названием или visual mesh.
4. Все persisted, content и client-brief contracts имеют schema version и validation boundary.
5. Functional proximity не должна ошибочно наказываться generic clearance rule.
6. Style mixing и client preferences оцениваются только относительно explicit authored policy, а не global default aesthetic.

За структурами данных и authoring workflow обращайтесь к [Content model](../systems/content-model.md); за техническими зависимостями — к [Architecture overview](../architecture/overview.md).

## References

[1]: ../../src/Application/UseCases/LoadLevelUseCase.js "V2 brief hydration"
[2]: ../../src/Domain/Briefs/ClientBrief.js "ClientBrief V2 value object"
[3]: ../../data/briefs/client-briefs.v2.json "Shipped client briefs"
[4]: ../systems/content-model.md "Content model"
[5]: ../../data/scoring/scoring-parameters.json "Scoring parameters V2"
[6]: ../../src/Application/UseCases/EvaluateRoomUseCase.js "Three-channel evaluation"
[7]: ../../src/Presentation/Views/EvaluationView.js "Evaluation result rendering"
[8]: ../architecture/overview.md "Architecture overview"
[9]: roadmap.md "Production roadmap"
[10]: ../../data/items/catalog.v4.json "V4 semantic item catalog"
