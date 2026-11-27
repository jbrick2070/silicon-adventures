"""Cycles front end: one height field, one orthographic camera, one light rig."""
import numpy as np, bpy, time
from mathutils import Vector


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    p = bpy.context.preferences.addons['cycles'].preferences
    p.compute_device_type = 'OPTIX'; p.get_devices()
    for d in p.devices: d.use = d.type == 'OPTIX'
    sc.cycles.device = 'GPU'
    return sc


def image(name, arr):
    h, w = arr.shape[:2]
    img = bpy.data.images.new(name, w, h, alpha=True, float_buffer=True)
    rgba = np.ones((h, w, 4), np.float32)
    rgba[..., :arr.shape[2]] = arr
    img.pixels.foreach_set(np.flipud(rgba).ravel())
    img.colorspace_settings.name = 'Non-Color'
    img.pack()
    return img


def heightfield(name, Z, unit):
    """Vertices sit at sub-pixel centres. unit = world units per map pixel."""
    h, w = Z.shape
    yy, xx = np.mgrid[0:h, 0:w]
    co = np.stack([(xx + .5) * unit, -(yy + .5) * unit, Z], -1).astype(np.float32).ravel()
    idx = np.arange(h * w, dtype=np.int32).reshape(h, w)
    q = np.stack([idx[:-1, :-1], idx[1:, :-1], idx[1:, 1:], idx[:-1, 1:]], -1).reshape(-1)
    n = q.size // 4
    me = bpy.data.meshes.new(name)
    me.vertices.add(h * w); me.vertices.foreach_set('co', co)
    me.loops.add(q.size); me.loops.foreach_set('vertex_index', q)
    me.polygons.add(n); me.polygons.foreach_set('loop_start', np.arange(n, dtype=np.int32) * 4)
    uv = me.uv_layers.new(name='UV')
    u = ((xx + .5) / w).astype(np.float32).ravel(); v = (1 - (yy + .5) / h).astype(np.float32).ravel()
    uv.data.foreach_set('uv', np.stack([u, v], -1)[q].ravel())
    me.update(calc_edges=True)
    me.polygons.foreach_set('use_smooth', np.ones(n, bool)); me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def material(ob, alb, rough, metal):
    mat = bpy.data.materials.new('m'); mat.use_nodes = True
    nt = mat.node_tree; b = nt.nodes['Principled BSDF']
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = image('alb', alb); t.interpolation = 'Linear'
    t2 = nt.nodes.new('ShaderNodeTexImage'); t2.image = image('rm', np.dstack([rough, metal, rough * 0]))
    t2.interpolation = 'Linear'
    sp = nt.nodes.new('ShaderNodeSeparateColor')
    nt.links.new(t.outputs[0], b.inputs['Base Color'])
    nt.links.new(t2.outputs[0], sp.inputs[0])
    nt.links.new(sp.outputs[0], b.inputs['Roughness']); nt.links.new(sp.outputs[1], b.inputs['Metallic'])
    ob.data.materials.append(mat)


def camera(width_units, height_units, res_x, res_y, z=400):
    sc = bpy.context.scene
    cam = bpy.data.cameras.new('c'); cam.type = 'ORTHO'
    cam.ortho_scale = max(width_units, height_units)
    cam.sensor_fit = 'HORIZONTAL' if width_units >= height_units else 'VERTICAL'
    ob = bpy.data.objects.new('c', cam); sc.collection.objects.link(ob)
    ob.location = (width_units / 2, -height_units / 2, z); ob.rotation_euler = (0, 0, 0)
    sc.camera = ob
    sc.render.resolution_x = res_x; sc.render.resolution_y = res_y; sc.render.resolution_percentage = 100
    sc.render.pixel_aspect_x = sc.render.pixel_aspect_y = 1


def sun(direction, energy, colour, angle_deg):
    l = bpy.data.lights.new('s', 'SUN'); l.energy = energy; l.color = colour; l.angle = np.radians(angle_deg)
    ob = bpy.data.objects.new('s', l); bpy.context.scene.collection.objects.link(ob)
    d = np.array(direction, float); d /= np.linalg.norm(d)
    ob.rotation_euler = Vector(d).to_track_quat('Z', 'Y').to_euler()
    return ob


def area(loc, size, energy, colour, target):
    l = bpy.data.lights.new('a', 'AREA'); l.shape = 'DISK'; l.size = size; l.energy = energy; l.color = colour
    ob = bpy.data.objects.new('a', l); bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (Vector(loc) - Vector(target)).to_track_quat('Z', 'Y').to_euler()
    return ob


def world(colour, strength):
    w = bpy.data.worlds.new('w'); w.use_nodes = True
    b = w.node_tree.nodes['Background']; b.inputs[0].default_value = (*colour, 1); b.inputs[1].default_value = strength
    bpy.context.scene.world = w


def render(path, samples, film_transparent=False, denoise=True):
    sc = bpy.context.scene
    c = sc.cycles
    c.samples = samples; c.use_adaptive_sampling = True; c.adaptive_threshold = .01
    c.max_bounces = 5; c.diffuse_bounces = 3; c.glossy_bounces = 3; c.transmission_bounces = 0; c.volume_bounces = 0
    c.use_denoising = denoise; c.denoiser = 'OPENIMAGEDENOISE'
    c.pixel_filter_type = 'BOX'; c.filter_width = 1.0
    c.seed = 7
    sc.render.film_transparent = film_transparent
    sc.render.image_settings.file_format = 'OPEN_EXR'; sc.render.image_settings.color_depth = '32'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.render.filepath = path
    t = time.time()
    bpy.ops.render.render(write_still=True)
    print('render', round(time.time() - t, 1), 's')
    img = bpy.data.images.load(path)
    w, h = img.size
    a = np.zeros(h * w * 4, np.float32); img.pixels.foreach_get(a)
    bpy.data.images.remove(img)
    return np.flipud(a.reshape(h, w, 4))
