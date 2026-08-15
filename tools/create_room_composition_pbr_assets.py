import bpy
from math import sin, cos, pi
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'assets' / 'environment' / 'rooms'
OUT.mkdir(parents=True, exist_ok=True)
TEXTURE_SIZE = 128


def reset():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.context.scene.unit_settings.system = 'METRIC'


def packed_image(name, pixels, color_space):
    image = bpy.data.images.new(name, TEXTURE_SIZE, TEXTURE_SIZE, alpha=False)
    image.colorspace_settings.name = color_space
    image.pixels.foreach_set(pixels)
    image.pack()
    return image


def pbr_material(name, base, roughness, metallic=0.0, motif='grain'):
    base_pixels, normal_pixels, orm_pixels = [], [], []
    for y in range(TEXTURE_SIZE):
        for x in range(TEXTURE_SIZE):
            waves = sin(x * .16 + sin(y * .07) * 1.8) * .04
            fleck = sin(x * .44) * sin(y * .31) * .018
            checker = .028 if motif == 'tile' and ((x // 16 + y // 16) % 2 == 0) else 0
            brush = sin(x * .68) * .014 if metallic else 0
            variation = waves + fleck + checker + brush
            base_pixels.extend((
                max(0.0, min(1.0, base[0] + variation)),
                max(0.0, min(1.0, base[1] + variation * .74)),
                max(0.0, min(1.0, base[2] + variation * .48)),
                1.0,
            ))
            normal_pixels.extend((.5 + sin(x * .27) * .042, .5 + cos(y * .21) * .029, .988, 1.0))
            edge = min(x, y, TEXTURE_SIZE - x - 1, TEXTURE_SIZE - y - 1) / (TEXTURE_SIZE * .5)
            ao = min(1.0, .78 + edge * .21)
            orm_pixels.extend((ao, max(.0, min(1., roughness + variation)), metallic, 1.0))
    base_image = packed_image(f'{name}_baseColor', base_pixels, 'sRGB')
    normal_image = packed_image(f'{name}_normal', normal_pixels, 'Non-Color')
    orm_image = packed_image(f'{name}_orm', orm_pixels, 'Non-Color')
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes, links = material.node_tree.nodes, material.node_tree.links
    for node in list(nodes):
        nodes.remove(node)
    output = nodes.new('ShaderNodeOutputMaterial')
    shader = nodes.new('ShaderNodeBsdfPrincipled')
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    base_tex = nodes.new('ShaderNodeTexImage'); base_tex.image = base_image; base_tex.label = 'baseColor (sRGB)'
    normal_tex = nodes.new('ShaderNodeTexImage'); normal_tex.image = normal_image; normal_tex.label = 'tangent normal (Non-Color)'
    orm_tex = nodes.new('ShaderNodeTexImage'); orm_tex.image = orm_image; orm_tex.label = 'ORM: R=AO G=roughness B=metallic'
    normal = nodes.new('ShaderNodeNormalMap'); normal.space = 'TANGENT'; normal.inputs['Strength'].default_value = .32
    split = nodes.new('ShaderNodeSeparateRGB')
    links.new(base_tex.outputs['Color'], shader.inputs['Base Color'])
    links.new(normal_tex.outputs['Color'], normal.inputs['Color'])
    links.new(normal.outputs['Normal'], shader.inputs['Normal'])
    links.new(orm_tex.outputs['Color'], split.inputs['Image'])
    links.new(split.outputs['G'], shader.inputs['Roughness'])
    links.new(split.outputs['B'], shader.inputs['Metallic'])
    links.new(shader.outputs['BSDF'], output.inputs['Surface'])
    material['pbrBakeWorkflow'] = 'high-to-low-normal-plus-material-passes'
    material['ormChannels'] = 'R=AO,G=roughness,B=metallic'
    return material


def scalar_material(name, color, roughness=.6, metallic=0.0, emission=None):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1.0)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    if emission:
        shader.inputs['Emission Color'].default_value = (*emission, 1.0)
        shader.inputs['Emission Strength'].default_value = .18
    return material


def assign(obj, material):
    obj.data.materials.append(material)
    return obj


def bevel(obj, width):
    modifier = obj.modifiers.new('soft-bevel', 'BEVEL')
    modifier.width = width
    modifier.segments = 2
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def uv_ready(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(island_margin=.012)
    bpy.ops.object.mode_set(mode='OBJECT')
    primary = obj.data.uv_layers.active
    secondary = obj.data.uv_layers.get('AO_UV') or obj.data.uv_layers.new(name='AO_UV')
    for source, target in zip(primary.data, secondary.data):
        target.uv = source.uv
    obj.select_set(False)


def box(name, loc, size, material, edge=.014):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if edge:
        bevel(obj, min(edge, min(size) * .16))
    assign(obj, material)
    uv_ready(obj)
    return obj


def cylinder(name, loc, radius, depth, material, vertices=16, rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation or (0, 0, 0))
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    bevel(obj, min(.01, radius * .2))
    uv_ready(obj)
    return obj


def sphere(name, loc, radius, material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=radius, location=loc)
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    uv_ready(obj)
    return obj


def framed_art(name, loc, width, height, frame, canvas, accent):
    box(f'{name}-frame', loc, (width, .045, height), frame, .014)
    box(f'{name}-canvas', (loc[0], loc[1] - .028, loc[2]), (width - .10, .018, height - .10), canvas, .004)
    band = box(f'{name}-accent', (loc[0], loc[1] - .042, loc[2] + height * .08), (width * .62, .012, .065), accent, .003)
    return band


def warm_living_composition():
    wood = pbr_material('warm-oak-pbr', (.34, .13, .030), .46)
    linen = pbr_material('warm-linen-pbr', (.47, .32, .17), .72, 0.0, 'tile')
    brass = pbr_material('warm-brass-pbr', (.46, .20, .045), .27, .88)
    navy = scalar_material('warm-navy-ink', (.055, .13, .20), .48)
    terracotta = scalar_material('warm-terracotta', (.39, .11, .045), .62)
    foliage = scalar_material('warm-foliage', (.05, .20, .10), .84)

    # Coordinates match the 8 x 6 authored starter room. Back-wall overlay, not a replacement wall.
    for x in (1.05, 2.15, 5.85, 6.95):
        box('warm-linen-wall-pilaster', (x, 5.925, 1.72), (.055, .036, 1.52), wood, .007)
    box('warm-linen-rail', (4.0, 5.91, 1.04), (7.52, .046, .07), brass, .009)
    for x in (1.55, 6.45):
        framed_art('warm-framed-print', (x, 5.885, 2.23), .88, .62, wood, linen, terracotta)

    # The built-in library nook is deliberately off the player placement plane.
    box('warm-library-back', (.74, 4.82, 1.18), (1.22, .20, 2.20), navy, .018)
    for z in (.24, .66, 1.08, 1.50, 1.92):
        box('warm-library-shelf', (.74, 4.64, z), (1.34, .36, .055), wood, .012)
    for index, (x, z) in enumerate(((-.34, .43), (-.05, .43), (.28, .43), (-.22, .86), (.18, .86), (-.25, 1.29), (.10, 1.29), (.34, 1.29))):
        book = box('warm-library-book', (.74 + x, 4.42, z), (.13, .16, .31 + (index % 2) * .06), terracotta if index % 3 == 0 else linen, .004)
        book.rotation_euler.y = (index % 3 - 1) * .08
    box('warm-library-ledge', (.74, 4.43, .14), (1.38, .40, .08), brass, .014)
    for x in (-.32, .32):
        sphere('warm-library-pot', (.74 + x, 4.35, 2.17), .11, terracotta)
        sphere('warm-library-plant', (.74 + x, 4.32, 2.34), .17, foliage)

    # Residential porch foreground lives beyond the window opening.
    box('warm-porch-canopy', (4.0, 6.38, 2.16), (2.55, .62, .12), wood, .02)
    for x in (2.85, 5.15):
        cylinder('warm-porch-post', (x, 6.31, 1.02), .055, 1.56, linen, 14)
    for x in (2.55, 5.45):
        box('warm-porch-planter', (x, 6.46, .29), (.64, .27, .24), terracotta, .025)
        for offset in (-.16, 0, .16):
            sphere('warm-porch-foliage', (x + offset, 6.42, .56), .15, foliage)


def urban_media_composition():
    graphite = pbr_material('media-graphite-pbr', (.018, .025, .042), .31, .72)
    blue = pbr_material('media-blue-fabric-pbr', (.045, .10, .26), .54, .04, 'tile')
    brass = pbr_material('media-brass-pbr', (.42, .16, .030), .24, .9)
    ink = scalar_material('media-ink', (.012, .016, .031), .36)
    cyan = scalar_material('media-cyan', (.04, .25, .38), .38, .15, (.03, .12, .18))
    coral = scalar_material('media-coral', (.48, .095, .035), .58)

    # Coordinates match the 6 x 5 authored media room. The visual screen is non-semantic.
    box('media-wall-backdrop', (3.0, 4.915, 1.92), (4.34, .12, 2.46), graphite, .02)
    for x in (1.12, 1.48, 4.52, 4.88):
        box('media-wall-vertical-slat', (x, 4.83, 1.9), (.10, .09, 2.28), brass, .008)
    box('media-wall-screen-frame', (3.0, 4.78, 2.03), (2.48, .13, 1.42), brass, .02)
    box('media-wall-decorative-screen', (3.0, 4.70, 2.03), (2.28, .025, 1.23), ink, .01)
    box('media-wall-screen-glow', (3.0, 4.676, 2.03), (1.90, .012, .89), cyan, .006)
    box('media-wall-console', (3.0, 4.60, .54), (2.78, .43, .54), graphite, .028)
    for x in (2.17, 3.83):
        cylinder('media-wall-sconce', (x, 4.57, 2.58), .09, .10, brass, 16, rotation=(pi / 2, 0, 0))
        sphere('media-wall-sconce-glow', (x, 4.50, 2.58), .055, cyan)
    for x in (2.04, 3.96):
        box('media-wall-speaker', (x, 4.48, .94), (.34, .28, .78), blue, .018)
        for z in (.75, 1.10):
            cylinder('media-wall-speaker-driver', (x, 4.31, z), .065, .028, brass, 14, rotation=(pi / 2, 0, 0))

    # Urban cinema frontage beyond the five-metre room facade.
    box('media-cinema-marquee', (3.0, 5.34, 2.73), (4.70, .22, .22), brass, .018)
    box('media-cinema-screen', (3.0, 5.28, 2.08), (3.25, .06, .74), ink, .008)
    for index in range(9):
        sphere('media-cinema-bulb', (1.25 + index * .44, 5.18, 2.73), .045, brass)
    for x in (1.10, 4.90):
        box('media-cinema-banner', (x, 5.19, 1.63), (.18, .045, 1.04), coral, .012)


def bright_studio_composition():
    teal = pbr_material('studio-teal-pbr', (.07, .33, .31), .58, .04, 'tile')
    ochre = pbr_material('studio-ochre-pbr', (.52, .19, .07), .49)
    brass = pbr_material('studio-brass-pbr', (.45, .20, .045), .25, .86)
    chalk = scalar_material('studio-chalk', (.72, .66, .54), .76)
    ink = scalar_material('studio-ink', (.06, .07, .09), .42)
    foliage = scalar_material('studio-foliage', (.07, .27, .14), .86)

    # Coordinates match the 9 x 7 studio, with a gallery composition along visible back/right walls.
    for index, x in enumerate((1.15, 2.75, 6.25, 7.85)):
        panel_material = teal if index % 2 == 0 else ochre
        box('studio-back-gallery-panel', (x, 6.915, 2.15), (1.26, .038, 1.56), panel_material, .012)
    box('studio-back-gallery-rail', (4.5, 6.88, 1.34), (8.12, .055, .07), brass, .01)
    for index, z in enumerate((1.5, 3.5, 5.5)):
        panel_material = ochre if index % 2 == 0 else teal
        box('studio-side-gallery-panel', (8.94, z, 2.05), (.036, 1.46, 1.24), panel_material, .012)
        box('studio-side-art-frame', (8.90, z, 2.13), (.025, .64, .58), brass, .003)
        box('studio-side-art-canvas', (8.878, z, 2.13), (.012, .50, .44), chalk, .002)
        box('studio-side-art-mark', (8.868, z, 2.19), (.010, .32, .055), ink, .001)
    for index, x in enumerate((1.55, 3.10, 5.90, 7.45)):
        framed_art('studio-back-art', (x, 6.86, 2.28), .78, .58, brass, chalk, teal if index % 2 else ochre)

    box('studio-workbench-top', (1.35, 5.72, .86), (1.74, .58, .09), ochre, .02)
    for x in (.63, 2.07):
        for z in (.63, 1.10):
            cylinder('studio-workbench-leg', (x, 5.52, z), .045, .84, ink, 12)
    for x in (.82, 1.34, 1.86):
        cylinder('studio-vase', (x, 5.45, 1.05), .075, .24, brass, 14)
        sphere('studio-vase-bloom', (x, 5.45, 1.25), .115, teal if x != 1.34 else ochre)

    # Courtyard/workshop foreground outside the studio window line.
    box('studio-courtyard-arch', (4.5, 7.44, 2.60), (4.36, .25, .16), ochre, .02)
    for x in (2.42, 6.58):
        box('studio-courtyard-post', (x, 7.39, 1.14), (.17, .22, 2.08), brass, .014)
    for x in (3.18, 5.82):
        box('studio-courtyard-bench', (x, 7.38, .28), (.84, .28, .22), ink, .014)
        box('studio-courtyard-pot', (x, 7.32, .57), (.26, .25, .25), ochre, .018)
        sphere('studio-courtyard-plant', (x, 7.32, .82), .22, foliage)


def export(asset_id, builder):
    reset()
    builder()
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=str(OUT / f'{asset_id}.glb'),
        export_format='GLB',
        export_materials='EXPORT',
        export_normals=True,
        export_tangents=True,
        export_yup=True,
        export_apply=True,
        export_cameras=False,
        export_lights=False,
        export_extras=True,
    )
    print(f'EXPORTED {OUT / (asset_id + ".glb")}')


if __name__ == '__main__':
    export('warm-living-composition-pbr-v1', warm_living_composition)
    export('urban-media-composition-pbr-v1', urban_media_composition)
    export('bright-studio-composition-pbr-v1', bright_studio_composition)
