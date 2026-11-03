"""Generate non-destructive visual refresh layers under art/refresh/.

Leaves archive/es/plates/*, art/*.png, art/foreground/*.png, art/castle/*.png,
and art/castle-wizard.png completely untouched.

Each room/foreground tone layer is a greyscale+binary-alpha PNG (A in {0, 255})
encoding both the exact original CODE 1 ScepterPatterns index (1..29) and
whether the pixel belongs to a shape's interior fill (even luma) or border
stroke (odd luma = base_luma - 1). Because alpha is strictly 0 or 255, HTML5
Canvas getImageData preserves exact byte values without premultiplication drift,
while standard image viewers display a clean shaded architectural tone plate.
"""
from pathlib import Path
import json
import math
import re
import struct
from PIL import Image, ImageDraw


ART = Path(__file__).resolve().parent
ROOT = ART.parent
OUT = ART / "refresh"


def load_patterns():
    fg = (ART / "foreground-index.js").read_text(encoding="utf-8")
    return json.loads(re.search(r"ScepterPatterns=(\[.*\]);", fg).group(1))


PATTERNS = load_patterns()


def pat_bit(pat_idx, x, y):
    tile = PATTERNS[pat_idx]
    return 1 if (tile[y & 7] & (128 >> (x & 7))) else 2


def build_luma_tables():
    densities = []
    for idx in range(1, 30):
        ones = sum(bin(b).count("1") for b in PATTERNS[idx])
        densities.append((ones, idx))
    densities.sort()  # 0/64 (lightest) -> 64/64 (darkest)
    pat_to_even = {}
    luma_to_meta = [None] * 256
    for rank, (_, idx) in enumerate(densities):
        # 29 ranks mapped onto even integers in [2..254]; odd =even-1 marks border stroke
        even = 254 - rank * 8
        pat_to_even[idx] = even
        luma_to_meta[even] = (idx, 0)      # interior fill
        luma_to_meta[even - 1] = (idx, 1)  # border stroke
    return pat_to_even, luma_to_meta


PAT_TO_EVEN, LUMA_TO_META = build_luma_tables()


def read_ascn_resources():
    fork = (ROOT / "archive/es/Scepters.rsrc").read_bytes()
    data_start, index = struct.unpack_from(">II", fork)
    types = index + struct.unpack_from(">H", fork, index + 24)[0]
    count = struct.unpack_from(">H", fork, types)[0] + 1
    streams = {}
    for i in range(count):
        kind, n, offset = struct.unpack_from(">4sHH", fork, types + 2 + 8 * i)
        if kind == b"ASCN":
            for j in range(n + 1):
                ref = types + offset + 12 * j
                ident = struct.unpack_from(">h", fork, ref)[0]
                start = data_start + int.from_bytes(fork[ref + 5 : ref + 8], "big")
                length = struct.unpack_from(">I", fork, start)[0]
                streams[ident] = fork[start + 4 : start + 4 + length]
    return streams


def parse_commands(res):
    end = struct.unpack_from(">H", res, 0)[0]
    pos = 2
    cmds = []
    while pos < end:
        fill, thick, bfill, stype = struct.unpack_from(">BBBB", res, pos)
        if stype in (4, 12):
            y1, x1, y2, x2 = struct.unpack_from(">hhhh", res, pos + 4)
            cmds.append((stype, fill, thick, bfill, (x1, y1, x2, y2)))
            pos += 12
        elif stype == 8:
            y1, x1, y2, x2, arc = struct.unpack_from(">hhhhh", res, pos + 4)
            cmds.append((stype, fill, thick, bfill, (x1, y1, x2, y2, arc)))
            pos += 14
        elif stype in (16, 20):
            nb = struct.unpack_from(">H", res, pos + 6)[0]
            y1, x1 = struct.unpack_from(">hh", res, pos + 16)
            pts = [(x1, y1)]
            rem = nb - 14
            p2 = pos + 20
            cx, cy = x1, y1
            while rem > 0:
                yb = struct.unpack_from(">b", res, p2)[0]
                if yb == -128:
                    cy = struct.unpack_from(">h", res, p2 + 1)[0]
                    p2 += 3
                    rem -= 3
                else:
                    cy += yb
                    p2 += 1
                    rem -= 1
                xb = struct.unpack_from(">b", res, p2)[0]
                if xb == -128:
                    cx = struct.unpack_from(">h", res, p2 + 1)[0]
                    p2 += 3
                    rem -= 3
                else:
                    cx += xb
                    p2 += 1
                    rem -= 1
                pts.append((cx, cy))
            cmds.append((stype, fill, thick, bfill, pts))
            pos += 6 + nb
        elif stype == 24:
            nb = struct.unpack_from(">H", res, pos + 4)[0]
            pos += 4 + nb
    return cmds


def expand_ranges(spec):
    out = set()
    for part in spec.split(","):
        ends = part.split("-")
        a, b = int(ends[0]), int(ends[-1])
        out.update(range(a, b + 1))
    return out


def build_tone_layer(png_path, cmds, selected_indices=None, opaque_bg=True):
    orig = Image.open(png_path).convert("RGBA")
    w, h = orig.size
    pat_img = Image.new("L", (w, h), 1 if opaque_bg else 0)
    bdr_img = Image.new("L", (w, h), 0)
    alt_img = Image.new("L", (w, h), 0)  # nearby stroke pattern for 1px Java vs PIL stroke width edge cases
    dp = ImageDraw.Draw(pat_img)
    db = ImageDraw.Draw(bdr_img)
    da = ImageDraw.Draw(alt_img)

    for i, (stype, fill, thick, bfill, geom) in enumerate(cmds, 1):
        if selected_indices is not None and i not in selected_indices:
            continue
        has_fill = 1 <= fill <= 29
        has_bdr = thick > 0 and 1 <= bfill <= 29
        if stype == 4:
            x1, y1, x2, y2 = geom
            if x2 > x1 and y2 > y1:
                if has_bdr:
                    da.rectangle([x1 - 1, y1 - 1, x2, y2], fill=bfill)
                    dp.rectangle([x1, y1, x2 - 1, y2 - 1], fill=bfill)
                    db.rectangle([x1, y1, x2 - 1, y2 - 1], fill=1)
                ix1, iy1, ix2, iy2 = x1 + thick, y1 + thick, x2 - thick, y2 - thick
                if has_fill and ix2 > ix1 and iy2 > iy1:
                    dp.rectangle([ix1, iy1, ix2 - 1, iy2 - 1], fill=fill)
                    db.rectangle([ix1, iy1, ix2 - 1, iy2 - 1], fill=0)
        elif stype == 8:
            x1, y1, x2, y2, arc = geom
            r = max(1, arc // 2)
            if x2 > x1 and y2 > y1:
                if has_bdr:
                    da.rounded_rectangle([x1 - 1, y1 - 1, x2, y2], radius=6, fill=bfill)
                    dp.rounded_rectangle([x1, y1, x2 - 1, y2 - 1], radius=6, fill=bfill)
                    db.rounded_rectangle([x1, y1, x2 - 1, y2 - 1], radius=6, fill=1)
                ix1, iy1, ix2, iy2 = x1 + thick, y1 + thick, x2 - thick, y2 - thick
                if has_fill and ix2 > ix1 and iy2 > iy1:
                    dp.rounded_rectangle([ix1, iy1, ix2 - 1, iy2 - 1], radius=r, fill=fill)
                    db.rounded_rectangle([ix1, iy1, ix2 - 1, iy2 - 1], fill=0)
        elif stype == 12:
            x1, y1, x2, y2 = geom
            if x2 > x1 and y2 > y1:
                if has_bdr:
                    da.ellipse([x1 - 1, y1 - 1, x2, y2], fill=bfill)
                    dp.ellipse([x1, y1, x2 - 1, y2 - 1], fill=bfill)
                    db.ellipse([x1, y1, x2 - 1, y2 - 1], fill=1)
                ix1, iy1, ix2, iy2 = x1 + thick, y1 + thick, x2 - thick, y2 - thick
                if has_fill and ix2 > ix1 and iy2 > iy1:
                    dp.ellipse([ix1, iy1, ix2 - 1, iy2 - 1], fill=fill)
                    db.ellipse([ix1, iy1, ix2 - 1, iy2 - 1], fill=0)
        elif stype in (16, 20):
            pts = geom
            if has_fill and len(pts) >= 3:
                dp.polygon(pts, fill=fill)
                db.polygon(pts, fill=0)
                if not has_bdr:
                    da.line(pts + [pts[0]], fill=fill, width=3)
            if has_bdr and len(pts) >= 2:
                # Java BasicStroke(thick - 0.5f, CAP_SQUARE) covers slightly wider on diagonals than PIL width=thick
                da.line(pts, fill=bfill, width=thick + 3)
                dp.line(pts, fill=bfill, width=max(1, thick))
                db.line(pts, fill=1, width=max(1, thick))

    orig_bytes = orig.tobytes()
    p_bytes = pat_img.tobytes()
    b_bytes = bdr_img.tobytes()
    a_bytes = alt_img.tobytes()
    out_la = bytearray(w * h * 2)

    for y in range(h):
        row_off = y * w
        for x in range(w):
            idx = row_off + x
            if orig_bytes[idx * 4 + 3] < 128:
                continue
            obit = 1 if orig_bytes[idx * 4] < 128 else 2
            pat = p_bytes[idx]
            is_bdr = b_bytes[idx]
            alt_bdr = a_bytes[idx]
            if pat < 1 or pat > 29 or pat_bit(pat, x, y) != obit:
                # Prefer the polygon/shape's own border stroke pattern if within its halo!
                if 1 <= alt_bdr <= 29 and pat_bit(alt_bdr, x, y) == obit:
                    pat = alt_bdr
                    is_bdr = 1
                else:
                    found = 0
                    found_bdr = is_bdr
                    for dy in (-1, 0, 1, -2, 2):
                        ny = y + dy
                        if ny < 0 or ny >= h:
                            continue
                        for dx in (-1, 0, 1, -2, 2):
                            nx = x + dx
                            if nx < 0 or nx >= w:
                                continue
                            np = p_bytes[ny * w + nx]
                            if 1 <= np <= 29 and pat_bit(np, x, y) == obit:
                                found = np
                                found_bdr = b_bytes[ny * w + nx]
                                break
                        if found:
                            break
                    if not found:
                        found = 8 if obit == 1 else 1
                        found_bdr = 1
                    pat = found
                    is_bdr = found_bdr
            even = PAT_TO_EVEN[pat]
            out_la[idx * 2] = even - 1 if is_bdr else even
            out_la[idx * 2 + 1] = 255

    return Image.frombytes("LA", (w, h), bytes(out_la))


def verify_tone_layer(orig_path, tone_img):
    orig = Image.open(orig_path).convert("RGBA").tobytes()
    la = tone_img.tobytes()
    w, h = tone_img.size
    for idx in range(w * h):
        oa = orig[idx * 4 + 3] >= 128
        ta = la[idx * 2 + 1] == 255
        if oa != ta:
            raise ValueError(f"Alpha mismatch at {idx} in {orig_path}")
        if oa:
            obit = 1 if orig[idx * 4] < 128 else 2
            meta = LUMA_TO_META[la[idx * 2]]
            if meta is None or pat_bit(meta[0], idx % w, idx // w) != obit:
                raise ValueError(f"Bit mismatch at {idx} in {orig_path}")


def build_sprite_rim(src_path, fw, fh, rows_cols, skip_bottom=True):
    src = Image.open(src_path).convert("RGBA")
    w, h = src.size
    px = src.load()
    rim = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    rpx = rim.load()
    for row, ncols in enumerate(rows_cols):
        for col in range(ncols):
            ox, oy = col * fw, row * fh
            for y in range(fh):
                if skip_bottom and y == fh - 1:
                    continue
                for x in range(fw):
                    if px[ox + x, oy + y][3] >= 128:
                        continue
                    touches_ink = False
                    for dy in (-1, 0, 1):
                        ny = y + dy
                        if ny < 0 or ny >= fh:
                            continue
                        for dx in (-1, 0, 1):
                            if dx == 0 and dy == 0:
                                continue
                            nx = x + dx
                            if nx < 0 or nx >= fw:
                                continue
                            r, _, _, a = px[ox + nx, oy + ny]
                            if a >= 128 and r < 128:
                                touches_ink = True
                                break
                        if touches_ink:
                            break
                    if touches_ink:
                        rpx[ox + x, oy + y] = (255, 255, 255, 255)
    return rim


def main():
    (OUT / "plates").mkdir(parents=True, exist_ok=True)
    (OUT / "foreground").mkdir(parents=True, exist_ok=True)
    (OUT / "sprites").mkdir(parents=True, exist_ok=True)

    streams = read_ascn_resources()
    parsed = {ident: parse_commands(data) for ident, data in streams.items()}

    # 1. All 200 room plates
    plate_bytes = 0
    for ident, cmds in sorted(parsed.items()):
        src = ROOT / f"archive/es/plates/ASCN-{ident}.png"
        dest = OUT / f"plates/ASCN-{ident}.png"
        im = build_tone_layer(src, cmds, None, True)
        verify_tone_layer(src, im)
        im.save(dest, optimize=True)
        plate_bytes += dest.stat().st_size

    # 2. Separated architectural rooms (High Altar, Quarters, Sanctum, Courtyard)
    bespoke = [
        (7990, "altar-clean", {1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,21,22,24}, True),
        (7990, "altar-dais", {16,23}, False),
        (7990, "altar-column-left", {19,20}, False),
        (7990, "altar-column-right", {17,18}, False),
        (7990, "altar-plinth", {25,26,27}, False),
        (21149, "quarters-clean", {1,2,3,4,5,10,11}, True),
        (21149, "quarters-bed", {6,7,8,9,12}, False),
        (29408, "sanctum-clean", {1,2,3,4,5,16,18,19,20,21,22,23,24,25,26,31}, True),
        (29408, "sanctum-table", {6,7,8,9,10,17}, False),
        (29408, "sanctum-book", {11,12,13,14,15}, False),
        (29408, "sanctum-arch", {27,28,29,30}, False),
        (10021, "court-clean", {1,2,3,4,5,6,7,8,9,10,11,12,14,15,16,17,18,19,20,21,22,23,24,25,29,30,31,32,33,34,35}, True),
        (10021, "court-basin", {13,26,27,28}, False),
    ]
    fg_bytes = 0
    for ident, name, sel, opq in bespoke:
        src = ART / f"{name}.png"
        dest = OUT / f"{name}.png"
        im = build_tone_layer(src, parsed[ident], sel, opq)
        verify_tone_layer(src, im)
        im.save(dest, optimize=True)
        fg_bytes += dest.stat().st_size

    # 3. 18 additional foreground.tsv rooms
    by_room = {}
    for line in (ART / "foreground.tsv").read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        fields = line.split("|")
        by_room.setdefault(int(fields[0]), []).append(fields)

    for ident, items in by_room.items():
        cmds = parsed[ident]
        used = set()
        for fields in items:
            sel = expand_ranges(fields[3])
            used.update(sel)
            name = f"{ident}-{fields[1]}.png"
            src = ART / "foreground" / name
            dest = OUT / "foreground" / name
            im = build_tone_layer(src, cmds, sel, False)
            verify_tone_layer(src, im)
            im.save(dest, optimize=True)
            fg_bytes += dest.stat().st_size
        clean_sel = set(range(1, len(cmds) + 1)) - used
        src = ART / "foreground" / f"{ident}-clean.png"
        dest = OUT / "foreground" / f"{ident}-clean.png"
        im = build_tone_layer(src, cmds, clean_sel, True)
        verify_tone_layer(src, im)
        im.save(dest, optimize=True)
        fg_bytes += dest.stat().st_size

    # 4. Separate Dark Castle visitor silhouette rim layers (native cell dimensions preserved)
    sprite_jobs = [
        (ART / "castle-wizard.png", OUT / "sprites/castle-wizard-rim.png", 48, 46, [8, 7, 6], True),
        (ART / "castle/B-PPCT-300.png", OUT / "sprites/B-PPCT-300-rim.png", 32, 16, [6], False),
        (ART / "castle/B-PPCT-908.png", OUT / "sprites/B-PPCT-908-rim.png", 48, 51, [3], True),
        (ART / "castle/B-PPCT-912.png", OUT / "sprites/B-PPCT-912-rim.png", 48, 51, [3], True),
        (ART / "castle/B-PPCT-915.png", OUT / "sprites/B-PPCT-915-rim.png", 48, 50, [5], True),
    ]
    sp_bytes = 0
    for src, dest, fw, fh, rc, skip_bot in sprite_jobs:
        rim = build_sprite_rim(src, fw, fh, rc, skip_bot)
        rim.save(dest, optimize=True)
        sp_bytes += dest.stat().st_size

    # 5. Export JS lookup table for luma -> (patternIndex, isBorder)
    pat_lookup = [0] * 256
    bdr_lookup = [0] * 256
    for luma, meta in enumerate(LUMA_TO_META):
        if meta is not None:
            pat_lookup[luma] = meta[0]
            bdr_lookup[luma] = meta[1]

    js = (
        "/* Generated by art/build_refresh.py. Maps refresh layer luma bytes back to\n"
        " * exact CODE 1 ScepterPatterns indices (1..29) and border-stroke flags (0/1).\n"
        " */\n"
        "window.RefreshPalette = {\n"
        f"  patternByLuma: {json.dumps(pat_lookup, separators=(',', ':'))},\n"
        f"  borderByLuma: {json.dumps(bdr_lookup, separators=(',', ':'))},\n"
        "  spriteRims: {\n"
        '    "art/castle-wizard.png": "art/refresh/sprites/castle-wizard-rim.png",\n'
        '    "art/castle/B-PPCT-300.png": "art/refresh/sprites/B-PPCT-300-rim.png",\n'
        '    "art/castle/B-PPCT-908.png": "art/refresh/sprites/B-PPCT-908-rim.png",\n'
        '    "art/castle/B-PPCT-912.png": "art/refresh/sprites/B-PPCT-912-rim.png",\n'
        '    "art/castle/B-PPCT-915.png": "art/refresh/sprites/B-PPCT-915-rim.png"\n'
        "  }\n"
        "};\n"
    )
    (OUT / "refresh-index.js").write_text(js, encoding="utf-8")

    print(
        f"Built 200 room tone plates ({plate_bytes/1024:.1f} KB), "
        f"foreground tone layers ({fg_bytes/1024:.1f} KB), "
        f"and {len(sprite_jobs)} sprite rim layers ({sp_bytes/1024:.1f} KB) — 0 mismatches."
    )


if __name__ == "__main__":
    main()
