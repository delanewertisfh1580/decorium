# Production roadmap

**Статус:** Active
**Обновлено:** 15 августа 2026 г.

Этот документ содержит только **незавершённую** работу, которая может изменить production baseline. Completed slice evidence хранится в [history/slices](../history/slices/), а не дублируется здесь.

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

PROD-001—PROD-006 создали profile, authored level selection, ergonomics, progression, touch/settings и release manifest/CI gate. HOTFIX-001 и HOTFIX-002 исправили completion level ID и refresh campaign unlock. PROD-009a—PROD-009c добавили semantic item metadata, functional dining relationships и directional lounge scenario. PROD-010 добавил versioned authored presentation profiles, визуально различающие три published levels без изменения gameplay scoring. Подробные evidence находятся в [history/slices](../history/slices/), [history/verification](../history/verification/) и [slice report PROD-010](../slices/PROD-010-authored-level-presentation-profiles.md).

## Следующие production-направления

| Приоритет | Направление | Пользовательский результат | Предварительные границы |
|---|---|---|---|
| P0 | PROD-011 — Persistent structured catalog | Игрок быстро находит предмет через category tabs и search; после placement сохраняются scroll position, active category, search query и selection continuity. | Presentation state and catalog UX contracts only; не менять score, progression, catalog gameplay semantics или presentation profile contract. |
| P1 | Multi-style `ClientBrief v1` foundation | Игрок получает заказ с primary/secondary/accent style goals, explicit mixing policy, client priorities и hard constraints. | Versioned schema, Domain value object, loader, deterministic style-fit channels, feedback and brief view; current Scandinavian dataset remains a starter fixture. |
| P1 | Client-brief content authoring pipeline | Контент-дизайнер добавляет style families, mixing policy и новые briefs с validation до runtime. | Compiled/catalog validation, reproducible fixtures, reviewable schemas; без runtime LLM-оценки. |
| P1 | Functional-layout expansion | Новые объяснимые interaction scenarios учитывают lifestyle requirements конкретного клиента. | Новый typed rule kind только при отдельном authored data и red tests; например bidirectional view relation или wall-dependent fixture policy. |
| P1 | Release observability and browser verification | Оператор может уверенно идентифицировать и проверить опубликованный build. | Release manifest, CI gate, browser smoke, performance budget; telemetry только privacy-safe и не влияет на score. |
| P2 | Performance and accessibility hardening | Игра остаётся удобной на target browser и touch устройствах. | Measured budgets, reduced-motion, quality tiers, input parity. |
| P3 | Platform packaging | Подготовленный mobile-native release candidate. | Platform adapters и реальные device acceptance tests; не смешивать с текущим web Domain. |

## Явно не запланировано

Accounts/cloud sync, multiplayer, real-money economy, runtime AI scoring и непрозрачная автоматическая расстановка не имеют active commitment. Мультистилевой client-brief-driven scoring не относится к этому списку: это утверждённое P0 production направление. Любая другая крупная capability требует отдельного product decision и versioned architecture contract прежде, чем попасть в roadmap.

## Definition of done для следующего слайса

1. Пользовательский результат и границы сформулированы в начале работы.
2. Domain/Application/Infrastructure/Presentation coverage выбирается по фактической вертикали; наружные слои не добавляются искусственно.
3. Schema, feedback и persistence contracts обновлены вместе с code.
4. Полный test suite, build, dependency audit и targeted browser smoke зафиксированы.
5. Active docs обновлены; slice report отправлен в `docs/history/slices/`; при архитектурном решении добавлен ADR.
