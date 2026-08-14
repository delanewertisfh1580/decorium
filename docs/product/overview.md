# Product overview

**Статус:** Active production baseline
**Обновлено:** 15 августа 2026 г.

Decorium — браузерная Three.js-игра об интерьере в скандинавском стиле. Игрок собирает комнату из authored catalog, размещает, перемещает и поворачивает предметы, затем получает детерминированную оценку и понятную обратную связь.

## Игровой цикл

| Шаг | Действие игрока | Результат системы |
|---|---|---|
| 1 | Открывает профиль и выбирает доступный уровень кампании | Восстанавливаются settings, completed levels и session context. |
| 2 | Выбирает предмет и размещает его в 3D-комнате | RoomState создаёт stable instance ID; предмет можно переместить, повернуть, удалить или отменить действие. |
| 3 | Нажимает «Оценить» | Application оркестрирует style, composition и spatial ergonomics evaluation. |
| 4 | Читает результат | UI показывает total score, stars, sub-scores и feedback из authored catalog. |
| 5 | Выполняет условия уровня | Profile records completion, campaign availability пересчитывается и открывает следующий уровень. |

## Shipped gameplay

Текущая кампания содержит три authored levels и один визуальный стиль — Scandinavian. Profile schema V3 хранится локально и включает settings (`reducedMotion`, `uiScale`, `qualityTier`) и прогресс прохождения. Touch и keyboard paths поддерживаются одним intent contract.

Style score использует authored visual-feature constraints. Ergonomics score использует spatial violations: minimum clearance, passage zones и functional layout. Итоговая оценка агрегирует style и ergonomics с весами **70% / 30%**; thresholds звёзд и остальные scoring parameters находятся в versioned data, а не в UI.

| Уровень | Функциональный сценарий | Ключевое правило |
|---|---|---|
| `level-001` | Обеденная зона | Обеденному столу нужны два места `dining-seat`; корректная пара стол—стул не получает ложный clearance penalty. |
| `level-002` | Зона отдыха | Диван должен смотреть на explicit `view-target` TV; журнальный столик располагается перед диваном. |
| `level-003` | Кампания и progression | Использует общие style, composition и spatial contracts без невозможных functional rules. |

## Границы продукта

Decorium является static web-приложением: ему не требуются backend, пользовательский аккаунт, environment variables или внешние API. Контент загружается вместе с приложением, а все игровые решения воспроизводимы из authored data и сохранённого RoomState.

В текущий production baseline не входят cloud sync, multiplayer, платежи, runtime AI-judge, автоматическая расстановка, pathfinding, аудио и native packaging. Эти направления не считаются обещанными capabilities, пока не перенесены в [production roadmap](roadmap.md) отдельным vertical slice.

## Продуктовые инварианты

1. UI отображает результат, но не вычисляет score, progression или economy.
2. Игровая оценка детерминированна и объяснима через feedback messages.
3. Семантика мебели задаётся authored `InteractionProfile`, а не названием или визуальным mesh.
4. Все persisted и content contracts имеют version/schema version.
5. Функциональная близость не должна ошибочно наказываться universal clearance rule.

За структурами данных и authoring workflow обращайтесь к [Content model](../systems/content-model.md); за техническими зависимостями — к [Architecture overview](../architecture/overview.md).
