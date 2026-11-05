"""Finds flat filler inside delivered 4x sprites: opaque blocks with no texture. Lists the worst frames."""
import json, re, sys
from pathlib import Path
import numpy as np
from PIL import Image
R = Path(r"D:\silicon-adventures"); A = R / "art/castle-3d/4x"
t = (R / "art/castle-index.js").read_text(encoding="utf8"); L = json.loads(t[t.index("["):t.rindex("]") + 1])
info = {x["path"].split("/")[-1]: x for x in L if x["type"] == "PPCT"}
out = []
for p in sorted(A.glob("*-PPCT-*.png")):
    x = info.get(p.name)
    if not x: continue
    a = np.array(Image.open(p).convert("RGBA")).astype(float); cw, ch, fr = x["width"] * 4, x["height"] * 4, x["frames"]
    horiz = a.shape[1] > cw
    for f in range(fr):
        c = a[:, f * cw:(f + 1) * cw] if horiz else a[f * ch:(f + 1) * ch]
        b = 6; H, W = c.shape[:2]; n = flat = 0
        for y in range(0, H - b, b):
            for xx in range(0, W - b, b):
                q = c[y:y + b, xx:xx + b]
                if q[..., 3].min() < 250: continue
                n += 1
                if q[..., :3].std(axis=(0, 1)).max() < 1.5: flat += 1
        if n: out.append((round(flat / n, 3), p.name[:-4], f, n))
out.sort(reverse=True)
for o in out[:int(sys.argv[1]) if len(sys.argv) > 1 else 30]: print(o)
