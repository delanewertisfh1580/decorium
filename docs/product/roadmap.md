# Production roadmap

**Статус:** Active
**Обновлено:** 16 августа 2026 г.

Этот документ содержит только **незавершённую** работу, которая может изменить production baseline. Completed slice evidence хранится в [slice reports](../slices/), а не дублируется здесь.

## Delivery discipline

Каждая задача выполняется как вертикальный TDD-слайс: сначала red test для публичного contract, затем минимальная implementation от Domain до нужных внешних слоёв, затем refactor, полный quality gate и документирование. Слайс не считается завершённым, пока его результат наблюдаем игроком или оператором и воспроизводим из versioned input.

| Обязательное правило | Причина |
|---|---|
| UI не считает game rules | Сохраняет единственный источник истины в Domain/Application. |
| Domain не импортирует Three.js, browser API, JSON, storage или сеть | Поддерживает детерминизм и тестируемость. |
| Infrastructure не содержит score/progression/unlock rules | Не смешивает delivery механизмы и игровую политику. |
| Persisted/content contracts versioned и validated | Делает reload, migration и authored data безопасными. |
| `npm test`, `npm run build`, dependency audit и targeted smoke обязательны | Предотвращает регрессии перед публикацией. |

## Завершённая база

PROD-001—PROD-006 создали profile, authored level selection, ergonomics, progression, touch/settings и release manifest/CI gate. HOTFIX-001 и HOTFIX-002 исправили completion level ID и refresh campaign unlock. PROD-009a—PROD-009c добавили semantic item metadata, functional dining relationships и directional lounge scenario. PROD-010 добавил versioned authored presentation profiles без изменения gameplay scoring; corrective room-archetype work остаётся в active queue. PROD-011 добавил structured catalog navigation, search и in-session continuity after placement. PROD-012 добавил explicit low-poly visual families, PROD-012R заменил priority seating rendering семью authored GLB prefabs с versioned budgets и safe runtime fallback. PROD-013 добавил четыре lounge PBR GLB prefabs с normal/roughness/AO maps, multi-manifest delivery, PMREM lighting response и тот же safe fallback. PROD-014 добавил три оставшихся table-type PBR GLB prefabs с explicit UV1/texture-variant manifest conformance. PROD-015 добавил семь storage PBR GLB prefabs с complete catalog-family ownership, measured budget, safe fallback и неизменными storage semantics. PROD-016 добавил versioned room identity baseline: distinct wall treatments, non-semantic built-ins and exterior compositions for every authored room, without changing game rules. PROD-017 заменил эти procedural identity-compositions тремя static Blender/GLB PBR assets с lazy active-profile delivery, measured budgets и safe procedural fallback; gameplay semantics остались неизменны. PROD-018 добавил ClientBrief V1 как единственный versioned source client requirements and current evaluation policy: topology-only levels hydrate client identity, completion, composition, ergonomics, primary style target, priorities and spatial preferences from validated data. PROD-019 activated the first client-specific spatial channel: `clearanceMultiplier` now scales `MinimumClearanceRule` thresholds and severity deterministically while retaining authored rule diagnostics. PROD-020 activated client-owned required functional scenarios: missing dining, media or work roles now create deterministic critical ergonomics diagnostics even without an existing anchor item. PROD-021 made those critical diagnostics enforceable through a calibrated scorecard: versioned epsilon and critical cap preserve raw score facts, `block-completion` caps displayed stars below the brief target and returns authoritative `completionEligible`, while Application—not UI—persists that decision. PROD-022 made those decisions explainable: an immutable runtime explanation V1 carries exact counterfactual recovery, authored remediation/severity, rule facts and only live RoomState instance references; UI renders/focuses these facts without calculating policy. Evidence: [PROD-010](../slices/PROD-010-authored-level-presentation-profiles.md), [PROD-011](../slices/PROD-011-persistent-structured-catalog.md), [PROD-012](../slices/PROD-012-distinct-furniture-visual-families.md), [PROD-012R](../slices/PROD-012R-asset-backed-furniture-quality.md), [PROD-013](../slices/PROD-013-lounge-pbr-asset-pack.md), [PROD-014](../slices/PROD-014-dining-table-pbr-asset-pack.md), [PROD-015](../slices/PROD-015-storage-pbr-asset-pack.md), [PROD-016](../slices/PROD-016-authored-room-identity-baseline.md), [PROD-017](../slices/PROD-017-room-composition-pbr-asset-pack.md), [PROD-018](../slices/PROD-018-client-brief-source-foundation.md), [PROD-019](../slices/PROD-019-client-clearance-multiplier.md), [PROD-020](../slices/PROD-020-required-functional-scenarios.md), [PROD-021](../slices/PROD-021-scorecard-calibration-completion-gates.md) and [PROD-022](../slices/PROD-022-explainable-evaluation-ui.md).

## Следующие production-направления

| Приоритет | Направление | Пользовательский результат | Предварительные границы |
|---|---|---|---|
| P0 — next | **PROD-023 — Client-priority and multi-style evaluator** | Weighted primary/secondary/accent targets, personal priorities and density/empty-space wishes начинают объяснимо менять оценку. | Deterministic weighted channels consuming only ClientBrief and catalog data; style family authoring, mix compatibility and feedback contracts. |
| P1 | **PROD-024 — Semantic catalog coverage** | Каждый shipped item имеет declared spatial behavior and relevant affordances instead of being a universal 2D clearance obstacle. | Completeness contract for all catalog items; work, storage, lighting, wall/ceiling and support semantics. |
| P1 | Ambient street life and animal behavior | Улица за окнами выглядит населённой, а животные ведут себя естественнее: разные маршруты, остановки, сидение, отдых и редкие выразительные transition motions. | Versioned presentation-only behavior profiles, deterministic seed/time inputs, route/state contracts, explicit entity and update budgets, reduced-motion support; без score, progression, persistence или implicit item interaction. |
| P1 | PBR lighting asset pack | Каталоговые настольная лампа, торшер и потолочная люстра получают distinct authored PBR silhouettes, readable emissive cues and safe fallback. | Отдельный versioned manifest, red content contract, reproducible Blender source, UV1/ORM validation, measured budget and game-camera smoke; без изменения lighting score, room illumination policy или persistence. |
| P2 | Performance and accessibility hardening | Игра остаётся удобной на target browser и touch устройствах. | Measured budgets, reduced-motion, quality tiers, input parity. |
| P3 | Platform packaging | Подготовленный mobile-native release candidate. | Platform adapters и реальные device acceptance tests; не смешивать с текущим web Domain. |
| P4 | PROD-010R — Corrective authored room archetypes and visual identity | Уровни становятся различимыми с первого кадра за счёт действительно разных room topology, architecture, camera, exterior и landmark décor. | Выполняется последним по product decision; не ограничиваться palette swaps и не менять gameplay scoring/progression. |

## Явно не запланировано

Accounts/cloud sync, multiplayer, real-money economy, runtime AI scoring и непрозрачная автоматическая расстановка не имеют active commitment. Мультистилевой client-brief-driven scoring не относится к этому списку: это утверждённое P0 production направление. Любая другая крупная capability требует отдельного product decision и versioned architecture contract прежде, чем попасть в roadmap.

## Definition of done для следующего слайса

1. Пользовательский результат и границы сформулированы в начале работы.
2. Domain/Application/Infrastructure/Presentation coverage выбирается по фактической вертикали; наружные слои не добавляются искусственно.
3. Schema, feedback и persistence contracts обновлены вместе с code.
4. Полный test suite, build, dependency audit и targeted browser smoke зафиксированы.
5. Active docs обновлены; slice report добавлен в `docs/slices/`; при архитектурном решении добавлен ADR.
