# Architecture overview

**Статус:** Active production reference
**Обновлено:** 17 августа 2026 г.

Decorium — static Vite web application на JavaScript ES modules с Three.js presentation и Clean Architecture ядром. Проект использует Three.js 0.160, AJV 8 для schema validation, Vitest 4 и versioned JSON content. `src/main.js` — единственный composition root.[1]

## Dependency direction

```text
Presentation → Application → Domain ← Infrastructure
```

`main.js` создаёт concrete loaders, repositories, evaluators, calibrated policies и views, затем передаёт их в Application use cases. Domain не знает о Three.js, DOM, fetch, localStorage, JSON или сети. Infrastructure реализует delivery/storage ports и не определяет score, progression или unlock policy.[1]

## Слои

| Слой | Ответственность | Примеры |
|---|---|---|
| `src/Domain` | Детерминированные entities, value objects и правила игры. | `RoomState`, `Item`, `ClientBrief v2`, multi-style/priority/occupancy evaluators, scorers, progression policy. |
| `src/Application` | Use cases, orchestration и immutable DTO boundary. | Load/evaluate room, V2 explanation assembly, profile settings, campaign levels, completion recording. |
| `src/Infrastructure` | JSON fetch/validation, exact profile catalog, static asset inventory, browser-local persistence, repositories. | `SchemaLoader`, `JsonConstraintCatalog`, JSON catalogs, AJV validators, local profile adapter. |
| `src/Presentation` | Three.js scene, controller, view models и DOM views. | `GameController`, `RoomView`, `EvaluationView`, item visual factory. |
| `data` | Versioned authored content and schemas. | Catalog V3, topology-only levels, ClientBrief V2, style profiles, feedback, scoring parameters V2 and visual profiles. |

## Runtime flows

### Bootstrap and content loading

```text
Static JSON + schemas → Infrastructure validation/loaders → Domain values
  → LoadLevelUseCase → immutable LevelDTO/evaluationSpec → controller and views
```

Static asset inventory ensures Vite publishes every runtime JSON next to the built HTML. Content is validated at the Infrastructure boundary before use cases receive it. Active production bootstrap loads the V2 brief catalog/schema and V1-versioned exact style-profile catalog/schema.[2]

### Authored presentation environment

```text
Level presentationProfileId → validated PresentationEnvironmentRepository → LoadLevelUseCase
  → LevelDTO.presentationEnvironment → pure EnvironmentProfilePlan → RoomView / SceneLifeSystem
```

Presentation profile resolution is deterministic but presentation-only. It selects room surfaces, openings, camera, lighting, exterior and explicit ambient fixture ownership; it cannot alter score, functional layout, progression or economy. Static GLB room compositions use lazy load, cache, material-isolated clones and a procedural fallback. Asset state and fallback visibility never become evaluation/progression/persistence inputs.

### Interaction and V2 evaluation

```text
Level clientBriefId → validated ClientBrief V2 repository → ClientBrief Domain value
  → exact style profile hydration → immutable evaluationSpec
Player intent → GameController → Application use case → RoomState
Evaluate → MultiStyleEvaluator + StyleChannelPolicy → style score
        → RoomOccupancyProfile + SpatialPreferenceEvaluator + ClientPriorityEvaluator → priority score
        → SpatialErgonomicsEvaluator → ergonomics score
        → ThreeChannelScoreAggregator → ScorecardCalibrationPolicy
        → MultiChannelViolationImpactPolicy → MultiChannelEvaluationExplanationAssembler → EvaluationView
Explanation focus intent (`instanceId`) → GameController validation → existing RoomViewModel selection rendering
Calibrated result (`stars`, `completionEligible`) → RecordLevelCompletionUseCase → ProgressionPolicy
```

`LoadLevelUseCase` creates V2 evaluation only from authored client policy and exact profile lookups. `MultiStyleEvaluator` independently evaluates targets; `StyleChannelPolicy` blends composition exactly once. `RoomOccupancyProfile` measures floor coverage with versioned fixed grid input, `SpatialPreferenceEvaluator` maps authored density/free-area rules, and `ClientPriorityEvaluator` normalizes `functional-scenario` and `spatial-preferences` satisfaction. `ThreeChannelScoreAggregator` applies authored `0.5/0.2/0.3` weights.[3] [4]

`ScorecardCalibrationPolicy` still owns raw-vs-display stars, critical caps and `completionEligible`. `MultiChannelViolationImpactPolicy` recomputes exact counterfactual impact per V2 diagnostic. `MultiChannelEvaluationExplanationAssembler` produces immutable explanation V2; `EvaluationView` renders supplied channels, labels, facts and remediation only. `GameController` forwards `evaluationSpec` and validated presentation intent, never recreating game policy.[5] [6]

### Profile and campaign

```text
Browser-local profile → migration/validation → PlayerProfile
Completion → record use case → ProgressionPolicy → level selection refresh
```

Player settings and completed level progress are persisted in profile schema V3. Unlocks are derived from authored campaign levels and Application completion result, not UI state.

## Core contracts

| Contract | Purpose | Owner |
|---|---|---|
| `PlayerProfile v3` | Local profile, settings and completed levels. | Domain + Infrastructure persistence boundary |
| Item catalog V3 | 34 authored items, feature vectors and semantic interaction profiles. | `data/items`, JSON schema, catalog loader |
| Level definition | Bounds, available items, initial placement, ClientBrief and presentation references, prerequisites. | `data/levels`, topology-only level schema |
| `PresentationEnvironmentProfile v2` | Closed-preset visual scene policy and ambient fixture ownership. | `data/presentation`, JSON schema, Infrastructure repository and Presentation resolver |
| `InteractionProfile v1` | Affordances, local front axis and usable sides. | Domain item semantics |
| `FunctionalLayoutRule v1` | Adjacency or directional `front-adjacency` functional relationships. | Domain ergonomics |
| `RequiredFunctionalScenario v1` | Client-required affordance roles/cardinality, independently evaluated when anchors are absent. | ClientBrief policy, Domain ergonomics and LoadLevel hydration |
| `ClientBrief v2` | Bound client identity, target weights, explicit priority rules, spatial preferences and evaluation policy. | `data/briefs`, schema, validated repository, Domain value and LoadLevel hydration |
| `StyleConstraintCatalog v1` | Exact style profile ID, label and constraints. | `data/styles`, schema, Infrastructure adapter and V2 hydration |
| `ScoringParameters v2` | Channel weights, style blend, grid size, density profiles, star thresholds and critical cap. | `data/scoring`, schema, runtime validation and Domain policies |
| `EvaluationSpec v1` | Frozen V2 evaluation inputs reproducible from a loaded level/brief/profile catalog. | Application DTO boundary |
| `EvaluationExplanation v2` | Immutable causal rule/fact/priority/remediation/impact/instance snapshot for result panel. | Domain impact policy, Application assembly, feedback adapter and Presentation rendering |
| BuildInfo / release manifest | Build identity for release verification. | Release pipeline |

## Non-negotiable invariants

1. UI does not calculate score, progression or economy.
2. Domain has no browser, Three.js, storage, network or JSON dependencies.
3. Infrastructure has no gameplay policy.
4. Every persisted or authored contract is versioned and validated.
5. Deterministic outcomes are reproducible from saved state and authored inputs.
6. Functional matches are evaluated before generic clearance exclusions, so valid pairs are not double-penalized.
7. Required client scenarios are evaluated independently of existing anchors; relationship quality never substitutes for scenario presence.
8. Style mixing and client preferences are interpreted only from explicit brief policy; no global default aesthetic or fuzzy style fallback is hidden in UI/evaluator.
9. Presentation environment and visual style labels are not gameplay evaluator inputs; visual ownership is explicit in versioned authored content.
10. Completion eligibility is produced by calibrated Domain/Application evaluation and forwarded by UI; it is never inferred from presentation state or a UI-side star comparison.
11. Per-diagnostic recovery is an exact Domain counterfactual and authored remediation is supplied through Application; Presentation may render or focus an instance but cannot apportion impact.

## Verification

```bash
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

The test suite covers Domain invariants, Application orchestration, content/schema contracts, presentation wiring and documentation requirements. Build generates the release manifest, validates `src/main.js`, produces `dist/index.html` and copies runtime JSON to `dist/data/`.[2]

For detailed content authoring see [Content model](../systems/content-model.md). For decisions see [ADR](../adr/). For release operation see [Release runbook](../operations/release-runbook.md).

## References

[1]: ../../src/main.js "Composition root"
[2]: ../../src/Infrastructure/DataLoaders/staticDataAssets.js "Static asset inventory"
[3]: ../../src/Application/UseCases/LoadLevelUseCase.js "V2 evaluation spec hydration"
[4]: ../../src/Domain/Scoring/ThreeChannelScoreAggregator.js "Three-channel scoring aggregate"
[5]: ../../src/Application/UseCases/EvaluateRoomUseCase.js "Evaluation orchestration"
[6]: ../../src/Application/Services/MultiChannelEvaluationExplanationAssembler.js "Explanation V2 assembly"
