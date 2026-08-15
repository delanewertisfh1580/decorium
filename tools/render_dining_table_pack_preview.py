import bpy
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / 'public' / 'assets' / 'furniture' / 'dining'
OUT = ROOT / 'docs' / 'assets' / 'prod-014'
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
    ('dining-table-pbr-v1.glb', (-2.3, 1.0, 0), -0.14),
    ('writing-desk-pbr-v1.glb', (1.7, 1.15, 0), 0.16),
    ('computer-desk-pbr-v1.glb', (0.0, -1.85, 0), 0.03),
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
    light.rotation_euler = (Vector((0, 0, .48)) - light.location).to_track_quat('-Z', 'Y').to_euler()

area((-4.6, -3.4, 5.7), 1650, (1.0, .60, .38), 5.4)
area((4.7, -1.0, 4.2), 1300, (.34, .56, 1.0), 4.6)
area((0, 4.6, 5.2), 920, (1.0, .34, .18), 3.0)

bpy.ops.object.camera_add(location=(6.7, -8.4, 5.55))
camera = bpy.context.object
camera.data.lens = 56
camera.rotation_euler = (Vector((0, 0, .49)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
scene.camera = camera
scene.render.filepath = str(OUT / 'dining-table-pbr-pack-preview.png')
bpy.ops.render.render(write_still=True)
print(f'RENDERED {scene.render.filepath}')
