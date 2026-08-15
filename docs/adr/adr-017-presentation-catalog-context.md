# ADR-017 — Presentation-owned catalog browsing context

**Статус:** Accepted
**Дата:** 15 августа 2026 г.

## Контекст

До PROD-011 catalog был компактной, но неструктурированной horizontal strip. Любой controller re-render после выбора предмета пересоздавал DOM и возвращал игрока к исходному состоянию. Для inventory из десятков предметов это делает повторное размещение медленным и непрозрачным: игрок снова ищет category, item и scroll position.

Нельзя решать проблему изменением `RoomState`, level availability, PlayerProfile progress или gameplay item semantics. Category/filter/search — это способ навигации по уже доступному content, а не действие игрока в комнате и не долгоживущий business preference. Persisting такое состояние в `PlayerProfile v3` создало бы ненужную migration и смешало бы UI session detail с player identity.

## Решение

`ItemCatalogView` владеет minimal ephemeral browse context: `activeCategoryId`, normalized `query`, `scrollTop`, `selectedItemId` и open/closed state. It derives filtered results only from `RoomViewModel.availableItems`, which itself is authored level availability. Closed category definitions group existing visual types; they do not add gameplay affordances or alter Domain item type policy.

Перед каждым controller-driven DOM rebuild view captures current `details` state and grid scroll. После render она восстанавливает category, query, selected card and scroll position. При выборе item panel remains closed, но context сохраняется для следующего explicit opening. Search/category changes deliberately reset scroll to the first result.

> Catalog continuity is an ephemeral Presentation concern. It is not saved game state and must not affect availability, price, score, progression or deterministic evaluation.

## Последствия

| Область | Последствие |
|---|---|
| Usability | Repeated placement no longer discards the player’s current inventory context. |
| Architecture | Domain/Application/Infrastructure changes are unnecessary; only view presentation state is added. |
| Content | Level availability remains authoritative. Empty categories are omitted rather than exposing non-existent choices. |
| Accessibility | Native search input, pressed category buttons, explicit labels and empty state make filtering observable without visual inference. |
| Persistence | Context resets on a full page reload or new `ItemCatalogView`; a future durable preference needs its own explicit profile contract and migration. |
| Testing | DOM contracts cover filter composition and close → rerender continuity independently from Three.js or gameplay rules. |

## Alternatives

1. **Persist browse context in PlayerProfile.** Rejected because current requirement is in-session continuity, not cross-session preference; a schema change would be disproportionate.
2. **Put filtering in RoomViewModel or Domain.** Rejected because both would mix navigation/UI behavior into gameplay-facing objects.
3. **Keep horizontal strip and remember only its `scrollLeft`.** Rejected because it retains poor discoverability and cannot provide category/search affordances.
4. **Close and reset catalog after every placement.** Rejected because this is the exact friction reported by the player.
5. **Derive categories from interaction affordances.** Rejected because browsing taxonomy is visual/navigation policy; functional affordances remain gameplay semantics and should not be conflated.

## Follow-up

Future catalog slices may add persistent cross-session preferences, sort/filter policy, item imagery or richer visual product taxonomy only with separate user requirements and explicit contracts. Furniture art differentiation belongs to a visual asset slice, not this navigation slice.
