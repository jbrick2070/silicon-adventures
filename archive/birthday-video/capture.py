"""Records gameplay for the reel, muted, from a throwaway home. Writes frames to <out>/<shot>/f####.jpg."""
import base64, socket, subprocess, sys, tempfile, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[2]; OUT = Path(sys.argv[1]); CORE = "EnchantedCastle.session.core()"
home = tempfile.mkdtemp(prefix="scepters-reel-")
s = socket.socket(); s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]; s.close(); base = f"http://127.0.0.1:{port}/"
pr = subprocess.Popen([str(ROOT / "engine/runtime/bin/java.exe"), f"-Duser.home={home}", "-jar", "engine/adventure.jar", "--test", str(port)], cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
for _ in range(100):
    try:
        with urllib.request.urlopen(base, timeout=1): break
    except OSError: time.sleep(.1)
ROOM = """async ([room, figure, frames]) => {
  const c = document.createElement('canvas'), v = new PlateView(c);
  const meta = ES_DESIGNS.find(x => x.type === 'ASCN' && x.id === room);
  v.setRefreshed(true); v.setColour(true); await v.load(meta);
  if (figure) await v.add(ES_DESIGNS.find(x => x.type === 'ACHR' && x.id === figure), 'npc', {});
  const out = [];
  for (let i = 0; i < frames; i++) { const t = i / (frames - 1); Object.assign(v.pose, {x: 0, z: .55 * t, yaw: .1 * Math.sin(t * 3.14), pitch: 0}); v.render(0); out.push(c.toDataURL('image/jpeg', .92)); }
  return out;
}"""
def save(name, data):
    d = OUT / name; d.mkdir(parents=True, exist_ok=True)
    for i, u in enumerate(data): (d / f"f{i:04d}.jpg").write_bytes(base64.b64decode(u.split(",")[1]))
    print(name, len(data), flush=True)
def castle(page, room, name, seconds, setup=""):
    page.evaluate(f"(()=>{{const c={CORE};c.preview=false;c.sawKnight=true;c.lives=9;c.enter({room},0);c.hero.safe=9999;{setup}}})()"); time.sleep(.6)
    canvas = page.locator("#castleCanvas"); data = []
    page.keyboard.down("d"); t = time.time(); n = 0
    while time.time() - t < seconds:
        if n % 8 == 3: page.keyboard.press(" ")
        data.append("x," + base64.b64encode(canvas.screenshot(type="jpeg", quality=88)).decode()); n += 1
    page.keyboard.up("d"); save(name, data)
try:
    with sync_playwright() as pw:
        b = pw.chromium.launch(channel="chrome", headless=True, args=["--mute-audio"])
        page = b.new_context(viewport={"width": 1280, "height": 900}).new_page(); page.set_default_timeout(120000)
        page.goto(base); page.wait_for_function("typeof PlateView!=='undefined' && window.ES_DESIGNS && window.EnchantedCastle")
        for name, room, fig in (("marsh", 24338, 6060), ("neptune", 14057, 29194), ("sanctum", 14750, 28937), ("wizard", 29408, 0), ("volcano", 3099, 0), ("throne", 17888, 16393), ("palace", 32256, 20762), ("beach", 20301, 0)):
            save(name, page.evaluate(ROOM, [room, fig, 72]))
        page.evaluate("EnchantedCastle.open({colour: () => true})")
        page.wait_for_function("EnchantedCastle.debug.view()==='title'", timeout=60000)
        page.get_by_role("button", name="Options").click()
        page.get_by_role("button", name="See the remastered throne room").click()
        page.wait_for_function(f"{CORE}?.room?.id===4020", timeout=120000); time.sleep(1.5); page.locator("#castleCanvas").focus()
        for name, room in (("c-dragon", 3010), ("c-ropes", 1000), ("c-river", 2020), ("c-throne", 4020)): castle(page, room, name, 3.5)
        b.close()
finally:
    pr.terminate(); pr.communicate(timeout=15)
