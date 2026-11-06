"""Lays each delivered room above its plate. Usage: check_batch.py OUTDIR REPORT"""
import re, sys
from pathlib import Path
from PIL import Image
out = Path(sys.argv[1]); out.mkdir(exist_ok=True)
ids = re.findall(r"`ASCN-(\d+)\.png`", Path(sys.argv[2]).read_text(encoding="utf8"))
for n in range(0, len(ids), 8):
    page = Image.new("RGB", (344 * 4, 640 * 2), (0, 0, 0))
    for i, id_ in enumerate(ids[n:n + 8]):
        p = Image.open(f"archive/es/plates/ASCN-{id_}.png").convert("RGBA"); b = Image.new("RGBA", p.size, (255, 255, 255, 255)); b.alpha_composite(p)
        x, y = i % 4 * 344, i // 4 * 640
        page.paste(b.convert("RGB"), (x, y)); page.paste(Image.open(f"art/es-3d/ASCN-{id_}.png").convert("RGB"), (x, y + 318))
    page.resize((1032, 960), Image.LANCZOS).save(out / f"p{n // 8}.png")
print(len(ids))
