import bpy
from pathlib import Path
from math import sin, cos, pi

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'assets' / 'furniture' / 'dining'
OUT.mkdir(parents=True, exist_ok=True)
TEXTURE_SIZE = 512


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
            grain = sin(axis * 0.084 + sin(other * 0.045) * 1.9) * 0.055
            pores = sin(axis * 0.48) * sin(other * 0.32) * 0.018
            brush = sin(axis * 0.72) * 0.012 if metallic else 0.0
            variation = grain + pores + brush
            base_pixels.extend((
                max(0.0, min(1.0, base[0] + variation)),
                max(0.0, min(1.0, base[1] + variation * 0.78)),
                max(0.0, min(1.0, base[2] + variation * 0.45)),
                1.0,
            ))
            normal_pixels.extend((
                0.5 + sin(axis * 0.25) * 0.05,
                0.5 + cos(other * 0.19) * 0.035,
                0.985,
                1.0,
            ))
            edge = min(x, y, TEXTURE_SIZE - x - 1, TEXTURE_SIZE - y - 1) / (TEXTURE_SIZE * 0.5)
            ao = min(1.0, 0.79 + edge * 0.20)
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
    normal = nodes.new('ShaderNodeNormalMap'); normal.space = 'TANGENT'; normal.inputs['Strength'].default_value = 0.32
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


OAK = pbr_material('PBR_Oak_Amber', (0.38, 0.16, 0.045), 0.43, 0.0, 'x')
WALNUT = pbr_material('PBR_Walnut_Dark', (0.16, 0.045, 0.012), 0.39, 0.0, 'x')
GRAPHITE = pbr_material('PBR_Graphite_Metal', (0.026, 0.033, 0.048), 0.28, 0.87, 'y')
BRASS = pbr_material('PBR_Brass_Accent', (0.46, 0.20, 0.045), 0.25, 0.92, 'x')
CREAM = pbr_material('PBR_Lacquer_Cream', (0.49, 0.40, 0.23), 0.34, 0.0, 'y')


def assign(obj, material):
    obj.data.materials.append(material)
    return obj


def bevel(obj, width):
    modifier = obj.modifiers.new('soft-bevel', 'BEVEL')
    modifier.width = width
    modifier.segments = 3
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def box(name, loc, size, material, edge=0.018):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if edge:
        bevel(obj, min(edge, min(size) * 0.15))
    assign(obj, material)
    return obj


def cylinder(name, loc, radius, depth, material, vertices=24, rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation or (0, 0, 0))
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    bevel(obj, min(0.014, radius * 0.22))
    return obj


def tapered_leg(name, loc, lower_radius, upper_radius, depth, material, vertices=4):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=lower_radius, radius2=upper_radius, depth=depth, location=loc, rotation=(0, 0, pi / 4))
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    bevel(obj, 0.011)
    return obj


def uv_ready(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(island_margin=0.014)
    bpy.ops.object.mode_set(mode='OBJECT')
    primary = obj.data.uv_layers.active
    secondary = obj.data.uv_layers.get('AO_UV') or obj.data.uv_layers.new(name='AO_UV')
    for source, target in zip(primary.data, secondary.data):
        target.uv = source.uv
    obj.select_set(False)


def dining_table():
    pieces = []
    pieces.append(box('dining-oak-top', (0, 0, .735), (1.78, .88, .075), OAK, .034))
    pieces.append(box('dining-shadow-apron-front', (0, -.365, .65), (1.52, .045, .12), WALNUT, .014))
    pieces.append(box('dining-shadow-apron-back', (0, .365, .65), (1.52, .045, .12), WALNUT, .014))
    pieces.append(box('dining-shadow-apron-left', (-.76, 0, .65), (.045, .68, .12), WALNUT, .014))
    pieces.append(box('dining-shadow-apron-right', (.76, 0, .65), (.045, .68, .12), WALNUT, .014))
    # Brass inlay under the tabletop is a strong, readable silhouette cue at game distance.
    pieces.append(box('dining-brass-inlay', (0, -.405, .765), (1.48, .014, .018), BRASS, .004))
    for x in (-.73, .73):
        for y in (-.33, .33):
            pieces.append(tapered_leg('dining-tapered-oak-leg', (x, y, .34), .048, .070, .65, OAK))
            pieces.append(cylinder('dining-brass-foot', (x, y, .028), .052, .05, BRASS, 16))
    for obj in pieces:
        uv_ready(obj)


def writing_desk():
    pieces = []
    pieces.append(box('writing-desk-walnut-top', (0, 0, .735), (1.38, .68, .07), WALNUT, .030))
    # Left drawer pedestal creates a recognisable writing-desk family without changing its gameplay footprint.
    pieces.append(box('writing-desk-pedestal', (-.48, .06, .39), (.34, .54, .58), CREAM, .020))
    pieces.append(box('writing-desk-drawer-top', (-.48, -.225, .52), (.27, .018, .16), CREAM, .006))
    pieces.append(box('writing-desk-drawer-bottom', (-.48, -.225, .30), (.27, .018, .18), CREAM, .006))
    for z in (.52, .30):
        pieces.append(cylinder('writing-desk-brass-pull', (-.48, -.243, z), .022, .026, BRASS, 20, rotation=(pi / 2, 0, 0)))
    # The airy opposite side has a black A-frame and a narrow brass stretcher.
    for x in (.51,):
        for y in (-.27, .27):
            leg = tapered_leg('writing-desk-graphite-leg', (x, y, .35), .040, .060, .68, GRAPHITE)
            leg.rotation_euler.z = .10 if y > 0 else -.10
            pieces.append(leg)
    pieces.append(box('writing-desk-brass-stretcher', (.51, 0, .23), (.032, .52, .032), BRASS, .008))
    pieces.append(box('writing-desk-back-brace', (.03, .285, .58), (1.12, .026, .048), GRAPHITE, .008))
    for obj in pieces:
        uv_ready(obj)


def computer_desk():
    pieces = []
    pieces.append(box('computer-desk-top', (0, 0, .735), (1.58, .78, .07), WALNUT, .026))
    # Raised rear shelf, grommets and cross-frame distinguish this workstation from the writing desk.
    pieces.append(box('computer-desk-monitor-shelf', (0, .25, .92), (1.14, .22, .055), GRAPHITE, .016))
    pieces.append(box('computer-desk-monitor-riser-left', (-.43, .25, .835), (.05, .17, .18), GRAPHITE, .010))
    pieces.append(box('computer-desk-monitor-riser-right', (.43, .25, .835), (.05, .17, .18), GRAPHITE, .010))
    for x in (-.63, .63):
        for y in (-.31, .31):
            pieces.append(box('computer-desk-square-leg', (x, y, .35), (.055, .055, .68), GRAPHITE, .010))
    pieces.append(box('computer-desk-front-crossbar', (0, -.31, .26), (1.30, .035, .045), GRAPHITE, .008))
    pieces.append(box('computer-desk-back-crossbar', (0, .31, .30), (1.30, .035, .045), GRAPHITE, .008))
    pieces.append(box('computer-desk-cable-tray', (0, .23, .54), (1.06, .12, .10), GRAPHITE, .012))
    pieces.append(box('computer-desk-slim-drawer', (0, -.265, .62), (.78, .05, .13), WALNUT, .012))
    for x in (-.42, .42):
        pieces.append(cylinder('computer-desk-brass-grommet', (x, .17, .776), .035, .008, BRASS, 24))
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
    export('dining-table-pbr-v1', dining_table)
    export('writing-desk-pbr-v1', writing_desk)
    export('computer-desk-pbr-v1', computer_desk)
