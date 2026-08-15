import bpy
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / 'public' / 'assets' / 'furniture' / 'lounge'
OUT = ROOT / 'docs' / 'assets' / 'prod-013'
OUT.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 1800
scene.render.resolution_y = 1100
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.world.color = (0.022, 0.03, 0.05)

floor_mat = bpy.data.materials.new('studio-floor')
floor_mat.diffuse_color = (0.055, 0.062, 0.082, 1)
bpy.ops.mesh.primitive_plane_add(size=18, location=(0, 0, 0))
bpy.context.object.data.materials.append(floor_mat)

assets = [
    ('sectional-hero-pbr-v1.glb', (-2.4, 1.25, 0), 0.20),
    ('straight-sofa-pbr-v1.glb', (1.9, 1.15, 0), -0.22),
    ('coffee-table-pbr-v1.glb', (-1.8, -1.65, 0), 0.08),
    ('round-coffee-table-pbr-v1.glb', (1.8, -1.65, 0), -0.12),
]
for filename, location, rotation in assets:
    bpy.ops.import_scene.gltf(filepath=str(ASSET_DIR / filename))
    for obj in bpy.context.selected_objects:
        obj.location += Vector(location)
        obj.rotation_euler.z += rotation


def area(location, energy, color, size):
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.object
    light.data.energy = energy
    light.data.color = color
    light.data.shape = 'DISK'
    light.data.size = size
    light.rotation_euler = (Vector((0, 0, .40)) - light.location).to_track_quat('-Z', 'Y').to_euler()

area((-4.5, -3.5, 5.5), 1700, (1.0, .60, .38), 5.2)
area((4.5, -1.5, 4.0), 1200, (.36, .56, 1.0), 4.5)
area((0, 4.5, 5), 900, (1.0, .34, .18), 3.0)

bpy.ops.object.camera_add(location=(6.9, -8.2, 5.3))
camera = bpy.context.object
camera.data.lens = 55
camera.rotation_euler = (Vector((0, 0, .48)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
scene.camera = camera
scene.render.filepath = str(OUT / 'lounge-pbr-pack-preview.png')
bpy.ops.render.render(write_still=True)
print(f'RENDERED {scene.render.filepath}')
