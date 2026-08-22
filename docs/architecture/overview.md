# Architecture overview

**Статус:** Active production reference
**Обновлено:** 22 августа 2026 г.

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
| `src/Presentation` | Browser adapters, Three.js scene, DOM views и тонкая композиция пользовательских intent-ов. | `GameController` façade, `LevelSessionCoordinator`, `RoomInteractionCoordinator`, `EvaluationCoordinator`, `RoomView`, DOM views. |
| `data` | Versioned authored content and schemas. | Catalog V4 with complete semantic behavior, topology-only levels, ClientBrief V2, style profiles, feedback, scoring parameters V2 and visual profiles. |

## Runtime flows

### Bootstrap and content loading

```text
Static JSON + schemas → Infrastructure validation/loaders → Domain values
  → LoadLevelUseCase → immutable LevelDTO/evaluationSpec → controller and views
```

Static asset inventory ensures Vite publishes every runtime JSON next to the built HTML. Content is validated at the Infrastructure boundary before use cases receive it. Active production bootstrap loads the V4 item catalog/schema, V2 brief catalog/schema and V1-versioned exact style-profile catalog/schema.[2]

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
Player intent → KeyboardIntentRouter / DOM view → GameController façade
  → RoomInteractionCoordinator → Application mutation use case → RoomState
Evaluate → EvaluationCoordinator → EvaluateRoomUseCase
  → MultiStyleEvaluator + StyleChannelPolicy → style score
        → RoomOccupancyProfile + SpatialPreferenceEvaluator + ClientPriorityEvaluator → priority score
        → SpatialErgonomicsEvaluator → ergonomics score
        → ThreeChannelScoreAggregator → ScorecardCalibrationPolicy
        → MultiChannelViolationImpactPolicy → MultiChannelEvaluationExplanationAssembler → EvaluationView
Explanation focus intent (`instanceId`) → EvaluationCoordinator validation
  → RoomInteractionCoordinator selection → RoomViewModel rendering
Calibrated result (`stars`, `completionEligible`) → RecordLevelCompletionUseCase → ProgressionPolicy
```

`LoadLevelUseCase` creates V2 evaluation only from authored client policy and exact profile lookups. `ClientBrief` owns a typed immutable `EvaluationPolicy` graph, including completion, composition and hydrated ergonomics rules; the use case resolves style profiles but never rehydrates those nested rules. `ScoringPolicy` is likewise an immutable explicit dependency created in `main.js`, with no process-global scoring configuration. `RoomState` assigns every placed entity the canonical `catalogItemId#ordinal` instance ID and accepts that ID, never a catalog ID, for move, rotate and remove commands; catalog lookup is read-only and returns all matching instances. `CatalogValidator` and `Item` reject any record without immutable `InteractionProfile` and `SpatialBehavior`; no runtime creates default semantics or derives behavior, composition capability or other gameplay policy from type or mesh. `CompositionEvaluator` evaluates only authored `requiredAffordances`; `MultiStyleEvaluator` independently evaluates targets; `StyleChannelPolicy` blends composition exactly once. `RoomOccupancyProfile` and `ClearanceEvaluator` consider only `SpatialBehavior.isFloorObstacle`, then `SpatialPreferenceEvaluator` maps authored density/free-area rules and `ClientPriorityEvaluator` normalizes `functional-scenario` and `spatial-preferences` satisfaction. `ThreeChannelScoreAggregator` applies authored `0.5/0.2/0.3` weights.[3] [4] [7]

`ScorecardCalibrationPolicy` still owns raw-vs-display stars, critical caps and `completionEligible`. `MultiChannelViolationImpactPolicy` recomputes exact counterfactual impact per unique V2 `diagnosticId`; the rule-level `constraintId` remains a separate reference. `MultiChannelEvaluationExplanationAssembler` produces immutable explanation V2; `EvaluationView` renders supplied channels, labels, facts and remediation only. `GameController` is a composition façade: it owns browser-view lifecycle and delegates level lifecycle, room interaction/undo, and evaluation/completion to dedicated coordinators. It never recreates game policy.[5] [6] [8]

### Presentation use-case boundaries

```text
GameController façade
  ├─ LevelSessionCoordinator
  │    StartLevelSessionUseCase → LoadLevelUseCase + initial persistence
  │    ReadRoomStateUseCase → authoritative state refresh
  │    ResetRoomAttemptUseCase → empty attempt with preserved bounds
  ├─ RoomInteractionCoordinator
  │    placement, movement, rotation, deletion, undo, preview and transient selection
  └─ EvaluationCoordinator
       evaluation, calibrated completion, result invalidation and explainability focus
```

`RoomInteractionCoordinator` owns UI-transient selection, ghost placement and its `UndoBuffer`; it invokes existing mutation use cases but contains no score, completion or persistence policy. `LevelSessionCoordinator` owns the loaded `LevelDTO` and `RoomViewModel` lifecycle. Its Application contracts expose structured room-state results, so Presentation no longer reads or writes `RoomRepository` directly. `EvaluationCoordinator` forwards authored `evaluationSpec`, completion eligibility and explainability data without deriving scoring inputs. `GameDashboardView` and `TransientStatusView` own their DOM rendering and teardown; `KeyboardIntentRouter` owns the capture-phase keyboard subscription.[8] [9] [10] [11]

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
| Item catalog V4 | 34 authored items with feature vectors, non-empty semantic roles and required spatial behavior. | `data/items`, JSON schema, catalog loader |
| Level definition | Bounds, available items, initial placement, ClientBrief and presentation references, prerequisites. | `data/levels`, topology-only level schema |
| `PresentationEnvironmentProfile v2` | Closed-preset visual scene policy and ambient fixture ownership. | `data/presentation`, JSON schema, Infrastructure repository and Presentation resolver |
| `InteractionProfile v1` | Functional/semantic affordances, local front axis and usable sides. | Domain item semantics |
| `SpatialBehavior v1` | Explicit placement kind, occupancy, clearance and support participation. | Domain item semantics, catalog V4, occupancy and clearance consumers |
| `FunctionalLayoutRule v1` | Adjacency or directional `front-adjacency` functional relationships. | Domain ergonomics |
| `RequiredFunctionalScenario v1` | Client-required affordance roles/cardinality, independently evaluated when anchors are absent. | ClientBrief policy, Domain ergonomics and LoadLevel hydration |
| `ClientBrief v2` | Bound client identity, target weights, explicit priority rules, spatial preferences and evaluation policy. | `data/briefs`, schema, validated repository, Domain value and LoadLevel hydration |
| `StyleConstraintCatalog v1` | Exact style profile ID, label and constraints. | `data/styles`, schema, Infrastructure adapter and V2 hydration |
| `ScoringPolicy v2` | Immutable channel weights, style blend, grid size, density profiles, star thresholds and critical cap. | `data/scoring`, `ScoringPolicy` runtime validation and explicit injection into Domain policies |
| `EvaluationSpec v1` | Frozen V2 evaluation inputs reproducible from a loaded level/brief/profile catalog. | Application DTO boundary |
| `RoomStateResultDTO` | Immutable success/error transport for read/reset room-session commands. | Application DTO boundary |
| `EvaluationExplanation v2` | Immutable causal `diagnosticId`/rule/fact/priority/remediation/impact/instance snapshot for result panel. | Domain impact policy, Application assembly, feedback adapter and Presentation rendering |
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
12. Floor occupancy and generic clearance are derived only from authored `SpatialBehavior`; an item without the explicit contract does not participate, while V4 catalog hydration rejects it. Visual footprint, item type and mesh cannot create or remove an obstacle.
13. A placed entity is identified only by its canonical `catalogItemId#ordinal` instance ID. Catalog IDs may select zero or more instances but cannot target mutation, feedback focus or causal evidence.
14. `GameController` may compose views and coordinators, but room mutation, undo, level session state, completion and evaluation flows belong to their dedicated coordinator/Application boundaries.
15. Presentation reads or resets room state only through room-session use cases; it must not call a room repository directly.

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
[7]: ../../src/Domain/Items/SpatialBehavior.js "V4 semantic behavior"
[8]: ../../src/Presentation/Controllers/GameController.js "Presentation composition façade"
[9]: ../../src/Presentation/Controllers/LevelSessionCoordinator.js "Level session lifecycle"
[10]: ../../src/Presentation/Controllers/RoomInteractionCoordinator.js "Mutation, undo and transient interaction"
[11]: ../../src/Presentation/Controllers/EvaluationCoordinator.js "Evaluation and completion coordinator"
