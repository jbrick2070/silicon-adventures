"""Material painter for the room: albedo, roughness and metal in linear light."""
import numpy as np, cv2
from scene_kit import M, S, noise, fbm


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def mix(a, b, t):
    return a * (1 - t[..., None]) + b * t[..., None]


def lrgb(*v):
    return np.array(v, np.float32)


def paint_room(Z, Mat, Grime, tone, density, ink_soft):
    sh = Z.shape
    h, w = sh
    alb = np.zeros((h, w, 3), np.float32); rough = np.full(sh, .78, np.float32); metal = np.zeros(sh, np.float32)
    blot = fbm(sh, S * 14, 1, 5); speck = fbm(sh, S * .9, 2, 3); mid = fbm(sh, S * 4, 3, 4)
    hue = fbm(sh, S * 22, 4, 3)
    streak = fbm(sh, S * 2.0, 5, 3, stretch=(12, 1))
    full = lambda *c: np.broadcast_to(lrgb(*c), (h, w, 3))

    def m(name): return Mat == M[name]

    # masonry: cool slate-grey blocks, warmer where the hue field drifts
    b = m('brick')
    base = mix(full(.215, .225, .255), full(.30, .265, .225), smooth(-.3, 1.1, hue))
    alb[b] = (base * (tone * (1 + .10 * blot + .10 * speck + .08 * mid))[..., None])[b]
    rough[b] = .84
    mo = m('mortar'); alb[mo] = lrgb(.075, .072, .07) * (1 + .15 * speck[mo])[..., None]; rough[mo] = .95

    # lime plaster, stained and thin
    p = m('plaster')
    pl = mix(full(.60, .565, .49), full(.43, .40, .345), smooth(-.5, 1.3, blot + .5 * mid))
    alb[p] = (pl * (1 + .05 * speck)[..., None])[p]; rough[p] = .9

    # dressed sandstone for everything cut and placed
    d = m('dressed')
    ds = mix(full(.56, .50, .39), full(.42, .37, .30), smooth(-.8, 1.2, mid + .6 * blot))
    alb[d] = (ds * (1 + .09 * speck)[..., None])[d]; rough[d] = .72

    ds2 = m('darkstone'); alb[ds2] = lrgb(.085, .088, .10) * (1 + .15 * mid[ds2])[..., None]; rough[ds2] = .7

    # oak
    wo = m('wood')
    grain = fbm(sh, S * .7, 7, 4, stretch=(14, 1)); fig = fbm(sh, S * 4, 8, 3, stretch=(8, 1))
    wd = mix(full(.20, .105, .05), full(.075, .036, .018), smooth(-1.1, 1.0, grain + .7 * fig))
    alb[wo] = wd[wo]; rough[wo] = .5

    ir = m('iron')
    rust = smooth(.3, 1.3, fbm(sh, S * 2.4, 9, 4))
    icol = mix(full(.17, .175, .19), full(.17, .07, .03), rust)
    alb[ir] = icol[ir]; metal[ir] = (1 - rust)[ir]; rough[ir] = (.42 + .45 * rust)[ir]

    br = m('bronze'); alb[br] = lrgb(.62, .40, .17); metal[br] = 1; rough[br] = .34
    vo = m('void'); alb[vo] = lrgb(.006, .006, .008); rough[vo] = 1

    st = m('statue')
    lichen = smooth(.2, 1.2, fbm(sh, S * 3, 11, 4))
    sc = mix(full(.20, .215, .225), full(.19, .22, .13), lichen)
    alb[st] = (sc * (1 + .12 * speck)[..., None])[st]; rough[st] = .62

    # The disk's dither density is its tone. Keep that tone as soot on the masonry.
    wall = b | mo | p
    soot = 1 - .84 * smooth(.08, .62, density + .035 * streak)
    alb[wall] *= soot[wall][..., None]
    # Grooves hold dirt; convex edges wear pale.
    g = cv2.GaussianBlur(Z, (0, 0), S * .55)
    curv = cv2.Laplacian(g, cv2.CV_32F, ksize=3)
    wear = np.clip(-curv * 2.2, 0, 1); dirt = np.clip(curv * 1.4, 0, 1)
    stone = d | st | ds2 | b
    alb[stone] *= (1 + .42 * wear[stone])[..., None]
    alb *= (1 - .55 * dirt)[..., None]
    alb *= (1 - .72 * Grime)[..., None]
    # Rain tracks falling from cut stone.
    wet = smooth(.4, 1.8, streak) * smooth(-1.2, .6, blot)
    alb[d | p] *= (1 - .22 * wet[d | p])[..., None]

    # surface relief small enough to sit below a native pixel
    micro = np.zeros(sh, np.float32)
    micro[b] = (.05 * speck + .05 * mid)[b]
    micro[d] = (.035 * speck + .05 * mid)[d]
    micro[st] = (.05 * speck)[st]
    micro[p] = (.02 * speck)[p]
    micro[wo] = (.09 * grain)[wo]
    return np.clip(alb, 0, 1), rough, metal, micro
