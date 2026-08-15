# ADR-016 — Authored versioned presentation environment profiles

**Статус:** Accepted
**Дата:** 15 августа 2026 г.

## Контекст

До PROD-010 все authored levels рендерились через практически один presentation environment: общий room shell, exterior, lighting, ambient cat and television assumptions. Level-specific tasks, catalog availability и functional rules менялись, но visual identity оставалась близкой к одной комнате. Это снижало ценность campaign progression и противоречило production direction: Decorium — multi-style, client-brief-driven interior design game, а не Scandinavian-only room simulator.

Нельзя решать различия копированием Three.js conditionals по `levelId` в `RoomView` или `LocationEnvironmentSystem`. Такой подход смешивает authoring policy и renderer implementation, делает level expansion дорогой, а residual global elements трудно обнаружимыми. Нельзя также помещать visual fields в Domain, поскольку scoring должен быть воспроизводимым из gameplay inputs и не зависеть от Three.js or browser rendering.

## Решение

Вводится `PresentationEnvironmentProfile v1` как strict versioned content contract. Каждый shipped level обязан содержать `presentationProfileId`. Profile catalog определяет closed preset vocabulary для room surfaces, openings, camera, lighting, exterior, scene-life и ambient fixture ownership. Infrastructure validates catalog and exposes it through `PresentationEnvironmentRepository`; Application hydrates exact profile into `LevelDTO.presentationEnvironment`.

Presentation layer преобразует profile в immutable `EnvironmentProfilePlan`. `RoomView` применяет plan к room rebuild, camera and lights. `SceneLifeSystem` и `LocationEnvironmentSystem` обязаны получать plan explicitly. No renderer may silently invent an authored fallback profile.

> Presentation environment is authored display policy. It must never become a Domain scoring signal or a hidden progression/economy rule.

TV не является ambient fixture V1. Он остаётся player-placeable catalog item. Resting cat является ambient fixture только profile `warm-starter-living`; media corner and studio receive their own non-cat décor. This makes visible scene ownership reviewable from content rather than inferred from global renderer defaults.

## Последствия

| Область | Последствие |
|---|---|
| Authoring | Новый level выбирает established presentation profile by ID; новые aesthetic variants добавляются через versioned schema/catalog decision, not renderer branching. |
| Validation | Missing or unknown profile references fail during content loading before a room can render. |
| Determinism | Same profile contract resolves to same frozen visual plan. This determinism is presentation-local and independent from game scoring. |
| Clean Architecture | Domain remains unaware of profile, Three.js, JSON and browser API. Infrastructure remains a transport/validation adapter. |
| Scene ownership | Cat, ambient furniture, exterior activity and profile décor are explicit. A globally baked television is prohibited. |
| Lifecycle | Profile ID participates in RoomView rebuild, preventing stale lighting or ambient geometry after campaign level change. |
| Quality | Media-dusk keeps an authored darker mood while an automated minimum-light contract prevents unusably dark performance-tier presentation. |

## Alternatives

1. **One renderer configuration with cosmetic level labels.** Rejected because it preserves the original visual sameness and makes progression narratively weak.
2. **Switch on `levelId` inside Three.js view classes.** Rejected because authoring policy becomes unversioned implementation branches and each new level needs code deployment.
3. **Use free-form colors and mesh parameters in every level JSON.** Rejected for V1 because unrestricted values are hard to validate, review and evolve. Closed presets provide reliable vocabulary while still yielding distinct scenes.
4. **Add presentation fields to `StyleScore` or ergonomics evaluators.** Rejected because visual setting does not represent player placement quality and would violate the gameplay/presentation boundary.
5. **Keep television as a global ambient fixture.** Rejected because it makes media semantics visually confusing and masks the player’s action of placing an actual television asset.
6. **Place cat animation policy in this slice.** Rejected because richer cat behavior, player-provided bed/bowl interactions and hints form a separate behavior system; V1 only corrects ownership and removes the global wandering cat.

## Follow-up

PROD-011 addresses the separate catalog usability issue with persistent structured navigation: category tabs, search and scroll/selection continuity after placement. It must consume the existing catalog content contract rather than couple its UX state to presentation profile or evaluator logic.
