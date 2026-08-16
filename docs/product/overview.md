# Product overview

**Статус:** Active production vision and current baseline
**Обновлено:** 16 августа 2026 г.

Decorium — браузерная Three.js-игра о проектировании интерьеров **для конкретных заказчиков**. Игрок собирает комнату из authored catalog, размещает и поворачивает предметы, а затем получает детерминированную оценку того, насколько решение отвечает стилевому замыслу, смешению эстетик, функциональным потребностям и явным ограничениям client brief.

> **Product canon:** Decorium — мультистилевая игра. Один стиль не является правилом продукта, а «хороший» интерьер определяется конкретным заказчиком и его brief, а не универсальным шаблоном.

## Игровой цикл

| Шаг | Действие игрока | Результат системы |
|---|---|---|
| 1 | Открывает профиль и выбирает заказ/уровень кампании | Восстанавливаются settings, completed levels и session context. |
| 2 | Читает brief: предпочтения клиента, допустимое смешение стилей, функциональные потребности и ограничения помещения | Hydrated versioned `ClientBrief` supplies authored policy; UI displays it without interpretation. |
| 3 | Выбирает предметы, расставляет и поворачивает их в 3D-комнате | RoomState создаёт stable instance IDs; действия можно переместить, повернуть, удалить или отменить. |
| 4 | Нажимает «Оценить» | Application оркестрирует style fit, composition и spatial ergonomics evaluation. |
| 5 | Читает результат и уточняет композицию | UI показывает total score, stars, sub-scores и actionable feedback. |
| 6 | Выполняет условия заказа | Profile records completion, campaign availability пересчитывается и открывает следующий brief. |

## Production vision: styles and client briefs

Каждый заказ должен иметь versioned `ClientBrief`, который делает вкусы и ограничения клиента явными authored data. Brief может назначать основной стиль, вторичные поддерживающие стили, допустимые сочетания, относительные веса, обязательные и запрещённые свойства, функциональные сценарии, budget/space constraints и критерии завершённости. Это позволяет уровню поощрять осмысленный эклектичный интерьер, а не наказывать его за несовпадение с единственным стилем.

| Слой policy | Роль в будущем `ClientBrief` | Пример |
|---|---|---|
| Style palette | Основные и вторичные стилевые цели с весами. | Mid-century как primary; Japandi accents как secondary. |
| Mixing policy | Допустимые пары/семейства стилей, balance и конфликтующие комбинации. | Тёплое дерево связывает две эстетики; несовместимый декоративный акцент получает feedback. |
| Client priorities | Что важнее именно этому заказчику. | Готовность к приёму гостей важнее минималистичной визуальной плотности. |
| Functional brief | Сценарии использования комнаты. | Dining for four, media viewing, reading corner, child-safe passage. |
| Hard constraints | Непереговорные условия помещения, бюджета или клиента. | Сохранить проход, не блокировать окно, использовать existing heirloom. |

`ClientBrief v1` is now a runtime-loaded, versioned source contract. Its primary target currently feeds the starter-style channel; its `clearanceMultiplier` actively adjusts minimum-clearance ergonomics, and its required functional scenarios actively diagnose missing client groups. Weighted secondary/accent targets, mixing policy, priorities, density and empty-space preference remain declared data until their dedicated deterministic evaluator slices activate them. Presentation must not simulate pending channels with UI heuristics.

## Current production baseline

Сегодня в репозитории существуют три authored levels и три versioned `ClientBrief v1` records. Каждый level теперь содержит только topology/inventory/presentation reference; hydrated brief является единственным source of truth для client identity, completion target, composition, ergonomics, style targets, priorities и spatial preferences. **Scandinavian starter dataset** всё ещё является единственным активным style/constraint dataset: current evaluator временно использует primary target brief. Client clearance multiplier и required dining/media/work scenarios уже активны как deterministic ergonomics inputs; weighted secondary/accent targets, density и empty-space preference ожидают отдельных mechanics slices.

Profile schema V3 хранится локально и включает settings (`reducedMotion`, `uiScale`, `qualityTier`) и прогресс прохождения. Touch и keyboard paths поддерживаются одним intent contract. Каталог группирует available items по UI-категориям, поддерживает поиск и сохраняет browsing context в пределах текущей игровой сессии после placement; эта навигация не меняет authored availability или gameplay rules. Priority furniture variants use data-driven visual families, so form distinguishes dining, lounge, office and other furniture roles independently from authored semantic profiles. The priority seating pack now renders from versioned authored GLB prefabs with an immediate procedural fallback; asset loading remains a Presentation concern. Итоговая оценка пока агрегирует current primary-style score и ergonomics с весами **70% / 30%**; thresholds звёзд и параметры находятся в versioned data, а не в UI. ClientBrief now owns the inputs that will replace this temporary global policy channel by channel.

| Текущий уровень | Функциональный сценарий | Ключевое правило |
|---|---|---|
| `level-001` | Тёплые ужины | Critical scenario требует 1 `dining-surface` и 2 `dining-seat`; existing table–seat relationship remains a separate placement-quality rule. |
| `level-002` | Камерный медиа-вечер | Critical scenario требует `lounge-seat`, `view-target` и `coffee-surface`; sofa orientation and coffee-table position remain separate placement-quality rules. |
| `level-003` | Светлая рабочая студия | Critical scenario требует `work-surface` и `work-seat`; desk and repeat-placeable chair semantics are explicit authored data. |

## Границы продукта

Decorium является static web-приложением: ему не требуются backend, пользовательский аккаунт, environment variables или внешние API. Контент загружается вместе с приложением, а все игровые решения воспроизводимы из authored data и сохранённого RoomState.

Cloud sync, multiplayer, платежи, runtime AI-judge, непрозрачная автоматическая расстановка, pathfinding, аудио и native packaging не входят в current baseline. Мультистилевой `ClientBrief` pipeline, напротив, является **активным production-направлением** и описан в [Production roadmap](roadmap.md).

## Продуктовые инварианты

1. UI отображает brief и результат, но не вычисляет style fit, progression или economy.
2. Игровая оценка детерминированна и объяснима через authored feedback messages.
3. Семантика мебели задаётся authored `InteractionProfile`, а не названием или visual mesh.
4. Все persisted, content и client-brief contracts имеют version/schema version.
5. Функциональная близость не должна ошибочно наказываться universal clearance rule.
6. Смешение стилей оценивается относительно explicit policy заказчика, а не как отклонение от global default style.

За структурами данных и authoring workflow обращайтесь к [Content model](../systems/content-model.md); за техническими зависимостями — к [Architecture overview](../architecture/overview.md).
