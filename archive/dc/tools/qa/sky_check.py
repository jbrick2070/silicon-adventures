"""Confirms no floor row or rope sits on a pixel that may drift, using the disk's own floor data."""
import json, subprocess
from pathlib import Path
import numpy as np
from PIL import Image
R = Path(r"D:\silicon-adventures")
js = "global.window={};require('./archive/dc/castle-data.js');const d=window.CASTLE_DATA;const o={};for(const k of Object.keys(d.rooms)){o[k]=d.rooms[k]}console.log(JSON.stringify(o))"
rooms = json.loads(subprocess.run(["node", "-e", js], cwd=R, capture_output=True, text=True).stdout)
ids = {"2000": None, "3010": None, "3030": None}
print(list(rooms)[:16], list(rooms[list(rooms)[0]].keys()))
for rid in ids:
    k = rid if rid in rooms else None
    if k is None:
        k = next(x for x in rooms if str(rooms[x].get("id")) == rid)
    a = np.array(Image.open(R / f"art/castle-3d/sky/B-PSCR-{rid}.png"))[..., 3]
    bad = tot = 0
    for f in rooms[k]["floors"]:
        y = f["y"] + 40
        for sp in f["spans"]:
            x0, x1 = sp[1] + 16, sp[2] + 16
            if y >= 342 or x0 >= 512: continue
            row = a[min(683, y * 2), max(0, x0 * 2):min(1024, x1 * 2 + 2)]
            tot += row.size; bad += int((row > 8).sum())
    print(rid, "floor pixels", tot, "may drift", bad)
a = np.array(Image.open(R / "art/castle-3d/sky/B-PSCR-2000.png"))[..., 3]
for x in (340, 369, 398): print("rope", x, "max alpha", int(a[80:500, x * 2 - 2:x * 2 + 3].min(axis=1).max()))
