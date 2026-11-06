"""Draw art/castle-flowchart.png, the spoiler map of The Enchanted Castle.

    python archive/dc/tools/build_flowchart.py <folder of room-<id>.png game shots>

The lettering is the disks' own bitmap fonts and wing titles. The rooms are shots
of the running game, so rebuild this after the art changes. Links and dangers
match the exits and rooms in archive/dc/castle-data.js and game/castle-plan.js.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[3]
SHOTS = Path(sys.argv[1])
GOLD, PAPER, RED, DIM, INK = (232, 178, 92), (236, 226, 204), (226, 78, 58), (166, 158, 146), (10, 10, 13)
COLUMN, GAP, MARGIN, SHOT_W, SHOT_H = 420, 28, 40, 396, 238
ROW = SHOT_H + 168
WIDTH = MARGIN * 2 + COLUMN * 4 + GAP * 3
HALL_TOP, WINGS_TOP = 186, 676
HEIGHT = WINGS_TOP + 74 + ROW * 4 + 24

fonts_js = "global.window={};require('./archive/dc/castle-data.js');console.log(JSON.stringify(window.CASTLE_DATA.fonts))"
FONTS = json.loads(subprocess.run(["node", "-e", fonts_js], cwd=ROOT, capture_output=True, text=True, check=True).stdout)
STRIPS = {name: Image.open(ROOT / meta["path"]).convert("RGBA").getchannel("A") for name, meta in FONTS.items()}


def text_width(name, text, scale):
    glyphs = FONTS[name]["glyphs"]
    return sum(glyphs.get(str(ord(c)), [0, 0, 0, 6])[3] for c in text) * scale


def write(page, name, text, x, y, scale=1, colour=PAPER, align="left"):
    """Draws disk-font text with y as the baseline, doubling pixels the way the game does."""
    meta = FONTS[name]
    pen = x - (text_width(name, text, scale) // (2 if align == "center" else 1) if align != "left" else 0)
    for ch in text:
        g = meta["glyphs"].get(str(ord(ch)))
        if g and g[1]:
            cell = STRIPS[name].crop((g[0], 0, g[0] + g[1], meta["ascent"] + meta["descent"]))
            cell = cell.resize((cell.width * scale, cell.height * scale), Image.NEAREST)
            page.paste(colour, (pen + g[2] * scale, y - meta["ascent"] * scale), cell)
        pen += (g[3] if g else 6) * scale


def wrap(name, text, scale, width):
    lines, line = [], ""
    for word in text.split():
        trial = (line + " " + word).strip()
        if text_width(name, trial, scale) > width and line:
            lines.append(line); line = word
        else:
            line = trial
    return lines + [line]


def frame(page, box, border=PAPER, fill=INK):
    """The double rule of the game's status bar."""
    d = ImageDraw.Draw(page)
    x0, y0, x1, y1 = box
    d.rectangle(box, fill=fill, outline=border, width=2)
    d.rectangle((x0 + 5, y0 + 5, x1 - 5, y1 - 5), outline=border, width=1)


def stone():
    """Dark castle stone from the painted room floor, with a vignette."""
    src = Image.open(ROOT / "art/castle-3d/4x/B-PSCR-3020.png").convert("RGB").crop((0, 1248, 2048, 1364))
    page = Image.new("RGB", (WIDTH, HEIGHT))
    for row, y in enumerate(range(0, HEIGHT, src.height)):
        page.paste(src, (-(row % 2) * 240, y))
        page.paste(src, (2048 - (row % 2) * 240, y))
    a = np.array(page).astype(float) * .42
    yy, xx = np.mgrid[0:HEIGHT, 0:WIDTH]
    fall = 1 - .5 * np.clip(np.hypot((xx - WIDTH / 2) / WIDTH, (yy - HEIGHT / 3) / HEIGHT) * 1.5, 0, 1)
    return Image.fromarray((a * fall[..., None]).astype(np.uint8))


def arrow(page, x0, y0, x1, y1, colour=GOLD, both=False, width=6):
    d = ImageDraw.Draw(page)
    d.line((x0, y0, x1, y1), fill=colour, width=width)
    def head(x, y, dx, dy):
        s = 13
        d.polygon([(x + dx * s, y + dy * s), (x - dy * s - dx * s, y + dx * s - dy * s), (x + dy * s - dx * s, y - dx * s - dy * s)], fill=colour)
    length = max(1, abs(x1 - x0) + abs(y1 - y0))
    dx, dy = (x1 - x0) / length, (y1 - y0) / length
    head(x1, y1, dx, dy)
    if both:
        head(x0, y0, -dx, -dy)


def chip(page, x, y, label, colour):
    w = text_width("dialog", label, 2) + 20
    d = ImageDraw.Draw(page)
    d.rectangle((x, y, x + w, y + 32), fill=INK, outline=colour, width=2)
    write(page, "dialog", label, x + 10, y + 25, 2, colour)
    return w


def scepter(page, cx, y, plate, name):
    """The scepter's own plate, or its name alone when the plate does not fit."""
    w = text_width("dialog", name, 2) + 36
    frame(page, (cx - w // 2, y, cx + w // 2, y + 46), GOLD)
    write(page, "dialog", name, cx, y + 32, 2, GOLD, "center")


def room(page, col, row, rid, title, note, pit=False, water=False, border=PAPER, prize=None):
    x = MARGIN + col * (COLUMN + GAP)
    y = WINGS_TOP + 74 + row * ROW
    frame(page, (x, y, x + COLUMN - 1, y + ROW - 48), border)
    shot = Image.open(SHOTS / f"room-{rid}.png").convert("RGB")
    shot = shot.crop((0, 0, shot.width, round(shot.height * .905))).resize((SHOT_W, SHOT_H), Image.LANCZOS)
    page.paste(shot, (x + 12, y + 12))
    write(page, "dialog", title, x + 16, y + SHOT_H + 38, 2, GOLD)
    px = x + COLUMN - 14
    if water:
        w = text_width("dialog", "Water", 2) + 20; chip(page, px - w, y + SHOT_H + 16, "Water", (112, 176, 226)); px -= w + 6
    if pit:
        w = text_width("dialog", "Pit", 2) + 20; chip(page, px - w, y + SHOT_H + 16, "Pit", RED)
    lines = wrap("dialog", note, 2, COLUMN - 32)
    assert len(lines) <= 2, note
    for i, line in enumerate(lines):
        write(page, "dialog", line, x + 16, y + SHOT_H + 70 + i * 30, 2, PAPER)
    if prize:
        scepter(page, x + COLUMN // 2, y + ROW - 50, None, prize)
    return x, y


def rid_has_prize(wing, r):
    return wing[r][0] in {1020, 2030, 3030, 4020}


def build():
    page = stone()
    write(page, "scepters", "The Enchanted Castle", WIDTH // 2, 86, 5, PAPER, "center")
    write(page, "dialog", "SPOILERS: the whole castle, room by room", WIDTH // 2, 132, 2, RED, "center")

    # Great Hall.
    hw, hh = 512, 342
    hx, hy = (WIDTH - hw) // 2, HALL_TOP
    frame(page, (hx - 14, hy - 14, hx + hw + 13, hy + hh + 48), GOLD)
    hall = np.array(Image.open(ROOT / "archive/dc/paper/Data-A-PICT-10000.png").convert("L")).astype(float) / 255
    tone = np.array([28, 22, 26]) * (1 - hall[..., None]) + np.array([232, 196, 136]) * hall[..., None]
    page.paste(Image.fromarray(tone.astype(np.uint8)), (hx, hy))
    write(page, "dialog", "The Great Hall: choose a door", hx + hw // 2, hy + hh + 26, 2, GOLD, "center")

    # What Duncan carries in, and how the run ends.
    left = (MARGIN, HALL_TOP, MARGIN + COLUMN + 40, HALL_TOP + 424)
    frame(page, left)
    write(page, "dialog", "How it works", left[0] + 22, left[1] + 40, 2, GOLD)
    rules = ["Bring out four scepters.", "5 lives, 60 rocks, no Elixir.", "Lose a life: the room restarts.", "Lose them all: game over.", "Bags give 10 rocks, up to 80.", "Rooms link both ways.", "Water drowns you.", "A Pit costs no life, but it", "drops you in the Dungeon."]
    for i, line in enumerate(rules):
        write(page, "dialog", line, left[0] + 22, left[1] + 80 + i * 38, 2, PAPER)
    right = (WIDTH - MARGIN - COLUMN - 40, HALL_TOP, WIDTH - MARGIN, HALL_TOP + 424)
    frame(page, right)
    write(page, "dialog", "Your four prizes", right[0] + 22, right[1] + 40, 2, GOLD)
    prizes = [("Earth Scepter", "Deep in the Dungeon."), ("Fire Scepter", "Rocks become fireballs."), ("Air Scepter", "You gain the shield."), ("Water Scepter", "Appears when the Knight falls.")]
    for i, (name, line) in enumerate(prizes):
        write(page, "dialog", name, right[0] + 22, right[1] + 88 + i * 84, 2, GOLD)
        write(page, "dialog", line, right[0] + 22, right[1] + 118 + i * 84, 2, PAPER)

    # Wing headers, fed from the hall.
    bus = WINGS_TOP - 66
    tops = [MARGIN + c * (COLUMN + GAP) + COLUMN // 2 for c in range(4)]
    ImageDraw.Draw(page).line((tops[0], bus, tops[3], bus), fill=GOLD, width=6)
    arrow(page, WIDTH // 2, hy + hh + 48, WIDTH // 2, bus)
    titles = [("B", 16201, "Door 1"), ("B", 16202, "Door 2"), ("B", 16204, "Door 3"), ("B", 16203, "Last door")]
    for c, (fork, pict, _) in enumerate(titles):
        cx = tops[c]
        arrow(page, cx, bus, cx, WINGS_TOP - 10)
        frame(page, (cx - 196, WINGS_TOP, cx + 196, WINGS_TOP + 52))
        art = Image.open(ROOT / f"archive/dc/paper/Data-{fork}-PICT-{pict}.png").convert("L")
        art = art.resize((art.width * 2 if art.height < 22 else art.width * 3 // 2, art.height * 2 if art.height < 22 else art.height * 3 // 2), Image.NEAREST)
        page.paste(art, (cx - art.width // 2, WINGS_TOP + 26 - art.height // 2))
    label = "Needs three scepters"
    w = text_width("dialog", label, 2) + 28
    ImageDraw.Draw(page).rectangle((tops[3] - w // 2, WINGS_TOP - 50, tops[3] + w // 2, WINGS_TOP - 14), fill=INK, outline=RED, width=2)
    write(page, "dialog", label, tops[3], WINGS_TOP - 22, 2, RED, "center")

    wings = [
        [(1000, "Trouble 1", "Bats, rats and three ropes."),
         (1010, "Trouble 2", "Swinging ropes and bats."),
         (1020, "Trouble 3: the Dungeon", "Whip guard, bag, Elixir, flail. Every Pit lands here.")],
        [(2000, "Fireball 1", "Mutant, vulture, three ropes."),
         (2010, "Fireball 2", "Moving platforms, falling drips."),
         (2020, "Fireball 3", "Ride logs past boulders and a mutant."),
         (2030, "Fireball 4", "Pull the gates in order. Wizard, eyes, broom.")],
        [(3000, "Shield 1", "Henchman and mutants."),
         (3010, "Shield 2", "Dragon, hatch, falling weight, vulture."),
         (3020, "Shield 3", "Rope after rope, with climbing rats."),
         (3030, "Shield 4", "Twenty ledges, only some real. A storm.")],
        [(4000, "Black Knight 1", "Gargoyle, rope rats, portcullis."),
         (4010, "Black Knight 2", "Gargoyle, platforms, henchman."),
         (4020, "Black Knight 3", "Levers, then rock the throne until the Knight falls.")],
    ]
    pits = {2020, 2030, 3000, 3010, 3020, 4000, 4010, 4020}
    water = {2010, 2020}
    prize = {1020: "Earth Scepter", 2030: "Fire Scepter", 3030: "Air Scepter", 4020: "Water Scepter"}
    for c, wing in enumerate(wings):
        for r, (rid, title, note) in enumerate(wing):
            room(page, c, r, rid, title, note, pit=rid in pits, water=rid in water, border=RED if rid == 1020 else GOLD if rid in prize else PAPER, prize=prize.get(rid))
            base = WINGS_TOP + 74 + r * ROW
            if r:
                arrow(page, tops[c], base - 22 if rid_has_prize(wing, r - 1) else base - 44, tops[c], base + 2, both=True)
        arrow(page, tops[c], WINGS_TOP + 52, tops[c], WINGS_TOP + 72)

    # The two spare slots: back to the hall, and the ending.
    trouble_y = WINGS_TOP + 74 + 3 * ROW
    frame(page, (MARGIN, trouble_y + 4, MARGIN + COLUMN - 1, trouble_y + ROW - 48), GOLD)
    write(page, "dialog", "Back to the Great Hall", tops[0], trouble_y + 120, 2, GOLD, "center")
    for i, line in enumerate(["Every scepter sends you", "back here, and that door", "stays shut after it. After", "three, the last door opens."]):
        write(page, "dialog", line, tops[0], trouble_y + 174 + i * 32, 2, PAPER, "center")

    frame(page, (tops[3] - COLUMN // 2, trouble_y + 4, tops[3] + COLUMN // 2 - 1, trouble_y + ROW - 48), GOLD)
    knight = Image.open(ROOT / "art/castle-3d/4x/B-PPCT-914.png").convert("RGBA")
    page.paste(knight, (tops[3] - knight.width // 2 - 84, trouble_y + 24), knight)
    write(page, "dialog", "You win", tops[3] + 110, trouble_y + 170, 3, GOLD, "center")
    write(page, "dialog", "All four scepters", tops[3] + 110, trouble_y + 212, 2, PAPER, "center")
    write(page, "dialog", "are yours.", tops[3] + 110, trouble_y + 242, 2, PAPER, "center")
    return page


out = ROOT / "art/castle-flowchart.png"
build().save(out, optimize=True)
print(out, out.stat().st_size // 1024, "KB")
