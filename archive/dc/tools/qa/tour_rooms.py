"""Muted, throwaway tour of every room in the Remastered look. Never touches the real save."""
import io, socket, subprocess, sys, tempfile, time, urllib.request
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT = Path(r"D:\silicon-adventures"); OUT = Path(sys.argv[1]); OUT.mkdir(exist_ok=True)
CORE = "EnchantedCastle.session.core()"
ROOMS = [1000, 1010, 1020, 2000, 2010, 2020, 2030, 3000, 3010, 3020, 3030, 4000, 4010, 4020]
with tempfile.TemporaryDirectory(prefix="scepters-tour-") as t:
    with socket.socket() as r:
        r.bind(("127.0.0.1", 0)); port = r.getsockname()[1]
    base = f"http://127.0.0.1:{port}/"
    pr = subprocess.Popen([str(ROOT / "engine/runtime/bin/java.exe"), f"-Duser.home={t}", "-jar", "engine/adventure.jar", "--test", str(port)], cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, creationflags=subprocess.CREATE_NO_WINDOW)
    try:
        for _ in range(100):
            try:
                with urllib.request.urlopen(base, timeout=1): break
            except OSError: time.sleep(.1)
        with sync_playwright() as pw:
            b = pw.chromium.launch(channel="chrome", headless=True, args=["--mute-audio"])
            with b.new_context(viewport={"width": 1280, "height": 1000}) as ctx:
                page = ctx.new_page(); errors = []
                page.on("pageerror", lambda e: errors.append(str(e)[:160]))
                page.on("requestfailed", lambda r: errors.append("failed " + r.url[-50:]))
                page.goto(base); page.wait_for_function("window.EnchantedCastle")
                page.evaluate("EnchantedCastle.open({colour: () => true})")
                page.wait_for_function("EnchantedCastle.debug.view()==='title'", timeout=60000)
                page.get_by_role("button", name="Options").click()
                t0 = time.time()
                page.get_by_role("button", name="See the remastered throne room").click()
                page.wait_for_function(f"{CORE}?.room?.id===4020", timeout=120000)
                print("load seconds", round(time.time() - t0, 1))
                canvas = page.locator("#castleCanvas")
                sheet = Image.new("RGB", (4 * 480, 5 * 320), (20, 20, 24))
                for i, room in enumerate(ROOMS):
                    page.evaluate(f"(()=>{{const c={CORE};c.lives=9;c.enter({room},0);c.hero.safe=9999;}})()"); time.sleep(.7)
                    while page.evaluate(f"{CORE}.hero.state") in ("chute", "ladder") : time.sleep(.2)
                    im = Image.open(io.BytesIO(canvas.screenshot())).convert("RGB"); im.save(OUT / f"room-{room}.png")
                    sheet.paste(im.resize((476, 316), Image.LANCZOS), (i % 4 * 480, i // 4 * 320))
                    print(room, page.evaluate("EnchantedCastle.debug.painter.fullColour"))
                sheet.save(OUT / "all-rooms.png")
                print("errors", errors[:6])
            b.close()
    finally:
        pr.terminate(); pr.communicate(timeout=15)
