"""Measure first-person rigs for rooms still on the generic box.

For each ASCN plate the script finds the floor: the largest filled shape that
reaches the bottom band and spans the centre column. Its top row at the centre
is the wall junction J. The vanishing point of its slanted side edges gives the
horizon cy; without slanted edges the horizon is set so the junction lands at
the class's default depth. Then back = 215 * 1.8 / (J - cy), the floor's side
edges at the junction give left/right, the top band gives wallTop, and the
pattern-index plates under art/refresh/plates/ give the unseen tones.

  python art/measure_rigs.py --calibrate     compare with the hand-measured RefreshRoomLayouts
  python art/measure_rigs.py --write         write art/refresh/rigs.js for campaign rooms off the box
  python art/measure_rigs.py --sheet DIR     contact sheets of flagged rooms for a human nudge

Rigs are used only while the refreshed layers are on; rooms with their own
rig (High Altar, quarters, sanctum, courtyard, the 18 foreground rooms and
the 12 landmark rooms) are left alone."""
from pathlib import Path
import argparse
import json
import re
import sys
from collections import Counter
from PIL import Image, ImageDraw

ART = Path(__file__).resolve().parent
ROOT = ART.parent
sys.path.insert(0, str(ART))
import build_refresh as B  # noqa: E402

EYE, FOCAL, CX = 1.8, 215, 169
TONE_RAMP = {2, 3, 4, 5, 6, 7, 13}  # solid ink and paper are outlines and sky, never a wall tone
OWN_RIG = {7990, 21149, 29408, 10021}
HAND = {17888: (92, 4.96), 22844: (95, 7.74), 8807: (170, 9.4), 20357: (117, 3.28), 7395: (137, 5.3),
        20791: (140, 3.3), 17983: (125, 5.5), 3122: (120, 6.3), 18458: (90, 4.95), 18366: (140, 3.17),
        18391: (150, 5.5), 10850: (100, 9.6)}


def designs():
    js = (ROOT / "archive/es/designs.js").read_text(encoding="utf-8")
    return json.loads(js[js.index("[") : js.rindex("]") + 1])


def environments():
    js = (ROOT / "art/refresh/environments.js").read_text(encoding="utf-8")
    return {int(k): v for k, v in re.findall(r"(\d+):\s*'(\w+)'", js)}


def foreground_rooms():
    rooms = set()
    for line in (ART / "foreground.tsv").read_text(encoding="utf-8").splitlines():
        if line and not line.startswith("#"):
            rooms.add(int(line.split("|")[0]))
    return rooms


def visits():
    counts = Counter()
    names = {}
    for line in (ROOT / "archive/es/campaign-trace.tsv").read_text(encoding="utf-8").splitlines()[1:]:
        parts = line.split("\t")
        if len(parts) >= 3:
            counts[parts[2].strip()] += 1
    return counts


def shape_mask(cmd, w, h):
    stype, fill, thick, bfill, geom = cmd
    im = Image.new("1", (w, h), 0)
    d = ImageDraw.Draw(im)
    if stype in (4, 8):
        x1, y1, x2, y2 = geom[:4]
        if x2 > x1 and y2 > y1:
            d.rectangle([x1, y1, x2 - 1, y2 - 1], fill=1)
    elif stype == 12:
        x1, y1, x2, y2 = geom
        if x2 > x1 and y2 > y1:
            d.ellipse([x1, y1, x2 - 1, y2 - 1], fill=1)
    elif stype in (16, 20) and len(geom) >= 3:
        d.polygon(geom, fill=1)
    return im


def floor_candidate(cmds, w=338, h=314):
    """The floor is what the painter's order leaves visible along the bottom band."""
    samples = [(x, y) for y in (284, 296) for x in (60, 120, CX, 218, 278)]
    best = None
    seen = []
    for i, cmd in enumerate(cmds, 1):
        stype, fill, thick, bfill, geom = cmd
        if not (1 <= fill <= 29) or stype == 12:
            continue
        m = shape_mask(cmd, w, h)
        px = m.load()
        hits = sum(1 for x, y in samples if px[x, y])
        area = sum(1 for y in range(0, h, 2) for x in range(0, w, 2) if px[x, y]) * 4
        if hits >= 1 and area >= 0.02 * w * h:
            seen.append((i, fill, stype))
        if hits < 3 or area < 0.03 * w * h:
            continue
        best = (area, i, cmd, 0, m)  # later commands paint over earlier ones
    if not best:
        return None
    # The junction is where the floor first shows beneath whatever was painted over it,
    # read down three columns near the centre and taking the middle value.
    area, i, cmd, _, m = best
    visible = Image.new("I", (w, h), 0)
    for k, c in enumerate(cmds, 1):
        stype, fill, thick, bfill, geom = c
        if not (1 <= fill <= 29):
            continue
        visible.paste(k, (0, 0), shape_mask(c, w, h))
    vp = visible.load()
    # Floor tiles drawn as several same-fill shapes (the dogleg's slabs) count as one floor.
    members = {k for k, fill, stype in seen if fill == cmd[1] and stype == cmd[0]} | {i}
    tops = []
    for x in (CX - 48, CX - 24, CX, CX + 24, CX + 48):
        ys = [y for y in range(h) if vp[x, y] in members]
        if ys:
            tops.append(ys[0])
    return (area, i, cmd, min(tops) if tops else h, m)


def slanted_edges(cmd):
    stype, fill, thick, bfill, geom = cmd
    if stype not in (16, 20):
        return []
    pts = geom
    edges = []
    for a, b in zip(pts, pts[1:] + pts[:1]):
        dx, dy = b[0] - a[0], b[1] - a[1]
        if abs(dy) >= 12 and abs(dx) >= 6 and abs(dx / dy) < 6:
            edges.append((a, b))
    return edges


def intersect(e1, e2):
    (a1, b1), (a2, b2) = e1, e2
    s1 = (b1[0] - a1[0]) / (b1[1] - a1[1])
    s2 = (b2[0] - a2[0]) / (b2[1] - a2[1])
    if abs(s1 - s2) < 0.08:
        return None
    return (a2[0] - a1[0] - s2 * a2[1] + s1 * a1[1]) / (s1 - s2)


def vanish(edges, top):
    """Horizon from the longest slanted edge on each side; None when they are near-parallel or absurd."""
    left = [e for e in edges if (e[0][0] + e[1][0]) / 2 < CX]
    right = [e for e in edges if (e[0][0] + e[1][0]) / 2 > CX]
    if not left or not right:
        return None
    e1 = max(left, key=lambda e: abs(e[0][1] - e[1][1]))
    e2 = max(right, key=lambda e: abs(e[0][1] - e[1][1]))
    y = intersect(e1, e2)
    if y is None or y > top - 15 or y < -400:
        return None
    return y


def wall_base_edges(cmds, J):
    """Slanted edges of any polygon that start near the junction row and run down toward the viewer."""
    edges = []
    for cmd in cmds:
        for a, b in slanted_edges(cmd):
            hi, lo = (a, b) if a[1] < b[1] else (b, a)
            if abs(hi[1] - J) <= 28 and lo[1] - hi[1] >= 14:
                edges.append((hi, lo))
    return edges


def tones(ident, cy, J, w=338, h=314):
    im = Image.open(ART / f"refresh/plates/ASCN-{ident}.png").convert("LA")
    lut = json.loads(re.search(r"patternByLuma: (\[[^\]]*\])", (ART / "refresh/refresh-index.js").read_text(encoding="utf-8")).group(1))
    px = im.load()
    w, h = im.size  # two disk plates are a row off 338 x 314

    def band(x0, x1, y0, y1):
        c = Counter()
        for y in range(max(0, y0), min(h, y1)):
            for x in range(max(0, x0), min(w, x1)):
                l, a = px[x, y]
                p = lut[l]
                if a >= 128 and p in TONE_RAMP:
                    c[p] += 1
        return c.most_common(1)[0][0] if c else None

    y0 = int(max(0, cy)) + 8
    return {"west": band(0, 14, y0, J - 4), "east": band(w - 14, w, y0, J - 4),
            "ceiling": band(0, w, 0, 18), "floor": band(0, w, J + 12, h)}


def measure(ident, cmds, env):
    cand = floor_candidate(cmds)
    if not cand:
        return None
    area, idx, cmd, J, mask = cand
    wide = env in ("open", "submerged")
    default_back = 9.6 if wide else 5.0
    if J < 20:
        return {"id": ident, "J": J, "cmd": idx, "flags": ["no-junction"], "rig": None}
    vy = vanish(slanted_edges(cmd), J)
    flags = []
    if vy is None:
        vy = vanish(wall_base_edges(cmds, J), J)
        if vy is not None and not (J - 230 <= vy <= J - 30 and FOCAL * EYE / (J - vy) <= 12):
            vy = None
        if vy is not None:
            flags.append("wall-base")
    if vy is None:
        flags.append("no-vanish")
        if J >= 150:
            # The drawing keeps the generic horizon; the junction row then tells the depth.
            cy = 140.0
            back = min(12, max(2.4, FOCAL * EYE / (J - cy)))
        else:
            cy = J - FOCAL * EYE / default_back
            back = default_back
    else:
        cy = vy
        back = FOCAL * EYE / max(8, J - cy)
        if back < 2.4 or back > 14:
            back = min(14, max(2.4, back))
            cy = J - FOCAL * EYE / back
            flags.append("clamped-back")
    if cy < -60 or cy > 230:
        flags.append("odd-horizon")
    if cmd[0] in (16, 20) and len(cmd[4]) > 9:
        flags.append("irregular")
    px = mask.load()
    row = min(313, J + 3)
    xs = [x for x in range(338) if px[x, row]]
    if xs and not wide:
        left = (xs[0] - CX) * back / FOCAL
        right = (xs[-1] + 1 - CX) * back / FOCAL
        half = CX * back / FOCAL
        if xs[0] <= 1:
            left = -half - 0.4
        if xs[-1] >= 336:
            right = half + 0.4
        left = max(-6.5, min(-0.8, left))
        right = min(6.5, max(0.8, right))
    else:
        left, right = (-4.7, 4.7) if wide else (-2.75, 2.75)
    top_height = EYE + (cy - 0) * back / FOCAL
    wall_top = max(2.2, min(7.5, top_height))
    ceiling = wall_top + 0.25
    rig = {"cy": round(cy, 1), "back": round(back, 2), "left": round(left, 2), "right": round(right, 2),
           "ceiling": round(ceiling, 2), "wallTop": round(wall_top, 2), "environment": env}
    if not wide:
        t = tones(ident, cy, J)
        rig["unseen"] = {"floor": t["floor"] or 5, "east": t["east"] or 5, "west": t["west"] or 6,
                         "rear": t["west"] or 6, "ceiling": t["ceiling"] or 7, "courses": False, "baseboard": False}
    return {"id": ident, "J": J, "cmd": idx, "flags": flags, "rig": rig}


# Calibration: unflagged and wall-base rooms matched the hand rigs, as did no-vanish rooms
# with a low junction row; the other tiers did not. Anything else keeps the generic box.
def confident(r):
    flags, rig = set(r["flags"]), r["rig"]
    if flags & {"clamped-back", "odd-horizon", "irregular"}:
        return False
    if not 0 <= rig["cy"] <= 200 or not 3.0 <= rig["back"] <= 10.5 or not 100 <= r["J"] <= 280:
        return False
    # Outdoors a short box stands the plate in front of the player's nose.
    if rig["environment"] in ("open", "submerged") and rig["back"] < 4.5:
        return False
    return not flags or flags == {"wall-base"} or (flags == {"no-vanish"} and r["J"] >= 195)


# Rooms that passed the gate but whose junction lands on furniture or scenery on the contact sheets.
REJECTED = {23272, 14750, 10573, 28995, 25538}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--calibrate", action="store_true")
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--sheet")
    ap.add_argument("--all", action="store_true")
    args = ap.parse_args()
    streams = B.read_ascn_resources()
    env = environments()
    rooms = {d["id"]: d for d in designs() if d["type"] == "ASCN"}
    results = {}
    for ident in sorted(rooms):
        r = measure(ident, B.parse_commands(streams[ident]), env.get(ident, "chamber"))
        if r and r["rig"]:
            results[ident] = r
    if args.calibrate:
        for ident, (hcy, hback) in HAND.items():
            r = results.get(ident)
            if not r:
                print(ident, "no floor")
                continue
            ok = abs(r["rig"]["cy"] - hcy) <= 12 and abs(r["rig"]["back"] - hback) / hback <= 0.10
            print(f"{ident:>5} {rooms[ident]['name']:<16} hand cy={hcy:>3} back={hback:<5} auto cy={r['rig']['cy']:>6} back={r['rig']['back']:<5} J={r['J']:<3} {'OK ' if ok else 'off'} {r['flags']}")
        return
    counts = visits()
    skip = OWN_RIG | foreground_rooms() | set(HAND)
    chosen = {}
    dropped = []
    for ident, r in results.items():
        name = rooms[ident]["name"]
        if ident in skip:
            continue
        if not args.all and counts.get(name, 0) == 0:
            continue
        wide = r["rig"]["environment"] in ("open", "submerged")
        fallback_J = 140 + FOCAL * EYE / (9.6 if wide else 5.0)
        if abs(r["J"] - fallback_J) <= 25:
            continue
        if ident in REJECTED or not confident(r):
            dropped.append(ident)
            continue
        chosen[ident] = r
    if args.sheet:
        out = Path(args.sheet)
        out.mkdir(parents=True, exist_ok=True)
        items = sorted(chosen.values(), key=lambda r: -counts.get(rooms[r["id"]]["name"], 0))
        cols, W, H = 6, 338, 314 + 16
        for part in range(0, len(items), 24):
            chunk = items[part : part + 24]
            sheet = Image.new("RGB", (cols * W, ((len(chunk) + cols - 1) // cols) * H), "white")
            d = ImageDraw.Draw(sheet)
            for i, r in enumerate(chunk):
                im = Image.open(ROOT / f"archive/es/plates/ASCN-{r['id']}.png").convert("RGB")
                x, y = (i % cols) * W, (i // cols) * H
                sheet.paste(im, (x, y + 16))
                dd = ImageDraw.Draw(sheet)
                cy = r["rig"]["cy"]
                if 0 <= cy < 314:
                    dd.line([(x, y + 16 + cy), (x + W, y + 16 + cy)], fill=(255, 0, 0))
                dd.line([(x, y + 16 + r["J"]), (x + W, y + 16 + r["J"])], fill=(0, 160, 0))
                d.text((x + 2, y + 2), f"{r['id']} {rooms[r['id']]['name'][:14]} cy={cy} back={r['rig']['back']} {','.join(r['flags'])}", fill="red")
            sheet.save(out / f"rigs-{part // 24}.png")
        print(f"{len(items)} rooms on {(len(items) + 23) // 24} sheets")
    if args.write:
        lines = ["/* Generated by art/measure_rigs.py. Refreshed-mode rigs for campaign rooms whose drawn",
                 " * floor junction sits more than 25 rows from the generic box. Horizons come from the",
                 " * floor's vanishing point (or the class depth when the floor has no slanted edges),",
                 " * depths from the junction, widths from the floor's side edges, tones from the plate.",
                 " * Rooms with a rig of their own are not listed. Flags mark low-confidence rooms. */",
                 "window.RefreshRigs = {"]
        for ident in sorted(chosen, key=lambda i: rooms[i]["name"].lower()):
            r = chosen[ident]
            flag = (" flags: " + ",".join(r["flags"])) if r["flags"] else ""
            lines.append(f"  {ident}: {json.dumps(r['rig'], separators=(',', ':'))}, // {rooms[ident]['name']} · J={r['J']}{flag}")
        lines.append("};")
        (ART / "refresh/rigs.js").write_text("\n".join(lines) + "\n", encoding="utf-8")
        print(f"Wrote {len(chosen)} rigs to art/refresh/rigs.js; {len(dropped)} low-confidence rooms keep the generic box")


if __name__ == "__main__":
    main()
