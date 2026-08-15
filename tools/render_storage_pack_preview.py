import bpy
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / 'public' / 'assets' / 'furniture' / 'storage'
OUT = ROOT / 'docs' / 'assets' / 'prod-015'
OUT.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 2000
scene.render.resolution_y = 1300
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.world.color = (.020, .028, .046)

floor_mat = bpy.data.materials.new('storage-studio-floor')
floor_mat.diffuse_color = (.050, .058, .078, 1)
bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, 0))
bpy.context.object.data.materials.append(floor_mat)

assets = [
    ('wall-shelf-pbr-v1.glb', (-3.10, 1.55, 0), -.08),
    ('bookcase-pbr-v1.glb', (-1.45, 1.35, 0), .05),
    ('tall-rack-pbr-v1.glb', (.40, 1.52, 0), -.04),
    ('drawer-chest-pbr-v1.glb', (2.25, 1.48, 0), .08),
    ('sideboard-pbr-v1.glb', (-2.15, -1.55, 0), -.08),
    ('tv-stand-pbr-v1.glb', (.20, -1.72, 0), .04),
    ('nightstand-pbr-v1.glb', (2.55, -1.55, 0), .16),
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
    light.rotation_euler = (Vector((0, 0, .80)) - light.location).to_track_quat('-Z', 'Y').to_euler()

area((-5.3, -4.5, 6.4), 1850, (1.0, .58, .34), 5.6)
area((5.4, -1.4, 5.2), 1420, (.34, .57, 1.0), 4.8)
area((0, 5.0, 5.8), 1030, (1.0, .32, .16), 3.4)

bpy.ops.object.camera_add(location=(7.75, -10.0, 6.5))
camera = bpy.context.object
camera.data.lens = 58
camera.rotation_euler = (Vector((0, 0, .88)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
scene.camera = camera
scene.render.filepath = str(OUT / 'storage-pbr-pack-preview.png')
bpy.ops.render.render(write_still=True)
print(f'RENDERED {scene.render.filepath}')
