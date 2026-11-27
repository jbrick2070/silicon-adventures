"""Render the hero and gargoyle sheets as lit, rounded figures.

Alpha is the original mask, exactly. The white halo and black outline of
the 1986 sprites become the rounded edge of the body; interior ink becomes
creases. Materials are assigned per connected region using the frame's own
proportions, so every frame of a reel is coloured by the same rule.
"""
import os
import numpy as np
from scipy import ndimage as ndi
from PIL import Image
from relief import *

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')).replace('\\', '/')
SRC = f'{ROOT}/art/castle'
OUT = f'{ROOT}/art/castle-relief'


def render_sheet(name, fw, fh, classify, palette, volume, light, rim, contrast, crease=0.45):
    alpha, ink = load_bits(f'{SRC}/{name}.png')
    h, w = alpha.shape
    n = w // fw
    col4 = np.zeros((h * S, w * S, 3), np.float32)
    for f in range(n):
        sl = (slice(0, fh), slice(f * fw, (f + 1) * fw))
        a, k = alpha[sl], ink[sl]
        if not a.any():
            continue
        lab = classify(a, k)  # native label map, 0 = transparent
        a4, k4, lab4 = up(a), up(k), up(lab)
        # --- height: one soft body dome, then each region rounded on its own
        H = pillow(a4, volume[0] * S) * volume[1]
        halo = a & ~k & up(ndi.binary_dilation(~a, iterations=1), 1)  # white ring on the edge
        halo = halo & ndi.binary_dilation(~a, structure=np.ones((3, 3)))
        outline = k & ndi.binary_dilation(halo, structure=np.ones((3, 3)))
        halo4, outline4 = up(halo), up(outline)
        inner = a4 & ~halo4 & ~outline4
        regions = inner & ~k4
        H += pillow(regions, 2.2 * S) * volume[2]
        H -= np.where(k4 & inner, 0.9, 0)      # creases
        H -= np.where(outline4, 0.6, 0)        # outline sits just inside the rim
        # --- albedo
        alb = np.zeros((fh * S, fw * S, 3), np.float32)
        for code, rgb in palette.items():
            alb[lab4 == code] = rgb
        # ink and the edge ring take the colour of the nearest body region
        src = regions
        if src.any():
            idx = ndi.distance_transform_edt(~src, return_indices=True)[1]
            near_lab = lab4[idx[0], idx[1]]
            near = np.zeros_like(alb)
            for code, rgb in palette.items():
                near[near_lab == code] = rgb
        else:
            near = alb.copy()  # no body region to borrow from: keep each pixel's own colour
        alb = np.where((k4 & inner)[..., None], near * crease, alb)
        alb = np.where(outline4[..., None], near * crease * 0.85, alb)
        alb = np.where(halo4[..., None], near * 0.92, alb)
        grain = fbm(alb.shape[:2], 5 + f, cells=(24, 12, 6, 3), weights=(1, .5, .25, .12))
        alb *= (1 + 0.10 * grain)[..., None]
        gloss = np.full(alb.shape[:2], 14.0, np.float32)
        spec = np.full(alb.shape[:2], 0.10, np.float32)
        for code, (g, sp) in getattr(classify, 'spec', {}).items():
            gloss[lab4 == code] = g
            spec[lab4 == code] = sp
        ao = ambient_occlusion(H, strengths=((2, 1.2), (5, 1.2)))
        c = shade(H, alb, gloss, spec, light=light, shadow_light=(light[0], light[1], 1.2),
                  shadow_strength=0.35, normal_gain=2.6, ao_map=ao, rim=rim,
                  blur_sigma=0.9, contrast=contrast)
        c[~a4] = 0
        col4[sl[0].start * S:sl[0].stop * S, sl[1].start * S:sl[1].stop * S] = c
    finish(col4, up(alpha), alpha, f'{OUT}/4x/{name}.png', f'{OUT}/native/{name}.png')
    print(name, 'done', n, 'frames')


# ---------------------------------------------------------------- hero
HAIR, SKIN, SHIRT, BELT, PANTS, BOOT = 1, 2, 3, 4, 5, 6
hero_palette = {
    HAIR: (96, 60, 34), SKIN: (236, 186, 142), SHIRT: (196, 72, 58),
    BELT: (70, 48, 32), PANTS: (62, 70, 102), BOOT: (58, 40, 30),
}


def classify_hero(a, k):
    ys, xs = np.where(a)
    top, bot = ys.min(), ys.max()
    hgt = bot - top + 1
    lab = np.zeros(a.shape, np.int16)
    rel = (np.arange(a.shape[0])[:, None] - top) / hgt
    rel = np.broadcast_to(rel, a.shape)
    # bands by relative height within the frame's own bounding box
    lab[a & (rel < 0.28)] = SKIN
    lab[a & (rel >= 0.28) & (rel < 0.56)] = SHIRT
    lab[a & (rel >= 0.56) & (rel < 0.61)] = BELT
    lab[a & (rel >= 0.61)] = PANTS
    lab[a & (rel >= 0.88)] = BOOT
    # hair: ink in the head band
    lab[k & (rel < 0.20)] = HAIR
    # hands: small white islands in the shirt band are skin
    wl, nw = ndi.label(a & ~k)
    for i, sl in enumerate(ndi.find_objects(wl)):
        comp = wl[sl] == i + 1
        sz = comp.sum()
        cy = (sl[0].start + sl[0].stop) / 2
        r = (cy - top) / hgt
        if 0.30 < r < 0.62 and sz <= 14:
            sub = lab[sl]
            sub[comp] = SKIN
    return lab


classify_hero.spec = {SKIN: (18, 0.12), SHIRT: (10, 0.06), PANTS: (10, 0.05),
                      BOOT: (28, 0.25), HAIR: (20, 0.10), BELT: (24, 0.2)}

# ---------------------------------------------------------------- gargoyle
STONE, WING = 1, 2
garg_palette = {STONE: (176, 180, 168), WING: (160, 166, 152)}


def classify_garg(a, k):
    lab = np.zeros(a.shape, np.int16)
    lab[a] = STONE
    return lab


classify_garg.spec = {STONE: (12, 0.07)}

render_sheet('A-PPCT-101', 32, 40, classify_hero, hero_palette, (4.5, 3.2, 1.3),
             (-0.45, -0.70, 0.55), 0.18, 1.10)
render_sheet('B-PPCT-906', 48, 32, classify_garg, garg_palette, (4.0, 2.8, 1.4),
             (-0.45, -0.70, 0.55), 0.14, 1.12, crease=0.6)
