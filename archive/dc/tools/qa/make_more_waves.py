"""Writes the parallel Argon briefs: two room waves, the scepters and the adventure's inhabitants."""
import json, re
from pathlib import Path
from PIL import Image
R = Path(r"D:\silicon-adventures"); B = R / "archive/dc"
head = (B / "AGY_WAVE_SCEPTERS_PILOT.md").read_text(encoding="utf8")
top, files = head.split("## Files"); tail = "## Before you finish" + files.split("## Before you finish")[1]
src = (Path(__file__).parent / "make_flow.py").read_text(encoding="utf8")
rooms = dict((int(a), b) for a, b in re.findall(r"\((\d{3,5}), \"([^\"]+)\"\)", src))
t = (R / "archive/es/designs.js").read_text(encoding="utf8"); D = json.loads(t[t.index("["):t.rindex("]") + 1])
S = {x["id"]: x for x in D if x["type"] == "ASCN"}
def room_brief(key, title, ids, intro):
    rows = "\n".join(f"| `ASCN-{i}.png` | {S[i]['name']} | {rooms[i]} |" for i in ids)
    body = top.replace("pilot rooms", title).replace("repainting eight rooms", f"repainting {len(ids)} rooms") + f"## Files\n\n{intro}\n\n| File | Room | Direction |\n| --- | --- | --- |\n{rows}\n\n" + tail.replace("WAVE_PILOT_REPORT", f"WAVE_{key}_REPORT")
    (B / f"AGY_WAVE_SCEPTERS_{key}.md").write_text(body, encoding="utf8")
room_brief("ROOMS_A", "opening and big moments", [21083, 17872, 17888, 3099, 14750, 29408, 14057, 31514, 32256], "These are the rooms players talk about. Each must have its own strong identity.")
room_brief("ROOMS_B", "memorable places", [20301, 14688, 10472, 23272, 4223, 20598, 18366], "These are the places players remember. Each must have its own strong identity.")
scepters = [(608, "Earth Scepter", "carved green jade and bronze"), (4500, "Fire Scepter", "blackened iron and red gold, with a ruby flame crystal"), (23213, "Air Scepter", "polished silver and pale blue enamel"), (19566, "Water Scepter", "deep blue steel and pearl, with a sapphire orb")]
rows = []
for pid, name, look in scepters:
    w, h = Image.open(R / f"archive/es/plates/AOBJ-{pid}.png").size
    rows.append(f"| `AOBJ-{pid}.png` | {w} x {h} | {name} | {look} |")
body = top.split("## Rules")[0].split("\n")[0].replace("pilot rooms", "the four scepters") + """

You are repainting the four scepters of a 1986 Macintosh game into a rich, truly lit 3D look. They are the prize of the whole game, so they must look precious. Study `art/castle-3d/B-PPCT-908.png` and `art/castle-3d/B-PSCR-4020.png` for materials and finish.

## Rules

- Work in `D:\\silicon-adventures`, on the branch `feature/asset-parity`.
- Create files only in `art/es-3d/scepters/`. Do not touch anything else. Do not commit, push, or switch branches. Play no audio. Leave ComfyUI and its GPU alone.
- For each scepter deliver three files, using the plate's number:
  - `AOBJ-<id>.png`: the same size as the original plate, transparent outside the original shape, with nothing outside it.
  - `4x/AOBJ-<id>.png`: the 4x master of that file. The native file must be its box average.
  - `hero/AOBJ-<id>.png`: the whole scepter on plain white, 1024 x 1024, seen straight on, with nothing cropped, for making a 3D model.
- Keep each scepter's shape and proportions from its plate in `archive/es/plates/`. Add no text.
- Use a muted dark yellow key light and a cool fill, with no orange glow. Never fill a gap with one flat colour.

## Files

| Plate | Size | Name | Materials |
| --- | --- | --- | --- |
""" + "\n".join(rows) + """

## Before you finish

Look at every file at native size on a dark background. A check by numbers alone does not count.

## Report

Write `art/es-3d/WAVE_SCEPTERS_REPORT.md`: one row per file with dimensions, spill pixels and pass or fail, then anything left out, then the time taken.
"""
(B / "AGY_WAVE_SCEPTERS_ART.md").write_text(body, encoding="utf8")
chars = [x for x in D if x["type"] == "ACHR"]
print(len(chars), [(x["id"], x["name"], x["width"], x["height"]) for x in chars][:40])
rows = "\n".join(f"| `ACHR-{x['id']}.png` | {Image.open(R / x['path']).size[0]} x {Image.open(R / x['path']).size[1]} | {x['name']} |" for x in chars)
body = """# Enchanted Scepters remaster: the inhabitants

You are repainting the inhabitants of a 1986 Macintosh adventure into a rich, truly lit 3D look. They stand in painted first-person rooms, so they must feel solid and belong there. Study `art/castle-3d/B-PPCT-908.png`, `art/castle-3d/B-PPCT-435.png` and `art/castle-3d/A-PPCT-106.png` for materials and finish.

## Rules

- Work in `D:\\silicon-adventures`, on the branch `feature/asset-parity`.
- Create files only in `art/es-3d/inhabitants/` and `art/es-3d/inhabitants/4x/`, using the original filenames from `archive/es/plates/`. Do not touch anything else. Do not commit, push, or switch branches. Play no audio. Leave ComfyUI and its GPU alone.
- Deliver a native file and a 4x master. Each native file must be the box average of its 4x master.
- Dimensions and frame layout must be exact. Nothing may spill outside the original sprite mask, and every pixel inside it must be real painted material. Never fill a gap with one flat colour.
- Keep a thin, soft light edge inside the original rim pixels, so each figure stays clear on dark rooms.
- The same character must keep the same colours and materials in every frame.
- Use a muted dark yellow key light and a cool fill, with no orange glow. Add no text.

## Files

| File | Size | Who |
| --- | --- | --- |
""" + rows + """

## Before you finish

Look at every frame at native size on a dark background. A check by numbers alone does not count. Files you cannot make good are better left out than delivered bad.

## Report

Write `art/es-3d/WAVE_INHABITANTS_REPORT.md`: one row per file with dimensions, spill pixels, largest shift and pass or fail, then anything left out, then the time taken.
"""
(B / "AGY_WAVE_SCEPTERS_INHABITANTS.md").write_text(body, encoding="utf8")
