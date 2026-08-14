# ADR-015 — Semantic functional-layout graph from versioned authored affordances

**Статус:** Accepted
**Дата:** 14 августа 2026 г.

## Контекст

До этого решения spatial ergonomics оценивала только универсальные расстояния и passage zones. Такой сигнал полезен для сохранения проходимости, но не выражает целевую функцию комнаты: стул должен обслуживать стол, диван — быть направленным к visual target, журнальный столик — располагаться перед диваном. Следствием была неверная product semantics: корректно придвинутый к столу стул выглядел как clearance violation, а диван спинкой к телевизору не получал отдельного functional signal.

Нельзя исправлять это эвристиками по `item.id`, display name, type или mesh shape. Эти поля не являются устойчивыми gameplay semantics, могут локализоваться и меняются при authoring/content migration. Так же неприемлемо помещать relationships в Presentation/Three.js: score должен быть детерминированно воспроизводим из сохранённых Domain inputs.

## Решение

Вводится two-part versioned contract.

Во-первых, каждый item в current `catalog.v3.json` содержит `InteractionProfile v1`. Profile declares closed-set affordances (`dining-seat`, `dining-surface`, `lounge-seat`, `coffee-surface`, `view-target`), normalized front axis и usable sides. В Domain `Item` хранит typed immutable profile; legacy constructor receives empty profile for backward safety.

Во-вторых, authored level content содержит `FunctionalLayoutRule v1`. Rule selects an anchor and partners exclusively by affordance, defines `kind: adjacency`, partner minimum, bounded distance, penalty weight and feedback key. `LoadLevelUseCase` hydrates raw JSON into immutable Domain value objects. `level.schema.json` enforces the persisted content shape and version.

> A functional relation is content policy, not renderer geometry and not a hidden item-name convention.

## Последствия

| Область | Последствие |
|---|---|
| Determinism | Identical saved item identities, transforms, item profiles and authored rules produce identical evaluator inputs. |
| Authoring | New furniture variants join existing relationships by declaring an affordance, not by editing evaluator conditionals. |
| Migration | Catalog changes are explicit V3 data migration, accompanied by a schema and reproducible migration script. |
| Clean Architecture | Domain owns semantic validation; Application hydrates it; Infrastructure reads JSON; Presentation cannot calculate relationships. |
| Compatibility | Old in-memory items remain constructible with empty profiles, while shipped content has explicit metadata. |
| Safety | PROD-009a changes contracts only; it cannot silently change released scoring before evaluator behaviour is separately tested. |

## Alternatives

1. **Infer relationships from item identifiers, display names or categories.** Rejected because localization, catalog expansion and visual renaming would silently alter gameplay semantics.
2. **Infer from Three.js mesh dimensions or model tags.** Rejected because renderer assets are not Domain data and cannot provide deterministic, headless score inputs.
3. **Put fixed table/chair/sofa conditions directly in `SpatialErgonomicsEvaluator`.** Rejected because relationship policy is level-specific and must be editable content, not code deployment policy.
4. **Replace universal clearance with functional relations.** Rejected because circulation and anti-overlap signals remain needed. PROD-009b will resolve intentional functional proximity without double-counting it.
5. **Use free-form labels rather than a closed affordance vocabulary.** Rejected for V1 because typo-prone arbitrary strings are not a reliable persisted contract. Vocabulary expansion requires an explicit schema and Domain version change.

## Follow-up

PROD-009b adds a pure deterministic `FunctionalLayoutEvaluator`: matching strategy, orientation semantics, paired clearance exclusion, weighted violations, feedback mapping, composition-root wiring and Presentation display. Rules for couches, coffee tables and view targets are not enabled until that slice proves their geometry and feedback expectations through tests.
