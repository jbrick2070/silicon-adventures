"""Seed the per-room environment table for the first-person refresh layers.

Prints one line per ASCN room: id, proposed class, confidence, the evidence,
and the room name and opening text. The classes are the four renderer
environments in game/view.js and game/refresh.js:

  chamber    built interior: walls, floors, ceilings (castle, hut, submarine, lab)
  cave       natural interior: rock walls, no courses, dark mouths for exits
  open       outdoors under the sky: forest, desert, road, courtyard, sea cliff
  submerged  under water: sea floor, reef, kelp, wreck

Evidence: keywords in the room name and scene text, plus the dominant CODE 1
pattern of the plate's top band (rows 0-39) read from art/refresh/plates/,
where sky and water read light (patterns 1-3, 14) and ceilings read dark.
The committed table is art/refresh/environments.js, checked by hand; rerun
this script only to re-seed it.
"""
from pathlib import Path
import json
import re
from PIL import Image

ART = Path(__file__).resolve().parent
ROOT = ART.parent


def designs():
    js = (ROOT / "archive/es/designs.js").read_text(encoding="utf-8")
    return json.loads(js[js.index("[") : js.rindex("]") + 1])


def palette():
    js = (ART / "refresh/refresh-index.js").read_text(encoding="utf-8")
    return json.loads(re.search(r"patternByLuma: (\[[^\]]*\])", js).group(1))


SUBMERGED = re.compile(r"\b(under ?water|sea ?floor|ocean floor|kelp|coral|reef|seaweed|swim|bubbles?|sand bar|tidewater|deep water|shallows|whirlpool|piranhas?|eel|octopus|shark)\b", re.I)
OPEN = re.compile(r"\b(forest|woods|swamp|marsh|bog|mountain|desert|dunes|valley|canyon|road|clearing|grove|trail|path|garden|bank|shore|beach|seaside|courtyard|lake|river|sea\b|meadow|prairie|sky|cliff|mesa|butte|oasis|peak|volcano|vista|rampart|camp|jungle|riverside|rapids|spring|outcrop|ledge|ravine|gulley|chasm|flats|mud|pond|pool|stream|dock|deck|galleon|catapult)\b", re.I)
CAVE = re.compile(r"\b(cave|cavern|tunnel|lava|rock(y|s)?\b|crawl|lair|grotto|stalag|boiling|sulphur|volcanic|crag|shaft|well|pit)\b", re.I)
CHAMBER = re.compile(r"\b(room|hall|hallway|chamber|door|stairs?|corridor|passage|cell|dungeon|throne|temple|shrine|altar|lab|office|cabin|hut|submarine|airlock|hold|deck|helm|control|computer|closet|store|armory|barracks|lobby|quarters|sanctum|treasury|annex|basin|idols|murals|sepulchre|palace|arena|cage|pen|bunker|map room|music|gambling|pool table|drinks|wheel|hatch|hook|post|strategy|keeper|greeting|sphinx|pedestal|grave|web|nest|ball)\b", re.I)


def band_pattern(ident, lut, rows=40):
    im = Image.open(ART / f"refresh/plates/ASCN-{ident}.png").convert("LA")
    w, h = im.size
    px = im.load()
    counts = {}
    for y in range(rows):
        for x in range(w):
            l, a = px[x, y]
            if a < 128:
                continue
            p = lut[l]
            counts[p] = counts.get(p, 0) + 1
    return max(counts, key=counts.get) if counts else 0


def classify(d, lut):
    text = d["name"] + " " + d["text"]
    top = band_pattern(d["id"], lut)
    light_top = top in (1, 2, 3, 14)
    scores = {"submerged": 0, "open": 0, "cave": 0, "chamber": 0}
    scores["submerged"] += 3 * len(SUBMERGED.findall(text))
    scores["open"] += 2 * len(OPEN.findall(text))
    scores["cave"] += 2 * len(CAVE.findall(text))
    scores["chamber"] += 1 * len(CHAMBER.findall(text))
    if light_top:
        scores["open"] += 2
    else:
        scores["chamber"] += 1
        scores["cave"] += 1
    best = max(scores, key=scores.get)
    ranked = sorted(scores.values(), reverse=True)
    conf = "high" if ranked[0] - ranked[1] >= 3 else "low"
    return best, conf, top, scores


def main():
    lut = palette()
    for d in sorted((x for x in designs() if x["type"] == "ASCN"), key=lambda x: x["name"].lower()):
        best, conf, top, scores = classify(d, lut)
        print(f"{d['id']:>5} {best:<9} {conf:<4} top={top:<2} {scores} | {d['name']} | {d['text'][:110].replace(chr(10), ' ')}")


if __name__ == "__main__":
    main()
