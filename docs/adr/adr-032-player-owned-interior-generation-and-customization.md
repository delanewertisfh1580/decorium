# ADR-032: Player-owned interior generation and progression-gated configuration

**Status:** Accepted  
**Date:** 22 August 2026

## Context

Earlier presentation profiles and room composition work allowed ambient fixtures, built-ins, surface treatments and composition assets to render player-visible room interior independently of `RoomState`. That model made ownership ambiguous: an initial TV, shelf, wallpaper or decor might be visible but not selectable, removable, persisted or evaluated as a catalog instance. It also separated visual customization from campaign progression.

This decision supersedes the interior-ownership portions of [ADR-016](adr-016-authored-presentation-environment-profiles.md), [ADR-023](adr-023-versioned-room-identity-selectors.md) and [ADR-024](adr-024-room-composition-asset-backed-environment.md). Their historical rationale remains valid where it concerns static delivery or presentation isolation, but their fixture/built-in/room-composition interior model is no longer current.

## Decision

All visible non-structural interior inside the playable room is player-owned. It is either a `RoomState` catalog placement or one of the two player-owned surface slots. Initial design is generated from Level V2's `interiorRecipeId` and seed, not from a profile fixture or `initialPlacement` block.

| Area | Chosen contract | Boundary |
|---|---|---|
| Items | Catalog V5 base/variant registry with finite visual/dimension/feature deltas and `unlockId`. | Domain resolves configuration; Application validates entitlement. |
| Initial design | Interior recipe V1 with canonical catalog placements. | `RoomInteriorGenerator` creates deterministic baseline `RoomState`. |
| Room surfaces | Surface finish catalog V1 and `RoomState.surfaceConfiguration`. | Renderer resolves selected IDs; Application validates surface type/unlock. |
| Progression | PlayerProfile V4 inventory plus reward catalog V1. | Reward grants are idempotent and never calculated by UI. |
| Persistence | Browser-local design snapshots scoped to `profileId + levelId`. | Start restores valid saved design; reset restores immutable recipe baseline. |
| Scene | Presentation environment V3 contains shell, openings, camera, lighting, exterior and atmosphere only. | No fixtures, interior GLB compositions, built-ins, TV, wallpaper or decorative props. |

`LocationEnvironmentSystem` and `SceneLifeSystem` cannot create playable-room interior or expose fixture movement. `RoomView` renders player placements and selected floor/wall finishes. Catalog instance mutation always targets canonical `catalogItemId#ordinal`.

## Consequences

The player can select, move, delete and configure every initial item. A TV used by functional policy is a catalog item in a recipe rather than an ambient screen. Existing profile V3 data migrates to V4 starter unlocks, and old room fixtures no longer have a persistence or interaction path.

There is a deliberate content cost: authors must create catalog entries and recipe placements for all interior objects. This is accepted because it makes ownership, scoring inputs, save state and progression reviewable. Cosmetic variants do not affect score unless an authored resolved feature vector explicitly changes; a mesh, material name or UI swatch never creates gameplay policy.

## Verification

The implementation is accepted only when schema/content tests validate V5/V2/V1/V3 data, `RoomInteriorGenerator` and configuration entitlement tests pass, renderer ownership tests prove the absence of auto-spawn interior, per-profile design persistence is covered, and production build/audit/browser smoke succeed.

## References

[1]: ../architecture/overview.md "Current architecture"
[2]: ../systems/content-model.md "Current authored content contracts"
[3]: ../../src/Domain/Rooms/RoomInteriorGenerator.js "Deterministic baseline generation"
[4]: ../../src/Presentation/Scene/LocationEnvironmentSystem.js "Exterior-only scene system"
