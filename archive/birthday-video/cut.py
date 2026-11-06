"""Cuts the birthday reel. Usage: cut.py <capture folder> <work folder>. Writes archive/birthday-video/reel.mp4."""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[2]; V = Path(__file__).parent; CAP, W = Path(sys.argv[1]), Path(sys.argv[2]); W.mkdir(exist_ok=True)
FONTS = json.loads(subprocess.run(["node", "-e", "global.window={};require('./archive/dc/castle-data.js');console.log(JSON.stringify(window.CASTLE_DATA.fonts))"], cwd=ROOT, capture_output=True, text=True, check=True).stdout)
STRIP = {n: Image.open(ROOT / m["path"]).convert("RGBA").getchannel("A") for n, m in FONTS.items()}
PAPER, GOLD = (236, 226, 204), (232, 178, 92)
def width(name, text, k): return sum(FONTS[name]["glyphs"].get(str(ord(c)), [0, 0, 0, 6])[3] for c in text) * k
def write(page, name, text, x, y, k, colour):
    m = FONTS[name]; pen = x - width(name, text, k) // 2
    for ch in text:
        g = m["glyphs"].get(str(ord(ch)))
        if g and g[1]:
            cell = STRIP[name].crop((g[0], 0, g[0] + g[1], m["ascent"] + m["descent"])); cell = cell.resize((cell.width * k, cell.height * k), Image.NEAREST)
            page.paste(colour + (255,), (pen + g[2] * k, y - m["ascent"] * k), cell)
        pen += (g[3] if g else 6) * k
def caption(file, text):
    c = Image.new("RGBA", (1280, 720), (0, 0, 0, 0)); w = width("dialog", text, 3) + 44; d = ImageDraw.Draw(c)
    d.rectangle((640 - w // 2, 618, 640 + w // 2, 682), fill=(10, 10, 13, 215), outline=PAPER + (255,), width=2); write(c, "dialog", text, 640, 662, 3, PAPER); c.save(W / file)
def error_box():
    c = Image.new("RGBA", (1280, 720), (0, 0, 0, 0)); d = ImageDraw.Draw(c)
    d.rectangle((300, 480, 980, 660), fill=(245, 245, 245, 255), outline=(0, 0, 0, 255), width=6); d.rectangle((312, 492, 968, 648), outline=(0, 0, 0, 255), width=2)
    d.ellipse((340, 530, 420, 610), fill=(0, 0, 0, 255)); d.line((395, 535, 425, 505), fill=(0, 0, 0, 255), width=6); d.ellipse((418, 492, 440, 514), fill=(235, 190, 60, 255))
    write(c, "dialog", "Set clock to 1986 failed.", 700, 585, 3, (0, 0, 0)); c.save(W / "error.png")
def sign():
    c = Image.new("RGBA", (1280, 720), (0, 0, 0, 0)); d = ImageDraw.Draw(c); d.rectangle((250, 30, 1030, 160), fill=(14, 12, 34, 235), outline=(255, 90, 170, 255), width=5)
    write(c, "scepters", "Enchanted Scepters", 640, 88, 4, (120, 230, 255)); write(c, "dialog", "now in real 3D", 640, 138, 3, (255, 150, 200)); c.save(W / "sign.png")
def card(file, lines):
    c = Image.new("RGB", (1280, 720), (8, 8, 10)); y = 340 - 44 * (len(lines) - 1)
    for font, text, k, colour in lines: write(c, font, text, 640, y, k, colour); y += 90
    c.save(W / file)
def ff(*a): subprocess.run(["ffmpeg", "-v", "error", "-y", *a], check=True)
GRADE = "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,colorbalance=rm=-.07:gm=.01:bm=.05:rh=-.05:bh=.03,fps=30,format=yuv420p"
def clip(n, seconds, out, overlay=None):
    a = ["-i", str(V / f"clips/shot-{n}.mp4")]
    if overlay:
        a += ["-i", str(W / overlay)]; f = f"[0:v]{GRADE}[v];[v][1:v]overlay,format=yuv420p[o]"; m = "[o]"
    else: f = f"[0:v]{GRADE}[o]"; m = "[o]"
    ff(*a, "-filter_complex", f, "-map", m, "-map", "0:a?", "-t", str(seconds), "-c:v", "libx264", "-crf", "18", "-c:a", "aac", "-ar", "48000", "-ac", "2", str(W / out))
def still(src, seconds, out):
    ff("-loop", "1", "-i", str(W / src), "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-vf", f"fade=t=in:s=0:n=12,fade=t=out:s={int(seconds * 30 - 15)}:n=15,format=yuv420p", "-t", str(seconds), "-r", "30", "-c:v", "libx264", "-crf", "18", "-c:a", "aac", "-shortest", str(W / out))
def frames(name, seconds, out):
    ff("-framerate", "24", "-i", str(CAP / name / "f%04d.jpg"), "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-vf", "scale=-2:720:flags=lanczos,pad=1280:720:(ow-iw)/2:0,fps=30,format=yuv420p", "-t", str(seconds), "-c:v", "libx264", "-crf", "18", "-c:a", "aac", "-shortest", str(W / out))
def atlas(path, fw, fh, per, count, seconds, out, bg=(8, 8, 10)):
    d = W / ("a_" + out); d.mkdir(exist_ok=True); im = Image.open(path).convert("RGBA")
    for i in range(count):
        c = Image.new("RGB", (fw, fh), bg); f = im.crop((i % per * fw, i // per * fh, (i % per + 1) * fw, (i // per + 1) * fh)); c.paste(f, (0, 0), f); c.save(d / f"f{i:04d}.png")
    ff("-framerate", str(count / seconds), "-i", str(d / "f%04d.png"), "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-vf", "scale=1280:720:force_original_aspect_ratio=decrease:flags=lanczos,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x08080a,fps=30,format=yuv420p", "-t", str(seconds), "-c:v", "libx264", "-crf", "18", "-c:a", "aac", "-shortest", str(W / out))
def dither(out):
    d = W / "s7"; d.mkdir(exist_ok=True); ff("-i", str(V / "clips/shot-7.mp4"), "-vf", "scale=1280:720,fps=30", "-t", "5", str(d / "f%04d.png"))
    B = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16; fs = sorted(d.glob("f*.png")); yy, xx = np.mgrid[0:720, 0:1280]; T = np.tile(B, (181, 321))[:720, :1280]
    for i, f in enumerate(fs):
        a = np.array(Image.open(f).convert("RGB")).astype(float); g = np.array(Image.fromarray(a.astype(np.uint8)).convert("L").resize((320, 180), Image.BILINEAR).resize((1280, 720), Image.NEAREST)).astype(float) / 255
        bw = ((g > np.tile(np.kron(B, np.ones((4, 4))), (46, 81))[:720, :1280]) * 255.0)[..., None]; t = i / len(fs); edge = 1280 * (1.25 - 1.6 * t)
        m = np.clip((xx - edge) / 80, 0, 1)[..., None]; Image.fromarray((a * (1 - m) + bw * m).astype(np.uint8)).save(f)
    ff("-framerate", "30", "-i", str(d / "f%04d.png"), "-i", str(V / "clips/shot-7.mp4"), "-map", "0:v", "-map", "1:a?", "-vf", "format=yuv420p", "-t", "5", "-c:v", "libx264", "-crf", "18", "-c:a", "aac", "-ar", "48000", "-ac", "2", str(W / out))
caption("c1.png", "We go back to 1986, to the night it was all made."); caption("c2.png", "Is this safe?"); caption("c3.png", "Perfectly."); caption("c6.png", "What year is this?"); caption("c7.png", "Oh dear. We are inside it.")
error_box(); sign()
parts = []
clip(1, 5, "p1.mp4", "c1.png"); clip(2, 4, "p2.mp4", "c2.png"); clip(3, 3.5, "p3.mp4", "c3.png"); clip(4, 4.5, "p4.mp4", "error.png"); clip(5, 3.5, "p5.mp4")
ov = Image.open(W / "sign.png"); o2 = Image.open(W / "c6.png"); ov.alpha_composite(o2); ov.save(W / "s6.png"); clip(6, 4.5, "p6.mp4", "s6.png")
dither("p7.mp4"); clip(8, 4.5, "p8.mp4")
seq = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"]
atlas(ROOT / "art/castle-3d/finale-knight.png", 640, 428, 8, 48, 3, "k.mp4"); seq.append("k")
for name in ("c-dragon", "marsh", "neptune", "c-ropes", "sanctum", "volcano", "c-river", "wizard", "palace", "beach", "throne", "c-throne"):
    frames(name, 2.2, name + ".mp4"); seq.append(name)
atlas(ROOT / "art/es-3d/scepters/spin-fire.png", 256, 256, 6, 24, 2, "sp1.mp4"); atlas(ROOT / "art/es-3d/scepters/spin-water.png", 256, 256, 6, 24, 2, "sp2.mp4"); seq += ["sp1", "sp2"]
atlas(ROOT / "art/castle-3d/finale-empty.png", 640, 428, 8, 48, 3.5, "e.mp4"); seq.append("e")
card("t1.png", [("scepters", "Happy Birthday", 8, GOLD)]); still("t1.png", 5, "t1.mp4"); seq.append("t1")
(W / "list.txt").write_text("".join(f"file '{(W / (s + '.mp4')).as_posix()}'\n" for s in seq), encoding="utf8")
ff("-f", "concat", "-safe", "0", "-i", str(W / "list.txt"), "-c:v", "libx264", "-crf", "20", "-r", "30", "-c:a", "aac", "-ar", "48000", str(W / "all.mp4"))
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(W / "all.mp4")], capture_output=True, text=True).stdout)
start = 29.5
ff("-i", str(W / "all.mp4"), "-ss", "0", "-i", str(ROOT / "audio/music/heros-quest.wav"), "-filter_complex", f"[1:a]adelay={int(start * 1000)}|{int(start * 1000)},volume=.8,afade=t=out:st={dur - 3}:d=3[m];[0:a]volume=.8[v];[v][m]amix=inputs=2:duration=first:normalize=0[a]", "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(V / "reel.mp4"))
print(dur)
