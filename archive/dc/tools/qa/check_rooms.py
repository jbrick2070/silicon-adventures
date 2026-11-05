"""Checks delivered rooms against the disk: sizes, box average, local drift, ropes, and side-by-side sheets."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import sobel, uniform_filter
R = Path(r"D:\silicon-adventures"); A = R / "art/castle-3d"; S = Path(sys.argv[1]); S.mkdir(exist_ok=True)
rooms = "1000 1010 1020 2000 2010 2030 3000 3010 3020 3030 4000 4010".split()
def lum(p):
    return np.array(Image.open(p).convert("L")).astype(float)
def edges(g):
    g = uniform_filter(g, 5); return np.hypot(sobel(g, 0), sobel(g, 1))
for r in rooms:
    n = f"B-PSCR-{r}.png"
    o = lum(R / "art/castle" / n); a = np.array(Image.open(A / n).convert("RGBA")); h = np.array(Image.open(A / "4x" / n).convert("RGBA"))
    box = np.abs(h[..., :3].astype(float).reshape(342, 4, 512, 4, 3).mean((1, 3)) - a[..., :3]).max()
    eo, ea = edges(o), edges(a[..., :3].mean(2).astype(float))
    t = 40; drift = []
    for y in range(0, 310 - t, t // 2):
        for x in range(0, 512 - t, t // 2):
            p = eo[y:y + t, x:x + t]
            if p.mean() < eo[:310].mean() * 1.2: continue
            best = None; scores = {}
            for dy in range(-5, 6):
                for dx in range(-5, 6):
                    y0, x0 = max(y + dy, 0), max(x + dx, 0)
                    q = ea[y0:y0 + t, x0:x0 + t]
                    if q.shape != p.shape: continue
                    c = np.corrcoef(p.ravel(), q.ravel())[0, 1]
                    scores[(dx, dy)] = c
            if not scores: continue
            (dx, dy), c = max(scores.items(), key=lambda v: v[1])
            drift.append((max(abs(dx), abs(dy)), round(float(c), 2), x, y, dx, dy))
    far = [d for d in drift if d[0] >= 3 and d[1] > .35]
    weak = [d for d in drift if d[1] < .25]
    print(r, "size", a.shape, h.shape, "alpha", int(a[..., 3].min()), "box", round(float(box), 2), "tiles", len(drift), "drift>=3:", len(far), far[:4], "weak", len(weak), weak[:3], "status mean", round(float(a[310:, :, :3].mean()), 1))
    O = Image.open(R / "art/castle" / n).convert("RGB").resize((768, 513), Image.NEAREST); P = Image.open(A / n).convert("RGB").resize((768, 513), Image.LANCZOS)
    s = Image.new("RGB", (1546, 513), (255, 0, 0)); s.paste(O, (0, 0)); s.paste(P, (778, 0)); s.save(S / f"room{r}.png")
old = np.array(Image.open(R / "art/castle/B-PSCR-1000.png").convert("L")).astype(float)
new = np.array(Image.open(A / "B-PSCR-1000.png").convert("RGB")).astype(float)
for lo, hi in ((416, 418), (442, 444), (469, 471)):
    g = new[:, lo - 6:hi + 7].mean(2); c = []
    for y in range(20, 280, 20): c.append(int(np.argmax(np.abs(np.diff(g[y:y + 20].mean(0)))) + lo - 6))
    print("rope", lo, hi, c)
