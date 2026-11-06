"""Build the offline Windows package from the working tree.

    python web/package_windows.py <old zip> <new zip>

The old package lists the program files. The new art comes from web/stage.py's
own list, so the offline edition carries what the web edition does.
"""
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).parent))
from stage import ASSETS

TOP = "Enchanted Scepters/"
old, new = Path(sys.argv[1]), Path(sys.argv[2])
wanted = set()
with zipfile.ZipFile(old) as z:
    for name in z.namelist():
        path = name[len(TOP):]
        if path and not name.endswith("/") and (ROOT / path).is_file():
            wanted.add(path)
for pattern in ASSETS:
    wanted.update(p.relative_to(ROOT).as_posix() for p in ROOT.glob(pattern) if p.is_file())
wanted.update(p.relative_to(ROOT).as_posix() for p in ROOT.glob("game/*") if p.is_file())
wanted.add("README.md")
with zipfile.ZipFile(new, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for path in sorted(wanted):
        z.write(ROOT / path, TOP + path)
print(len(wanted), "files", new.stat().st_size // 1048576, "MB")
