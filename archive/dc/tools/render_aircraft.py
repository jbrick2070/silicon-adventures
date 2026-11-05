"""Render the Eastern Beacon's courier aircraft from its Pixal3D model.

    blender --background --python archive/dc/tools/render_aircraft.py -- <glb> <outdir> [frames samples]

The aircraft banks through one slow turn on a transparent background. Frames go
to <outdir>/f##.png.
"""
import math
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:]
GLB, OUT = args[0], Path(args[1])
FRAMES = int(args[2]) if len(args) > 2 else 16
SAMPLES = int(args[3]) if len(args) > 3 else 48

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "OPTIX"
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type != "CPU"
scene.cycles.device = "GPU"
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = 256, 160
scene.render.film_transparent = True
scene.render.image_settings.color_mode = "RGBA"
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"

before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=GLB)
new = set(bpy.data.objects) - before
meshes = [o for o in new if o.type == "MESH"]
root = bpy.data.objects.new("root", None)
scene.collection.objects.link(root)
for o in new:
    if o.parent is None:
        o.parent = root
bpy.context.view_layer.update()
pts = np.array([list(o.matrix_world @ Vector(c)) for o in meshes for c in o.bound_box])
lo, hi = pts.min(0), pts.max(0)
size = float((hi - lo).max())
print("bounds", lo, hi)
holder = bpy.data.objects.new("holder", None)
scene.collection.objects.link(holder)
root.parent = holder
root.scale = (2 / size, 2 / size, 2 / size)
c = (lo + hi) / 2 * 2 / size
root.location = (-c[0], -c[1], -c[2])

cam_data = bpy.data.cameras.new("cam"); cam_data.type = "ORTHO"; cam_data.ortho_scale = 2.6
cam = bpy.data.objects.new("cam", cam_data); scene.collection.objects.link(cam); scene.camera = cam
cam.location = (0, -6, 1); cam.rotation_euler = (math.radians(80.5), 0, 0)
for name, energy, colour, loc in (("key", 180, (1, .9, .68), (-3, -3, 4)), ("rim", 60, (.6, .72, 1), (3, 3, 1))):
    data = bpy.data.lights.new(name, "SUN"); data.energy = energy / 60; data.color = colour
    o = bpy.data.objects.new(name, data); scene.collection.objects.link(o); o.location = loc
    t = bpy.data.objects.new(name + "t", None); scene.collection.objects.link(t)
    k = o.constraints.new("TRACK_TO"); k.target = t; k.track_axis = "TRACK_NEGATIVE_Z"; k.up_axis = "UP_Y"
world = bpy.data.worlds.new("w"); scene.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (.5, .55, .65, 1)

for f in range(FRAMES):
    a = f / FRAMES * math.tau
    holder.rotation_euler = (math.radians(14 * math.sin(a)), math.radians(22 * math.cos(a)), a)
    scene.render.filepath = str(OUT / f"f{f:02d}.png")
    bpy.ops.render.render(write_still=True)
