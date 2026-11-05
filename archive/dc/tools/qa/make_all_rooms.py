"""Splits the rooms not yet painted into Argon briefs, most-visited rooms first."""
import collections, csv, json, re
from pathlib import Path
R = Path(__file__).resolve().parents[4]; B = R / "archive/dc"
t = (R / "archive/es/designs.js").read_text(encoding="utf8"); D = [x for x in json.loads(t[t.index("["):t.rindex("]") + 1]) if x["type"] == "ASCN"]
done = {int(n) for n in re.findall(r"\d+", re.search(r"static painted = new Set\(\[(.*?)\]\)", (R / "game/view.js").read_text(encoding="utf8"), re.S).group(1))}
themes = {}
for f in ("interiors", "outdoors"):
    for row in csv.DictReader(open(R / f"art/colour/{f}.tsv", encoding="utf8"), delimiter="\t"): themes[int(row["id"])] = row["theme"]
visits = collections.Counter(r[2] for r in csv.reader(open(R / "archive/es/campaign-trace.tsv", encoding="utf8"), delimiter="\t") if len(r) > 2)
rest = sorted((x for x in D if x["id"] not in done), key=lambda x: (-visits[x["name"]], themes.get(x["id"], "z"), x["id"]))
top = (B / "AGY_WAVE_SCEPTERS_PILOT.md").read_text(encoding="utf8"); head = top.split("## Files")[0]; tail = "## Before you finish" + top.split("## Before you finish")[1]
SIZE = 22
for n in range(0, len(rest), SIZE):
    part = rest[n:n + SIZE]; key = f"ROOMS_{n // SIZE + 1:02d}"
    rows = []
    for x in part:
        line = re.split(r"(?<=[.!?])\s", (x.get("text") or "").replace("\n", " ").replace("|", " ").strip())[0][:110]
        rows.append(f"| `ASCN-{x['id']}.png` | {x['name']} | {themes.get(x['id'], 'unspecified')} | {line} |")
    body = head.replace("pilot rooms", f"rooms, batch {n // SIZE + 1}").replace("repainting eight rooms", f"repainting {len(part)} rooms") + f"## Files\n\nUse the room's disk text and place to choose its colour and light. Neighbouring rooms in the same place should feel related, but no two may look the same. Use a muted dark yellow key light and a cool fill, with no orange glow unless the room is lit by fire. Paint no leftover dither patterns.\n\n| File | Room | Place | Disk text |\n| --- | --- | --- | --- |\n" + "\n".join(rows) + "\n\n" + tail.replace("WAVE_PILOT_REPORT", f"WAVE_{key}_REPORT")
    (B / f"AGY_WAVE_SCEPTERS_{key}.md").write_text(body, encoding="utf8"); print(key, len(part))
