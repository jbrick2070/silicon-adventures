"""Switches on the rooms in a checked batch and stages them. Usage: add_rooms.py REPORT [skip ids...]"""
import re, subprocess, sys
from pathlib import Path
rep = sys.argv[1]; skip = set(sys.argv[2:])
ids = [i for i in re.findall(r"`ASCN-(\d+)\.png`", Path(rep).read_text(encoding="utf8")) if i not in skip]
p = Path("game/view.js"); s = p.read_text(encoding="utf8")
m = re.search(r"static painted = new Set\(\[(.*?)\]\);", s, re.S)
have = re.findall(r"\d+", m.group(1)); new = [i for i in ids if i not in have and Path(f"art/es-3d/ASCN-{i}.png").exists()]
s = s[:m.end(1)] + (",\n    " + ", ".join(new) if new else "") + s[m.end(1):]; p.write_text(s, encoding="utf8")
subprocess.run(["git", "add", "--", "game/view.js", rep] + [f"art/es-3d/ASCN-{i}.png" for i in new] + [f"art/es-3d/4x/ASCN-{i}.png" for i in new] + ["archive/dc/tools/qa/"], check=True)
print(len(have) + len(new), "rooms painted")
