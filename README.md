# Decorium

Decorium — браузерная 3D-игра о проектировании интерьеров для конкретных заказчиков. Игрок работает с разными эстетиками, осмысленно смешивает стили в границах authored client brief и получает детерминированную оценку style fit, композиции и эргономики с объяснимой обратной связью.

> **Product direction:** Decorium — мультистилевая игра. Current Scandinavian content — только MVP-derived starter scenario, а не global product style. Актуальная карта проекта находится в **[Documentation hub](docs/README.md)**.

## Что доступно сейчас

| Capability | Production baseline |
|---|---|
| Кампания и профиль | Три authored levels, local profile schema V3, progress и unlocks между перезагрузками. |
| Управление | Placement, move, 90° rotate, remove, undo; keyboard и touch intent paths. |
| Оценка | Current starter dataset: style + composition + spatial ergonomics; итоговая агрегация 70% / 30%. |
| Functional layout | Стулья у стола, диван к ТВ и журнальный столик перед диваном оцениваются через explicit semantic rules. |
| Presentation | Three.js room, data-driven procedural item visuals, settings для reduced motion, UI scale и quality tier. |
| Delivery | Versioned release manifest, CI release gate и static Vite build. |

## Production direction

Следующий content/scoring foundation — versioned `ClientBrief`: заказ определяет primary/secondary/accent style targets, допустимое смешение, приоритеты, functional scenarios и hard constraints. Этот contract заменит single-style input на client-specific policy, не перекладывая игровую логику в UI. Текущий runtime пока обслуживает только один **Scandinavian starter scenario**; новые styles и brief-driven mixing будут поставляться отдельными TDD-слайсами.

## Быстрый старт

**Требования:** Node.js 18+ и браузер с WebGL. Внешние сервисы и environment variables не нужны.

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

`npm run build` validates the entry point, generates `public/release-manifest.json`, creates `dist/index.html` and publishes runtime JSON to `dist/data/`. Для static hosting используйте:

```text
Build command: npm ci && npm run build
Publish directory: dist
Environment variables: none
```

Не публикуйте repository root: built HTML depends on adjacent `data/` content.

## Управление

1. Откройте «Каталог», выберите предмет и разместите его на полу.
2. Выберите размещённый предмет, чтобы переместить его; используйте rotate, delete и undo из contextual summary.
3. Нажмите **«Оценить»** или `E`, чтобы увидеть score, stars и actionable feedback.
4. После успешного прохождения уровень открывает следующий доступный этап кампании.

## Документация

| Нужно понять или изменить | Документ |
|---|---|
| Игровой цикл, scope и shipped scenarios | [Product overview](docs/product/overview.md) |
| Следующие production направления и TDD discipline | [Production roadmap](docs/product/roadmap.md) |
| Слои, data flow и архитектурные invariants | [Architecture overview](docs/architecture/overview.md) |
| Catalog V3, current starter dataset, ClientBrief target, levels, scoring, feedback и functional rules | [Content model](docs/systems/content-model.md) |
| Выпуск, проверка и rollback web build | [Release runbook](docs/operations/release-runbook.md) |
| Полная навигация, ADR и historical evidence | [Documentation hub](docs/README.md) |

## Архитектура

```text
Presentation → Application → Domain ← Infrastructure
```

Domain сохраняет игровые правила чистыми и детерминированными. Application оркестрирует use cases. Infrastructure загружает и валидирует versioned JSON/persistence. Presentation отображает Three.js-сцену и результаты, но не вычисляет gameplay rules.

Подробнее: [Architecture overview](docs/architecture/overview.md).
