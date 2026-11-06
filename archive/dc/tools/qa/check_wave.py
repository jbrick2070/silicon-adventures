"""Measures delivered sprites and lays out every frame for review. Usage: check_wave.py OUTDIR name [name...] or a report path."""
import json, re, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
R = Path(r"D:\silicon-adventures"); A = R / "art/castle-3d"; S = Path(sys.argv[1]); S.mkdir(exist_ok=True)
t = (R / "art/castle-index.js").read_text(encoding="utf8"); L = json.loads(t[t.index("["):t.rindex("]") + 1])
info = {x["path"].split("/")[-1]: x for x in L if x["type"] == "PPCT"}
wave = (R / sys.argv[2]).read_text(encoding="utf8")
names = [n for n in re.findall(r"`([AB]-PPCT-\d+\.png)`", wave)]
names = list(dict.fromkeys(names))
rows = []; bad = []
for n in names:
    x = info[n]
    if not (A / n).exists() or not (A / "4x" / n).exists(): rows.append((n, "MISSING")); bad.append(n); continue
    o = np.array(Image.open(R / "art/castle" / n).convert("RGBA")); a = np.array(Image.open(A / n).convert("RGBA")); h = np.array(Image.open(A / "4x" / n).convert("RGBA"))
    if a.shape != o.shape or h.shape[0] != o.shape[0] * 4 or h.shape[1] != o.shape[1] * 4: rows.append((n, "SIZE", a.shape, h.shape)); bad.append(n); continue
    om, am = o[..., 3] > 0, a[..., 3] > 0
    cw, ch, fr = x["width"], x["height"], x["frames"]
    horiz = o.shape[1] > cw
    iou = []
    for f in range(fr):
        s = (slice(None), slice(f * cw, (f + 1) * cw)) if horiz else (slice(f * ch, (f + 1) * ch), slice(None))
        p, q = om[s], am[s]
        if p.any(): iou.append((p & q).sum() / (p | q).sum())
    spill = int((am & ~om).sum()); low = min(iou) if iou else 1
    rows.append((n[:-4], fr, spill, round(float(low), 2)))
    if spill or low < .9: bad.append(f"{n[:-4]} spill {spill} iou {low:.2f}")
print(len(rows), "checked"); print("FLAGS", bad)
ok = [n for n in names if (A / n).exists()]
pages, x0, y0, page = [], 8, 8, Image.new("RGB", (1500, 1000), (22, 22, 26)); d = ImageDraw.Draw(page)
for n in ok:
    x = info[n]; cw, ch, fr = x["width"], x["height"], x["frames"]
    im = Image.open(A / n).convert("RGBA"); k = 2 if cw * fr * 2 < 1400 else 1
    bg = Image.new("RGBA", im.size, (44, 40, 46, 255)); bg.alpha_composite(im)
    if im.width == cw and fr > 1: bg = Image.new("RGBA", (cw * fr, ch), (44, 40, 46, 255)); [bg.alpha_composite(im.crop((0, f * ch, cw, (f + 1) * ch)), (f * cw, 0)) for f in range(fr)]
    bg = bg.resize((bg.width * k, bg.height * k), Image.NEAREST).convert("RGB")
    if x0 + bg.width + 8 > 1500: x0 = 8; y0 += rowh + 16; rowh = 0
    if y0 + bg.height + 16 > 1000: pages.append(page); page = Image.new("RGB", (1500, 1000), (22, 22, 26)); d = ImageDraw.Draw(page); x0, y0, = 8, 8; rowh = 0
    d.text((x0, y0), n[:-4].replace("-PPCT-", ""), fill=(200, 200, 120)); page.paste(bg, (x0, y0 + 12))
    x0 += bg.width + 12; rowh = max(locals().get("rowh", 0), bg.height + 12)
pages.append(page)
for i, p in enumerate(pages): p.save(S / f"page{i + 1}.png")
print(len(pages), "pages")
