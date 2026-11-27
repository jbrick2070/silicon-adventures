"""Shape-locked relief renderer for the 1-bit castle art.

The original ink is never moved: every opaque pixel stays opaque, every
transparent pixel stays transparent, and ink lines become grooves or edge
lines at the same positions. Depth, colour and light are added on top.
Rendering happens at 4x, then a box filter produces the native file.
"""
import numpy as np
from scipy import ndimage as ndi
from PIL import Image

S = 4  # render scale


# ---------------------------------------------------------------- helpers
def up(a, s=S):
    return np.repeat(np.repeat(a, s, 0), s, 1)


def down(a, s=S):
    h, w = a.shape[0] // s, a.shape[1] // s
    return a[:h * s, :w * s].reshape(h, s, w, s, *a.shape[2:]).mean(axis=(1, 3))


def value_noise(shape, seed, cell):
    rng = np.random.default_rng(seed)
    h, w = shape
    small = rng.random((h // cell + 3, w // cell + 3)).astype(np.float32)
    big = ndi.zoom(small, cell, order=3)
    return big[:h, :w] - 0.5


def fbm(shape, seed, cells=(96, 48, 24, 12, 6), weights=(1, .55, .3, .16, .08)):
    out = np.zeros(shape, np.float32)
    tot = 0.0
    for i, (c, w) in enumerate(zip(cells, weights)):
        out += w * value_noise(shape, seed * 101 + i, c)
        tot += w
    return out / tot


def edt(mask):
    return ndi.distance_transform_edt(mask).astype(np.float32)


def pillow(mask, radius):
    """Rounded dome 0..1 inside mask, flat top after `radius` subpixels."""
    d = np.clip(edt(mask) / max(radius, 1e-3), 0, 1)
    return np.sqrt(1 - (1 - d) ** 2).astype(np.float32)


def chamfer(mask, width):
    return np.clip(edt(mask) / max(width, 1e-3), 0, 1).astype(np.float32)


def blur(a, sigma):
    return ndi.gaussian_filter(a, sigma)


def normalize(v):
    return v / np.linalg.norm(v)


# ---------------------------------------------------------------- lighting
def cast_shadow(H, light, max_steps=40, soft=2.0):
    """Ray-march shadow mask (1 = lit) over a height field in subpixels."""
    lx, ly, lz = light
    # step towards the light in the image plane; height rises by slope per step
    step = np.array([lx, ly]) / np.hypot(lx, ly)
    slope = lz / np.hypot(lx, ly) / S  # H is in native px, steps in subpx
    occl = np.zeros_like(H)
    h, w = H.shape
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    for k in range(1, max_steps + 1):
        sx = xs + step[0] * k
        sy = ys + step[1] * k
        hs = ndi.map_coordinates(H, [sy, sx], order=1, mode='nearest')
        occl = np.maximum(occl, hs - H - slope * k)
    shade = np.clip(occl / 0.6, 0, 1)
    shade = blur(shade, soft)
    return 1 - shade


def ambient_occlusion(H, strengths=((3, 1.0), (8, 1.2), (20, 1.4))):
    ao = np.zeros_like(H)
    for sigma, k in strengths:
        ao += np.clip((blur(H, sigma) - H) * k / sigma * S, 0, 1)
    return np.clip(1 - 0.55 * np.clip(ao, 0, 1.4), 0.25, 1)


def shade(H, albedo, gloss, spec, light=(-0.45, -0.70, 0.55), shadow_light=None,
          key=(0.80, 0.76, 0.68), fill=(0.42, 0.48, 0.60), ambient=(0.30, 0.33, 0.40),
          normal_gain=2.2, shadow_strength=0.6, ao_map=None, rim=0.0, alpha=None,
          key_power=1.0, blur_sigma=0.7, contrast=1.12):
    """Blinn-Phong relief shading. H in native px, arrays at 4x."""
    Hb = blur(H, blur_sigma)
    gy, gx = np.gradient(Hb)
    n = np.dstack([-gx * normal_gain, -gy * normal_gain, np.ones_like(H)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    L = normalize(np.array(light, np.float32))
    F = normalize(np.array([0.6, 0.35, 0.7], np.float32))
    V = np.array([0, 0, 1], np.float32)
    Hv = normalize(L + V)
    ndl = np.clip(n @ L, 0, 1)
    ndf = np.clip(n @ F, 0, 1)
    ndh = np.clip(n @ Hv, 0, 1)
    sh = cast_shadow(H, shadow_light or light)
    sh = 1 - shadow_strength * (1 - sh)
    ao = ao_map if ao_map is not None else ambient_occlusion(H)
    key = np.array(key, np.float32)
    fill = np.array(fill, np.float32)
    amb = np.array(ambient, np.float32)
    diffuse = (amb * ao[..., None]
               + key * (ndl ** key_power * sh)[..., None]
               + fill * (ndf * 0.35)[..., None])
    col = albedo * diffuse
    specular = (ndh[..., None] ** gloss[..., None]) * spec[..., None] * sh[..., None] * key
    col = col + specular * 255
    if rim:
        # light wrapping around silhouettes, used on sprites
        nz = n[..., 2]
        r = np.clip(1 - nz, 0, 1) ** 2 * rim
        col = col + r[..., None] * np.array([120, 140, 170], np.float32)
    col = 255 * ((col / 255 - 0.5) * contrast + 0.5)
    return np.clip(col, 0, 255)


def finish(col4, alpha4, native_alpha, out4, out_native):
    """Write 4x and native RGBA. Alpha is the exact original mask."""
    col4 = np.clip(np.round(col4), 0, 255)
    rgba4 = np.dstack([col4, alpha4.astype(np.float32) * 255]).astype(np.uint8)
    Image.fromarray(rgba4, 'RGBA').save(out4)
    rgb = down(col4)
    rgba = np.dstack([rgb, native_alpha.astype(np.float32) * 255])
    rgba = np.clip(np.round(rgba), 0, 255).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(out_native)
    return rgba


def load_bits(path):
    a = np.array(Image.open(path).convert('RGBA'))
    alpha = a[..., 3] > 127
    ink = (a[..., 0] < 128) & alpha
    return alpha, ink
