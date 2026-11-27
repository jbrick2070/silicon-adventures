"""Render B-PSCR-4020 as a lit stone relief. Geometry comes only from the ink."""
import os
import numpy as np
from scipy import ndimage as ndi
from PIL import Image, ImageDraw
from relief import *

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')).replace('\\', '/')
SRC = f'{ROOT}/art/castle/B-PSCR-4020.png'
OUT = f'{ROOT}/art/castle-relief'

alpha, ink = load_bits(SRC)
H0, W0 = ink.shape
white = ~ink

# ------------------------------------------------ material annotation (native px)
# Each entry: material, rect (x0,y0,x1,y1 exclusive) or polygon. Rects only
# choose colour/depth; the ink inside them is untouched.
MAT = {}  # name -> (albedo, base height, kind)
def M(name, rgb, h, kind): MAT[name] = (np.array(rgb, np.float32), h, kind)
M('void',   (46, 52, 68),    0.0, 'void')
M('wall',   (156, 147, 134), 6.0, 'brick')
M('tower',  (118, 109, 100), 6.5, 'brick')
M('rubble', (138, 129, 118), 5.0, 'brick')
M('slab',   (218, 203, 172), 9.0, 'slab')
M('panel',  (206, 190, 160), 9.0, 'slab')
M('pillar', (226, 213, 186), 10.0, 'pillar')
M('ladder', (152, 106, 60),  9.0, 'round')
M('brass',  (178, 134, 66),  9.5, 'round')
M('statue', (158, 158, 150), 10.5, 'round')
M('arch',   (196, 184, 160), 8.0, 'slab')
M('door',   (118, 82, 48),   4.0, 'plank')
M('iron',   (74, 74, 82),    6.0, 'round')
M('floor',  (124, 122, 126), 8.0, 'slab')
M('deep',   (10, 12, 20),   -8.0, 'void')
M('hud',    (255, 255, 255), 0.0, 'hud')
names = list(MAT)
code = {n: i for i, n in enumerate(names)}

def mirror(r):
    x0, y0, x1, y1 = r
    return (W0 - x1, y0, W0 - x0, y1)

left = [
    ('slab',   (37, 4, 66, 50)),       # top-left plaque
    ('brass',  (44, 7, 60, 42)),       # key on the plaque
    ('slab',   (97, 11, 173, 23)),     # top ledge
    ('brass',  (103, 22, 113, 182)),   # hanging rod
    ('statue', (174, 66, 206, 101)),   # gargoyle ornament
    ('slab',   (140, 101, 250, 114)),  # middle ledge
    ('slab',   (24, 83, 94, 91)),      # tower top ledge
    ('tower',  (24, 91, 72, 252)),     # tower face
    ('slab',   (36, 112, 51, 208)),    # tower window frame
    ('brass',  (50, 138, 60, 206)),    # bead chain
    ('slab',   (72, 92, 80, 268)),     # pilaster strip
    ('brass',  (80, 96, 96, 112)),     # sconce ball
    ('pillar', (80, 112, 96, 232)),    # column
    ('pillar', (0, 70, 6, 243)),       # outer wall edge
    ('ladder', (4, 73, 24, 242)),      # tall ladder
    ('brass',  (111, 183, 129, 220)),  # lower lamp
    ('slab',   (92, 175, 152, 184)),   # lower-left ledge
    ('slab',   (176, 147, 214, 158)),  # ledge above lower ladder
    ('ladder', (161, 188, 184, 258)),  # short ladder
    ('slab',   (94, 256, 214, 264)),   # platform top ledge
    ('panel',  (94, 264, 214, 303)),   # platform face
    ('deep',   (198, 240, 212, 258)),  # small niche
]
sym = [(m, r) for m, r in left] + [(m, mirror(r)) for m, r in left]
center = [
    ('brass',  (247, 99, 265, 135)),   # centre lamp
    ('slab',   (240, 169, 272, 183)),  # floating ledge
    ('rubble', (196, 212, 316, 304)),  # rough stone around the door
    ('arch',   (224, 216, 290, 238)),  # voussoirs
    ('door',   (226, 236, 288, 304)),  # planks
    ('iron',   (229, 268, 287, 278)),  # iron band
    ('iron',   (272, 262, 288, 298)),  # latch
    ('deep',   (203, 29, 242, 66)),    # window
    ('floor',  (0, 301, 512, 310)),    # floor tiles
    ('hud',    (0, 310, 512, 342)),
    ('slab',   (436, 240, 500, 250)),  # right tower lower ledge
]
polys = [
    ('slab', [(142, 172), (180, 144), (186, 151), (152, 183)]),           # left ramp
    ('slab', [(W0 - 142, 172), (W0 - 180, 144), (W0 - 186, 151), (W0 - 152, 183)]),
]

# ------------------------------------------------ build the label map
lab = np.full((H0, W0), code['wall'], np.int16)
dens = ndi.gaussian_filter(ink.astype(np.float32), 5)
void = dens < 0.045
void = ndi.binary_opening(void, iterations=2)
void = ndi.binary_closing(void, iterations=2)
# open space only exists inside the big interior white areas, never in the
# sparsely stippled upper wall or the HUD band
wl0, nw0 = ndi.label(white)
big = np.zeros_like(white)
for i, sl in enumerate(ndi.find_objects(wl0)):
    comp = wl0[sl] == i + 1
    if comp.sum() > 4000 and sl[0].start > 0 and sl[0].start < 310:
        big[sl] |= comp
void &= big
lab[void] = code['void']
for m, r in sym + center:
    x0, y0, x1, y1 = r
    sl = (slice(y0, y1), slice(x0, x1))
    if m == 'deep':
        sub = lab[sl]
        sub[ink[sl]] = code['deep']
        sub[~ink[sl]] = code['slab']
    else:
        lab[sl] = code[m]
pm = Image.new('L', (W0, H0), 0)
d = ImageDraw.Draw(pm)
for m, pts in polys:
    d.polygon(pts, fill=code[m] + 1)
pmask = np.array(pm)
lab[pmask > 0] = pmask[pmask > 0] - 1

# automatic slabs: any large smooth white component inside brick context is trim
wl, nw = ndi.label(white)
sizes = ndi.sum(np.ones_like(wl), wl, range(1, nw + 1))
bb = ndi.find_objects(wl)
brick_codes = [code['wall'], code['tower'], code['rubble']]
for i in range(nw):
    sz = sizes[i]
    if sz < 70 or sz > 3000:
        continue
    sl = bb[i]
    bw = sl[1].stop - sl[1].start
    bh = sl[0].stop - sl[0].start
    comp = (wl[sl] == i + 1)
    if sz / (bw * bh) < 0.45 and sz < 400:
        continue  # thin frames of brick cells etc.
    ctx = lab[sl][comp]
    if np.isin(ctx, brick_codes).mean() > 0.6:
        sub = lab[sl]
        sub[comp] = code['slab']

Image.fromarray((lab * 15).astype(np.uint8)).save(f'{OUT}/tools/room-labels.png')

# ------------------------------------------------ height field at 4x
lab4 = up(lab)
ink4 = up(ink)
white4 = ~ink4
H = np.zeros(lab4.shape, np.float32)
albedo = np.zeros(lab4.shape + (3,), np.float32)
gloss = np.full(lab4.shape, 12.0, np.float32)
spec = np.full(lab4.shape, 0.04, np.float32)
for n, (rgb, base, k) in MAT.items():
    m = lab4 == code[n]
    H[m] = base
    albedo[m] = rgb
is_brick = np.isin(lab4, brick_codes)
is_slab = np.isin(lab4, [code[n] for n in ('slab', 'panel', 'arch', 'floor')])
is_round = np.isin(lab4, [code[n] for n in ('ladder', 'brass', 'statue', 'iron')])
is_pillar = lab4 == code['pillar']
is_plank = lab4 == code['door']
is_void = lab4 == code['void']
is_deep = lab4 == code['deep']

# ink component sizes (native) to tell stipple dots from lines
il, ni = ndi.label(ink, structure=np.ones((3, 3)))
isz = ndi.sum(np.ones_like(il), il, range(1, ni + 1))
dot = np.zeros_like(ink)
dot[ink] = isz[il[ink] - 1] <= 2
dot4 = up(dot)
line4 = ink4 & ~dot4

# bricks: each white cell is a gently rounded block, mortar is a groove
cell = white4 & is_brick
H += np.where(cell, pillow(cell, 7) * 1.1, 0)
H -= np.where(line4 & is_brick, 1.3, 0)
H -= np.where(dot4 & is_brick, 0.5, 0)
# slabs: chamfered edges, outline ink is a groove
slab_body = white4 & is_slab
H += np.where(slab_body, (chamfer(slab_body, 6) - 1) * 1.6, 0)
H -= np.where(ink4 & is_slab, 1.0, 0)
# rounded things: ladders, brass, statues, iron
rb = white4 & is_round
H += np.where(rb, pillow(rb, 8) * 2.4 - 2.4, 0)
H -= np.where(ink4 & is_round, 0.9, 0)
# pillar: cylindrical profile across x within each pillar rect
for m, r in sym + center:
    if m != 'pillar':
        continue
    x0, y0, x1, y1 = r
    cx = (x0 + x1) / 2 * S
    rad = (x1 - x0) / 2 * S
    xs = np.arange(x0 * S, x1 * S)
    prof = np.sqrt(np.clip(1 - ((xs - cx) / rad) ** 2, 0, 1)) * 2.5
    sl = (slice(y0 * S, y1 * S), slice(x0 * S, x1 * S))
    H[sl] += np.where(is_pillar[sl], prof[None, :], 0)
H -= np.where(ink4 & is_pillar, 0.8, 0)
# door planks
pb = white4 & is_plank
H += np.where(pb, pillow(pb, 6) * 1.2, 0)
H -= np.where(ink4 & is_plank, 0.8, 0)
# stray dots in the void are little pebbles on the far wall
peb = ink4 & is_void
H += np.where(peb, 0.6, 0)

# ------------------------------------------------ albedo detail
h4, w4 = lab4.shape
grain = fbm((h4, w4), 7)
albedo *= (1 + 0.16 * grain)[..., None]
cl, ncl = ndi.label(cell)
rng = np.random.default_rng(3)
var = rng.uniform(0.86, 1.1, ncl + 1).astype(np.float32)
var[0] = 1
albedo *= np.where(cell, var[cl], 1)[..., None]
wood = is_plank | (lab4 == code['ladder'])
wg = value_noise((h4, w4), 11, 3)
wg2 = np.repeat(value_noise((h4, 1), 12, 5), w4, 1)
albedo *= np.where(wood, 1 + 0.18 * wg2 + 0.08 * wg, 1)[..., None]
near = ndi.grey_dilation(albedo, size=(3, 3, 1))
albedo = np.where(ink4[..., None], near * 0.42, albedo)
albedo = np.where((dot4 & is_brick)[..., None], near * 0.62, albedo)
albedo = np.where(peb[..., None], np.array([92, 96, 110], np.float32), albedo)
albedo = np.where(is_deep[..., None], np.array([10, 12, 20], np.float32), albedo)
yy = np.linspace(0, 1, h4, dtype=np.float32)[:, None]
xx = np.linspace(-1, 1, w4, dtype=np.float32)[None, :]
grad = (1.15 - 0.35 * yy - 0.12 * xx ** 2)
albedo = np.where((is_void & ~peb)[..., None], albedo * grad[..., None], albedo)
spec[lab4 == code['brass']] = 0.32
gloss[lab4 == code['brass']] = 40
spec[lab4 == code['iron']] = 0.25
gloss[lab4 == code['iron']] = 24
spec[is_slab | is_pillar] = 0.08
gloss[is_slab | is_pillar] = 10
spec[is_brick] = 0.05
spec[is_void] = 0.0
spec[ink4] *= 0.3

# ------------------------------------------------ light
col = shade(H, albedo, gloss, spec, light=(-0.45, -0.70, 0.55),
            shadow_light=(-0.45, -0.70, 0.85), shadow_strength=0.62)
lamps = np.zeros((h4, w4), np.float32)
for m, r in sym + center:
    if m == 'brass':
        x0, y0, x1, y1 = r
        lamps[(y0 + y1) // 2 * S, (x0 + x1) // 2 * S] = 1
lamps = blur(lamps, 90) * 90 * 90 * 2.2
col = col * (1 + lamps[..., None] * np.array([0.35, 0.22, 0.0], np.float32))
hud = lab4 == code['hud']
col[hud] = 255
col = np.clip(col, 0, 255)

alpha4 = up(alpha)
finish(col, alpha4, alpha, f'{OUT}/4x/B-PSCR-4020.png', f'{OUT}/native/B-PSCR-4020.png')
print('room done')
