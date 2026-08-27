# Architecture overview

**Статус:** Active production reference
**Обновлено:** 22 августа 2026 г.

Decorium — статическое Vite-приложение на JavaScript ES modules с Three.js presentation и Clean Architecture ядром. Проект использует Three.js 0.160, AJV 8, Vitest 4 и versioned JSON content. `src/main.js` — единственный composition root: он создаёт validated infrastructure adapters и передаёт их в Application use cases.[1]

## Направление зависимостей

```text
Presentation → Application → Domain ← Infrastructure
```

Presentation не владеет доменным состоянием, policy, repository или schema validation. Domain не импортирует Three.js, DOM, browser storage, fetch или JSON. Infrastructure доставляет и хранит данные, но не определяет оценку, progression или entitlement. Все пользовательские команды проходят через Application boundary.[1]

## Слои и ответственность

| Слой | Ответственность | Основные компоненты |
|---|---|---|
| `Domain` | Детерминированные entities, value objects и игровые правила. | `Item`, `ItemVariant`, `RoomState`, `RoomInteriorGenerator`, `SurfaceConfiguration`, scoring и progression policies. |
| `Application` | Оркестрация, immutable DTO и entitlement-protected commands. | Level load/generation, configure item/surface, session, rewards, evaluation и completion. |
| `Infrastructure` | JSON validation/loaders, local persistence и ports. | V5 catalog, V2 levels, V3 environment, recipe/finish/reward catalogs, V4 profile/design repositories. |
| `Presentation` | Three.js/DOM adapters и transient UI coordination. | `GameController`, session/interaction/evaluation coordinators, `RoomView`, `DesignInspectorView`. |
| `Operations` | Build/release contracts isolated from gameplay. | BuildInfo, release verifier and CI-facing manifests. |
| `data` | Authoritative versioned content. | Catalog V5, levels V2, recipes/finishes/rewards V1, environments V3, briefs V2, styles/scoring. |

## Versioned content model

| Contract | Version | Purpose |
|---|---:|---|
| Item catalog | V5 | Base and finite authored visual/material/size variants with `unlockId`. |
| Level | V2 | Topology, available catalog subset, `interiorRecipeId`, seed, player-owned surface defaults, brief and presentation references; no `initialPlacement`. |
| Interior recipe | V1 | Deterministic initial catalog placements, each materialized as a player-owned `RoomState` instance. |
| Surface finish catalog | V1 | Floor/wall finish slots with render data and `unlockId`. |
| Reward catalog | V1 | Idempotent completion grants for variants and finishes. |
| Presentation environment | V3 | Structural shell, openings, camera, lighting, exterior and atmosphere only. |
| Player profile | V4 | Settings, completion history and inventory `{ unlockedIds, grantedRewardIds }`. |
| Scoring policy | V2 | Validated explicit channel weights, style blend, occupancy, density, star thresholds and critical cap. |
| Endless blueprint catalog | V1 | Versioned authored generation envelopes: client, priority feedback key, available catalog pool, room ranges, surfaces, environment, style and evaluation policy. |

> **Ownership rule.** Каждый видимый объект внутри playable room обязан быть либо catalog instance в `RoomState`, либо player-owned floor/wall surface slot. Structural shell, openings, exterior и atmosphere могут быть неуправляемыми, но не являются интерьером.

## Загрузка, генерация и persistence

```text
Validated Level V2 + ClientBrief V2 + Item V5 + recipe/finishes V1 + PlayerProfile V4
  → LoadLevelUseCase
  → restore profile+level design OR RoomInteriorGenerator baseline
  → immutable LevelDTO → StartLevelSessionUseCase / ScopedRoomRepository
  → RoomView + coordinators
```

`LoadLevelUseCase` validates authored references, profile unlocks, recipe, V3 environment и default surfaces. It restores a valid profile-scoped snapshot when available; otherwise `RoomInteriorGenerator` materializes recipe + seed. The immutable recipe baseline is retained separately, therefore reset restores authored player-owned interior instead of an empty room. `ScopedRoomRepository` mirrors successful live mutations into `BrowserLocalRoomDesignRepository`; Presentation never reads/writes that persistence directly.[2] [3] [4]

`RoomState` assigns placements canonical `catalogItemId#ordinal`. Move, rotate, remove, configuration, undo and explainability focus target instance ID only. Its snapshot includes per-instance resolved configuration and `SurfaceConfiguration`, decoupling restore from renderer implementation.[5]

`GenerateEndlessLevelUseCase` takes an unsigned seed and turns one V1 blueprint into a deterministic `LevelDTO` with `mode: 'endless'`, identity `endless-{seed}`, a generated catalog-only baseline, explicit run metadata, an authored client-priority feedback key and the same V3 evaluation contracts as campaign content. `StartEndlessSessionUseCase` registers that baseline as an **ephemeral** `ScopedRoomRepository` scope: save and reset work for the active run, but browser design persistence, `lastSession`, campaign completion, unlocks and rewards remain untouched.[13] [14] [15]

## Configuration and progression

```text
DesignInspectorView → RoomInteractionCoordinator
  → ConfigurePlacedItemUseCase / ConfigureRoomSurfaceUseCase
  → Application unlock validation against PlayerProfile V4
  → RoomState mutation + persistent scoped repository
  → refresh, evaluation invalidation and undo
```

There is no arbitrary scale slider. The player selects only finite authored color/material/size variants. Application rejects unknown or locked variants, finish IDs or incompatible surface slots before mutation. UI may show a locked option but contains no policy and cannot bypass entitlement validation.[6] [7]

`RecordLevelCompletionUseCase` delegates campaign progression grants to `GrantProgressionRewardsUseCase`. Reward IDs are idempotent: replay cannot grant the same entitlement twice. A new profile is propagated through the active controller so unlocked options appear in the inspector. `EvaluationCoordinator` renders endless results through the shared feedback/HUD flow but never invokes that campaign completion path when `LevelDTO.mode === 'endless'`.[8] [16]

## Evaluation and scene boundary

`ClientBrief` owns an immutable typed graph containing client identity, authored client voice, completion, composition and hydrated ergonomics rules. `LoadLevelUseCase` resolves exact style profiles but never derives policy from topology or visuals. `ScoringPolicy` is an immutable explicit dependency created by `main.js`; no process-global scoring configuration exists. `CatalogValidator` rejects missing `InteractionProfile` or `SpatialBehavior`; no runtime infers gameplay behavior from type, name or mesh. `CompositionEvaluator`, occupancy, clearance, passages, functional rules and three-channel aggregation consume authored semantics/policy only.[9]

```text
LevelDTO.presentationEnvironment V3 → EnvironmentProfilePlan
  → RoomView: shell/openings/camera/light/exterior/atmosphere
RoomState placements + surfaceConfiguration
  → RoomView + ItemVisualFactory: all player interior
```

`EnvironmentProfilePlan` does not export surfaces, fixtures, built-ins or TV state. `LocationEnvironmentSystem` produces exterior/atmosphere only and exposes no fixture interaction. `SceneLifeSystem` accepts no room-composition asset repository. Thus no hidden GLB/preset path can inject furniture, TV, wallpaper, decor, shelf, mirror or cat into the playable room.[10] [11] [12]

## Presentation use-case boundaries

| Owner | Delegates to Application | Must not do |
|---|---|---|
| `LevelSessionCoordinator` | start, read and reset session. | Access repository or build baseline directly. |
| `RoomInteractionCoordinator` | place/move/rotate/remove/configure commands. | Compute unlock, score, reward or persistence policy. |
| `EvaluationCoordinator` | evaluate, pass the active ClientBrief to the final review view and record completion. | Infer eligibility or client voice from UI state. |
| `GameController` | Compose views/coordinators and route explicit campaign/endless session commands. | Own `RoomState`, schema, score/reward policy or fixture interaction. |
| `MainMenuView` + bootstrap | Render navigation only; request campaign list or a seed-based run through callbacks/use cases. | Read repositories, derive unlock/reward policy or persist designs. |

## Non-negotiable invariants

1. UI does not calculate score, progression, reward, unlock or economy.
2. Domain has no browser, Three.js, storage, network or JSON dependencies.
3. Every authored/persisted contract is versioned and validated at Infrastructure boundary.
4. Baseline/reset is deterministic from recipe + seed; design scope is `profileId + levelId`.
5. There are no automatic fixtures, built-ins, preset TV, wallpaper or decor inside room bounds.
6. Item variants and finishes are finite authored options; Application validates ownership before mutation.
7. V3→V4 profile migration seeds compatibility unlocks and reward grants stay idempotent.
8. Score depends on authored resolved gameplay data, never UI label, visual mesh, asset or ambient scene state.
9. Every mutation targets canonical instance ID, never catalog ID.
10. Presentation reads/resets room state only through use cases.
11. Campaign and endless modes are explicit `LevelDTO.mode` values: only campaign may write profile-scoped designs, last-session state, completion, reward or unlock data.
12. A generated run must be reproducible from its V1 blueprint catalog and seed; diagnostic feedback keys are authored by its selected blueprint, never invented by Presentation.

## Verification

```bash
npm test
npm run build
npm audit --omit=dev --audit-level=high
git diff --check
```

Verification covers schema/content hydration, recipe determinism, entitlement commands, V3→V4 migration, idempotent rewards, per-profile designs, no-auto-interior renderer ownership, coordinator/UI wiring, production build and audit.[2] [6] [8] [10]

## References

[1]: ../../src/main.js "Composition root"
[2]: ../../src/Application/UseCases/LoadLevelUseCase.js "V2 load and restore"
[3]: ../../src/Domain/Rooms/RoomInteriorGenerator.js "Deterministic recipe generation"
[4]: ../../src/Infrastructure/Repositories/ScopedRoomRepository.js "Profile-level design persistence"
[5]: ../../src/Domain/Rooms/RoomState.js "Instance and surface configuration state"
[6]: ../../src/Application/UseCases/ConfigurePlacedItemUseCase.js "Variant entitlement"
[7]: ../../src/Application/UseCases/ConfigureRoomSurfaceUseCase.js "Surface entitlement"
[8]: ../../src/Application/UseCases/GrantProgressionRewardsUseCase.js "Idempotent grants"
[9]: ../../src/Domain/Scoring/ScoringPolicy.js "Explicit scoring policy"
[10]: ../../src/Presentation/Scene/EnvironmentProfilePlan.js "V3 shell and atmosphere plan"
[11]: ../../src/Presentation/Scene/LocationEnvironmentSystem.js "Exterior-only environment"
[12]: ../../src/Presentation/Views/RoomView.js "Player-owned room renderer"
[13]: ../../src/Application/UseCases/GenerateEndlessLevelUseCase.js "Deterministic endless DTO assembly"
[14]: ../../src/Application/UseCases/StartEndlessSessionUseCase.js "Ephemeral generated-run entry"
[15]: ../../src/Infrastructure/Repositories/ScopedRoomRepository.js "Campaign versus ephemeral persistence scopes"
[16]: ../../src/Presentation/Controllers/EvaluationCoordinator.js "Mode-safe evaluation completion"
