import bpy
from pathlib import Path
from math import pi, sin, cos

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'assets' / 'furniture' / 'seating'
OUT.mkdir(parents=True, exist_ok=True)

# Stylised PBR palette matching the approved warm contemporary art direction.
def material(name, color, metallic=0.0, roughness=0.56):
    entry = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    entry.use_nodes = True
    bsdf = entry.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    return entry

OAK = material('Oak', (0.61, 0.38, 0.18), 0.0, 0.42)
DARK_WOOD = material('DarkWood', (0.13, 0.055, 0.025), 0.0, 0.38)
SAGE = material('SageFabric', (0.30, 0.42, 0.31), 0.0, 0.82)
BLUE = material('BlueFabric', (0.22, 0.36, 0.58), 0.0, 0.84)
CHARCOAL = material('Charcoal', (0.035, 0.045, 0.06), 0.16, 0.42)
OCHRE = material('OchreFabric', (0.62, 0.30, 0.055), 0.0, 0.83)
TERRACOTTA = material('TerracottaFabric', (0.48, 0.16, 0.09), 0.0, 0.82)
TEAL = material('TealFabric', (0.035, 0.23, 0.25), 0.0, 0.75)
BRASS = material('Brass', (0.55, 0.28, 0.045), 0.78, 0.29)
GREEN = material('ClassicGreen', (0.045, 0.18, 0.09), 0.0, 0.76)


def reset():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        # Materials are intentionally shared; deleting them would break active references.
        if datablocks == bpy.data.materials:
            continue
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.unit_settings.system = 'METRIC'


def assign(obj, mat):
    obj.data.materials.append(mat)
    return obj


def box(name, location, size, mat, bevel=0.025):
    # Builders use semantic Three.js coordinates: X width, Y height, Z depth.
    # Blender uses Z height, so map point and dimensions at the authoring boundary.
    x, y, z = location
    width, height, depth = size
    bpy.ops.mesh.primitive_cube_add(location=(x, z, y))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = (width, depth, height)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new('soft_bevel', 'BEVEL')
        modifier.width = min(bevel, min(size) * 0.18)
        modifier.segments = 3
        modifier.limit_method = 'ANGLE'
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    assign(obj, mat)
    return obj


def cylinder(name, location, radius, depth, mat, vertices=24, bevel=0.012, rotation=None):
    x, y, z = location
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=(x, z, y), rotation=rotation or (0, 0, 0))
    obj = bpy.context.object
    obj.name = name
    if bevel:
        modifier = obj.modifiers.new('edge_bevel', 'BEVEL')
        modifier.width = min(bevel, radius * 0.24)
        modifier.segments = 2
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    assign(obj, mat)
    return obj


def sphere(name, location, scale, mat):
    x, y, z = location
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, location=(x, z, y))
    obj = bpy.context.object
    obj.name = name
    sx, sy, sz = scale
    obj.scale = (sx, sz, sy)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign(obj, mat)
    return obj


def torus(name, location, major_radius, minor_radius, mat, rotation=(0, 0, 0)):
    x, y, z = location
    bpy.ops.mesh.primitive_torus_add(major_radius=major_radius, minor_radius=minor_radius, major_segments=32, minor_segments=10, location=(x, z, y), rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    assign(obj, mat)
    return obj


def leg(name, x, z, height, mat=DARK_WOOD, radius=0.032, taper=0.75):
    bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=radius * taper, radius2=radius, depth=height, location=(x, z, height / 2))
    obj = bpy.context.object
    obj.name = name
    assign(obj, mat)
    return obj


def cushion(name, location, size, mat, bevel=0.055):
    obj = box(name, location, size, mat, bevel)
    # A subtle tapered visual profile, driven by a non-uniform top-level shape.
    return obj


def dining_chair():
    # 0.50 x 0.50 x 0.96 metres: light oak dining chair with padded seat and slat back.
    seat_y = 0.47
    cushion('seat-cushion', (0, seat_y, 0.02), (0.42, 0.075, 0.40), SAGE, 0.028)
    box('seat-rail', (0, seat_y - 0.06, 0.02), (0.46, 0.055, 0.44), OAK, 0.015)
    for x in (-0.19, 0.19):
        for z in (-0.17, 0.17):
            leg('tapered-leg', x, z, seat_y - 0.035, OAK, 0.028)
    for x in (-0.19, 0.19):
        box('back-post', (x, 0.77, -0.17), (0.045, 0.64, 0.045), OAK, 0.012)
    box('back-top-rail', (0, 1.05, -0.17), (0.43, 0.055, 0.045), OAK, 0.012)
    for x in (-0.105, 0, 0.105):
        box('back-slat', (x, 0.80, -0.17), (0.026, 0.45, 0.032), OAK, 0.008)


def lounge_armchair():
    # Broad modern armchair: separately cushioned back, seat, and rounded arm blocks.
    cushion('base', (0, 0.24, 0.02), (0.78, 0.27, 0.76), BLUE, 0.045)
    cushion('seat-cushion', (0, 0.43, 0.08), (0.63, 0.17, 0.58), BLUE, 0.06)
    back = cushion('back-cushion', (0, 0.74, -0.26), (0.64, 0.60, 0.15), BLUE, 0.065)
    back.rotation_euler.x = -0.10
    for x in (-0.36, 0.36):
        arm = cushion('rounded-arm', (x, 0.45, 0.02), (0.18, 0.43, 0.70), BLUE, 0.075)
        arm.rotation_euler.z = -0.035 if x < 0 else 0.035
    for x in (-0.29, 0.29):
        for z in (-0.25, 0.25):
            leg('short-foot', x, z, 0.16, DARK_WOOD, 0.045)


def office_chair():
    # Ergonomic chair: five spoke wheel base, gas lift, reclined back and paired armrests.
    cylinder('base-disc', (0, 0.045, 0), 0.17, 0.09, CHARCOAL, 32, 0.008)
    cylinder('gas-lift', (0, 0.35, 0), 0.045, 0.62, CHARCOAL, 20, 0.007)
    for index in range(5):
        angle = 2 * pi * index / 5
        x, z = cos(angle) * 0.24, sin(angle) * 0.24
        spoke = box('five-spoke-base', (x / 2, 0.12, z / 2), (0.50, 0.045, 0.055), CHARCOAL, 0.012)
        spoke.rotation_euler.y = -angle
        cylinder('wheel', (x, 0.07, z), 0.055, 0.06, CHARCOAL, 16, 0.008, (0, pi / 2, 0))
    cushion('seat', (0, 0.68, 0.04), (0.56, 0.12, 0.54), CHARCOAL, 0.045)
    back = cushion('ergonomic-back', (0, 1.06, -0.22), (0.50, 0.73, 0.115), CHARCOAL, 0.055)
    back.rotation_euler.x = -0.12
    for x in (-0.31, 0.31):
        cylinder('arm-support', (x, 0.82, 0), 0.025, 0.27, CHARCOAL, 14, 0.005)
        cushion('armrest', (x, 0.97, 0.02), (0.15, 0.055, 0.23), CHARCOAL, 0.02)


def ottoman():
    # Upholstered round ottoman with piping, low feet and slightly domed top.
    cylinder('upholstered-body', (0, 0.24, 0), 0.40, 0.36, OCHRE, 32, 0.035)
    sphere('domed-cushion', (0, 0.43, 0), (0.37, 0.10, 0.37), OCHRE)
    torus('piping', (0, 0.40, 0), 0.34, 0.014, TERRACOTTA)
    for x in (-0.22, 0.22):
        for z in (-0.22, 0.22):
            leg('low-foot', x, z, 0.12, DARK_WOOD, 0.038)


def entry_bench():
    # Entry bench: upholstered seat floats inside oak side frames with a slatted shelf.
    cushion('long-seat', (0, 0.56, 0), (1.18, 0.14, 0.40), TERRACOTTA, 0.045)
    for x in (-0.61, 0.61):
        box('side-frame', (x, 0.35, 0), (0.065, 0.70, 0.47), OAK, 0.014)
        box('top-frame', (x, 0.68, 0), (0.10, 0.055, 0.48), OAK, 0.012)
    for x in (-0.40, -0.20, 0, 0.20, 0.40):
        box('shelf-slat', (x, 0.18, 0), (0.055, 0.035, 0.38), OAK, 0.008)
    box('shelf-rail-front', (0, 0.14, 0.18), (1.12, 0.04, 0.035), OAK, 0.008)
    box('shelf-rail-back', (0, 0.14, -0.18), (1.12, 0.04, 0.035), OAK, 0.008)


def barstool():
    # Compact elevated stool: padded seat, metal gas lift, base and brass footrest.
    cylinder('weighted-base', (0, 0.045, 0), 0.26, 0.09, CHARCOAL, 32, 0.012)
    cylinder('central-column', (0, 0.48, 0), 0.038, 0.84, CHARCOAL, 20, 0.006)
    cylinder('seat', (0, 0.94, 0), 0.20, 0.115, TEAL, 32, 0.035)
    sphere('soft-seat-top', (0, 1.00, 0), (0.185, 0.05, 0.185), TEAL)
    torus('brass-footrest', (0, 0.46, 0), 0.19, 0.018, BRASS)
    torus('seat-piping', (0, 0.99, 0), 0.17, 0.010, BLUE)


def classic_armchair():
    # Formal high-back chair: rolled arms, tuft buttons and carved/tapered feet.
    cushion('seat-base', (0, 0.30, 0.04), (0.77, 0.29, 0.72), GREEN, 0.055)
    cushion('seat-cushion', (0, 0.49, 0.09), (0.61, 0.16, 0.54), GREEN, 0.058)
    back = cushion('high-back', (0, 0.92, -0.25), (0.66, 0.90, 0.17), GREEN, 0.07)
    back.rotation_euler.x = -0.06
    for x in (-0.37, 0.37):
        cylinder('rolled-arm', (x, 0.69, 0.00), 0.115, 0.61, GREEN, 24, 0.04, (0, pi / 2, 0))
        box('arm-base', (x, 0.42, 0), (0.16, 0.43, 0.66), GREEN, 0.05)
    for x in (-0.18, 0, 0.18):
        for y in (0.82, 1.07, 1.31):
            sphere('tuft-button', (x, y, -0.35), (0.028, 0.018, 0.018), BRASS)
    for x in (-0.28, 0.28):
        for z in (-0.23, 0.23):
            leg('carved-foot', x, z, 0.18, DARK_WOOD, 0.050, 0.65)


def export(asset_id, builder):
    reset()
    builder()
    bpy.ops.object.select_all(action='SELECT')
    filepath = OUT / f'{asset_id}.glb'
    bpy.ops.export_scene.gltf(
        filepath=str(filepath),
        export_format='GLB',
        export_materials='EXPORT',
        export_normals=True,
        export_tangents=True,
        export_yup=True,
        export_apply=True,
        export_cameras=False,
        export_lights=False,
        export_extras=True
    )
    print(f'EXPORTED {filepath}')


for asset_id, builder in (
    ('dining-chair-v1', dining_chair),
    ('lounge-armchair-v1', lounge_armchair),
    ('office-chair-v1', office_chair),
    ('ottoman-v1', ottoman),
    ('entry-bench-v1', entry_bench),
    ('barstool-v1', barstool),
    ('classic-armchair-v1', classic_armchair),
):
    export(asset_id, builder)
