import bpy
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
ASSET = ROOT / 'public' / 'assets' / 'furniture' / 'lounge' / 'sectional-hero-pbr-v1.glb'
OUT = ROOT / 'docs' / 'assets' / 'prod-013'
OUT.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 1600
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.world.color = (0.025, 0.035, 0.055)

floor_mat = bpy.data.materials.new('floor')
floor_mat.diffuse_color = (0.075, 0.08, 0.095, 1)
bpy.ops.mesh.primitive_plane_add(size=14, location=(0, 0, 0))
bpy.context.object.data.materials.append(floor_mat)

bpy.ops.import_scene.gltf(filepath=str(ASSET))
for obj in bpy.context.selected_objects:
    obj.rotation_euler.z = 3.14159


def area(location, energy, color, size):
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.object
    light.data.energy = energy
    light.data.color = color
    light.data.shape = 'DISK'
    light.data.size = size
    light.rotation_euler = (Vector((0, 0, .48)) - light.location).to_track_quat('-Z', 'Y').to_euler()

area((-4, -3, 5), 1300, (1.0, .63, .40), 4.5)
area((3, -1, 3.5), 850, (.38, .58, 1.0), 3.5)
area((0, 4, 4), 700, (1.0, .30, .15), 2.8)

bpy.ops.object.camera_add(location=(4.4, -5.5, 3.1))
camera = bpy.context.object
camera.data.lens = 52
camera.rotation_euler = (Vector((0, 0, .55)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
scene.camera = camera
scene.render.filepath = str(OUT / 'hero-sectional-pbr-preview.png')
bpy.ops.render.render(write_still=True)
print(f'RENDERED {scene.render.filepath}')
