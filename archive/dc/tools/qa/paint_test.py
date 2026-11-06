"""Muted test of a painted room in the walking view. Uses a stand-in painting served only to this browser."""
import io, os, socket, subprocess, sys, tempfile, time, urllib.request
from pathlib import Path
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT = Path(r"D:\silicon-adventures"); OUT = Path(__file__).parent / "paint"; OUT.mkdir(exist_ok=True)
room = int(sys.argv[1]) if len(sys.argv) > 1 else 21149
src = sys.argv[2] if len(sys.argv) > 2 else None
if src:
    painted = Image.open(src).convert("RGB")
else:
    p = np.array(Image.open(ROOT / f"archive/es/plates/ASCN-{room}.png").convert("RGBA"))
    ink = (p[..., 3] > 0) & (p[..., 0] < 128)
    a = np.zeros((*ink.shape, 3), np.uint8); a[...] = (235, 150, 60); a[ink] = (20, 40, 110)
    painted = Image.fromarray(a)
buf = io.BytesIO(); painted.save(buf, "PNG"); blob = buf.getvalue()
home = tempfile.mkdtemp(prefix="scepters-paint-")
s = socket.socket(); s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]; s.close(); base = f"http://127.0.0.1:{port}/"
pr = subprocess.Popen([str(ROOT / "engine/runtime/bin/java.exe"), f"-Duser.home={home}", "-jar", "engine/adventure.jar", "--test", str(port)], cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
for _ in range(100):
    try:
        with urllib.request.urlopen(base, timeout=1): break
    except OSError: time.sleep(.1)
try:
    with sync_playwright() as pw:
        b = pw.chromium.launch(channel="chrome", headless=True, args=["--mute-audio"])
        ctx = b.new_context(viewport={"width": 1280, "height": 900}); page = ctx.new_page(); errors = []
        page.on("pageerror", lambda e: errors.append(str(e)[:220]))
        page.route(f"**/art/es-3d/ASCN-{room}.png", lambda r: r.fulfill(body=blob, content_type="image/png"))
        page.goto(base); page.wait_for_function("window.PlateView!==undefined || typeof PlateView!=='undefined'", timeout=30000)
        page.evaluate(f"PlateView.painted.add({room})")
        page.get_by_role("button", name="Begin the full adventure").click(timeout=120000)
        time.sleep(4)
        c = page.locator("#world")
        c.screenshot(path=OUT / "0-eye.png")
        page.keyboard.down("w"); time.sleep(.6); page.keyboard.up("w"); time.sleep(.2); c.screenshot(path=OUT / "1-walk.png")
        page.keyboard.down("ArrowLeft"); time.sleep(.5); page.keyboard.up("ArrowLeft"); time.sleep(.2); c.screenshot(path=OUT / "2-turn.png")
        page.keyboard.down("ArrowRight"); time.sleep(1); page.keyboard.up("ArrowRight"); time.sleep(.2); c.screenshot(path=OUT / "3-turn.png")
        print("errors", errors[:5]); b.close()
finally:
    pr.terminate(); pr.communicate(timeout=15)
ims = [Image.open(OUT / f"{n}.png").convert("RGB") for n in ("0-eye", "1-walk", "2-turn", "3-turn")]
w, h = ims[0].size; sheet = Image.new("RGB", (w * 2 + 8, h * 2 + 8), (255, 0, 0))
for i, im in enumerate(ims): sheet.paste(im, (i % 2 * (w + 8), i // 2 * (h + 8)))
sheet.save(OUT / "sheet.png"); print(w, h)
