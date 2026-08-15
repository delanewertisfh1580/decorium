# ADR-023 — Versioned room identity selectors in presentation profiles

**Статус:** Accepted

**Дата:** 15 августа 2026 г.

**Продолжает:** [ADR-016 — Authored presentation environment profiles](adr-016-authored-presentation-environment-profiles.md)

## Контекст

The initial presentation-profile contract chose floor, wall, openings, camera, lighting, exterior and a small list of ambient fixtures. Although the profiles were versioned, much of their visual identity was still hardcoded in scene builders: generic wall treatment, a generic pendant/planter pair and a generic street. That made authored profiles insufficient to express a room’s lasting architectural character and made visual review depend on implementation code rather than declared content.

The media level adds an important constraint. Its player-placed `tv-001` is a deterministic `view-target` for the lounge functional-layout rule. A built-in visual television cannot quietly become a second target; it would change the meaning of a room without a saved gameplay input or an authored rule change.

## Решение

Presentation environment catalog v2 adds a required `room.identity` object with three closed selectors:

| Selector | Owner | Purpose |
|---|---|---|
| `wallTreatmentPreset` | `RoomView` | Profile-owned wall covering, panels, rails and graphic treatment. |
| `builtInPreset` | `LocationEnvironmentSystem` | Readable built-in landmark such as library, media wall or gallery rail. |
| `exteriorCompositionPreset` | `LocationEnvironmentSystem` | Profile-owned facade foreground composition beyond base street colours. |

`EnvironmentProfilePlan` maps selectors to immutable Presentation values. The plan never crosses into Domain/Application rules. Built-ins contain an explicit `semantic` flag; all PROD-016 built-ins are `semantic: false`.

> A visible display is not a functional `view-target`. Only a separately authored semantic-fixture slice may define a deterministic relationship between a room fixture and evaluator logic.

## Consequences

| Area | Consequence |
|---|---|
| Authored content | Each profile declares its visual identity in reviewable, schema-validated JSON instead of relying on generic hardcoded décor. |
| Scene lifecycle | `RoomView` disposes prior room-owned geometry before rebuild; `LocationEnvironmentSystem` continues owning and disposing fixed interior/exterior content. |
| Gameplay determinism | Existing item IDs, room dimensions, score inputs, rules, unlocks and persistence remain unchanged. |
| Visual quality | The three rooms gain clearly different warm-library, urban-media and studio-gallery landmarks under their existing cameras. |
| Future evolution | New identity preset requires schema vocabulary, profile data, plan resolution, red contract and visual acceptance. |

## Rejected alternatives

1. **Put built-in geometry directly into level initial placement.** Rejected because level state is gameplay data; decorative scene objects must not become persisted items, hit targets or score inputs.
2. **Infer visual identity from `styleId`.** Rejected because production direction is client-brief-driven and multi-style; a room’s architectural identity is not a synonym for style scoring.
3. **Treat a decorative media screen as `tv-001`.** Rejected because this would silently satisfy a deterministic lounge relationship and break the player’s explicit placement task.
4. **Keep profile identity as scene-builder conditionals only.** Rejected because no schema can validate, content-review or version those decisions.
5. **Create arbitrary runtime wallpaper or décor without a preset.** Rejected because deterministic review, assets and performance budgets require declared authored selectors.

## Follow-up

A separate ambient-life slice may add versioned exterior route variants and animal states. It must remain Presentation-only, have explicit performance bounds and cannot mutate player state or evaluator inputs. A semantic built-in television, if product later requires one, needs a separate ADR and a deterministic authored gameplay contract.

## References

[1]: ../../data/presentation/environment-profile.v2.schema.json "Presentation environment profile v2 schema"
[2]: ../../data/presentation/environment-profiles.v2.json "Authored room identity profiles"
[3]: ../slices/PROD-016-authored-room-identity-baseline.md "PROD-016 delivery report"
[4]: adr-016-authored-presentation-environment-profiles.md "ADR-016 authored presentation profiles"
