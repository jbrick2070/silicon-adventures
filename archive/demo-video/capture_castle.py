"""Records staged castle play for the demo, muted, with the hero warded. Usage: capture_castle.py <folder>"""
import base64, socket, subprocess, sys, tempfile, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[2]; OUT = Path(sys.argv[1]); CORE = "EnchantedCastle.session.core()"
home = tempfile.mkdtemp(prefix="scepters-demo-")
s = socket.socket(); s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]; s.close(); base = f"http://127.0.0.1:{port}/"
pr = subprocess.Popen([str(ROOT / "engine/runtime/bin/java.exe"), f"-Duser.home={home}", "-jar", "engine/adventure.jar", "--test", str(port)], cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
for _ in range(100):
    try:
        with urllib.request.urlopen(base, timeout=1): break
    except OSError: time.sleep(.1)
RECORD = """async ([seconds, fps, hold]) => {
  const src = document.querySelector('#castleCanvas'), c = document.createElement('canvas'); c.width = 1080; c.height = 721;
  const x = c.getContext('2d'), out = [], start = performance.now(), end = start + seconds * 1000;
  const key = (type, k) => src.dispatchEvent(new KeyboardEvent(type, {key: k, bubbles: true}));
  x.imageSmoothingQuality = 'high'; if (hold) key('keydown', hold);
  let fired = 0, jumped = 0;
  while (performance.now() < end) {
    const t = performance.now() - start;
    if (hold && t > fired * 650 + 300) { fired++; key('keydown', 'f'); setTimeout(() => key('keyup', 'f'), 80); }
    if (hold && t > jumped * 1500 + 900) { jumped++; key('keydown', ' '); setTimeout(() => key('keyup', ' '), 90); }
    x.drawImage(src, 0, 0, 1080, 721); out.push(c.toDataURL('image/jpeg', .9));
    await new Promise(r => setTimeout(r, 1000 / fps));
  }
  if (hold) key('keyup', hold);
  return out;
}"""
def save(name, data):
    d = OUT / name; d.mkdir(parents=True, exist_ok=True)
    for i, u in enumerate(data): (d / f"f{i:04d}.jpg").write_bytes(base64.b64decode(u.split(",")[1]))
    print(name, len(data), flush=True)
try:
    with sync_playwright() as pw:
        b = pw.chromium.launch(channel="chrome", headless=True, args=["--mute-audio"])
        page = b.new_context(viewport={"width": 1280, "height": 900}).new_page(); page.set_default_timeout(120000)
        page.goto(base); page.wait_for_function("window.EnchantedCastle")
        page.evaluate("EnchantedCastle.open({colour: () => true})")
        page.wait_for_function("EnchantedCastle.debug.view()==='title'", timeout=60000)
        page.get_by_role("button", name="Options").click()
        page.get_by_role("button", name="See the remastered throne room").click()
        page.wait_for_function(f"{CORE}?.room?.id===4020", timeout=120000); time.sleep(1.5)
        page.evaluate(f"(()=>{{const c={CORE};c.preview=false;c.ward=true;c.sawKnight=true;c.enterHall();}})()"); time.sleep(.4)
        page.evaluate(f"(()=>{{const c={CORE};c.door=2;c.door=1;c.runDoor();}})()")
        save("c-hall", page.evaluate(RECORD, [3.4, 15, ""]))
        for name, room, hold, var in (("c-mutant", 2000, "d", 0), ("c-dragon", 3010, "d", 0), ("c-wizard", 2030, "d", 0), ("c-river", 2020, "d", 0), ("c-knight", 4020, "d", 0)):
            page.evaluate(f"(()=>{{const c={CORE};c.lives=9;c.rocks=60;c.ward=true;c.sawKnight=true;c.enter({room},{var});c.hero.safe=9999;}})()"); time.sleep(.5)
            save(name, page.evaluate(RECORD, [4.4, 15, hold]))
            print(page.evaluate(f"[{CORE}.mode,{CORE}.room?.id,{CORE}.lives]"), flush=True)
        b.close()
finally:
    pr.terminate(); pr.communicate(timeout=15)
