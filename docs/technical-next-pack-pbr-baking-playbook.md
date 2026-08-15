# PBR texture-baking playbook for the next Decorium furniture pack

## Решение в одном абзаце

Для каждого нового prefab нужен **low/mid-poly runtime mesh**, отдельный high-detail bake source, UV0 для base color / normal / ORM и UV1 для ambient occlusion. Из Blender экспортируется GLB с `baseColor`, tangent-space `normal` и упакованной `ORM`-картой, где **R = AO, G = roughness, B = metallic**. В runtime `GLTFLoader` уже создаёт PBR materials; дополнительный asset adapter не нужен, если GLB корректно содержит standard glTF textures. Это добавляет perceived depth, micro-surface response и contact darkening, но не заменяет хорошие silhouette, bevels и environment lighting.

> **Критическое ограничение:** normal map меняет освещение, а не геометрию. Поэтому buttons, piping и seams, которые должны менять silhouette или shadow, остаются mesh detail; мелкая weave/grain/detail идёт в normal/roughness. [3]

## Что запекать

| Карта | Роль в результате | Colour space | UV | Рекомендуемое применение |
|---|---|---|---|---|
| `baseColor` | Цвет, wood grain, fabric variation | sRGB | UV0 | Только albedo: без baked directional shadows и specular highlights. |
| `normal` | Stitching, wood pores, cushion grain, shallow seams | Non-Color / linear | UV0 | Tangent-space OpenGL normal. |
| `orm` | Contact darkening, surface response, metal mask | Non-Color / linear | UV0 for roughness/metal; UV1 for AO | R = AO, G = roughness, B = metallic. |
| `emissive` | Только LEDs / screens | sRGB | UV0 | Не использовать для fake lighting на мебели. |

The glTF Metallic-Roughness convention and the Three.js standard material align with this packing: Three.js reads AO from the red channel, roughness from green and metalness from blue. AO requires a second UV set. [2] [3]

## Asset contract for the next pack

| Contract | Recommended production rule |
|---|---|
| Source ownership | Keep `.blend`, high-detail collection, low/runtime collection, bake script and source texture files outside `public/`; version all of them with the asset pack. |
| Runtime topology | Apply transforms, real-world scale, smooth shading / controlled hard edges, and final triangulation before export and test. |
| UV0 | Non-overlapping islands, consistent texel density, no accidental mirror on a normal-mapped surface, 8 px padding at 1024² or 16 px at 2048². |
| UV1 | A separate non-overlapping unwrap for AO. It may share layout logic with UV0 but must be suitable for light/AO sampling. |
| Source bake | Bake from high → low only for geometry detail. Use low-only material bake for roughness and low-only AO bake. |
| Resolution | Author at 2048² only when close inspection justifies it; ship 1024² for hero sofa/armchair, 512² for chairs/side furniture, and 256² for small props. |
| Materials | Target at most 2 runtime materials per compact item and 3 for a large hero item; merge surfaces where visual distinction is not needed. |
| Shipping | Prefer GLB with KTX2/Basis textures after the uncompressed PNG review baseline passes. |

## Reproducible Blender workflow

### 1. Prepare the low and high models

Create two Collections: `ASSET_<id>_HIGH` and `ASSET_<id>_LOW`. The high model owns seams, button indentations, piping, wood grain relief and sculpted cushion creases. The low model owns the silhouette, major cushions, arms, legs and every detail that changes the profile from the normal game camera.

Apply scale and rotation on both collections. Keep matched origin and orientation. Mark sharp edges and set smoothing before baking; do not change topology, UV seams or normal splitting after validating the normal map. Bake errors at edge splits are normally resolved with a cage or adjusted ray distance, not by painting over the error.

### 2. Create two UV channels

Unwrap `UV0` first. Use a checker texture to identify stretching; keep cloth, wood and metal pieces at coherent texel density. Create `UV1` for AO next. It must be non-overlapping because AO sampling needs an independent second UV channel in the runtime material. [3]

Create the following image targets on the low mesh, making the target Image Texture node active before each bake:

```text
asset_basecolor.png     2048 or 1024, sRGB
asset_normal.png        2048 or 1024, Non-Color
asset_roughness.png     2048 or 1024, Non-Color
asset_ao.png            2048 or 1024, Non-Color
asset_metallic.png      2048 or 1024, Non-Color
```

Cycles baking requires the UV map and an active Image Texture target. It supports Normal, Ambient Occlusion and Roughness passes directly. [1]

### 3. Bake the normal map

Set **Render Engine: Cycles**. Select high-detail objects first, then select the low object last so it is active. Choose **Bake → Normal → Tangent**, enable **Selected to Active**, use **Cage** when convex details overlap or when seams cause projection artefacts, and start with a scale-relative ray distance of 1–3% of the smallest asset dimension. Blender identifies tangent space as the default and normally correct choice for reusable/animated assets. [1]

Use 16–32 samples for the initial normal bake and inspect it in the game camera. Increase samples only if bake noise is visible; normal maps generally benefit more from correct cage/ray settings than from extreme samples. Save a high-bit-depth source if further painting is expected, then ship an 8-bit OpenGL normal map after review.

### 4. Bake AO and roughness separately

For `AO`, bake the low model alone using **Bake → Ambient Occlusion** with modest distance; it should darken cushion joints, shelf recesses and leg-to-body contact, not turn the entire object dirty. Begin with 64 samples and tune AO distance per object scale. Blender AO baking ignores scene lights, which is desirable because the map must remain reusable across every authored room lighting profile. [1]

For `roughness`, expose intended material variation through the Principled BSDF and use **Bake → Roughness**. Fabric needs high but varied roughness, oiled wood needs medium variation along grain, lacquered painted surfaces need lower roughness with subtle imperfections, and metal needs metallic mask plus appropriate roughness. Do not bake scene highlights into base color.

### 5. Pack and wire ORM

Pack grayscale maps without gamma conversion:

```text
R = ambient occlusion
G = roughness
B = metallic
```

This is the glTF-oriented ORM convention used to reduce texture fetches. [4] For upholstery and wood, metal is often zero; the B channel remains black. Maintain named source maps and generate `asset_orm.png` by script so packing is deterministic and auditable.

In Blender, assign `baseColor` as **Color/sRGB**. Assign `normal` and `orm` as **Non-Color Data**. Connect the normal map through a Normal Map node. The Three.js material also expects normal, AO, roughness and metalness as non-color data. [3]

### 6. Export and compress

Export a review GLB with PNG textures first. Validate visual correctness in Decorium before compression. Then create the shipping variant using KTX2/Basis Universal for maps that pass image-difference and device tests; retain the review PNG GLB only as a CI/reference artifact, not a shipped fallback unless platform support requires it.

The asset repository already loads GLB asynchronously and retains procedural geometry when loading fails. PROD-014 added the versioned `textureSet`, `textureVariant` and `requiresUv1` manifest fields together with deterministic GLB/UV inspection. A future compression slice may configure `KTX2Loader` before `GLTFLoader`, but it must preserve an explicit PNG GLB fallback for clients without compatible texture transcoding.

## Current runtime baseline in Decorium

`FurnitureAssetRepository` preserves standard GLB materials, caches source scenes, returns material-isolated clones and retains immediate procedural geometry when loading fails. `RoomView` owns the PMREM room environment introduced by PROD-013, so `MeshStandardMaterial` assets receive a stable environment response. [3]

1. Versioned PBR manifests declare `textureSet`, `textureVariant`, `requiresUv1`, per-asset byte ceilings and pack ceilings.
2. Contract tests inspect declared PBR bindings plus `TEXCOORD_0`, `TEXCOORD_1` and AO `texCoord: 1` for `requiresUv1` assets.
3. The composition root supplies independent manifests to the Presentation-only multi-manifest repository; no game rule sees render metadata.
4. Procedural fallback remains mandatory: no missing mesh, texture or renderer capability may block placement, score or progression.
5. KTX2/Basis delivery is deferred to a dedicated compression slice, where it must be feature-detected and preserve PNG compatibility fallback.

## Release gates

| Gate | Pass criterion |
|---|---|
| Bake integrity | Normal has no seams, projection hits, inverted green channel or conspicuous gradients at UV borders. |
| Material review | Base color has no baked lights; fabric, wood and metal remain legible under warm-evening, media-dusk and bright-daylight profiles. |
| UV review | UV0 and UV1 satisfy their contracts; all AO-enabled meshes have UV1. |
| Game-camera review | Hero item is inspected in the actual Decorium camera at default, close and rotated angles. |
| Performance | GLB and texture bytes stay inside the pack manifest budget; texture requests are deduplicated across cloned placements. |
| Degradation | Network/parse/transcode failure leaves the procedural visual, hit behavior and score flow functional. |
| Regression | `npm test`, build, audit, GLB validation and browser smoke are green. |

## Recommended next implementation slice

The lounge calibration pack is complete in PROD-013, remaining table-type catalog assets are complete in PROD-014, and the complete storage family is complete in PROD-015. Continue with a **lighting PBR pack**: table lamp, floor lamp and ceiling fixture. Calibrate one hero fixture first for glass/metal/textile separation, then replicate the validated toolchain across the remaining lighting silhouettes. Emissive detail may signal a luminous object but must not change the room’s authoritative illumination policy. Keep each pack independently versioned, bounded and visual-accepted; do not texture the entire catalog in one unreviewed batch.

## References

[1]: https://docs.blender.org/manual/en/latest/render/cycles/baking.html "Blender Manual — Render Baking"
[2]: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html "Khronos — glTF 2.0 Specification"
[3]: https://threejs.org/docs/pages/MeshStandardMaterial.html "Three.js — MeshStandardMaterial"
[4]: https://www.khronos.org/blog/art-pipeline-for-gltf "Khronos — Art Pipeline for glTF"
