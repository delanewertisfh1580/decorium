# Architecture overview

**Статус:** Active production reference
**Обновлено:** 15 августа 2026 г.

Decorium — static Vite web application на JavaScript ES modules с Three.js presentation и Clean Architecture ядром. Проект использует Three.js 0.160, AJV 8 для schema validation, Vitest 4 и versioned JSON content. `src/main.js` — единственный composition root.

## Dependency direction

```text
Presentation → Application → Domain ← Infrastructure
```

`main.js` создаёт конкретные loaders, repositories, evaluators и views, затем передаёт их в Application use cases. Domain не знает о Three.js, DOM, fetch, localStorage, JSON или сети. Infrastructure реализует delivery/storage ports и не определяет score, progression или unlock policy.

## Слои

| Слой | Ответственность | Примеры |
|---|---|---|
| `src/Domain` | Детерминированные entities, value objects и правила игры. | `RoomState`, `Item`, `InteractionProfile`, `FunctionalLayoutRule`, scorers, progression policy. |
| `src/Application` | Use cases, orchestration и DTO boundary. | Load/evaluate room, profile settings, campaign levels, completion recording. |
| `src/Infrastructure` | JSON fetch/validation, static asset inventory, browser-local profile persistence, repositories. | `SchemaLoader`, JSON catalogs, AJV validators, local profile adapter. |
| `src/Presentation` | Three.js scene, controller, view models и DOM views. | `GameController`, `RoomView`, `EvaluationView`, item visual factory. |
| `data` | Versioned authored content and schemas. | Catalog V3, levels, starter style dataset, feedback, scoring parameters and visual profiles. |

## Runtime flows

### Bootstrap and content loading

```text
Static JSON + schemas → Infrastructure loaders → Domain values → LoadLevelUseCase → controller and views
```

Static asset inventory ensures Vite publishes runtime JSON next to the built HTML. Content is validated at the infrastructure boundary before use cases receive it.

### Authored presentation environment

```text
Level presentationProfileId → validated PresentationEnvironmentRepository → LoadLevelUseCase → LevelDTO.presentationEnvironment → pure EnvironmentProfilePlan → RoomView / SceneLifeSystem
```

Presentation profile resolution is deterministic but presentation-only. It selects room surfaces, openings, camera, lighting, exterior and explicit ambient fixture ownership; it cannot alter score, functional layout, progression or economy. `SceneLifeSystem` and `LocationEnvironmentSystem` receive the resolved plan explicitly, so no global cat or television assumption survives level switching.

### Interaction and evaluation

```text
Player intent → GameController → Application use case → RoomState
Evaluate → constraint/style/composition/spatial evaluators → score aggregation → authored feedback → EvaluationView
```

Evaluation is deterministic. Presentation receives serialized feedback and score data; it never reimplements rule logic. Current runtime receives one starter style dataset; it does not yet load multi-style client briefs.

### Target: client-brief evaluation

```text
ClientBrief JSON + style catalogs + level → Infrastructure validation → ClientBrief Domain value → evaluation inputs → deterministic style-fit and constraint channels → feedback UI
```

`ClientBrief v1` is the planned boundary for multi-style product policy. It will provide primary/secondary/accent style targets, controlled mixing, client priorities, functional scenarios and hard constraints. Domain owns validation and deterministic interpretation; Infrastructure only loads versioned data; Presentation displays the brief and result without choosing styles or resolving conflicts.

### Profile and campaign

```text
Browser-local profile → migration/validation → PlayerProfile
Completion → record use case → ProgressionPolicy → level selection refresh
```

Player settings and completed level progress are persisted in profile schema V3. Unlocks are derived from authored campaign levels and stored completion, not from UI state.

## Core contracts

| Contract | Purpose | Owner |
|---|---|---|
| `PlayerProfile v3` | Local profile, settings and completed levels. | Domain + Infrastructure persistence boundary |
| Item catalog V3 | 34 authored items, feature vectors and semantic interaction profiles. | `data/items`, JSON schema, catalog loader |
| Level definition | Bounds, available items, presentation profile reference, composition/spatial rules and prerequisites. | `data/levels`, level schema |
| `PresentationEnvironmentProfile v1` | Closed-preset visual scene policy and ambient fixture ownership. | `data/presentation`, JSON schema, Infrastructure repository and Presentation resolver |
| `InteractionProfile v1` | Affordances, local front axis and usable sides. | Domain item semantics |
| `FunctionalLayoutRule v1` | Adjacency or directional `front-adjacency` functional relationships. | Domain ergonomics |
| `ClientBrief v1` *(target)* | Multi-style targets, mixing policy, client priorities and hard constraints. | Future Domain + content boundary; not yet runtime-loaded |
| BuildInfo / release manifest | Build identity for release verification. | Release pipeline |

## Non-negotiable invariants

1. UI does not calculate score, progression or economy.
2. Domain has no browser, Three.js, storage, network or JSON dependencies.
3. Infrastructure has no gameplay policy.
4. Every persisted or authored contract is versioned and validated.
5. Deterministic outcomes are reproducible from saved state and authored inputs.
6. Functional matches are evaluated before generic clearance exclusions, so valid pairs are not double-penalized.
7. Style mixing is interpreted only from explicit client-brief policy; no global default aesthetic is hidden in UI or evaluator heuristics.
8. Presentation environment is not a gameplay evaluator input; visual ownership is explicit in versioned authored content.

## Verification

```bash
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

The test suite covers Domain invariants, Application orchestration, content/schema contracts, presentation wiring and documentation requirements. Build generates the release manifest, validates `src/main.js`, produces `dist/index.html` and copies runtime JSON to `dist/data/`.

For detailed content authoring see [Content model](../systems/content-model.md). For decisions see [ADR](../adr/). For release operation see [Release runbook](../operations/release-runbook.md).
