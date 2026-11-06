"""Builds upload guides and the Flow prompt sheet for the 24 standout adventure rooms."""
import json, re
from pathlib import Path
from PIL import Image, ImageFilter
R = Path(r"D:\silicon-adventures"); G = R / "art/es-3d/guides"; G.mkdir(parents=True, exist_ok=True); (R / "art/es-3d/incoming").mkdir(exist_ok=True)
t = (R / "archive/es/designs.js").read_text(encoding="utf8"); D = {x["id"]: x for x in json.loads(t[t.index("["):t.rindex("]") + 1]) if x["type"] == "ASCN"}
ROOMS = [("Opening", [(21149, "Warm lamplight and polished wood."), (21083, "Vast, cold stone with shafts of daylight."), (17872, "Polished stone in soft daylight."), (17888, "Black obsidian lit with warm gold."), (7990, "Ochre pillars, stone paving, aubergine at the foot of the walls, slate above.")]),
  ("Marsh", [(24338, "Pale gold morning mist."), (25936, "Rust-brown water under a low amber sun."), (2577, "Sickly green and dangerous, with a dim glow on the mud."), (25694, "Deep teal shadow and dark water."), (4315, "Still violet dusk, the pool reflecting the sky."), (4957, "Cold grey-blue stone and wet mud.")]),
  ("Big moments", [(3099, "Molten orange light and black rock."), (14750, "Blood-red firelight."), (29408, "Arcane blue and violet light."), (14057, "Deep undersea blue-green with shimmering caustic light."), (31514, "Rich, glowing, otherworldly."), (32256, "Grand and luminous.")]),
  ("Memorable places", [(20301, "Bright sun on pale sand and blue water."), (14688, "Late sun on weathered wood."), (10472, "Brass and riveted steel, dim instrument glow."), (23272, "Brass and riveted steel, dim instrument glow."), (4223, "Hot gold sand under a white sky."), (20598, "Green-gold forest light."), (18366, "Triumphant golden light.")])]
base = "Repaint this exact scene as a rich, truly lit 3D render. Keep the camera, horizon and perspective, and keep every wall edge, doorway, object and landmark exactly where it is in this image. Do not add, remove or move anything. No new text, people, frames or borders. Solid realistic materials, muted dark yellow key light from the upper left, cool slate fill, no orange, soft detail. Do not add a dark vignette."
out = ["# Flow prompts for the 24 standout rooms", "", "Use these in Flow with **image input**. For each room:", "", "1. Upload `art/es-3d/guides/ASCN-<id>.png`.", "2. Paste the shared prompt, then the room line.", "3. Use the square-ish shape closest to the upload.", "4. Save the best result as `art/es-3d/incoming/ASCN-<id>.png`, keeping the number in the name.", "", "Start with room 21149 only, so its result can be checked before you do the rest.", "", "## Shared prompt", "", "```text", base, "```", ""]
for group, rooms in ROOMS:
    out += [f"## {group}", "", "| File | Room | Room line |", "| --- | --- | --- |"]
    for i, line in rooms:
        d = D[i]; im = Image.open(R / d["path"]).convert("RGBA")
        bg = Image.new("RGBA", im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
        bg.convert("RGB").resize((1352, 1256), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.4)).save(G / f"ASCN-{i}.png")
        first = re.split(r"(?<=[.!?])\s", (d.get("text") or "").replace("\n", " ").replace("|", " ").strip())[0][:120]
        out.append(f"| `ASCN-{i}.png` | {d['name']} | This is: {first} {line} |")
    out.append("")
(R / "archive/dc/FLOW_ROOMS.md").write_text("\n".join(out), encoding="utf8")
print(sum(len(r) for _, r in ROOMS))
for g, r in ROOMS:
    for i, _ in r: print(i, D[i]["name"], "|", (D[i].get("text") or "")[:90].replace("\n", " "))
