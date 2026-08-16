# Architecture overview

**Статус:** Active production reference
**Обновлено:** 16 августа 2026 г.

Decorium — static Vite web application на JavaScript ES modules с Three.js presentation и Clean Architecture ядром. Проект использует Three.js 0.160, AJV 8 для schema validation, Vitest 4 и versioned JSON content. `src/main.js` — единственный composition root.

## Dependency direction

```text
Presentation → Application → Domain ← Infrastructure
```

`main.js` создаёт конкретные loaders, repositories, evaluators и views, затем передаёт их в Application use cases. Domain не знает о Three.js, DOM, fetch, localStorage, JSON или сети. Infrastructure реализует delivery/storage ports и не определяет score, progression или unlock policy.

## Слои

| Слой | Ответственность | Примеры |
|---|---|---|
| `src/Domain` | Детерминированные entities, value objects и правила игры. | `RoomState`, `Item`, `InteractionProfile`, `FunctionalLayoutRule`, `ClientBrief`, scorers, progression policy. |
| `src/Application` | Use cases, orchestration и DTO boundary. | Load/evaluate room, profile settings, campaign levels, completion recording. |
| `src/Infrastructure` | JSON fetch/validation, static asset inventory, browser-local profile persistence, repositories. | `SchemaLoader`, JSON catalogs, AJV validators, local profile adapter. |
| `src/Presentation` | Three.js scene, controller, view models и DOM views. | `GameController`, `RoomView`, `EvaluationView`, item visual factory. |
| `data` | Versioned authored content and schemas. | Catalog V3, topology-only levels, ClientBrief V1, starter style dataset, feedback, scoring parameters and visual profiles. |

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

```text
Versioned room-composition PBR manifest → RoomCompositionAssetRepository → GameController → RoomView → SceneLifeSystem → LocationEnvironmentSystem
```

The repository lazy-loads only the active profile's static GLB, caches its source and provides material-isolated clones. `LocationEnvironmentSystem` first builds `compositionFallbackRoot`; it hides that procedural identity composition only after successful asset attachment and retains it for a load/decode failure. Async callbacks are ignored after lifecycle teardown. This is strictly a Presentation path: GLB assets, cache state and fallback visibility never become an evaluator, progression or persisted-room input.

### Interaction and evaluation

```text
Level clientBriefId → validated ClientBrief repository → ClientBrief Domain value
  → LoadLevelUseCase → current primary style / completion / composition / ergonomics / required-scenario inputs
Player intent → GameController → Application use case → RoomState
Evaluate → constraint/style/composition/spatial evaluators → score aggregation → `ScorecardCalibrationPolicy` → calibrated feedback/result → EvaluationView
Calibrated result (`stars`, `completionEligible`) → `RecordLevelCompletionUseCase` → ProgressionPolicy
```

Evaluation is deterministic. Presentation receives the hydrated brief plus serialized feedback and score data; it never reimplements rule logic. `ScorecardCalibrationPolicy` preserves `rawScore` and `rawStars`, then derives display stars and explicit `completionEligible` from versioned scoring calibration plus the ClientBrief completion mode and diagnostics. `GameController` forwards those facts only; `RecordLevelCompletionUseCase` owns persistence gating. Current runtime uses the brief’s **primary** target with the one shipped starter style dataset and derives completion, composition, clearance multiplier, functional layout and required scenario policy from the brief. Secondary/accent weighting, density, empty-space preference and client-priority channels remain explicitly persisted inputs awaiting dedicated deterministic evaluator slices.

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
| Level definition | Bounds, available items, initial placement, ClientBrief and presentation references, prerequisites. | `data/levels`, topology-only level schema |
| `PresentationEnvironmentProfile v2` | Closed-preset visual scene policy and ambient fixture ownership. | `data/presentation`, JSON schema, Infrastructure repository and Presentation resolver |
| `RoomCompositionPbrAssetManifest v1` | Static GLB-to-environment-profile mapping, PBR conformance and lazy/fallback/performance contract. | `data/visuals`, Presentation asset repository and scene lifecycle |
| `InteractionProfile v1` | Affordances, local front axis and usable sides. | Domain item semantics |
| `FunctionalLayoutRule v1` | Adjacency or directional `front-adjacency` functional relationships. | Domain ergonomics |
| `RequiredFunctionalScenario v1` | Client-required affordance roles and cardinality, independently evaluated when anchors are absent. | ClientBrief policy, Domain ergonomics and LoadLevel hydration |
| `ClientBrief v1` | Bound client identity, weighted style targets, priorities, spatial preferences and current evaluation policy. | `data/briefs`, schema, validated repository, Domain value and LoadLevel hydration |
| `ScoringParameters v1` | Star thresholds, bounded numerical epsilon and critical-star cap for calibrated scorecards. | `data/scoring`, schema, runtime validation, composition root and Domain policy |
| `ScorecardCalibrationPolicy` | Preserved raw score/rating, critical diagnostic caps and authoritative completion eligibility. | Domain scoring and Application evaluation/completion boundaries |
| BuildInfo / release manifest | Build identity for release verification. | Release pipeline |

## Non-negotiable invariants

1. UI does not calculate score, progression or economy.
2. Domain has no browser, Three.js, storage, network or JSON dependencies.
3. Infrastructure has no gameplay policy.
4. Every persisted or authored contract is versioned and validated.
5. Deterministic outcomes are reproducible from saved state and authored inputs.
6. Functional matches are evaluated before generic clearance exclusions, so valid pairs are not double-penalized.
7. Required client scenarios are evaluated independently of existing anchors; relationship quality never substitutes for scenario presence.
8. Style mixing is interpreted only from explicit client-brief policy; no global default aesthetic is hidden in UI or evaluator heuristics.
9. Presentation environment is not a gameplay evaluator input; visual ownership is explicit in versioned authored content.
10. Completion eligibility is produced by calibrated Domain/Application evaluation and forwarded by UI; it is never inferred from presentation state or a UI-side star comparison.

## Verification

```bash
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

The test suite covers Domain invariants, Application orchestration, content/schema contracts, presentation wiring and documentation requirements. Build generates the release manifest, validates `src/main.js`, produces `dist/index.html` and copies runtime JSON to `dist/data/`.

For detailed content authoring see [Content model](../systems/content-model.md). For decisions see [ADR](../adr/). For release operation see [Release runbook](../operations/release-runbook.md).
