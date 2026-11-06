"""Cuts the public demo video. Usage: make_demo.py <capture folder>. Writes archive/demo-video/demo.mp4."""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
ROOT = Path(__file__).resolve().parents[2]; CAP = Path(sys.argv[1]); OUT = Path(__file__).parent / "demo.mp4"; SIL = OUT.with_suffix(".silent.mp4")
W, H, FPS = 1280, 720, 30
FONTS = json.loads(subprocess.run(["node", "-e", "global.window={};require('./archive/dc/castle-data.js');console.log(JSON.stringify(window.CASTLE_DATA.fonts))"], cwd=ROOT, capture_output=True, text=True, check=True).stdout)
STRIP = {n: Image.open(ROOT / m["path"]).convert("RGBA").getchannel("A") for n, m in FONTS.items()}
PAPER, GOLD, INK = (236, 226, 204), (232, 188, 110), (9, 9, 12)
ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "19", "-pix_fmt", "yuv420p", str(SIL)], stdin=subprocess.PIPE)
total = [0]
def width(n, t, k): return sum(FONTS[n]["glyphs"].get(str(ord(c)), [0, 0, 0, 6])[3] for c in t) * k
def write(page, n, t, x, y, k, colour):
    m = FONTS[n]; pen = x - width(n, t, k) // 2
    for ch in t:
        g = m["glyphs"].get(str(ord(ch)))
        if g and g[1]:
            cell = STRIP[n].crop((g[0], 0, g[0] + g[1], m["ascent"] + m["descent"])); cell = cell.resize((cell.width * k, cell.height * k), Image.NEAREST)
            page.paste(colour, (pen + g[2] * k, y - m["ascent"] * k), cell)
        pen += (g[3] if g else 6) * k
def emit(frames, fade=7):
    frames = list(frames); n = len(frames)
    for i, f in enumerate(frames):
        k = min(1, (i + 1) / fade, (n - i) / fade) if fade else 1
        a = f if k >= 1 else Image.fromarray((np.asarray(f).astype(float) * k).astype(np.uint8))
        ff.stdin.write(a.tobytes()); total[0] += 1
def card(lines, seconds):
    c = Image.new("RGB", (W, H), INK); y = 330 - 42 * (len(lines) - 1)
    for font, text, k, colour in lines: write(c, font, text, W // 2, y, k, colour); y += 96 if k > 4 else 62
    emit([c] * int(seconds * FPS), 12)
def fit(im):
    """Square-ish room over a soft blurred copy of itself, so the frame stays full."""
    bg = im.resize((W, int(W * im.height / im.width)), Image.BILINEAR).crop((0, 80, W, 80 + H)).filter(ImageFilter.GaussianBlur(26))
    bg = Image.fromarray((np.asarray(bg).astype(float) * .42).astype(np.uint8)); w = int(H * im.width / im.height)
    bg.paste(im.resize((w, H), Image.LANCZOS), ((W - w) // 2, 0)); return bg
def caption(f, text):
    w = width("dialog", text, 2) + 36; f = f.copy(); d = ImageDraw.Draw(f); x0 = (W - w) // 2
    d.rectangle((x0, 648, x0 + w, 694), fill=INK, outline=PAPER, width=2); write(f, "dialog", text, W // 2, 681, 2, PAPER); return f
def wipe(old, new, text):
    oldf, newf = old, new; out = []
    line = lambda f, x: (ImageDraw.Draw(f).line((x, 0, x, H), fill=GOLD, width=3), f)[1]
    out += [caption(oldf, "1986")] * 20
    for i in range(38):
        t = i / 37; e = t * t * (3 - 2 * t); x = int(W * (1 - e)); f = oldf.copy(); f.paste(newf.crop((x, 0, W, H)), (x, 0)); out.append(line(f, x))
    out += [caption(newf, text)] * 32
    emit(out, 5)
def plate(name, folder="archive/es/plates"):
    p = Image.open(ROOT / folder / name).convert("RGBA"); b = Image.new("RGBA", p.size, (255, 255, 255, 255)); b.alpha_composite(p); return b.convert("RGB")
def room_wipe(i, text):
    wipe(fit(plate(f"ASCN-{i}.png").resize((338 * 4, 314 * 4), Image.NEAREST)), fit(Image.open(ROOT / f"art/es-3d/4x/ASCN-{i}.png").convert("RGB")), text)
def seq(name, a=0, b=None, repeat=1, form=None, text=None):
    fs = sorted((CAP / name).glob("f*"))[a:b]; out = []
    for f in fs:
        im = Image.open(f).convert("RGB"); im = form(im) if form else im
        if text: im = caption(im, text)
        out += [im] * repeat
    emit(out, 5)
def letter(im):
    c = Image.new("RGB", (W, H), (0, 0, 0)); w = int(H * im.width / im.height); c.paste(im.resize((w, H), Image.LANCZOS), ((W - w) // 2, 0)); return c
def atlas(path, fw, fh, per, count, repeat):
    im = Image.open(path).convert("RGBA"); out = []
    for i in range(count):
        c = Image.new("RGB", (fw, fh), INK); f = im.crop((i % per * fw, i // per * fh, (i % per + 1) * fw, (i // per + 1) * fh)); c.paste(f, (0, 0), f); out += [letter(c)] * repeat
    emit(out, 7)
def spins():
    ims = [Image.open(ROOT / f"art/es-3d/scepters/spin-{n}.png").convert("RGBA") for n in ("earth", "fire", "air", "water")]; out = []
    for i in range(48):
        c = Image.new("RGB", (W, H), INK)
        for j, im in enumerate(ims):
            f = (i + j * 5) % 24; a = im.crop((f % 6 * 256, f // 6 * 256, (f % 6 + 1) * 256, (f // 6 + 1) * 256)).resize((320, 320), Image.LANCZOS); c.paste(a, (j * 310 + 30, 150), a)
        write(c, "dialog", "Four scepters to find, in real 3D", W // 2, 590, 3, PAPER); out += [c] * 2
    emit(out, 8)
card([("scepters", "Enchanted Scepters", 6, PAPER), ("dialog", "The 1986 Macintosh adventure, remastered", 3, GOLD)], 3)
room_wipe(14057, "Now"); room_wipe(3099, "Now"); room_wipe(17888, "Now")
for name in ("w-marsh", "w-shark", "w-demon", "w-queen", "w-ship"): seq(name, 0, 52, 2, fit)
seq("beacon", 0, 100, 2, lambda im: fit(im), "A bonus flight at the watchtower")
card([("scepters", "The Enchanted Castle", 6, PAPER), ("dialog", "A new action game built from the Dark Castle disk", 3, GOLD)], 3)
old = Image.new("RGB", (W, H), (0, 0, 0)); o = plate("B-PSCR-4020.png", "art/castle"); nw = Image.open(ROOT / "art/castle-3d/4x/B-PSCR-4020.png").convert("RGB"); wipe(letter(o.resize((1024, 684), Image.NEAREST)), letter(nw), "Now")
seq("c-hall", 0, 45, 2, letter); seq("c-mutant", 10, 56, 2, letter); seq("c-dragon", 0, 59, 2, letter); seq("c-wizard", 0, 46, 2, letter); seq("c-river", 0, 17, 2, letter); seq("c-river", 26, 59, 2, letter)
atlas(ROOT / "art/castle-3d/finale-knight.png", 640, 428, 8, 48, 2)
spins()
card([("scepters", "Enchanted Scepters", 6, PAPER), ("dialog", "Play it free in your browser", 3, GOLD), ("dialog", "jbrick2070.github.io/silicon-adventures", 3, PAPER)], 5)
ff.stdin.close(); ff.wait(); dur = total[0] / FPS; print(round(dur, 1))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(SIL), "-i", str(ROOT / "audio/music/heros-quest.wav"), "-filter_complex", f"[1:a]volume=.9,afade=t=out:st={dur - 3}:d=3[a]", "-map", "0:v", "-map", "[a]", "-t", str(dur), "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(OUT)], check=True)
SIL.unlink()
