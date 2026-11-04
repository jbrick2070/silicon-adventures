"""Build the one-byte colour material maps used by the live room renderer.

Run python art/build_colour.py from any directory. Each map aligns with the
native texture, including its crop and transparency. The low five bits select
a material, bit 5 protects a QuickDraw stroke or solid-ink fill from tint,
and bit 6 identifies narrow exterior margins of unpainted interior paper.
"""

import csv
import itertools
import json

import build_refresh as refresh
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = refresh.ROOT
OUT = ROOT / "art/colour"
MATERIALS = (
    "",
    "sky",
    "water",
    "foliage",
    "earth",
    "stone",
    "floor",
    "wall",
    "ceiling",
    "wood",
    "metal",
    "gold",
    "cloth",
    "fire",
    "ice",
    "flesh",
    "accent",
    "ivory",
    "shadow",
)
PROTECT = 32
MARGIN = 64
THEMES = {
    "castle",
    "coast",
    "crypt",
    "desert",
    "highland",
    "jungle",
    "machinery",
    "palace",
    "ruins",
    "sea",
    "temple",
    "village",
    "volcanic",
    "wreck",
}
PER_PAGE = 16
TONES = np.array([bool(meta and (meta[0] == 8 or meta[1])) for meta in refresh.LUMA_TO_META])


def rows(name):
    with (OUT / name).open(encoding="utf-8-sig", newline="") as source:
        yield from csv.DictReader(source, delimiter="\t")


def assignments(row, n, complete):
    values = {}
    for group in row["materials"].split():
        name, spans = group.split("=")
        value = MATERIALS.index(name)
        if value == 0:
            raise ValueError(f"Empty material in {row}")
        for span in spans.split(","):
            ends = list(map(int, span.split("-")))
            if not (len(ends) in (1, 2) and 0 <= ends[0] <= ends[-1] <= n):
                raise ValueError(f"Bad command range {span} in {row}")
            for k in range(ends[0], ends[-1] + 1):
                if k in values:
                    raise ValueError(f"Duplicate command {k} in {row}")
                values[k] = value
    if 0 not in values or (complete and len(values) != n + 1):
        raise ValueError(f"Incomplete material survey for {row['id']}")
    return [values.get(k, values[0]) for k in range(n + 1)]


def selections(rooms):
    """Base texture is the key. Clean plates are drawn with lifted commands removed."""
    result = {d["path"]: (ident, None, True) for ident, d in rooms.items()}
    for ident, name, selected, opaque in refresh.BESPOKE:
        result[f"art/{name}.png"] = ident, selected, opaque
    groups = []
    for line in (ROOT / "art/foreground.tsv").read_text(encoding="utf-8").splitlines():
        if line and not line.startswith("#"):
            ident, key, _, spec, *_ = line.split("|")
            groups.append((int(ident), "art/foreground", key, spec))
    groups.extend(
        (ident, "art/refresh/forms", key, spec) for ident, key, spec in refresh.REFRESH_FORMS
    )
    for (ident, folder), items in itertools.groupby(sorted(groups), key=lambda g: g[:2]):
        used = set()
        for _, _, key, spec in items:
            selected = refresh.expand_ranges(spec)
            used.update(selected)
            result[f"{folder}/{ident}-{key}.png"] = ident, selected, False
        result[f"{folder}/{ident}-clean.png"] = (
            ident,
            set(range(1, rooms[ident]["count"] + 1)) - used,
            True,
        )
    return result


def stamp(mapping, cmd, material, offset):
    """Paint one command into an L tile in the original painter's order."""
    typ, fill, thick, stroke, geometry = cmd
    poly = typ in (16, 20)
    if poly:
        if not geometry:
            return
        xs, ys = zip(*geometry)
        x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
    else:
        x0, y0, x1, y1 = geometry[:4]
    # Restrict each temporary pattern/stroke pair to the command's bounding box.
    ox, oy = offset
    pad = thick + 2
    x, y = max(0, x0 - ox - pad), max(0, y0 - oy - pad)
    w, h = min(mapping.width, x1 - ox + pad + 1) - x, min(mapping.height, y1 - oy + pad + 1) - y
    if min(w, h) <= 0:
        return
    dx, dy = ox + x, oy + y
    geom = (
        [(a - dx, b - dy) for a, b in geometry]
        if poly
        else (x0 - dx, y0 - dy, x1 - dx, y1 - dy, *geometry[4:])
    )
    has_fill = 1 <= fill <= 29
    # For stroke-only rectangles/ellipses keep the underlying drawing in their
    # interiors. Rasterizing a temporary filled shape gives the exact stroke ring.
    sample = (typ, fill if has_fill else 1, thick, stroke, geom)
    patterns, borders, _ = refresh.raster_patterns([sample], w, h, opaque_bg=False)
    pat, border = np.asarray(patterns), np.asarray(borders) != 0
    covered = pat != 0 if has_fill else border
    protected = border | (pat == 8)
    value = material + PROTECT * protected.astype(np.uint8)
    mapping.paste(Image.fromarray(value), (x, y), Image.fromarray(covered))


def trim_paper_margin(codes, mask, background):
    """Continue the ground into a narrow unpainted window margin, far below the sky."""
    h, w = codes.shape
    for x in range(w):
        painted = np.flatnonzero(mask[:, x])
        if painted.size:
            end = painted[-1]
            if 0 < h - end - 1 <= 14 and (codes[end, x] & 31) != background:
                codes[end + 1 :, x] = codes[end, x] & 31
    for y in range(3 * h // 4, h):
        painted = np.flatnonzero(mask[y])
        if painted.size:
            left, right = painted[0], painted[-1]
            if 0 < left <= 8:
                codes[y, :left] = codes[y, left] & 31
            if 0 < w - right - 1 <= 8:
                codes[y, right + 1 :] = codes[y, right] & 31


def exterior_paper(stamped):
    """Only a narrow paper strip directly reachable from an edge of the room window.

    A wide opening or the space around a small object at the top of a plate
    is part of the drawing. Require the majority of that edge to have paint
    within the first 14 pixels before recognizing a frame margin there.
    """
    margin = np.zeros_like(stamped)
    for art, result in ((stamped, margin), (stamped.T, margin.T)):
        for side, dest in ((art, result), (art[::-1], result[::-1])):
            strip = side[:15]
            near = strip.any(axis=0)
            if near.mean() < 0.65:
                continue
            first = strip.argmax(axis=0)
            dest[: len(strip)] |= near & (np.arange(len(strip))[:, None] < first)
    return margin


def texture(
    path, cmds, material, selected, opaque, offset, tone_path=None, margins=None, regions=()
):
    with Image.open(ROOT / path) as src:
        rgba = np.asarray(src.convert("RGBA"))
        alpha = rgba[:, :, 3] >= 128
        size = src.size
    mapping = Image.new("L", size, 0)
    for i, cmd in enumerate(cmds, 1):
        if selected is None or i in selected:
            stamp(mapping, cmd, material[i], offset)
    value = np.array(mapping)
    ids = value & 31
    stamped = ids != 0
    if not opaque and stamped.any():
        # Old BasicStroke extends roughly one pixel beyond Pillow's stroke.
        # Carry the adjacent material just to that outer edge of the native mask.
        rim = np.asarray(Image.fromarray(ids).filter(ImageFilter.MaxFilter(3)))
        ids[~stamped] = rim[~stamped]
    ids[ids == 0] = material[0]
    if margins == "ground":
        trim_paper_margin(ids, stamped, material[0])
    if regions:
        paint = Image.fromarray(ids)
        db = ImageDraw.Draw(paint)
        for name, points in regions:
            if any(not (0 <= x < size[0] and 0 <= y < size[1]) for x, y in points):
                raise ValueError(f"Out-of-bounds sprite region on {path}")
            db.polygon(points, fill=MATERIALS.index(name))
        ids = np.array(paint)
    if tone_path:
        # The existing decoded tone plates already correct the pixel-wide
        # differences between Pillow and the Java QuickDraw rasterizer.
        with Image.open(ROOT / tone_path) as src:
            if src.size != size:
                raise ValueError(f"Tone map dimensions disagree for {path}")
            protected = TONES[np.asarray(src.convert("LA"))[:, :, 0]]
    else:
        protected = ((value & PROTECT) != 0) | (~stamped & alpha)
    dominant = int(np.bincount(ids[alpha]).argmax())
    packed = ids | (PROTECT * protected.astype(np.uint8))
    if margins == "paper":
        packed[exterior_paper(stamped) & (rgba[:, :, 0] >= 128)] |= MARGIN
    packed[~alpha] = 0
    return Image.fromarray(packed), dominant


def make_pages(textures):
    pages = []
    for start in range(0, len(textures), PER_PAGE):
        items = textures[start : start + PER_PAGE]
        w, h = max(im.width for _, im in items), max(im.height for _, im in items)
        page = Image.new("L", (4 * w, 4 * h))
        for i, (_, im) in enumerate(items):
            page.paste(im, ((i % 4) * w, (i // 4) * h))
        page.save(OUT / f"atlas-{len(pages)}.png", optimize=True)
        pages.append({"w": w, "h": h, "paths": [path for path, _ in items]})
    return pages


def build():
    designs = refresh.load_designs()
    parsed = {
        (typ, i): refresh.parse_commands(s)
        for typ in ("ASCN", "AOBJ", "ACHR")
        for i, s in refresh.read_design_resources(typ.encode()).items()
    }
    rooms = {
        d["id"]: dict(d, count=len(parsed["ASCN", d["id"]])) for d in designs if d["type"] == "ASCN"
    }
    themes, materials = {}, {}
    surround = {}
    for file in ("interiors.tsv", "outdoors.tsv"):
        for row in rows(file):
            i = int(row["id"])
            if i in themes or row["theme"] not in THEMES:
                raise ValueError(f"Duplicate room or unknown theme for {i}")
            themes[i] = row["theme"]
            materials[i] = assignments(row, rooms[i]["count"], True)
            if file == "outdoors.tsv":
                names = row["surround"].split(",")
                if len(names) != 3 or any(name not in MATERIALS[1:] for name in names):
                    raise ValueError(f"Unknown sky, ridge or ground for {i}: {names}")
                surround[i] = [MATERIALS.index(name) for name in names]
    if themes.keys() != rooms.keys():
        raise ValueError(f"Missing room survey {sorted(rooms.keys() - themes.keys())}")
    regs = {}
    if (OUT / "sprite-regions.tsv").exists():
        for row in rows("sprite-regions.tsv"):
            key = row["type"], int(row["id"])
            points = [tuple(map(int, p.split(","))) for p in row["points"].split()]
            if (
                row["material"] not in MATERIALS[1:]
                or len(points) < 3
                or any(len(p) != 2 for p in points)
            ):
                raise ValueError(f"Invalid sprite region {row}")
            regs.setdefault(key, []).append((row["material"], points))
    sprites = {}
    for row in rows("sprites.tsv"):
        key = row["type"], int(row["id"])
        if key in sprites or key[0] not in ("AOBJ", "ACHR"):
            raise ValueError(f"Invalid sprite survey {key}")
        sprites[key] = assignments(row, len(parsed[key]), False)
    expected = {
        (d["type"], d["id"])
        for d in designs
        if d["type"] in ("AOBJ", "ACHR") and (d["width"], d["height"]) != (1, 1)
    }
    if sprites.keys() != expected or not regs.keys() <= expected:
        raise ValueError(f"Missing or extra sprite survey {expected ^ sprites.keys()}")
    images = []
    dominant = {}
    for path, (i, selected, opaque) in sorted(selections(rooms).items()):
        if path.startswith("archive/es/plates/"):
            tone_path = path.replace("archive/es/", "art/refresh/")
        elif path.startswith("art/refresh/forms/"):
            tone_path = path.replace("forms/", "forms/tone/")
        else:
            tone_path = path.replace("art/", "art/refresh/", 1)
        margins = None
        if opaque:
            if i not in surround:
                margins = "paper"
            elif materials[i][0] in (1, 2):
                margins = "ground"
        im, dominant[path] = texture(
            path,
            parsed["ASCN", i],
            materials[i],
            selected,
            opaque,
            (0, 0),
            tone_path,
            margins,
        )
        images.append((path, im))
    sprite_tiles = []
    for d in designs:
        key = d["type"], d["id"]
        if key in sprites:
            path = d["path"]
            im, dominant[path] = texture(
                path,
                parsed[key],
                sprites[key],
                None,
                False,
                (d["x"], d["y"]),
                regions=regs.get(key, ()),
            )
            sprite_tiles.append((path, im))
    images += sorted(sprite_tiles, key=lambda a: (a[1].height, a[1].width, a[0]))
    pages = make_pages(images)
    index = {"rooms": themes, "pages": pages, "dominant": dominant, "surround": surround}
    lines = [
        "/* Generated by art/build_colour.py. */",
        "window.ColourIndex = " + json.dumps(index, ensure_ascii=True, separators=(",", ":")) + ";",
    ]
    (OUT / "index.js").write_bytes(("\n".join(lines) + "\n").encode("utf-8"))
    print(
        f"Built {len(rooms)} rooms and {len(sprites)} sprites: {len(images)} texture maps, {len(pages)} atlas pages."
    )


if __name__ == "__main__":
    build()
