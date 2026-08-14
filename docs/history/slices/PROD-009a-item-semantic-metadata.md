# PROD-009a — Semantic item metadata and authored functional-layout contracts

**Статус:** Implemented
**Дата:** 14 августа 2026 г.
**Срез:** Domain → Application → Infrastructure content contracts

## Пользовательский результат

Этот слайс создаёт корректный фундамент для реалистичной оценки взаимного расположения мебели. Каталог больше не заставляет игровой код догадываться о назначении предмета по его `id`, имени, категории или Three.js-модели. Вместо этого каждый shipped item явно сообщает свои взаимодействующие возможности: например, обеденный стул — `dining-seat`, обеденный стол — `dining-surface`, диван — `lounge-seat`, журнальный столик — `coffee-surface`, телевизор — `view-target`.

Слайс также вводит authored JSON contract для отношений предметов. `level-001` теперь декларирует, что у каждого обеденного стола требуется как минимум два места для сидения на предусмотренной дистанции. Само начисление penalty и UI feedback намеренно остаются в следующем vertical slice, PROD-009b.

## Контракты

| Контракт | Ответственность |
|---|---|
| `InteractionProfile v1` | Immutable Domain value object с declared affordances, `frontAxis` и `usableSides`; legacy items получают безопасный empty profile. |
| `Item.interactionProfile` | Typed semantic metadata предмета, не зависящее от имени, JSON loader или 3D geometry. |
| `catalog.v3.json` + `item.v3.schema.json` | Current versioned catalog contract. Все 33 shipped items несут явный `interactionProfile`. |
| `FunctionalLayoutRule v1` | Immutable authored rule с semantic anchor/partner selectors, distance interval, weight и feedback message key. |
| `LevelDTO.ergonomicsRules.functionalLayoutRules` | Typed `FunctionalLayoutRule` instances, гидратированные на Application boundary. |
| `level.schema.json` | Strict content schema для functional rules: версия, supported affordances, rule kind, minPartners, distance, weight и message key. |

## Authoring model

`InteractionProfile` является семантической декларацией, а не inferred classification. Он не содержит score, конкретные item identifiers или ссылки на renderer. Минимальный профиль обеденного стула выглядит так:

```json
{
  "schemaVersion": 1,
  "affordances": ["dining-seat"],
  "frontAxis": "negative-z",
  "usableSides": ["positive-x", "negative-x"]
}
```

Функциональные ожидания уровня задаются отдельно и только через affordance selectors. Следующее authored правило из `level-001` требует минимум два `dining-seat` для каждого `dining-surface` в measurable interval:

```json
{
  "schemaVersion": 1,
  "id": "dining-seating-required",
  "kind": "adjacency",
  "anchorSelector": { "affordance": "dining-surface" },
  "partnerSelector": { "affordance": "dining-seat" },
  "minPartners": 2,
  "distance": { "min": 0.05, "max": 0.35 },
  "weight": 1.2,
  "messageKey": "functional-dining-seat-required"
}
```

> `distance` описывает functional adjacency contract, а не заменяет global clearance policy. Как согласовать эти два сигнала без двойного наказания, определяет PROD-009b.

## Реализационные границы

| Слой | Выполнено в PROD-009a | Намеренно не выполнено |
|---|---|---|
| Domain | Value objects и их validation/immutability invariants. | Геометрическое matching, orientation semantics, penalty calculation. |
| Application | Hydration functional rules в `LoadLevelUseCase`. | Изменение score orchestration. |
| Infrastructure | V3 catalog/schema, deterministic migration script и level schema/content. | Правила оценки или unlock logic. |
| Presentation | Нет изменения поведения UI. | Functional feedback, visual hints и score presentation. |

Migration `scripts/migrate-item-catalog-v2-to-v3.mjs` является reproducible one-shot authoring utility. Runtime загружает только `catalog.v3.json` и `item.v3.schema.json`; static deployment inventory и regression tests фиксируют этот single source of truth.

## TDD evidence

| Фаза | Red test | Green implementation |
|---|---|---|
| Semantic metadata | `InteractionProfile.test.js`, `ItemInteractionProfile.test.js`, `CatalogInteractionProfile.test.js` | `InteractionProfile`, extended `Item`, catalog validation propagation. |
| Catalog content | `ItemCatalogV3.test.js` | V3 schema/catalog, current static assets and JSON loaders. |
| Functional rule Domain | `FunctionalLayoutRule.test.js` | Versioned, immutable `FunctionalLayoutRule` с strict invariants. |
| Application | `LoadLevelFunctionalRules.test.js` | Hydration в `createErgonomicsRules()`. |
| Level content | `FunctionalLayoutRulesContent.test.js` | Strict level schema и authored dining seating requirement for `level-001`. |
| Regression | `StaticDataAssets.test.js`, `MvpContent.test.js` | Intentional V2→V3 expectation migration. |

## Acceptance criteria

- Semantic properties не inferred from display name, `id`, category или renderer data.
- Every current catalog item validates against `item.v3.schema.json` and exposes `InteractionProfile` in Domain.
- Legacy construction remains safe through an empty semantic profile.
- Every functional authored rule contains a schema version and validates both schema and Domain invariants.
- `LoadLevelUseCase` never leaves raw functional rule JSON in `LevelDTO`.
- `level-001` contains a deterministic dining seating requirement without changing current scoring behaviour.

## Не входит

Functional matching, one-to-one partner consumption, distance and usable-side calculations, sofa-to-TV orientation, coffee-table placement, clearance exclusions, feedback messages, scoring integration and Presentation wiring are deferred to PROD-009b. This separation prevents semantic content migration from silently changing live scoring before its evaluator is fully tested.
