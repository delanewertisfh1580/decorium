# PROD-011 — Persistent structured catalog

**Статус:** Completed
**Дата:** 15 августа 2026 г.
**Связанное решение:** [ADR-017](../adr/adr-017-presentation-catalog-context.md)

## Пользовательский результат

Каталог больше не является одной длинной горизонтальной лентой. Игрок может отфильтровать доступные предметы по понятным категориям, найти предмет через case-insensitive text search и увидеть число текущих результатов. Открытая панель использует вертикальный scrollable grid, поэтому inventory не возвращает игрока к началу после выбора и последующего controller re-render.

| Возможность | Поведение |
|---|---|
| Category tabs | `Все`, `Сиденья`, `Спальня` при наличии кроватей, `Столы`, `Свет`, `Хранение` и `Декор` фильтруют current level availability. |
| Search | Query сопоставляется с отображаемым названием предмета без учёта регистра и совместно с active category. |
| Empty state | Каталог явно сообщает, что по текущему query/category ничего не найдено. |
| Continuity | Active category, search query, selected item and vertical `scrollTop` сохраняются при close → controller re-render → next open. |
| Responsive layout | На обычном viewport используется двухколоночный grid; на narrow viewport — одна колонка и touch-safe controls. |

## Границы решения

PROD-011 добавляет только Presentation state внутри `ItemCatalogView`. Этот state не сохраняется в `PlayerProfile`, не переходит между browser sessions и не является gameplay data. Level catalog по-прежнему определяет, какие items доступны; UI только отображает и фильтрует already-authored data. Scoring, economy, progression, RoomState и Domain остаются неизменными.

> Continuity означает сохранение контекста между неизбежными UI re-renders текущей игровой сессии, а не создание нового persisted player contract.

## TDD и verification

Red/green contracts покрывают category filtering, case-insensitive search, empty result feedback и exact placement lifecycle: catalog close, controller re-render и restored query/category/selected card/scroll position. Existing minimal HUD test остаётся зелёным: панель по-прежнему collapsed until explicitly opened.

Browser smoke подтвердил live DOM behavior. Seating tab returned four level-001 seating items; query `ДИВАН` reduced that set to two sofa items. На full all-items grid значение `scrollTop: 126` сохранилось после выбора item, закрытия панели и controller rerender; панель не раскрывается самопроизвольно во время placement.

## Non-goals и follow-up

Слайс не вводит persistent cross-session catalog preference, item images, semantic gameplay categories, price filtering или sort policy. Следующая крупная визуальная работа с furniture silhouettes and materials остаётся отдельным slice. Corrective **PROD-010R — authored room archetypes and visual identity** перенесён в конец active queue по product decision и не изменяется этой поставкой.
