"""Adds delivered sprite reels to HD_PAINTED. Usage: add_painted.py brief.md [skip keys...]"""
import re, sys
from pathlib import Path
R = Path(r"D:\silicon-adventures"); p = R / "game/enchanted-castle.js"; s = p.read_text(encoding="utf8")
skip = set(sys.argv[2:])
names = dict.fromkeys(re.findall(r"`([AB])-PPCT-(\d+)\.png`", (R / sys.argv[1]).read_text(encoding="utf8")))
m = re.search(r"const HD_PAINTED = new Set\(\[(.*?)\]\);", s)
cur = re.findall(r"'(\w+)'", m.group(1))
for f, n in names:
    k = f + n
    if k not in cur and k not in skip and (R / f"art/castle-3d/4x/{f}-PPCT-{n}.png").exists(): cur.append(k)
s = s[:m.start(1)] + ", ".join(f"'{k}'" for k in cur) + s[m.end(1):]
p.write_text(s, encoding="utf8"); print(len(cur), "painted")
