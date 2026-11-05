"""Render a turning view of each scepter from its Pixal3D model.

    blender --background --python archive/dc/tools/render_scepters.py -- <glb folder> <outdir> [frames samples]

Each model stands upright on its long axis, head up, and makes one full turn
on a transparent background. Frames go to <outdir>/<name>/f##.png.
"""
import math
import sys
from pathlib import Path

import bmesh  # noqa: F401
import bpy
import numpy as np
from mathutils import Matrix, Vector

args = sys.argv[sys.argv.index("--") + 1:]
SOURCE, OUT = Path(args[0]), Path(args[1])
FRAMES = int(args[2]) if len(args) > 2 else 24
SAMPLES = int(args[3]) if len(args) > 3 else 48
SIZE = 256
ONLY = args[4] if len(args) > 4 else None


def setup():
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
    scene.render.resolution_x = scene.render.resolution_y = SIZE
    scene.render.film_transparent = True
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    return scene


def lamp(scene, name, energy, colour, location):
    data = bpy.data.lights.new(name, "AREA"); data.energy = energy; data.color = colour; data.size = 2
    o = bpy.data.objects.new(name, data); scene.collection.objects.link(o); o.location = location
    t = bpy.data.objects.new(name + "t", None); scene.collection.objects.link(t)
    c = o.constraints.new("TRACK_TO"); c.target = t; c.track_axis = "TRACK_NEGATIVE_Z"; c.up_axis = "UP_Y"


for name in ("earth", "fire", "air", "water"):
    if ONLY and name != ONLY:
        continue
    scene = setup()
    bpy.ops.import_scene.gltf(filepath=str(sorted(SOURCE.glob(f"pixal_scepter_{name}_*.glb"))[-1]))
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    points = []
    for o in meshes:
        v = np.empty(len(o.data.vertices) * 3); o.data.vertices.foreach_get("co", v)
        m = np.array(o.matrix_world)
        p = v.reshape(-1, 3); points.append(p @ m[:3, :3].T + m[:3, 3])
    pts = np.concatenate(points)
    centre = pts.mean(axis=0)
    axis = np.linalg.svd(pts[::max(1, len(pts) // 50000)] - centre, full_matrices=False)[2][0]
    along = (pts - centre) @ axis
    radial = np.linalg.norm((pts - centre) - np.outer(along, axis), axis=1)
    high = along > np.percentile(along, 75); low = along < np.percentile(along, 25)
    if radial[low].mean() > radial[high].mean():  # The wider end is the head, and it goes on top.
        axis = -axis; along = -along
    turn = Vector(axis.tolist()).rotation_difference(Vector((0, 0, 1))).to_matrix().to_4x4()
    root = bpy.data.objects.new("root", None); scene.collection.objects.link(root)
    pivot = np.median(pts, axis=0)
    span = along.max() - along.min(); mid = (along.max() + along.min()) / 2
    hold = Matrix.Scale(2.0 / span, 4) @ Matrix.Translation((0, 0, -mid)) @ turn @ Matrix.Translation(Vector((-centre).tolist()))
    for o in meshes:
        if o.parent is None or o.parent.type != "MESH":
            pass
    for o in [o for o in bpy.data.objects if o.parent is None and o is not root and o.type in {"MESH", "EMPTY"}]:
        o.parent = root
        o.matrix_parent_inverse = hold
    cam_data = bpy.data.cameras.new("cam"); cam_data.type = "ORTHO"; cam_data.ortho_scale = 2.3
    cam = bpy.data.objects.new("cam", cam_data); scene.collection.objects.link(cam); scene.camera = cam
    cam.location = (0, -6, .35); cam.rotation_euler = (math.radians(86.7), 0, 0)
    lamp(scene, "key", 120, (1, .87, .6), (-3, -3.5, 3))
    lamp(scene, "rim", 70, (.6, .72, 1), (3.5, 2, 1))
    lamp(scene, "fill", 30, (.7, .75, .9), (3, -4, -1))
    world = bpy.data.worlds.new("w"); scene.world = world; world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (.18, .19, .23, 1)
    for f in range(FRAMES):
        root.rotation_euler = (0, 0, f / FRAMES * math.tau)
        scene.render.filepath = str(OUT / name / f"f{f:02d}.png")
        bpy.ops.render.render(write_still=True)
