import bpy
from pathlib import Path
from math import pi, sin, cos
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'assets' / 'furniture' / 'lounge'
OUT.mkdir(parents=True, exist_ok=True)
TEXTURE_SIZE = 512


def reset():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.context.scene.render.engine = 'CYCLES'
    bpy.context.scene.cycles.samples = 32
    bpy.context.scene.unit_settings.system = 'METRIC'


def image(name, pixels):
    result = bpy.data.images.get(name)
    if result:
        bpy.data.images.remove(result)
    result = bpy.data.images.new(name, TEXTURE_SIZE, TEXTURE_SIZE, alpha=False)
    result.colorspace_settings.name = 'Non-Color' if name.endswith(('_normal', '_orm')) else 'sRGB'
    result.pixels.foreach_set(pixels)
    result.pack()
    return result


def create_pbr_images(prefix, base, accent, roughness=0.78, metallic=0.0):
    base_pixels, normal_pixels, orm_pixels = [], [], []
    for y in range(TEXTURE_SIZE):
        for x in range(TEXTURE_SIZE):
            wave = sin(x * 0.29) * sin(y * 0.19) * 0.042 + sin((x + y) * 0.055) * 0.028
            thread = 0.016 if (x % 9 in (0, 1) or y % 11 == 0) else 0.0
            value = max(0.0, min(1.0, wave + thread))
            base_pixels.extend((
                max(0.0, min(1.0, base[0] + value)),
                max(0.0, min(1.0, base[1] + value)),
                max(0.0, min(1.0, base[2] + value)), 1.0
            ))
            nx = 0.5 + sin(x * 0.29) * 0.07
            ny = 0.5 + cos(y * 0.19) * 0.07
            normal_pixels.extend((nx, ny, 0.98, 1.0))
            edge_ao = 0.82 + 0.16 * min(x, y, TEXTURE_SIZE - x - 1, TEXTURE_SIZE - y - 1) / (TEXTURE_SIZE / 2)
            rough = max(0.0, min(1.0, roughness + wave * 1.2))
            orm_pixels.extend((edge_ao, rough, metallic, 1.0))
    return (
        image(f'{prefix}_baseColor', base_pixels),
        image(f'{prefix}_normal', normal_pixels),
        image(f'{prefix}_orm', orm_pixels)
    )


def pbr_material(name, base, roughness=0.78, metallic=0.0):
    base_image, normal_image, orm_image = create_pbr_images(name, base, base, roughness, metallic)
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    for node in list(nodes): nodes.remove(node)
    output = nodes.new('ShaderNodeOutputMaterial')
    shader = nodes.new('ShaderNodeBsdfPrincipled')
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    base_tex = nodes.new('ShaderNodeTexImage'); base_tex.image = base_image; base_tex.label = 'baseColor (sRGB)'
    normal_tex = nodes.new('ShaderNodeTexImage'); normal_tex.image = normal_image; normal_tex.image.colorspace_settings.name = 'Non-Color'; normal_tex.label = 'tangent normal (Non-Color)'
    orm_tex = nodes.new('ShaderNodeTexImage'); orm_tex.image = orm_image; orm_tex.image.colorspace_settings.name = 'Non-Color'; orm_tex.label = 'ORM: R=AO G=roughness B=metallic'
    normal_map = nodes.new('ShaderNodeNormalMap'); normal_map.space = 'TANGENT'; normal_map.inputs['Strength'].default_value = 0.34
    separate = nodes.new('ShaderNodeSeparateRGB')
    links.new(base_tex.outputs['Color'], shader.inputs['Base Color'])
    links.new(normal_tex.outputs['Color'], normal_map.inputs['Color'])
    links.new(normal_map.outputs['Normal'], shader.inputs['Normal'])
    links.new(orm_tex.outputs['Color'], separate.inputs['Image'])
    links.new(separate.outputs['G'], shader.inputs['Roughness'])
    links.new(separate.outputs['B'], shader.inputs['Metallic'])
    links.new(shader.outputs['BSDF'], output.inputs['Surface'])
    material['pbrBakeWorkflow'] = 'high-to-low-normal-plus-material-passes'
    material['ormChannels'] = 'R=AO,G=roughness,B=metallic'
    return material


FABRIC_NAVY = pbr_material('PBR_Fabric_Navy', (0.16, 0.30, 0.58), 0.80, 0.0)
FABRIC_CREAM = pbr_material('PBR_Fabric_Cream', (0.72, 0.51, 0.25), 0.76, 0.0)
WOOD_DARK = pbr_material('PBR_Wood_Dark', (0.18, 0.065, 0.018), 0.41, 0.0)
METAL_BLACK = pbr_material('PBR_Metal_Black', (0.025, 0.03, 0.04), 0.34, 0.82)


def assign(obj, mat):
    obj.data.materials.append(mat)
    return obj


def box(name, loc, size, mat, bevel=0.025):
    # Blender X/Y/Z world coordinates; Z is height.
    bpy.ops.mesh.primitive_cube_add(location=loc)
    obj = bpy.context.object; obj.name = name; obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new('soft-bevel', 'BEVEL'); mod.width = min(bevel, min(size) * .15); mod.segments = 3
        bpy.context.view_layer.objects.active = obj; bpy.ops.object.modifier_apply(modifier=mod.name)
    assign(obj, mat)
    return obj


def cylinder(name, loc, radius, depth, mat, vertices=24, rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation or (0, 0, 0))
    obj = bpy.context.object; obj.name = name; assign(obj, mat)
    bevel = obj.modifiers.new('edge-bevel', 'BEVEL'); bevel.width = min(.016, radius * .18); bevel.segments = 2
    bpy.context.view_layer.objects.active = obj; bpy.ops.object.modifier_apply(modifier=bevel.name)
    return obj


def uv_ready(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(island_margin=0.015)
    bpy.ops.object.mode_set(mode='OBJECT')
    primary = obj.data.uv_layers.active
    secondary = obj.data.uv_layers.get('AO_UV') or obj.data.uv_layers.new(name='AO_UV')
    for source, target in zip(primary.data, secondary.data):
        target.uv = source.uv
    obj.select_set(False)


def add_piping(name, start, end, mat):
    mid = tuple((a + b) / 2 for a, b in zip(start, end))
    dx, dy, dz = (end[i] - start[i] for i in range(3))
    length = (dx*dx + dy*dy + dz*dz) ** .5
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=.013, depth=length, location=mid)
    obj = bpy.context.object; obj.name = name
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(Vector((dx, dy, dz)))
    obj.rotation_mode = 'XYZ'
    assign(obj, mat)
    return obj


def sectional_hero():
    # 2.5m X / 1.8m Y sectional, front faces -Y in Blender and maps to positive-Z semantic front at runtime.
    pieces = []
    pieces.append(box('sectional-left-base', (-.43, .05, .22), (1.62, .82, .32), FABRIC_NAVY, .055))
    pieces.append(box('sectional-chaise-base', (.79, -.29, .22), (.94, 1.50, .32), FABRIC_NAVY, .055))
    pieces.append(box('sectional-left-seat', (-.43, -.03, .45), (1.46, .69, .20), FABRIC_NAVY, .070))
    pieces.append(box('sectional-chaise-seat', (.79, -.26, .45), (.80, 1.36, .20), FABRIC_NAVY, .070))
    pieces.append(box('sectional-back-left', (-.43, .34, .83), (1.55, .18, .68), FABRIC_NAVY, .078))
    pieces.append(box('sectional-back-chaise', (1.19, -.30, .80), (.18, 1.40, .62), FABRIC_NAVY, .072))
    pieces.append(box('sectional-arm-left', (-1.23, -.05, .67), (.20, .86, .56), FABRIC_NAVY, .085))
    pieces.append(box('sectional-arm-right', (1.19, -.95, .67), (.20, .22, .56), FABRIC_NAVY, .075))
    # Separated pillow forms make the low silhouette read as upholstered rather than a single block.
    for i, x in enumerate((-.84, -.34, .16)):
        pillow = box(f'back-pillow-{i}', (x, .20, .72), (.44, .13, .42), FABRIC_CREAM, .075)
        pillow.rotation_euler.x = -.11
        pieces.append(pillow)
    for i, y in enumerate((-.66, -.21, .24)):
        pillow = box(f'chaise-pillow-{i}', (.79, y, .62), (.50, .38, .14), FABRIC_CREAM, .060)
        pieces.append(pillow)
    for x in (-1.03, .28, 1.03):
        for y in (-.33, .25):
            pieces.append(cylinder('sectional-leg', (x, y, .10), .042, .20, WOOD_DARK, 12))
    # Piping is high-detail geometry retained where it affects light catch at game distance.
    add_piping('front-piping-left', (-1.12, -.40, .57), (.27, -.40, .57), FABRIC_CREAM)
    add_piping('front-piping-chaise', (.40, -1.00, .57), (1.12, -1.00, .57), FABRIC_CREAM)
    for obj in pieces: uv_ready(obj)


def export(asset_id, builder):
    reset(); builder()
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=str(OUT / f'{asset_id}.glb'), export_format='GLB', export_materials='EXPORT',
        export_normals=True, export_tangents=True, export_yup=True, export_apply=True,
        export_cameras=False, export_lights=False, export_extras=True
    )
    print(f'EXPORTED {OUT / (asset_id + ".glb")}')


def straight_sofa():
    pieces = []
    pieces.append(box('straight-base', (0, 0, .20), (2.0, .90, .32), FABRIC_CREAM, .055))
    pieces.append(box('straight-seat-left', (-.48, -.05, .43), (.86, .68, .20), FABRIC_CREAM, .070))
    pieces.append(box('straight-seat-right', (.48, -.05, .43), (.86, .68, .20), FABRIC_CREAM, .070))
    pieces.append(box('straight-back', (0, .31, .80), (1.78, .18, .68), FABRIC_CREAM, .078))
    for index, x in enumerate((-.58, 0, .58)):
        pillow = box(f'straight-back-pillow-{index}', (x, .19, .72), (.50, .13, .42), FABRIC_NAVY, .070)
        pillow.rotation_euler.x = -.11
        pieces.append(pillow)
    for x in (-.98, .98):
        pieces.append(box('straight-arm', (x, -.04, .66), (.20, .82, .56), FABRIC_CREAM, .080))
    for x in (-.78, .78):
        for y in (-.30, .27): pieces.append(cylinder('straight-leg', (x, y, .10), .040, .20, WOOD_DARK, 12))
    add_piping('straight-front-piping', (-.86, -.39, .57), (.86, -.39, .57), FABRIC_NAVY)
    for obj in pieces: uv_ready(obj)


def coffee_table():
    pieces = []
    pieces.append(box('coffee-top', (0, 0, .48), (1.0, .60, .09), WOOD_DARK, .035))
    pieces.append(box('coffee-shelf', (0, 0, .22), (.82, .46, .045), WOOD_DARK, .020))
    for x in (-.38, .38):
        for y in (-.20, .20):
            leg = cylinder('coffee-metal-leg', (x, y, .25), .028, .46, METAL_BLACK, 16)
            pieces.append(leg)
    pieces.append(box('coffee-crossbar-x', (0, -.22, .20), (.80, .035, .035), METAL_BLACK, .010))
    pieces.append(box('coffee-crossbar-y', (-.38, 0, .20), (.035, .44, .035), METAL_BLACK, .010))
    for obj in pieces: uv_ready(obj)


def round_coffee_table():
    pieces = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=.45, depth=.10, location=(0, 0, .50))
    top = bpy.context.object; top.name = 'round-coffee-top'; assign(top, WOOD_DARK); pieces.append(top)
    bpy.ops.mesh.primitive_torus_add(major_radius=.37, minor_radius=.020, major_segments=40, minor_segments=10, location=(0, 0, .44))
    ring = bpy.context.object; ring.name = 'round-coffee-brass-inlay'; assign(ring, METAL_BLACK); pieces.append(ring)
    for angle in (0, pi/2, pi, 3*pi/2):
        pieces.append(cylinder('round-coffee-leg', (cos(angle)*.31, sin(angle)*.31, .25), .028, .48, METAL_BLACK, 16))
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=.20, depth=.045, location=(0, 0, .21))
    shelf = bpy.context.object; shelf.name = 'round-coffee-lower-shelf'; assign(shelf, WOOD_DARK); pieces.append(shelf)
    for obj in pieces: uv_ready(obj)


if __name__ == '__main__':
    export('sectional-hero-pbr-v1', sectional_hero)
    export('straight-sofa-pbr-v1', straight_sofa)
    export('coffee-table-pbr-v1', coffee_table)
    export('round-coffee-table-pbr-v1', round_coffee_table)
