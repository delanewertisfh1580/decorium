# ADR-020 — PBR texture baking pipeline for furniture assets

**Статус:** Accepted

**Дата:** 15 августа 2026 г.

**Продолжает:** [ADR-019 — Asset-backed furniture presentation](adr-019-asset-backed-furniture-presentation.md)

## Контекст

ADR-019 established versioned GLB prefabs, source caching and a procedural compatibility fallback. That decision improves silhouette fidelity but does not by itself guarantee readable material differentiation under production room lighting. Uncalibrated mesh colours or renderer-default roughness flatten upholstery, wood and metal into visually similar surfaces, while asset-specific lighting workarounds would make room presentation non-reproducible and difficult to maintain.

The furniture pipeline needs a repeatable way to ship compact material information inside a GLB, preserve a stable game-camera response and remain strictly outside deterministic game rules. It must also support explicit validation of material maps, UV availability and byte budget before a pack reaches runtime.

## Решение

Furniture packs that declare PBR delivery use a **versioned, reproducible high-to-low bake workflow** with these source and runtime conventions.

| Concern | Decision |
|---|---|
| Authoring source | A headless Blender Python script is the reproducible source for each pack’s GLBs and calibrated materials. |
| Colour data | Base colour is authored/exported as sRGB texture data on UV0. |
| Surface detail | Tangent-space normal texture is authored/exported as non-colour data on UV0. |
| Packed material data | ORM texture is non-colour data on UV0: red is ambient occlusion, green is roughness and blue is metallic. |
| AO coordinates | Each render mesh includes UV1; a post-export pass binds the ORM texture as glTF `occlusionTexture` using UV1. |
| Runtime lighting | `RoomView` creates a PMREM-prefiltered `RoomEnvironment` and disposes it with the view. |
| Content boundary | A versioned asset manifest declares paths, required PBR bindings and per-asset / pack byte budgets. |
| Failure behaviour | GLB load or PBR material failure preserves the immediate procedural visual; gameplay input and deterministic evaluation continue. |

The composition root may provide several manifests to `FurnitureAssetRepository`. The repository merges mappings, caches source GLB scenes and returns material-isolated clones. It does not decide score, progression, unlocks, gameplay dimensions or item placement semantics.

> Render assets enrich the player’s visual evidence; they are never the source of score, collision, interaction semantics or persisted room truth.

## Consequences

| Area | Consequence |
|---|---|
| Material quality | Upholstery, wood and metal can remain visually distinct through base colour, normal, roughness, metallic and AO response rather than relying on flat colour alone. |
| Production repeatability | Blender source, manifest and post-process script make pack output inspectable and regenerable without manual editor steps. |
| Runtime resilience | The existing asynchronous upgrade retains responsive placement and the procedural fallback remains available for unavailable or invalid assets. |
| Performance | Texture/map additions increase payload; explicit pack and per-asset budgets become content acceptance gates. |
| Resource lifecycle | PMREM environment resources must be owned and disposed by `RoomView` to avoid GPU/resource leaks when a room is rebuilt. |
| Architecture | Domain, Application and persisted room data remain independent from Three.js materials, GLB paths, UVs, PMREM and bake details. |

## Rejected alternatives

1. **Single flat material colours.** Rejected because they cannot convey reliable material separation across different authored room lights.
2. **Unpacked individual AO, roughness and metallic textures.** Rejected because three separate material textures add avoidable requests and payload while glTF already supports packed metallic-roughness and occlusion channels.
3. **Use UV0 for AO by convention without an explicit UV1 contract.** Rejected because it weakens the authoring constraint and makes AO-coordinate correctness untestable per pack.
4. **Let individual assets create environment lighting.** Rejected because lighting becomes duplicated, non-uniform and difficult to dispose; the room owns lighting context.
5. **Adopt rendered mesh bounds for gameplay collision or scoring.** Rejected because render fidelity must not change deterministic authored gameplay semantics.
6. **Treat GLB load failure as placement failure.** Rejected because asset-delivery faults must not make core interaction unusable.

## Follow-up

The dining/table, storage and lighting packs reuse this decision. Each new PBR pack must add a red manifest contract, reproducible source, map/UV inspection, budget measurement, controlled visual preview and a browser smoke in an authored room profile. A later decision may replace or extend this pipeline only through a new ADR; it must preserve the Presentation-only and graceful-fallback boundaries established here.

## References

[1]: ../../data/visuals/lounge-pbr-assets.v1.json "Lounge PBR asset manifest v1"
[2]: ../../tools/create_lounge_pbr_assets.py "Reproducible lounge PBR authoring script"
[3]: ../../tools/add_gltf_ao_binding.mjs "glTF AO binding post-process"
[4]: ../../tests/Presentation/PbrEnvironmentWiring.test.js "PMREM room environment contract"
