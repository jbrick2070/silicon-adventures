"""Muted, throwaway run of the Remastered look in the real game. Never touches the real save."""
import io, os, socket, subprocess, sys, tempfile, time, urllib.request
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(r"D:\silicon-adventures")
OUT = ROOT / "art/castle-3d/preview"; OUT.mkdir(exist_ok=True)
CORE = "EnchantedCastle.session.core()"

def run(page, base):
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("requestfailed", lambda r: errors.append("failed " + r.url))
    page.goto(base); page.wait_for_function("window.EnchantedCastle")
    page.evaluate("EnchantedCastle.open({colour: () => true})")
    page.wait_for_function("EnchantedCastle.debug.view()==='title'", timeout=60000)
    page.get_by_role("button", name="Options").click()
    page.get_by_role("button", name="See the remastered throne room").click()
    page.wait_for_function(f"{CORE}?.room?.id===4020", timeout=15000)
    time.sleep(.6)
    canvas = page.locator("#castleCanvas")
    canvas.screenshot(path=OUT / "throne-room-in-game.png")
    print("state", page.evaluate(f"({{x:{CORE}.hero.x,y:{CORE}.hero.y,state:{CORE}.hero.state,full:EnchantedCastle.debug.painter.fullColour}})"))
    page.evaluate(f"{CORE}.entities=[]")  # A clear floor for the walking test only.
    frames = []
    def film(key, count):
        page.keyboard.down(key)
        for _ in range(count):
            frames.append(Image.open(io.BytesIO(canvas.screenshot())).convert("RGB")); time.sleep(.02)
        page.keyboard.up(key)
    page.locator("#castleCanvas").focus()
    film("ArrowRight", 12)
    print("after right", page.evaluate(f"({{x:{CORE}.hero.x,state:{CORE}.hero.state,face:{CORE}.hero.face}})"))
    film("ArrowLeft", 12)
    print("after left", page.evaluate(f"({{x:{CORE}.hero.x,state:{CORE}.hero.state,face:{CORE}.hero.face}})"))
    frames[0].save(OUT / "walk-in-game.gif", save_all=True, append_images=frames[1:], duration=120, loop=0)
    # Every painted room, entered through its own button.
    for label, room, out in (("the remastered river", 2020, "river-in-game.png"), ("the remastered first room", 1000, "first-room-in-game.png")):
        page.locator("#castleGame .knock-tools [data-do=menu]").click()
        page.get_by_role("button", name="Options").click()
        page.get_by_role("button", name="See " + label).click()
        page.wait_for_function(f"{CORE}?.room?.id==={room}", timeout=15000); time.sleep(.5)
        canvas.screenshot(path=OUT / out)
        print(room, "state", page.evaluate(f"({{x:{CORE}.hero.x,y:{CORE}.hero.y,state:{CORE}.hero.state,full:EnchantedCastle.debug.painter.fullColour}})"))
    # Duncan behind the river's front layer, on a log.
    page.evaluate(f"(()=>{{const c={CORE};c.enter(2020,0);c.entities=[];const l=c.addLog(0,200);c.landOn(86,212);c.hero.floor=l.seg;}})()"); time.sleep(.3)
    canvas.screenshot(path=OUT / "river-log-in-game.png")
    print("fronts", page.evaluate("EnchantedCastle.debug.fronts()"))
    # A room with no new art keeps its usual look across the whole enlarged page.
    page.evaluate(f"{CORE}.enter(3000,0)"); time.sleep(.4)
    print("other room full", page.evaluate("EnchantedCastle.debug.painter.fullColour"))
    return errors

with tempfile.TemporaryDirectory(prefix="scepters-hd-") as t:
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
                print("errors:", run(ctx.new_page(), base))
            b.close()
    finally:
        pr.terminate(); pr.communicate(timeout=15)
