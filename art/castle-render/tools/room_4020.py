"""Scene description for B-PSCR-4020. Every number here was read off the disk's pixels.

Coordinates are inclusive native pixels; `mirror` reflects x -> 510 - x, the axis the disk
artist drew around. The white band from y=310 down is the status bar's slot; finish_room.py
copies it through from the disk unchanged after rendering.
"""
import sys, os
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(__file__))
from scene_kit import Scene, S, M, MATS, noise, fbm, brick_courses

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'castle', 'B-PSCR-4020.png')
PLAY_H = 310          # rows above the status band


def wall(sc, ink):
    """Bricks recovered from the ink, under lime plaster wherever the disk drew none."""
    H4, W4 = sc.H4, sc.W4
    rng = np.random.default_rng(4020)
    courses = brick_courses(ink, sc.w, sc.h)
    offset = np.zeros((sc.h, sc.w), np.float32)
    # Recessed bays beside the stairs: dark brick the artist set back behind the ledge.
    for a, b in ((151, 176), (510 - 176, 510 - 151)):
        offset[113:153, a:b + 1] = -6
    Z = np.full((H4, W4), -1.3, np.float32)          # mortar bed
    Mat = np.full((H4, W4), M['mortar'], np.uint8)
    tone = np.ones((H4, W4), np.float32)
    bricks = []
    for k, joints in enumerate(courses):
        y = k * 4
        if y >= PLAY_H: break
        for j0, j1 in zip(joints[:-1], joints[1:]):
            x0, x1 = max(j0 + 1, 0), min(j1 - 1, sc.w - 1)
            if x1 < x0: continue
            y1 = min(y + 3, PLAY_H - 1)
            bricks.append((x0, y + 1, x1, y1))
    exposed = np.zeros(len(bricks), bool)
    density = cv2.GaussianBlur(ink.astype(np.float32), (0, 0), 2.0)
    for i, (x0, y0, x1, y1) in enumerate(bricks):
        count = ink[max(y0 - 1, 0):y1 + 2, max(x0 - 1, 0):x1 + 2].sum()
        exposed[i] = count >= 3 or y0 < 96
    # Heal lone plaster islands inside brickwork (a lone brick inside plaster is left exposed).
    grid = {}
    for i, (x0, y0, x1, y1) in enumerate(bricks): grid.setdefault(y0, []).append(i)
    for row in grid.values():
        for a, i, b in zip(row, row[1:], row[2:]):
            if exposed[a] and exposed[b]: exposed[i] = True
    plaster4 = np.zeros((H4, W4), np.float32)
    for i, (x0, y0, x1, y1) in enumerate(bricks):
        ax, ay, bx, by = x0 * S, y0 * S, (x1 + 1) * S, (y1 + 1) * S
        if not exposed[i]:
            plaster4[max(ay - S, 0):by + S, max(ax - S, 0):bx + S] = 1
            continue
        hh, ww = by - ay, bx - ax
        yy, xx = np.mgrid[0:hh, 0:ww]
        d = np.minimum.reduce([xx + .5, ww - xx - .5, yy + .5, hh - yy - .5]) / S
        tilt = rng.normal(0, .12, 2)
        crown = rng.normal(0, .22)
        pillow = .55 * np.sqrt(np.clip(1 - (1 - np.clip(d / .8, 0, 1)) ** 2, 0, 1))
        h = crown - .55 + pillow + tilt[0] * (xx / ww - .5) * 2 + tilt[1] * (yy / hh - .5) * 2
        Z[ay:by, ax:bx] = h
        Mat[ay:by, ax:bx] = M['brick']
        tone[ay:by, ax:bx] = np.clip(1 + rng.normal(0, .17), .62, 1.4)
    # Plaster sits proud of the brick and breaks away along a torn edge.
    torn = cv2.GaussianBlur(plaster4, (0, 0), S * .9) + fbm((H4, W4), S * 2.5, 77, 3) * .17
    pm = torn > .56
    pd = cv2.distanceTransform(pm.astype(np.uint8), cv2.DIST_L2, 5) / S
    ph = .6 + .75 * np.clip(pd / .9, 0, 1) ** .6 + fbm((H4, W4), S * 3, 31, 4) * .14
    Z[pm] = ph[pm]
    Mat[pm] = M['plaster']
    ox = cv2.resize(offset, (W4, H4), interpolation=cv2.INTER_NEAREST)
    return Z + ox, Mat, tone, density


def build(ink):
    sc = Scene(ink, mirror_sum=510)
    Z, Mat, tone, density = wall(sc, ink)
    sc.Z[:] = Z; sc.Mat[:] = Mat
    B, C, I = sc.box, sc.cyl_v, sc.cyl_h

    # ---- ground level
    B(83, 264, 213, 308, 11, 'dressed', 1.6)                         # platform blocks
    B(0, 303, 71, 309, 8, 'dressed', 1.0, carve=1.5)                 # plinth courses
    B(124, 303, 225, 309, 8, 'dressed', 1.0, carve=1.5)
    B(72, 304, 82, 309, 5, 'darkstone', .8, carve=1.0)
    B(94, 257, 214, 263, 25, 'dressed', 1.7)                         # walkways
    B(0, 240, 42, 246, 22, 'dressed', 1.6)
    B(156, 195, 213, 201, 17, 'dressed', 1.4)                        # ladder landing

    # ---- pillars
    C(83, 121, 94, 224, 14, 'dressed')
    C(83, 229, 94, 257, 14, 'dressed')
    B(81, 115, 96, 122, 18, 'dressed', 1.4)
    B(81, 224, 96, 229, 18, 'dressed', 1.4)
    sc.blob(82, 98, 95, 114, 17, 'statue', r=5.5, carve=1.2)
    C(78, 90, 80, 266, 6, 'iron'); C(49, 90, 51, 205, 6, 'iron'); C(107, 15, 109, 136, 7, 'iron')

    # ---- cornice, stairs, ledges
    B(0, 80, 94, 89, 13, 'dressed', 1.0, carve=1.8)
    B(143, 106, 245, 111, 20, 'dressed', 1.5)
    B(146, 91, 177, 95, 18, 'dressed', 1.3)
    B(150, 97, 174, 105, 9, 'dressed', 1.0, carve=.7)
    B(197, 101, 207, 105, 12, 'dressed', .8, carve=.8)
    B(223, 101, 233, 105, 12, 'dressed', .8, carve=.8)
    sc.poly([(95, 170), (142, 170), (142, 168), (150, 168), (150, 162), (159, 162), (159, 157), (168, 157), (168, 153),
             (214, 153), (214, 173), (178, 173), (150, 191), (95, 191)], 14, 'dressed', 1.0, carve=2.0)

    # ---- shelf, dome, niche
    B(100, 11, 167, 15, 19, 'dressed', 1.3)
    B(103, 16, 165, 20, 10, 'darkstone', .8)
    B(116, 17, 121, 20, 14, 'dressed', .8); B(149, 17, 154, 20, 14, 'dressed', .8)
    sc.blob(129, 0, 140, 10, 9, 'darkstone', r=4.5, carve=1.6)
    sc.blob(195, 247, 205, 256, 6, 'darkstone', r=2.5, carve=3.0)

    # ---- statues
    sc.blob(140, 56, 171, 90, 17, 'statue', r=7.0, carve=1.5, close=1)

    # ---- ladders stand in front of the slabs they pass
    for a, b in ((4, 7), (20, 23)): C(a, 75, b, 241, 15, 'wood')
    for y in range(80, 234, 9): I(8, y, 19, y + 3, 13, 'wood')
    for a, b in ((163, 166), (179, 182)): C(a, 190, b, 257, 21, 'wood')
    for y in range(195, 250, 9): I(167, y, 178, y + 3, 19, 'wood')

    # ---- plates, chains and rings
    B(42, 5, 61, 42, 7, 'dressed', 1.5)
    sc.ink_relief(43, 6, 60, 41, 10, 'iron', r=.8, base=7)
    B(114, 187, 126, 198, 7, 'dressed', 1.0)
    sc.ink_relief(115, 188, 125, 217, 10, 'iron', r=.8, base=4, keep=2)
    B(246, 97, 264, 112, -2, 'darkstone', .8, mirror=False, force=True)
    B(249, 101, 261, 113, 7, 'dressed', 1.0, mirror=False)
    sc.ink_relief(250, 102, 260, 133, 10, 'iron', r=.8, base=4, mirror=False, keep=2)

    # ---- ball stack in its slot
    lab, k = ndi.label(~ink[146:206, 52:60])
    for i in range(1, k + 1):
        ys, xs = np.nonzero(lab == i)
        if len(ys) >= 22:
            sc.sphere(52 + xs.mean(), 146 + ys.mean(), np.sqrt(len(ys) / np.pi) + .35, 6.5, 'bronze')

    # ---- single pieces, not mirrored on the disk
    B(210, 31, 236, 55, 9, 'dressed', 1.2, carve=1.2, mirror=False)
    B(214, 35, 233, 47, -9, 'void', .8, mirror=False, force=True)
    B(217, 48, 231, 50, 5, 'dressed', .8, mirror=False, force=True)
    B(240, 173, 267, 180, 12, 'dressed', 1.1, carve=.9, mirror=False)

    # ---- the door
    sc.poly([(234, 301), (234, 241), (237, 232), (243, 225), (250, 221), (260, 221), (267, 225), (273, 232), (276, 241), (276, 301)],
            10, 'dressed', 1.0, carve=1.6, mirror=False)
    sc.poly([(240, 301), (240, 244), (243, 237), (248, 232), (255, 230), (262, 232), (267, 237), (271, 244), (271, 301)],
            5, 'wood', .7, carve=1.0, mirror=False, grime=.9)
    # Force the leaf down into its frame.
    leaf = np.zeros((sc.H4, sc.W4), np.uint8)
    cv2.fillPoly(leaf, [np.array([(x * S, y * S) for x, y in [(240, 301), (240, 244), (243, 237), (248, 232), (255, 230), (262, 232), (267, 237), (271, 244), (271, 301)]], np.int32)], 1)
    leaf = leaf.astype(bool)
    sc.Z[leaf] = 4 + (-1.0) * sc.ink_soft[leaf]
    sc.Mat[leaf] = M['wood']
    sc.Grime[leaf] = np.maximum(sc.Grime[leaf], sc.ink_soft[leaf])
    B(227, 269, 274, 275, 14, 'wood', 1.2, carve=.8, mirror=False)
    B(274, 261, 282, 286, 12, 'iron', 1.0, carve=1.4, mirror=False)
    B(231, 300, 278, 308, 7, 'darkstone', 1.0, carve=1.2, mirror=False)
    B(0, 309, 510, 309, -.5, 'void', .1, mirror=False, force=True)

    # ---- the artist's mark stays, cut into the stone
    win = np.zeros((sc.H4, sc.W4), bool); win[295 * S:304 * S, 487 * S:506 * S] = True
    sc.Z[win] -= 1.1 * sc.ink_soft[win]
    sc.Grime[win] = np.maximum(sc.Grime[win], sc.ink_soft[win])

    # column 511 has no mirror partner; carry column 510 across
    sc.Z[:, 511 * S:] = sc.Z[:, 510 * S:511 * S]; sc.Mat[:, 511 * S:] = sc.Mat[:, 510 * S:511 * S]
    sc.Grime[:, 511 * S:] = sc.Grime[:, 510 * S:511 * S]
    return sc, tone, density


def hillshade(Z):
    gy, gx = np.gradient(cv2.GaussianBlur(Z, (0, 0), 1))
    n = np.dstack([-gx * 4, -gy * 4, np.ones_like(Z)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    l = np.array([-.5, -.6, .62]); l /= np.linalg.norm(l)
    return np.clip(n @ l, 0, 1)


if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    src = np.array(Image.open(SRC).convert('L'))
    ink = src < 128
    sc, tone, density = build(ink)
    np.savez_compressed(f'{out}/maps.npz', Z=sc.Z, Mat=sc.Mat, Grime=sc.Grime, tone=tone, density=density, ink=ink)
    hs = (hillshade(sc.Z) * 255).astype(np.uint8)
    rgb = np.dstack([hs] * 3)
    rgb[sc.ink4 > .5] = (.55 * rgb[sc.ink4 > .5] + .45 * np.array([255, 30, 30])).astype(np.uint8)
    Image.fromarray(rgb).save(f'{out}/overlay.png')
    pal = np.array([[150, 110, 100], [50, 50, 50], [225, 220, 205], [205, 190, 150], [90, 90, 100], [150, 95, 45], [70, 90, 120], [200, 150, 60], [10, 10, 10], [120, 150, 130]], np.uint8)
    Image.fromarray((pal[sc.Mat] * (.45 + .55 * hs[..., None] / 255)).astype(np.uint8)).save(f'{out}/mats.png')
    print('Z range', sc.Z.min(), sc.Z.max())
