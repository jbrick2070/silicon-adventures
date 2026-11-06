"""Records the demo's game footage, muted, from a throwaway home. Usage: capture_demo.py <folder>"""
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
WALK = """async ([room, figure, frames]) => {
  const c = document.createElement('canvas'), v = new PlateView(c);
  const meta = ES_DESIGNS.find(x => x.type === 'ASCN' && x.id === room);
  v.setRefreshed(true); v.setColour(true); await v.load(meta);
  if (figure) await v.add(ES_DESIGNS.find(x => x.type === 'ACHR' && x.id === figure), 'npc', {});
  const out = [];
  for (let i = 0; i < frames; i++) { const t = i / (frames - 1), e = t * t * (3 - 2 * t); Object.assign(v.pose, {x: 0, z: .6 * e, yaw: .07 * Math.sin(t * 6.28), pitch: 0}); v.render(0); out.push(c.toDataURL('image/png')); }
  return out;
}"""
BEACON = """async (frames) => {
  await new Promise(r => setTimeout(r, 800));
  const c = document.createElement('canvas'); c.width = 338; c.height = 314; const out = [];
  for (let i = 0; i < frames; i++) { KnockArt.draw(c, {stage: 'beacon', colour: true, elapsed: 4 + i * .22, bearing: 'east', flash: i % 24 > 18}); out.push(c.toDataURL('image/png')); }
  return out;
}"""
RECORD = """async ([seconds, fps]) => {
  const src = document.querySelector('#castleCanvas'), c = document.createElement('canvas'); c.width = 1080; c.height = 721;
  const x = c.getContext('2d'), out = [], end = performance.now() + seconds * 1000;
  x.imageSmoothingQuality = 'high';
  while (performance.now() < end) { x.drawImage(src, 0, 0, 1080, 721); out.push(c.toDataURL('image/jpeg', .9)); await new Promise(r => setTimeout(r, 1000 / fps)); }
  return out;
}"""
def save(name, data):
    d = OUT / name; d.mkdir(parents=True, exist_ok=True)
    for i, u in enumerate(data):
        ext = "png" if u.startswith("data:image/png") else "jpg"
        (d / f"f{i:04d}.{ext}").write_bytes(base64.b64decode(u.split(",")[1]))
    print(name, len(data), flush=True)
try:
    with sync_playwright() as pw:
        b = pw.chromium.launch(channel="chrome", headless=True, args=["--mute-audio"])
        page = b.new_context(viewport={"width": 1280, "height": 900}).new_page(); page.set_default_timeout(200000)
        page.goto(base); page.wait_for_function("typeof PlateView!=='undefined' && window.ES_DESIGNS && window.EnchantedCastle && window.KnockArt")
        for name, room, fig in (("w-marsh", 24338, 6060), ("w-shark", 7747, 29194), ("w-demon", 14750, 28937), ("w-queen", 31514, 20762), ("w-ship", 12464, 0)):
            save(name, page.evaluate(WALK, [room, fig, 66]))
        save("beacon", page.evaluate(BEACON, 110))
        page.evaluate("EnchantedCastle.open({colour: () => true})")
        page.wait_for_function("EnchantedCastle.debug.view()==='title'", timeout=60000)
        page.get_by_role("button", name="Options").click()
        page.get_by_role("button", name="See the remastered throne room").click()
        page.wait_for_function(f"{CORE}?.room?.id===4020", timeout=120000); time.sleep(1.5)
        page.evaluate("EnchantedCastle.debug.begin(0, true)"); time.sleep(.3)
        save("play", page.evaluate(RECORD, [24, 15]))
        print("demo view", page.evaluate("EnchantedCastle.debug.view()"), flush=True)
        b.close()
finally:
    pr.terminate(); pr.communicate(timeout=15)
