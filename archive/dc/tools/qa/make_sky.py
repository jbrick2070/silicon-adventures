"""Bakes a sky layer for outdoor rooms: sky colour with structure filled in, alpha marking what may drift."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ni
R = Path(r"D:\silicon-adventures"); S = Path(__file__).parent; O = R / "art/castle-3d/sky"; O.mkdir(exist_ok=True)
import json, subprocess
js = "global.window={};require('./archive/dc/castle-data.js');console.log(JSON.stringify(window.CASTLE_DATA.rooms))"
rooms = json.loads(subprocess.run(["node", "-e", js], cwd=R, capture_output=True, text=True).stdout)
sheet = Image.new("RGB", (1024 * 2 + 10, 3 * 690), (255, 0, 0))
for i, room in enumerate((2000, 3010, 3030)):
    art = Image.open(R / f"art/castle-3d/4x/B-PSCR-{room}.png").convert("RGB").resize((1024, 684), Image.LANCZOS)
    n = np.array(Image.open(R / f"art/castle-3d/normals/B-PSCR-{room}.png").convert("RGB")).astype(float) / 127.5 - 1
    solid = np.linalg.norm(n, axis=2) > .4
    # Thin gameplay parts such as ropes count as solid, so only tiny specks of the mask are dropped.
    lab, count = ni.label(solid)
    size = ni.sum(np.ones_like(lab), lab, range(1, count + 1))
    keep = np.isin(lab, [j + 1 for j, v in enumerate(size) if v > 300])
    keep = ni.binary_closing(keep, iterations=3); keep[620:] = True  # Status row and floor never drift.
    if room == 3010: keep[445:] = True  # Hills stay put; only the clouds behind them drift.
    if room == 3030:  # The clouds at the sides sit beside the wall, and they are sky.
        post = keep[:100].copy(); keep[:, :40] = False; keep[:, 1000:] = False; keep[620:] = True
        keep[:100] = post; keep[:100, :700] = False
        keep[100:, 44:1000] = True
    for f in rooms[str(room)]["floors"]:  # The disk's own floors can never drift.
        y = f["y"] + 40
        for sp in f["spans"]:
            if y < 342: keep[max(0, (y - 3) * 2):(y + 4) * 2, max(0, (sp[1] + 13) * 2):(sp[2] + 20) * 2] = True
    if room == 2000:
        for x in (340, 369, 398): keep[50:530, x * 2 - 6:x * 2 + 7] = True  # The three ropes.
    keep = ni.binary_dilation(keep, iterations=3)  # Guard band: nothing beside a gameplay edge moves.
    # Fill structure with the nearest sky so drift reveals only sky.
    idx = ni.distance_transform_edt(keep, return_distances=False, return_indices=True)
    rgb = np.array(art); fill = rgb[idx[0], idx[1]]
    from PIL import ImageFilter
    blur = np.array(Image.fromarray(fill).filter(ImageFilter.GaussianBlur(10)))
    edge = ni.distance_transform_edt(keep); t = np.clip(edge / 12, 0, 1)[..., None]
    fill = (fill * (1 - t) + blur * t).astype(np.uint8)
    alpha = np.array(Image.fromarray(((~keep) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)))
    Image.fromarray(np.dstack([fill, alpha])).save(O / f"B-PSCR-{room}.png", optimize=True)
    vis = rgb.copy(); vis[keep] = (vis[keep] * .35 + np.array([200, 40, 200]) * .65).astype(np.uint8)
    sheet.paste(Image.fromarray(vis), (0, i * 690)); sheet.paste(Image.fromarray(fill), (1034, i * 690))
sheet.save(S / "wrooms/sky.png"); print("ok")
