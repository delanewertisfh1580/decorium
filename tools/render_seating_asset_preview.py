import bpy
from pathlib import Path
from mathutils import Vector
from math import pi, radians

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / 'public' / 'assets' / 'furniture' / 'seating'
OUT = ROOT / 'docs' / 'assets' / 'prod-012r'
OUT.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = False
scene.world.color = (0.055, 0.07, 0.09)

# Matte studio floor
mat = bpy.data.materials.new('StudioFloor')
mat.diffuse_color = (0.18, 0.19, 0.20, 1)
bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, 0))
floor = bpy.context.object
floor.data.materials.append(mat)

assets = [
    ('dining-chair-v1.glb', (-2.9, 1.25), pi),
    ('lounge-armchair-v1.glb', (-1.0, 1.25), pi),
    ('office-chair-v1.glb', (1.05, 1.25), pi),
    ('classic-armchair-v1.glb', (3.0, 1.25), pi),
    ('ottoman-v1.glb', (-2.7, -1.35), pi),
    ('entry-bench-v1.glb', (-0.75, -1.35), pi),
    ('barstool-v1.glb', (1.75, -1.35), pi),
]
for filename, (x, y), rotation in assets:
    bpy.ops.import_scene.gltf(filepath=str(ASSET_DIR / filename))
    selected = list(bpy.context.selected_objects)
    root = bpy.data.objects.new(filename.replace('.glb', ''), None)
    bpy.context.collection.objects.link(root)
    for obj in selected:
        obj.parent = root
    root.location = (x, y, 0)
    root.rotation_euler.z = rotation

# Large soft key, cool fill and warm rim.
def area(name, location, energy, size, color):
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.object
    light.name = name
    light.data.energy = energy
    light.data.shape = 'DISK'
    light.data.size = size
    light.data.color = color
    target = Vector((0, 0, 0.72))
    direction = target - light.location
    light.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

area('soft-key', (-4.0, 6.0, 5.8), 1450, 5.0, (1.0, 0.80, 0.63))
area('cool-fill', (4.5, 3.0, 3.4), 850, 4.0, (0.52, 0.68, 1.0))
area('rim', (0.0, -4.0, 4.5), 1000, 3.0, (1.0, 0.48, 0.28))

bpy.ops.object.camera_add(location=(0.0, -9.2, 6.4))
camera = bpy.context.object
camera.data.lens = 48
camera.rotation_euler = (radians(57), 0, 0)
target = Vector((0, 0, 0.72))
direction = target - camera.location
camera.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
scene.camera = camera

scene.render.filepath = str(OUT / 'seating-pack-preview.png')
bpy.ops.render.render(write_still=True)
print(f'RENDERED {scene.render.filepath}')
