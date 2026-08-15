import bpy
from pathlib import Path
from math import sin, cos, pi

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'assets' / 'furniture' / 'storage'
OUT.mkdir(parents=True, exist_ok=True)
TEXTURE_SIZE = 384


def reset():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.context.scene.render.engine = 'CYCLES'
    bpy.context.scene.cycles.samples = 32
    bpy.context.scene.unit_settings.system = 'METRIC'


def packed_image(name, pixels, color_space):
    current = bpy.data.images.get(name)
    if current:
        bpy.data.images.remove(current)
    image = bpy.data.images.new(name, TEXTURE_SIZE, TEXTURE_SIZE, alpha=False)
    image.colorspace_settings.name = color_space
    image.pixels.foreach_set(pixels)
    image.pack()
    return image


def pbr_maps(prefix, base, roughness, metallic, grain_axis='x'):
    base_pixels, normal_pixels, orm_pixels = [], [], []
    for y in range(TEXTURE_SIZE):
        for x in range(TEXTURE_SIZE):
            axis, other = (x, y) if grain_axis == 'x' else (y, x)
            grain = sin(axis * .10 + sin(other * .043) * 2.1) * .050
            pores = sin(axis * .52) * sin(other * .31) * .016
            brush = sin(axis * .78) * .013 if metallic else 0.0
            variation = grain + pores + brush
            base_pixels.extend((
                max(0.0, min(1.0, base[0] + variation)),
                max(0.0, min(1.0, base[1] + variation * .76)),
                max(0.0, min(1.0, base[2] + variation * .45)),
                1.0,
            ))
            normal_pixels.extend((
                .5 + sin(axis * .28) * .047,
                .5 + cos(other * .20) * .033,
                .986,
                1.0,
            ))
            edge = min(x, y, TEXTURE_SIZE - x - 1, TEXTURE_SIZE - y - 1) / (TEXTURE_SIZE * .5)
            ao = min(1.0, .79 + edge * .20)
            rough = max(0.0, min(1.0, roughness + variation * 1.15))
            orm_pixels.extend((ao, rough, metallic, 1.0))
    return (
        packed_image(f'{prefix}_baseColor', base_pixels, 'sRGB'),
        packed_image(f'{prefix}_normal', normal_pixels, 'Non-Color'),
        packed_image(f'{prefix}_orm', orm_pixels, 'Non-Color'),
    )


def pbr_material(name, base, roughness, metallic=0.0, grain_axis='x'):
    base_image, normal_image, orm_image = pbr_maps(name, base, roughness, metallic, grain_axis)
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    for node in list(nodes):
        nodes.remove(node)
    output = nodes.new('ShaderNodeOutputMaterial')
    shader = nodes.new('ShaderNodeBsdfPrincipled')
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    base_tex = nodes.new('ShaderNodeTexImage'); base_tex.image = base_image; base_tex.label = 'baseColor (sRGB)'
    normal_tex = nodes.new('ShaderNodeTexImage'); normal_tex.image = normal_image; normal_tex.label = 'tangent normal (Non-Color)'
    orm_tex = nodes.new('ShaderNodeTexImage'); orm_tex.image = orm_image; orm_tex.label = 'ORM: R=AO G=roughness B=metallic'
    normal = nodes.new('ShaderNodeNormalMap'); normal.space = 'TANGENT'; normal.inputs['Strength'].default_value = .31
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


OAK = pbr_material('PBR_Oak_Honey', (.36, .145, .038), .43, 0.0, 'x')
WALNUT = pbr_material('PBR_Walnut_Charred', (.12, .030, .008), .40, 0.0, 'x')
CREAM = pbr_material('PBR_Lacquer_Sand', (.48, .38, .20), .33, 0.0, 'y')
GRAPHITE = pbr_material('PBR_Graphite_Metal', (.023, .030, .047), .27, .87, 'y')
BRASS = pbr_material('PBR_Brass_Accent', (.44, .185, .035), .25, .92, 'x')


def assign(obj, material):
    obj.data.materials.append(material)
    return obj


def bevel(obj, width):
    modifier = obj.modifiers.new('soft-bevel', 'BEVEL')
    modifier.width = width
    modifier.segments = 3
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def box(name, loc, size, material, edge=.014):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if edge:
        bevel(obj, min(edge, min(size) * .15))
    assign(obj, material)
    return obj


def cylinder(name, loc, radius, depth, material, vertices=20, rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation or (0, 0, 0))
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    bevel(obj, min(.012, radius * .22))
    return obj


def tapered_leg(name, loc, lower_radius, upper_radius, depth, material, vertices=4):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=lower_radius, radius2=upper_radius, depth=depth, location=loc, rotation=(0, 0, pi / 4))
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    bevel(obj, .010)
    return obj


def uv_ready(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(island_margin=.014)
    bpy.ops.object.mode_set(mode='OBJECT')
    primary = obj.data.uv_layers.active
    secondary = obj.data.uv_layers.get('AO_UV') or obj.data.uv_layers.new(name='AO_UV')
    for source, target in zip(primary.data, secondary.data):
        target.uv = source.uv
    obj.select_set(False)


def storage_wall_shelf():
    # 1.2m x 0.3m floor footprint; vertical back panel and shelf depth read as a wall-storage family.
    pieces = []
    pieces.append(box('wall-shelf-back-panel', (0, .105, .62), (1.18, .045, 1.18), WALNUT, .018))
    pieces.append(box('wall-shelf-honey-ledger', (0, -.13, .42), (1.20, .30, .055), OAK, .018))
    pieces.append(box('wall-shelf-upper-board', (0, -.11, .86), (1.06, .27, .045), OAK, .014))
    for x in (-.48, .48):
        pieces.append(box('wall-shelf-graphite-bracket', (x, -.10, .26), (.045, .26, .34), GRAPHITE, .008))
    for x in (-.40, .40):
        pieces.append(cylinder('wall-shelf-brass-hook', (x, -.17, .26), .025, .045, BRASS, 18, rotation=(pi / 2, 0, 0)))
    for obj in pieces:
        uv_ready(obj)


def bookcase():
    pieces = []
    pieces.append(box('bookcase-left-upright', (-.46, .02, .95), (.075, .38, 1.90), WALNUT, .018))
    pieces.append(box('bookcase-right-upright', (.46, .02, .95), (.075, .38, 1.90), WALNUT, .018))
    pieces.append(box('bookcase-back', (0, .16, .97), (.84, .035, 1.74), CREAM, .012))
    for index, z in enumerate((.13, .53, .93, 1.33, 1.75)):
        pieces.append(box(f'bookcase-shelf-{index}', (0, -.01, z), (.92, .39, .05), OAK, .014))
    # A brass rail gives the high bookcase a recognisable family detail at game distance.
    pieces.append(cylinder('bookcase-brass-side-rail', (-.39, -.19, .98), .016, 1.58, BRASS, 16))
    for obj in pieces:
        uv_ready(obj)


def drawer_chest():
    pieces = []
    pieces.append(box('chest-oak-body', (0, .03, .47), (1.38, .48, .76), OAK, .024))
    pieces.append(box('chest-walnut-top', (0, 0, .88), (1.44, .54, .07), WALNUT, .030))
    for row, z in enumerate((.64, .40, .16)):
        for col, x in enumerate((-.34, .34)):
            pieces.append(box(f'chest-drawer-{row}-{col}', (x, -.226, z), (.59, .035, .19), CREAM if row == 0 else OAK, .010))
            pieces.append(cylinder(f'chest-brass-pull-{row}-{col}', (x, -.252, z), .018, .027, BRASS, 16, rotation=(pi / 2, 0, 0)))
    for x in (-.58, .58):
        for y in (-.18, .18):
            pieces.append(tapered_leg('chest-tapered-leg', (x, y, .06), .032, .050, .16, GRAPHITE))
    for obj in pieces:
        uv_ready(obj)


def tall_rack():
    pieces = []
    for x in (-.35, .35):
        for y in (-.14, .14):
            pieces.append(box('rack-graphite-upright', (x, y, 1.05), (.045, .045, 2.10), GRAPHITE, .008))
    for index, z in enumerate((.16, .58, 1.00, 1.42, 1.84)):
        pieces.append(box(f'rack-oak-shelf-{index}', (0, 0, z), (.76, .33, .045), OAK, .012))
    brace = box('rack-diagonal-brace', (0, .15, 1.10), (.035, .035, 1.86), BRASS, .006)
    brace.rotation_euler.y = -.37
    for obj in pieces:
        uv_ready(obj)


def sideboard():
    pieces = []
    pieces.append(box('sideboard-walnut-body', (0, .02, .46), (1.48, .43, .64), WALNUT, .025))
    pieces.append(box('sideboard-oak-top', (0, 0, .82), (1.56, .49, .07), OAK, .028))
    pieces.append(box('sideboard-open-cubby', (0, -.224, .54), (.40, .030, .26), GRAPHITE, .008))
    for x in (-.50, .50):
        pieces.append(box('sideboard-ribbed-door', (x, -.225, .47), (.38, .032, .48), CREAM, .012))
        pieces.append(cylinder('sideboard-brass-pull', (x + (.14 if x < 0 else -.14), -.250, .47), .018, .027, BRASS, 16, rotation=(pi / 2, 0, 0)))
    for x in (-.64, .64):
        for y in (-.16, .16):
            pieces.append(tapered_leg('sideboard-leg', (x, y, .07), .032, .052, .19, WALNUT))
    for obj in pieces:
        uv_ready(obj)


def tv_stand():
    pieces = []
    pieces.append(box('tvstand-walnut-case', (0, .02, .30), (1.58, .38, .43), WALNUT, .022))
    pieces.append(box('tvstand-oak-top', (0, 0, .55), (1.64, .44, .06), OAK, .024))
    pieces.append(box('tvstand-graphite-open-bay', (0, -.205, .36), (.42, .028, .16), GRAPHITE, .008))
    for index, x in enumerate((-.51, .51)):
        pieces.append(box(f'tvstand-slat-door-{index}', (x, -.205, .31), (.37, .030, .30), CREAM, .010))
        pieces.append(cylinder(f'tvstand-brass-pull-{index}', (x + (.12 if x < 0 else -.12), -.230, .31), .016, .027, BRASS, 16, rotation=(pi / 2, 0, 0)))
    for x in (-.66, .66):
        for y in (-.15, .15):
            pieces.append(tapered_leg('tvstand-leg', (x, y, .06), .028, .042, .15, GRAPHITE))
    for obj in pieces:
        uv_ready(obj)


def nightstand():
    pieces = []
    pieces.append(box('nightstand-cream-body', (0, .02, .30), (.48, .38, .44), CREAM, .020))
    pieces.append(box('nightstand-walnut-top', (0, 0, .56), (.54, .44, .07), WALNUT, .025))
    pieces.append(box('nightstand-upper-drawer', (0, -.192, .40), (.40, .030, .15), CREAM, .008))
    pieces.append(box('nightstand-open-cubby', (0, -.192, .20), (.40, .030, .14), GRAPHITE, .006))
    pieces.append(cylinder('nightstand-brass-pull', (0, -.218, .40), .018, .027, BRASS, 16, rotation=(pi / 2, 0, 0)))
    for x in (-.18, .18):
        for y in (-.13, .13):
            pieces.append(tapered_leg('nightstand-leg', (x, y, .05), .023, .035, .13, BRASS))
    for obj in pieces:
        uv_ready(obj)


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
    export('wall-shelf-pbr-v1', storage_wall_shelf)
    export('bookcase-pbr-v1', bookcase)
    export('drawer-chest-pbr-v1', drawer_chest)
    export('tall-rack-pbr-v1', tall_rack)
    export('sideboard-pbr-v1', sideboard)
    export('tv-stand-pbr-v1', tv_stand)
    export('nightstand-pbr-v1', nightstand)
