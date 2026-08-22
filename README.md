# Decorium

Decorium — браузерная 3D-игра о проектировании интерьеров **для конкретных заказчиков**. Игрок читает authored brief, выбирает предметы, строит интерьер и получает детерминированную, объяснимую оценку стиля, запросов клиента и эргономики.

> **Product canon:** Decorium — мультистилевая client-brief-driven игра. Scandinavian — один из shipped style profiles, а не глобальное правило продукта. Полная active navigation находится в [Documentation hub](docs/README.md).

## Что доступно сейчас

| Capability | Active production baseline |
|---|---|
| Кампания и профиль | Три authored levels, local `PlayerProfile v3`, persisted completion и prerequisite-based unlocks. |
| Управление комнатой | Floor placement, move, 90° rotate, remove и undo; keyboard и touch intent paths. |
| Client brief | Три `ClientBrief v3` records определяют style targets, personal priorities, spatial preferences, functional scenarios, ergonomics и completion. |
| Оценка | Three-channel aggregate: **50% style**, **20% client priorities**, **30% ergonomics**; style channel blends target fit/composition as `75% / 25%`. |
| Функциональная планировка | Dining seats/table, sofa-to-TV и coffee-table relationships используют explicit semantic rules; valid functional pairs не получают ложный generic clearance penalty. |
| Semantic catalog | `catalog V4` содержит 34 предмета с explicit `InteractionProfile` и `SpatialBehavior`; только declared floor obstacles участвуют в generic occupancy и clearance. |
| Presentation | Three.js scene, authored room profiles, data-driven visual families и selected asset-backed PBR/GLB packs с safe fallback. |
| Delivery | Versioned release manifest, static Vite build, CI release gate и guarded publication flow. |

## Current production baseline

Production runtime загружает versioned data из static asset inventory: V4 item catalog, `ClientBrief v3`, exact Scandinavian/Japandi/Eclectic style profiles, scoring parameters V3 и authored feedback. UI отображает supplied policy/facts, но не вычисляет score, progression, economy или item semantics из category/name/mesh.[1] [2]

Игрок проходит цикл «brief → room design → evaluate → explanation → completion». Missing critical functional scenario может block completion; `ScorecardCalibrationPolicy` является единственным источником stars и `completionEligible`. Explanation V2 показывает channel, rule facts, authored remediation и exact recovery impact, а не только общий score.[2] [3]

### Важное текущее ограничение

Catalog V4 уже различает floor, overlay, wall, ceiling и surface-mounted objects для правил occupancy/clearance. Сам interaction layer пока поддерживает **floor placement**; отдельный future slice должен добавить physical wall/ceiling/surface anchors, не изменяя score policy.[4]

## Быстрый старт

**Требования:** Node.js 18+ и browser с WebGL. Внешние сервисы и environment variables не нужны.

```bash
npm ci
npm run dev -- --host 0.0.0.0
```

Откройте Vite address, обычно `http://localhost:5173`.

## Проверки и production build

```bash
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

`npm run build` проверяет entry point, генерирует `public/release-manifest.json`, создаёт `dist/index.html` и публикует active runtime JSON в `dist/data/`. Для static hosting используйте:

```text
Build command: npm ci && npm run build
Publish directory: dist
Environment variables: none
```

Не публикуйте repository root: built HTML depends on adjacent `data/` content.

## Управление

1. Откройте «Каталог», выберите предмет и разместите его на полу.
2. Выберите размещённый предмет, чтобы переместить его; используйте rotate, delete и undo из contextual summary.
3. Нажмите **«Оценить»** или `E`, чтобы увидеть score, stars и actionable explanation.
4. Completion, подтверждённый scorecard, открывает следующий available campaign level.

## Документация

| Нужно понять или изменить | Current source |
|---|---|
| Игровой цикл, shipped scenarios и product limits | [Product overview](docs/product/overview.md) |
| Следующие production направления и TDD discipline | [Production roadmap](docs/product/roadmap.md) |
| Слои, runtime flow и invariants | [Architecture overview](docs/architecture/overview.md) |
| Item catalog V4, ClientBrief v3, scoring, levels и feedback | [Content model](docs/systems/content-model.md) |
| Active versus retained JSON versions | [Data lifecycle guide](data/README.md) |
| Выпуск, проверка и rollback web build | [Release runbook](docs/operations/release-runbook.md) |
| Полная навигация, ADR и historical evidence | [Documentation hub](docs/README.md) |

## Архитектура

```text
Presentation → Application → Domain ← Infrastructure
```

Domain хранит детерминированные gameplay rules. Application оркестрирует use cases. Infrastructure загружает и валидирует versioned JSON, packages static data и сохраняет profile. Presentation отображает Three.js-сцену и supplied results, но не вычисляет gameplay policy.

Подробнее: [Architecture overview](docs/architecture/overview.md).

## References

[1]: src/Infrastructure/DataLoaders/staticDataAssets.js "Active runtime static asset inventory"
[2]: docs/product/overview.md "Current production baseline"
[3]: docs/architecture/overview.md "V2 evaluation architecture"
[4]: docs/adr/adr-031-semantic-catalog-spatial-behavior.md "Semantic catalog placement decision"
