# ADR-021 — PBR asset-manifest conformance metadata

**Статус:** Accepted

**Дата:** 15 августа 2026 г.

**Продолжает:** [ADR-020 — PBR texture baking pipeline for furniture assets](adr-020-pbr-texture-baking-pipeline.md)

## Контекст

ADR-020 established the PBR texture workflow: base color, tangent-space normal, packed ORM, UV1 AO mapping and room-level PMREM response. Its first lounge pack successfully proved those conventions, but the manifest expressed only broad boolean PBR capabilities. A production content review still had to infer the shipped texture variant, the texture-set layout and UV1 requirement from the GLB itself.

As more asset packs are added, this implicit knowledge becomes a release risk. The content contract needs enough declarative metadata to make intended PBR delivery auditable before a room is rendered, while preserving the existing boundary: render assets must not influence score, progression, collision or persisted room semantics.

## Решение

Each versioned PBR asset-manifest entry declares the following conformance metadata in addition to its path, format, byte ceiling and PBR capability flags.

| Field | Meaning | Validation duty |
|---|---|---|
| `textureSet` | Texture layout expected by the asset, currently `basecolor-normal-orm`. | Inspect that base color, normal, metallic-roughness and occlusion bindings are present. |
| `textureVariant` | Delivery representation, currently `png-embedded`. | Enables future KTX2/PNG variants without changing gameplay content. |
| `requiresUv1` | AO material path needs a second UV set. | Inspect `TEXCOORD_0`, `TEXCOORD_1` and occlusion `texCoord: 1`. |
| `pbr` | Readable declaration of the player-visible material channels expected from the pack. | Contract-test PBR bindings and document the pack’s intended fidelity. |

The metadata belongs to a Presentation content manifest and is consumed only by presentation asset delivery and validation. Existing `FurnitureAssetRepository` multi-manifest merging, source caching, material-isolated clone behavior and procedural fallback remain unchanged.

> A manifest may describe how an item is rendered, but it must never define how an item is placed, scored, unlocked, persisted or evaluated.

## Consequences

| Area | Consequence |
|---|---|
| Content validation | PBR pack tests can now detect an AO texture bound to the wrong UV set before browser acceptance. |
| Asset evolution | Future compressed variants can be declared explicitly instead of relying on filename conventions or loader inference. |
| Runtime resilience | The manifest describes conformance but does not make asset delivery a prerequisite for item placement; the existing procedural fallback remains authoritative for failure handling. |
| Architecture | Domain/Application remain free of GLB and texture metadata; the new fields cannot enter deterministic gameplay inputs. |
| Authoring discipline | Every future PBR pack must provide UV0/UV1, map bindings and byte budgets as versioned, reviewable content. |

## Rejected alternatives

1. **Keep UV1 and texture layout as undocumented Blender conventions.** Rejected because export regressions would surface late, after visual review or at runtime.
2. **Infer texture variant from the GLB filename.** Rejected because names are not a versioned compatibility contract and prevent controlled migration to compressed variants.
3. **Move material validation to renderer-only best effort.** Rejected because release gates need deterministic, non-browser contract coverage.
4. **Persist PBR details in room or player data.** Rejected because a content rendering upgrade must not alter reproducible gameplay state or require profile migration.
5. **Fail item placement when declared metadata cannot be satisfied.** Rejected because a visual delivery fault must leave core interaction functional via the procedural fallback.

## Follow-up

The storage and lighting packs must adopt this metadata from their first red contract. A later KTX2 slice may introduce a second `textureVariant`, but it must preserve the explicit contract, asynchronous repository upgrade and fallback behavior from ADR-019 through ADR-021.

## References

[1]: ../../data/visuals/dining-table-pbr-assets.v1.json "Dining/table PBR asset manifest v1"
[2]: ../../tests/Infrastructure/DiningTablePbrAssetManifest.test.js "Dining/table PBR manifest conformance contract"
[3]: adr-020-pbr-texture-baking-pipeline.md "ADR-020 PBR texture baking pipeline"
