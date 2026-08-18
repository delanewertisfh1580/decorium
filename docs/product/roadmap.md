# Production roadmap

**Статус:** Active
**Обновлено:** 18 августа 2026 г.

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

PROD-001—PROD-006 создали profile, authored level selection, ergonomics, progression, touch/settings и release manifest/CI gate. HOTFIX-001 и HOTFIX-002 исправили completion level ID и refresh campaign unlock. PROD-009a—PROD-009c добавили semantic item metadata, functional dining relationships и directional lounge scenario. PROD-010 добавил versioned authored presentation profiles без изменения gameplay scoring; corrective room-archetype work остаётся в active queue. PROD-011 добавил structured catalog navigation, search и in-session continuity after placement. PROD-012—PROD-017 поставили distinct visual families и asset-backed PBR furniture/room-composition packs без изменения gameplay policy. PROD-018 сделал `ClientBrief` единственным source client requirements; PROD-019 активировал client clearance multiplier; PROD-020 добавил critical required functional scenarios; PROD-021 ввёл calibrated scorecard and authoritative completion gates; PROD-022 поставил immutable explanation V1 с exact counterfactual recovery. PROD-023 завершил переход к active multi-style, client-priority-driven evaluation: `ClientBrief v2`, exact style profile catalog, fixed-grid spatial preferences, three-channel `0.5/0.2/0.3` aggregate, explanation V2 и production packaging всех runtime V2 JSON contracts. PROD-024 завершил V4 semantic catalog coverage: every one of 34 shipped items now carries explicit functional role and `SpatialBehavior`; only authored floor obstacles participate in generic occupancy and clearance.[1] [2]

## Следующие production-направления

| Приоритет | Направление | Пользовательский результат | Предварительные границы |
|---|---|---|---|
| P0 — next | **PROD-025 — Authored level style labels** | Каждый visible style target получает explicit display label from content, independent of internal identifier. | Content completeness and localization-ready labels; labels remain non-scoring metadata. |
| P1 | **PROD-026 — Multi-style room identity** | Environment profiles reflect the active client style targets without becoming a scoring input. | Versioned Presentation selectors linked through explicit profile data; no Three.js dependency in Domain. |
| P1 | Ambient street life and animal behavior | Улица за окнами выглядит населённой, а животные ведут себя естественнее: разные маршруты, остановки, сидение, отдых и редкие выразительные transition motions. | Versioned presentation-only behavior profiles, deterministic seed/time inputs, route/state contracts, explicit entity/update budgets и reduced-motion support; без score, progression, persistence или implicit item interaction. |
| P1 | PBR lighting asset pack | Каталоговые настольная лампа, торшер и потолочная люстра получают distinct authored PBR silhouettes, readable emissive cues and safe fallback. | Отдельный versioned manifest, red content contract, reproducible Blender source, UV1/ORM validation, measured budget and game-camera smoke; без изменения lighting score, room illumination policy или persistence. |
| P2 | Performance and accessibility hardening | Игра остаётся удобной на target browser и touch устройствах. | Measured budgets, reduced-motion, quality tiers, input parity. |
| P3 | Platform packaging | Подготовленный mobile-native release candidate. | Platform adapters и реальные device acceptance tests; не смешивать с текущим web Domain. |
| P4 | PROD-010R — Corrective authored room archetypes and visual identity | Уровни становятся различимыми с первого кадра за счёт действительно разных room topology, architecture, camera, exterior и landmark décor. | Выполняется последним по product decision; не ограничиваться palette swaps и не менять gameplay scoring/progression. |

## Явно не запланировано

Accounts/cloud sync, multiplayer, real-money economy, runtime AI scoring и непрозрачная автоматическая расстановка не имеют active commitment. Мультистилевой client-brief-driven scoring уже является shipped production baseline, а не будущей инициативой. Любая другая крупная capability требует отдельного product decision и versioned architecture contract прежде, чем попасть в roadmap.

## Definition of done для следующего слайса

1. Пользовательский результат и границы сформулированы в начале работы.
2. Domain/Application/Infrastructure/Presentation coverage выбирается по фактической вертикали; наружные слои не добавляются искусственно.
3. Schema, feedback и persistence contracts обновлены вместе с code.
4. Полный test suite, build, dependency audit и targeted browser smoke зафиксированы.
5. Active docs обновлены; slice report добавлен в `docs/slices/`; при архитектурном решении добавлен ADR.

## References

[1]: ../slices/PROD-023-client-priority-multi-style-evaluator.md "PROD-023 evidence"
[2]: ../slices/PROD-024-semantic-catalog-coverage.md "PROD-024 evidence"
