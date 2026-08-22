# Product overview

**Статус:** Active production vision and current baseline
**Обновлено:** 22 августа 2026 г.

Decorium — браузерная Three.js-игра о проектировании интерьеров **для конкретных заказчиков**. Игрок собирает комнату из authored catalog, размещает и поворачивает предметы, а затем получает детерминированную оценку того, насколько решение отвечает смешению эстетик, личным приоритетам и эргономическим требованиям `ClientBrief`.[1] [2]

> **Product canon:** Decorium — мультистилевая игра. Один стиль не является правилом продукта, а «хороший» интерьер определяется explicit brief заказчика, а не универсальным шаблоном.

## Игровой цикл

| Шаг | Действие игрока | Результат системы |
|---|---|---|
| 1 | Открывает главное меню и выбирает продолжение, authored campaign или endless order. | Campaign cards получают unlock/completion status из Application; endless открывает явный seed flow. |
| 2 | В кампании выбирает доступный authored brief; в endless запускает новый или повторяемый unsigned seed. | Campaign восстанавливает profile+level design. Endless детерминированно создаёт версию комнаты, brief и baseline из V1 blueprint + seed. |
| 3 | Читает brief: стили, запросы клиента, сценарии и ограничения. | Hydrated `ClientBrief v3` supplies versioned authored policy; UI displays it without interpretation. |
| 4 | Выбирает, размещает, поворачивает и настраивает предметы/поверхности в 3D-комнате. | `RoomState` создаёт canonical stable instance IDs вида `catalogItemId#n`; move, rotate, remove, variant configuration и feedback focus принимают только этот ID. Color/material/size выбираются только из unlocked authored V5 variants. |
| 5 | Нажимает «Оценить», читает результат и уточняет композицию. | Application вычисляет multi-style fit, composition, client-priority satisfaction и spatial ergonomics; UI показывает calibrated scorecard и actionable explanation. |
| 6 | Выполняет кампанийный заказ либо продолжает endless challenge. | Только eligible **campaign** completion идемпотентно выдаёт authored rewards и открывает следующий content. Endless results ничего не меняют в progression или campaign persistence. |

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

В репозитории существуют три authored Level V2, три `ClientBrief v3` records, exact profile catalog для Scandinavian, Japandi и Eclectic, а также V5 catalog из 34 предметов с explicit semantic roles, spatial behavior и discrete authored variants. Level владеет topology, available catalog subset, recipe baseline, surface defaults, ClientBrief и V3 presentation reference; immutable `evaluationSpec` гидрирует client identity, style targets, priorities, spatial preferences, composition, ergonomics, typed functional satisfaction policy и completion в Application boundary.[1] [4] [10]

Score имеет три независимых канала: **50% style**, **20% client priorities** и **30% ergonomics**. Style channel сочетает normalized weighted target fit и composition с весами **75% / 25%**; room feature vector uses capped square-root footprint influence (`sqrt(x × z / 1 m²)`, clamped `0.5–2.0`) for every placed visual instance, with applied contributions returned in the evaluation result. Client-priority channel нормализует положительные weights; functional scenarios use demand-weighted unit coverage while separate critical scenario completion remains hard-gated. Fixed `0.1 m` occupancy grid измеряет free-area ratio без двойного счёта перекрывающихся footprints. `ScorecardCalibrationPolicy` по-прежнему единолично выводит display stars и `completionEligible`; UI не сравнивает stars и не открывает уровни.[5] [6]

`EvaluationExplanation v2` отражает source каждого active diagnostic: style, client priority или ergonomics. Card показывает supplied fact/desired value, severity, authored remediation, exact counterfactual recovery и—если applicable—priority label или live instance focus. Presentation форматирует только эти данные и не выводит policy из label, mesh или category.[6] [7]

Semantic catalog contract отделяет visual footprint от gameplay obstacle policy. Floor furniture, beds, storage и free-standing décor declare floor occupancy/clearance; rugs are floor overlays; wall, ceiling and surface-mounted artifacts are ignored by generic floor diagnostics. Эта классификация authored per item и делает компактность комнаты, passages и будущие functional rules воспроизводимыми без inference from `type` or mesh.[10]

| Текущий уровень | Функциональный сценарий | Клиентский акцент |
|---|---|---|
| `level-001` | Тёплые ужины: 1 `dining-surface` и 2 `dining-seat`. | Готовность принимать гостей; missing critical scenario blocks completion. |
| `level-002` | Камерный медиа-вечер: `lounge-seat`, `view-target` и `coffee-surface`. | Камерная плотность и media comfort могут влиять через brief-owned priority rules. |
| `level-003` | Светлая рабочая студия: `work-surface` и `work-seat`. | Открытость пространства и поддержка focused work оцениваются явно, а не из визуальной догадки. |

## Границы продукта

Decorium является static web-приложением: ему не требуются backend, пользовательский аккаунт, environment variables или внешние API. Контент загружается вместе с приложением, а игровые решения воспроизводимы из authored versioned data, profile-scoped browser-local design snapshot и сохранённого `RoomState`. Любой интерьерный предмет внутри комнаты — catalog instance, а floor/wall — player-owned surface slot; V3 environment оставляет неуправляемыми только shell/exterior/atmosphere.[4] [8]

Campaign и endless имеют разные persistence boundaries. Campaign design привязан к `profileId + levelId`, а кнопка «Продолжить» ссылается только на последний authored level. Endless identity имеет вид `endless-{seed}`; run materializes только в runtime scope, reset возвращает generated baseline, а завершение, rewards, unlocks и campaign design никогда не записываются.

Cloud sync, multiplayer, платежи, runtime AI-judge, непрозрачная автоматическая расстановка, pathfinding, аудио и native packaging не входят в current baseline. Initial layout не является opaque automation: campaign materializes из reviewable interior recipe, endless materializes из reviewable V1 blueprint + seed; оба baseline всегда остаются player-editable.

## Продуктовые инварианты

1. UI отображает brief и результат, но не вычисляет style fit, priority satisfaction, progression или economy.
2. Игровая оценка детерминированна и объяснима через authored feedback messages.
3. Семантика мебели и её floor participation задаются authored `InteractionProfile` и `SpatialBehavior`, а не названием или visual mesh.
4. Все persisted, content и client-brief contracts имеют schema version и validation boundary.
5. Functional proximity не должна ошибочно наказываться generic clearance rule.
6. Style mixing и client preferences оцениваются только относительно explicit authored policy, а не global default aesthetic.
7. Каждый player-visible object inside room является catalog instance или surface slot; Presentation V3 не создаёт fixtures, built-ins или interior composition assets.
8. UI может показывать locked variant/finish, но unlock проверяется только Application against PlayerProfile V4.
9. Endless run должен быть повторяемым по seed и V1 blueprint; его priority feedback key authored вместе с blueprint.
10. Endless evaluation использует тот же прозрачный scorecard, но не может записать campaign completion, rewards, unlocks, last session или durable design.

За структурами данных и authoring workflow обращайтесь к [Content model](../systems/content-model.md); за техническими зависимостями — к [Architecture overview](../architecture/overview.md).

## References

[1]: ../../src/Application/UseCases/LoadLevelUseCase.js "V3 brief hydration"
[2]: ../../src/Domain/Briefs/ClientBrief.js "ClientBrief V3 value object"
[3]: ../../data/briefs/client-briefs.v3.json "Shipped client briefs"
[4]: ../systems/content-model.md "Content model"
[5]: ../../data/scoring/scoring-parameters.json "Scoring parameters V3"
[6]: ../../src/Application/UseCases/EvaluateRoomUseCase.js "Three-channel evaluation"
[7]: ../../src/Presentation/Views/EvaluationView.js "Evaluation result rendering"
[8]: ../architecture/overview.md "Architecture overview"
[9]: roadmap.md "Production roadmap"
[10]: ../../data/items/catalog.v5.json "V5 semantic item catalog and variants"
[11]: ../../docs/architecture/main-menu-and-endless-mode.md "Menu and endless mode contract"
