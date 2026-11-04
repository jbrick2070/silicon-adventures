"""Extract original FONT bitmaps and metrics. No game execution or audio.

Uses Pillow and macresources. All paths written are below this script's directory.
"""
import json
import struct
from pathlib import Path

from PIL import Image, ImageDraw
from macresources import parse_file

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
SOURCES = [
    ("score-font", ROOT / "archive/dc/Data A.rsrc", 25737, "Score Font", 9,
     "Data A FOND 201 association entry at resource offset $34 identifies FONT 25737, size 9"),
    ("dialog-font", ROOT / "archive/dc/Data A.rsrc", 29452, "DC Dialog Font", 12,
     "Data A FOND 230 association entry at resource offset $34 identifies FONT 29452, size 12"),
    ("scepters-font", ROOT / "archive/es/Scepters.rsrc", 394, None, None,
     "INFERRED: no FOND in this fork; paper.py uses family*128+size, so 394 suggests family 3 and size 10"),
]


def extract(name, source, resource_id, family, size, family_evidence):
    matches = [r for r in parse_file(source.read_bytes()) if r.type == b"FONT" and r.id == resource_id]
    assert len(matches) == 1
    data = bytes(matches[0])
    header = struct.unpack_from(">13h", data)
    _, first, last, _, kern, _, _, height, ow, ascent, descent, leading, row_words = header
    bitmap_end = 26 + height * row_words * 2
    locations = struct.unpack_from(">" + "H" * (last - first + 3), data, bitmap_end)
    widths_start = 16 + 2 * ow
    assert widths_start + 2 * (last - first + 2) <= len(data)
    glyphs = {}
    cursor = 0
    present = []
    for code in range(first, last + 1):
        ix = code - first
        pair = data[widths_start + 2 * ix:widths_start + 2 * ix + 2]
        if pair == b"\xff\xff":
            continue
        left, right = locations[ix:ix + 2]
        assert 0 <= left <= right <= row_words * 16
        width = right - left
        # Strike.draw combines the signed global kern with the byte side bearing.
        side, advance = pair
        glyphs[str(code)] = {"x": cursor, "width": width, "offset": kern + side, "advance": advance}
        present.append((code, left, width, cursor))
        cursor += width
    strip = Image.new("RGBA", (max(cursor, 1), height), (0, 0, 0, 0))
    for code, left, width, x in present:
        for yy in range(height):
            for xx in range(width):
                bit = left + xx
                value = data[26 + yy * row_words * 2 + bit // 8]
                if value & (0x80 >> (bit % 8)):
                    strip.putpixel((x + xx, yy), (0, 0, 0, 255))
    strip.save(OUT / (name + ".png"))
    meta = {
        "resource": {"fork": source.name, "type": "FONT", "id": resource_id},
        "family": family, "size": size, "ascent": ascent, "descent": descent,
        "leading": leading, "glyphs": glyphs,
        "confidence": {"resource_and_metrics": "PROVEN", "family": "PROVEN" if family else None,
                       "size": "PROVEN" if size is not None else None},
        "evidence": {"header": "FONT resource offsets $00-$19, big-endian FontRec",
                     "bitmaps": f"FONT resource $1a-${bitmap_end-1:x}",
                     "locations": f"FONT resource ${bitmap_end:x}",
                     "offset_width_table": f"FONT resource ${widths_start:x}",
                     "family_and_size": family_evidence},
        "notes": "PROVEN: glyph keys are Mac Roman character codes whose offset/width entry is not $ffff. Offset includes the FontRec global kern, matching paper.py Strike.draw. A zero-width glyph can still have an advance. "
                 + ("Family and size are null because the Scepters fork contains no FOND association. INFERRED from the reader's ID convention: family 3 and size 10." if family is None else ""),
        "character_codes": [c for c, _, _, _ in present],
        "characters_mac_roman": "".join(bytes([c]).decode("mac_roman") for c, _, _, _ in present),
    }
    (OUT / (name + ".json")).write_text(json.dumps(meta, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")
    return strip, meta


def draw_text(canvas, font, meta, x, top, text):
    start = x
    for code in text.encode("mac_roman"):
        g = meta["glyphs"].get(str(code))
        assert g is not None, (code, text)
        if g["width"]:
            piece = font.crop((g["x"], 0, g["x"] + g["width"], font.height))
            canvas.alpha_composite(piece, (x + g["offset"], top))
        x += g["advance"]
    return x - start


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    results = [extract(*item) for item in SOURCES]
    # 1x glyphs and metrics; white paper makes the transparent images readable.
    specimen = Image.new("RGBA", (510, 134), (0, 0, 0, 0))
    draw = ImageDraw.Draw(specimen)
    dialog, dm = results[1]
    for row, ((strip, meta), label) in enumerate(zip(results, ("SCORE FONT", "DC DIALOG FONT", "SCEPTERS FONT"))):
        y = 4 + row * 42
        draw.rectangle((3, y, 506, y + 37), fill=(255, 255, 255, 255))
        draw_text(specimen, dialog, dm, 8, y + 1, label)
        draw_text(specimen, strip, meta, 8, y + 19, "0123456789")
        phrase = "SCORE BONUS ROCKS LIVES ELIXIR"
        if all(str(c) in meta["glyphs"] for c in phrase.encode("mac_roman")):
            draw_text(specimen, strip, meta, 100, y + 19, phrase)
    specimen.save(OUT / "specimen.png")
    for p in OUT.glob("*.png"):
        colours = set(Image.open(p).convert("RGBA").getdata())
        assert colours <= {(0,0,0,0), (0,0,0,255), (255,255,255,255)}, (p, colours)
        print(p.name, Image.open(p).size, sorted(colours))
    for name, (_, meta) in zip((s[0] for s in SOURCES), results):
        print(name, "glyph codes", meta["character_codes"])


if __name__ == "__main__":
    main()
