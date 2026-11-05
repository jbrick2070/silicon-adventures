"""Render the castle's closing 3D shot in Blender.

    blender --background --python archive/dc/tools/render_finale.py -- <outdir> [first last step samples]

Uses the Pixal3D models in art/castle-models, seated on a stone dais before the
painted throne room. Frames go to <outdir>/f####.png. Add "empty" for the throne alone.
"""
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[3]
args = sys.argv[sys.argv.index("--") + 1:]
OUT = Path(args[0]); OUT.mkdir(parents=True, exist_ok=True)
FIRST, LAST, STEP, SAMPLES = (int(v) for v in ([a for a in args[1:5] if a != "empty"] or ["0", "47", "1", "64"]))
FRAMES = 48
W, H = 640, 428

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
scene.cycles.max_bounces = 4
scene.render.resolution_x, scene.render.resolution_y = W, H
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = .4


def load(name):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(ROOT / f"art/castle-models/{name}.glb"))
    new = set(bpy.data.objects) - before
    meshes = [o for o in new if o.type == "MESH"]
    root = bpy.data.objects.new(name, None)
    scene.collection.objects.link(root)
    for o in new:
        if o.parent is None:
            o.parent = root
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    lo = Vector(tuple(min(p[i] for p in pts) for i in range(3)))
    hi = Vector(tuple(max(p[i] for p in pts) for i in range(3)))
    print(name, "bounds", lo, hi)
    return root, lo, hi


def place(root, lo, hi, height, x, y, z, turn=0):
    s = height / (hi.z - lo.z)
    root.scale = (s, s, s)
    centre = (lo + hi) / 2
    root.rotation_euler = (0, 0, math.radians(turn))
    bpy.context.view_layer.update()
    offset = root.matrix_world.to_3x3() @ Vector((centre.x, centre.y, lo.z))
    root.location = (x - offset.x, y - offset.y, z - offset.z)


def plane(name, size, location, rotation, material):
    bpy.ops.mesh.primitive_plane_add(size=1, location=location, rotation=rotation)
    o = bpy.context.object
    o.name = name; o.scale = size; o.data.materials.append(material)
    return o


throne, tlo, thi = load("throne")
EMPTY = "empty" in args
place(throne, tlo, thi, 2.6, 0, 0, .3)
if not EMPTY:
    knight, klo, khi = load("knight")
    place(knight, klo, khi, 1.75, 0, -.42, .42)

# Painted throne room as a far backdrop, so it shifts against the throne as the camera moves.
wall = bpy.data.materials.new("wall"); wall.use_nodes = True
nodes = wall.node_tree.nodes; bsdf = nodes["Principled BSDF"]
tex = nodes.new("ShaderNodeTexImage"); tex.image = bpy.data.images.load(str(ROOT / "art/castle-3d/4x/B-PSCR-4020.png"))
mix = nodes.new("ShaderNodeMixRGB"); mix.blend_type = "MULTIPLY"; mix.inputs[0].default_value = 1; mix.inputs[2].default_value = (.5, .5, .55, 1)
wall.node_tree.links.new(tex.outputs[0], mix.inputs[1]); wall.node_tree.links.new(mix.outputs[0], bsdf.inputs["Base Color"])
bsdf.inputs["Roughness"].default_value = .9
plane("wall", (16, 10.7, 1), (0, 5, 3.6), (math.radians(90), 0, 0), wall)

stone = bpy.data.materials.new("stone"); stone.use_nodes = True
b = stone.node_tree.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (.055, .05, .05, 1); b.inputs["Roughness"].default_value = .42
plane("floor", (30, 30, 1), (0, 0, 0), (0, 0, 0), stone)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -.1, .15)); dais = bpy.context.object; dais.scale = (3.2, 2.6, .3); dais.data.materials.append(stone)

world = bpy.data.worlds.new("w"); scene.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (.008, .009, .013, 1)


def lamp(kind, energy, colour, location, target=(0, 0, 1.2), size=1.0):
    data = bpy.data.lights.new(kind, "AREA"); data.energy = energy; data.color = colour; data.size = size
    o = bpy.data.objects.new(kind, data); scene.collection.objects.link(o); o.location = location
    t = bpy.data.objects.new(kind + "t", None); scene.collection.objects.link(t); t.location = target
    c = o.constraints.new("TRACK_TO"); c.target = t; c.track_axis = "TRACK_NEGATIVE_Z"; c.up_axis = "UP_Y"
    return o


key = lamp("key", 260, (1, .86, .55), (-2.4, -3.2, 3.2), size=1.4)
rim = lamp("rim", 75, (.55, .68, 1), (2.8, 2.2, 3.0), size=2)
fill = lamp("fill", 16, (.6, .68, .9), (2.5, -3.5, 1.2), size=3)

cam_data = bpy.data.cameras.new("cam"); cam_data.lens = 50
cam = bpy.data.objects.new("cam", cam_data); scene.collection.objects.link(cam); scene.camera = cam
aim = bpy.data.objects.new("aim", None); scene.collection.objects.link(aim); aim.location = (0, 0, 1.45)
c = cam.constraints.new("TRACK_TO"); c.target = aim; c.track_axis = "TRACK_NEGATIVE_Z"; c.up_axis = "UP_Y"

for f in range(FIRST, LAST + 1, STEP):
    t = f / (FRAMES - 1)
    ease = t * t * (3 - 2 * t)
    az = math.radians(-34 + 68 * ease)
    dist = 7.4 - 1.5 * ease
    cam.location = (math.sin(az) * dist, -math.cos(az) * dist, 1.2 + .55 * ease)
    key.location = (-2.4 + 1.6 * math.sin(t * 6.28), -3.2, 3.2 + .3 * math.cos(t * 9))
    scene.render.filepath = str(OUT / f"f{f:04d}.png")
    bpy.ops.render.render(write_still=True)
