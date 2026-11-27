"""Scene kit: compile a list of pixel-exact primitives into height and material maps.

All coordinates are inclusive native pixels. Maps are built at SCALE times native, so a
native pixel (x, y) is exactly the block [x*S, (x+1)*S) x [y*S, (y+1)*S). Under an
orthographic camera looking straight down the height axis, height can only change light,
never position, which is what keeps the layout locked.
"""
import numpy as np, cv2
from scipy import ndimage as ndi

S = 4
MATS = ['brick', 'mortar', 'plaster', 'dressed', 'darkstone', 'wood', 'iron', 'bronze', 'void', 'statue']
M = {n: i for i, n in enumerate(MATS)}


def noise(shape, sigma, seed, stretch=(1, 1)):
    """Band-limited noise, zero mean and unit variance."""
    r = np.random.default_rng(seed)
    h, w = shape
    sy, sx = max(sigma * stretch[0], .5), max(sigma * stretch[1], .5)
    f = max(int(min(sy, sx) // 2), 1)
    a = r.standard_normal((h // f + 4, w // f + 4)).astype(np.float32)
    a = cv2.GaussianBlur(a, (0, 0), sigmaX=sx / f, sigmaY=sy / f)
    a = cv2.resize(a, (w, h), interpolation=cv2.INTER_CUBIC)
    return (a - a.mean()) / (a.std() + 1e-6)


def fbm(shape, base, seed, oct=4, gain=.55, stretch=(1, 1)):
    out = np.zeros(shape, np.float32); amp = 1; tot = 0
    for i in range(oct):
        out += amp * noise(shape, base / 2 ** i, seed + i * 17, stretch); tot += amp; amp *= gain
    return out / tot


def round_profile(d, r):
    """Quarter-circle shoulder: 0 at the edge, 1 once d >= r."""
    t = np.clip(d / max(r, 1e-3), 0, 1)
    return np.sqrt(np.maximum(1 - (1 - t) ** 2, 0))


class Scene:
    def __init__(self, ink, mirror_sum=None):
        self.ink = ink.astype(bool)
        self.h, self.w = ink.shape
        self.H4, self.W4 = self.h * S, self.w * S
        self.mirror_sum = mirror_sum
        self.Z = np.zeros((self.H4, self.W4), np.float32)
        self.Mat = np.full((self.H4, self.W4), M['brick'], np.uint8)
        self.Grime = np.zeros((self.H4, self.W4), np.float32)    # darkens albedo in crevices
        self.Solid = np.zeros((self.H4, self.W4), bool)          # anything laid over the wall
        self.ink4 = cv2.resize(ink.astype(np.uint8), (self.W4, self.H4), interpolation=cv2.INTER_NEAREST).astype(np.float32)
        self.ink_soft = cv2.GaussianBlur(self.ink4, (0, 0), S * .42)
        self.log = []

    # ---- helpers
    def _both(self, x0, x1, mirror):
        yield x0, x1
        if mirror and self.mirror_sum is not None:
            yield self.mirror_sum - x1, self.mirror_sum - x0

    @staticmethod
    def _dist(mask):
        p = np.pad(mask, 1).astype(np.uint8)
        return cv2.distanceTransform(p, cv2.DIST_L2, 5)[1:-1, 1:-1] / S

    def _lay(self, mask, h, mat, grime=None):
        """Union by height: the prim wins wherever it stands proud of what is there."""
        win = mask & (h >= self.Z - 1e-3)
        self.Z[win] = h[win]
        self.Mat[win] = mat
        self.Solid |= mask
        if grime is not None:
            self.Grime[win] = np.maximum(self.Grime[win], grime[win])

    def _carve_h(self, h, depth):
        return h - depth * self.ink_soft

    # ---- primitives
    def box(self, x0, y0, x1, y1, z, mat, bevel=1.0, carve=0.0, mirror=True, grime=.75, force=False):
        for a, b in self._both(x0, x1, mirror):
            m = np.zeros((self.H4, self.W4), bool)
            m[y0 * S:(y1 + 1) * S, a * S:(b + 1) * S] = True
            d = self._dist(m)
            h = z - bevel * (1 - round_profile(d, bevel))
            if carve: h = self._carve_h(h, carve)
            if force: self.Z[m] = -99
            self._lay(m, h, M[mat], self.ink_soft * grime if carve else None)
            self.log.append((a, y0, b, y1, mat))

    def poly(self, pts, z, mat, bevel=1.0, carve=0.0, mirror=True, grime=.75):
        for flip in ([False, True] if mirror else [False]):
            p = [((self.mirror_sum + 1 - x) if flip else x, y) for x, y in pts]
            m = np.zeros((self.H4, self.W4), np.uint8)
            cv2.fillPoly(m, [np.array([(x * S, y * S) for x, y in p], np.int32)], 1)
            m = m.astype(bool)
            d = self._dist(m)
            h = z - bevel * (1 - round_profile(d, bevel))
            if carve: h = self._carve_h(h, carve)
            self._lay(m, h, M[mat], self.ink_soft * grime if carve else None)

    def cyl_v(self, x0, y0, x1, y1, z, mat, mirror=True):
        """Vertical half-round shaft on the wall; x0..x1 is its full width."""
        for a, b in self._both(x0, x1, mirror):
            r = (b - a + 1) / 2; cx = (a + b + 1) / 2
            xs = (np.arange(a * S, (b + 1) * S) + .5) / S
            prof = np.sqrt(np.maximum(1 - ((xs - cx) / r) ** 2, 0))
            h = z - r + r * prof
            m = np.zeros((self.H4, self.W4), bool)
            m[y0 * S:(y1 + 1) * S, a * S:(b + 1) * S] = True
            hh = np.zeros_like(self.Z); hh[y0 * S:(y1 + 1) * S, a * S:(b + 1) * S] = h
            self._lay(m, hh, M[mat])

    def cyl_h(self, x0, y0, x1, y1, z, mat, mirror=True):
        for a, b in self._both(x0, x1, mirror):
            r = (y1 - y0 + 1) / 2; cy = (y0 + y1 + 1) / 2
            ys = (np.arange(y0 * S, (y1 + 1) * S) + .5) / S
            prof = np.sqrt(np.maximum(1 - ((ys - cy) / r) ** 2, 0))
            h = z - r + r * prof
            m = np.zeros((self.H4, self.W4), bool)
            m[y0 * S:(y1 + 1) * S, a * S:(b + 1) * S] = True
            hh = np.zeros_like(self.Z); hh[y0 * S:(y1 + 1) * S, a * S:(b + 1) * S] = h[:, None]
            self._lay(m, hh, M[mat])

    def sphere(self, cx, cy, r, z, mat, mirror=True):
        for a, _ in self._both(cx, cx, mirror):
            y0 = max(int((cy - r - 1) * S), 0); y1 = min(int((cy + r + 2) * S), self.H4)
            x0 = max(int((a - r - 1) * S), 0); x1 = min(int((a + r + 2) * S), self.W4)
            yy, xx = np.mgrid[y0:y1, x0:x1]
            d2 = ((xx + .5) / S - (a + .5)) ** 2 + ((yy + .5) / S - (cy + .5)) ** 2
            m = np.zeros((self.H4, self.W4), bool); m[y0:y1, x0:x1] = d2 < r * r
            hh = np.zeros_like(self.Z); hh[y0:y1, x0:x1] = z - r + np.sqrt(np.maximum(r * r - d2, 0))
            self._lay(m, hh, M[mat])

    def from_mask(self, native, z, mat, round_r=3.0, carve=0.0, base=0.0, grime=.9):
        """Inflate an exact native mask into a rounded solid."""
        m = cv2.resize(native.astype(np.uint8), (self.W4, self.H4), interpolation=cv2.INTER_NEAREST).astype(bool)
        d = self._dist(m)
        h = base + (z - base) * round_profile(d, round_r)
        if carve: h = self._carve_h(h, carve)
        self._lay(m, h, M[mat], self.ink_soft * grime if carve else None)

    def ink_relief(self, x0, y0, x1, y1, z, mat, r=1.2, base=0.0, mirror=True, keep=None):
        """Raise the ink strokes themselves: chains, rings, frames."""
        for a, b in self._both(x0, x1, mirror):
            n = np.zeros_like(self.ink); n[y0:y1 + 1, a:b + 1] = self.ink[y0:y1 + 1, a:b + 1]
            if keep:
                lab, k = ndi.label(n, np.ones((3, 3)))
                if k:
                    sz = ndi.sum(n, lab, range(1, k + 1))
                    n = np.isin(lab, np.argsort(sz)[::-1][:keep] + 1)
            self.from_mask(n, z, mat, r, base=base)

    def blob(self, x0, y0, x1, y1, z, mat, r=4.0, carve=1.0, mirror=True, keep=1, close=1):
        """Fill the shape enclosed by ink in a window: statues, urns, niches."""
        for a, b in self._both(x0, x1, mirror):
            win = self.ink[y0:y1 + 1, a:b + 1]
            c = win
            if close:
                c = ndi.binary_closing(np.pad(win, 3), np.ones((close * 2 + 1,) * 2))[3:-3, 3:-3]
            f = ndi.binary_fill_holes(c)
            lab, k = ndi.label(f, np.ones((3, 3)))
            if k:
                sz = ndi.sum(f, lab, range(1, k + 1))
                f = np.isin(lab, np.argsort(sz)[::-1][:keep] + 1)
            n = np.zeros_like(self.ink); n[y0:y1 + 1, a:b + 1] = f
            self.from_mask(n, z, mat, r, carve=carve)


def brick_courses(ink, w, h):
    """Recover the 8x4 running bond. Courses sit on y % 4 == 0; joints are read from ink per
    course and fall back to the regular bond where the dither hides them."""
    courses = []
    for k in range(0, h // 4 + 1):
        y = k * 4
        band = ink[y + 1:y + 3, :] if y + 3 <= h else None
        phase = 0 if (y // 4) % 2 == 0 else 4
        joints = []
        for x in range(phase - 8, w + 8, 8):
            best = x
            if band is not None:
                score = -1
                for dx in (0, -1, 1, -2, 2, -3):
                    xx = x + dx
                    if 0 <= xx < w and band[:, xx].all():
                        s = 2 - .2 * abs(dx)
                        if s > score: score = s; best = xx
            joints.append(best)
        courses.append(sorted(set(joints)))
    return courses
