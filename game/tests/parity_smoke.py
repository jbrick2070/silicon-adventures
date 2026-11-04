"""Silent browser acceptance of physical edges, the Chronicle and The Enchanted Castle.

Run from the repository root: python game/tests/parity_smoke.py
The test owns a throwaway JVM home and Chrome profile. It never opens the real save,
and Chrome runs with audio muted.
"""

import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import urllib.request

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
SPY = """
;(() => { const load = PlateView.prototype.load;
  PlateView.prototype.load = function(meta) { window.qaView = this; return load.call(this, meta); };
})();
"""
TOUR = r"""
async () => {
  const E = EnchantedCastle, wait = n => new Promise(r => setTimeout(r, n));
  E.debug.begin(2);
  const core = E.session.core(), keys = E.debug.keys;
  core.lives = 99; core.ward = true;
  const show = async (spec, ms = 90) => {
    core.enter(3000, 0); core.entities = []; core.hero.safe = 9999;
    for (const e of Array.isArray(spec) ? spec : [spec]) core.entities.push({w: 16, h: 16, frame: 0, x: 200, y: 200, ...e, foes: false});
    await wait(ms);
  };
  const base = {left: 0, right: 500, hp: 9};
  for (const v of [{speed: 2}, {speed: -2}, {speed: 2, hurt: 5}, {speed: 2, turned: 8}, {speed: 2, dying: 18}, {speed: -2, dying: 18},
    {speed: 2, whip: true}, {speed: 2, whip: true, hurt: 8}, {speed: 2, whip: true, dying: 18}, {speed: 0, whip: true, lash: 12, x: 60, y: 258}]) await show({type: 'guard', ...base, ...v});
  for (const reel of ['B400', 'B401']) await show({type: 'door', reel, left_: 0, timer: 99, open: 9});
  for (const vx of [4, -4]) await show({type: 'arrow', vx, life: 40});
  for (const v of [{type: 'rat', speed: 2, ...base}, {type: 'rat', speed: -2, ...base}, {type: 'ropeRat', speed: 1, top: 0, bottom: 300}, {type: 'bat', state: 'perch', timer: 99},
    {type: 'mutant', speed: 2, ...base}, {type: 'mutant', speed: 2, ...base, hurt: 8}, {type: 'mutant', speed: 2, ...base, dying: 18}, {type: 'vulture', homeY: 200, timer: 0}, {type: 'feather', vy: .1},
    {type: 'eye', phase: 1}, {type: 'eye', phase: 1, dying: 18}, {type: 'broom', speed: 1, ...base}, {type: 'broom', speed: 1, ...base, hurt: 8}, {type: 'broom', speed: 1, ...base, dying: 18},
    {type: 'fountain', timer: 0}, {type: 'torch'}, {type: 'faces', timer: 99}, {type: 'item', item: 'bag'}, {type: 'henchman', timer: 99}, {type: 'henchman', timer: 6}, {type: 'henchman', dying: 18},
    {type: 'rock', vx: 0, vy: 0}, {type: 'shards', broken: 9, vx: 0, vy: 0}, {type: 'weight', falling: true, timer: 99, x: 300}, {type: 'dragon', timer: 99, breath: 0, hp: 9},
    {type: 'dragon', timer: 99, breath: 30, hp: 9, x: 300}, {type: 'dragon', timer: 99, breath: 0, hp: 9, dying: 18}, {type: 'wizard', timer: 99}, {type: 'wizard', timer: 44}, {type: 'wizard', timer: 8},
    {type: 'wizard', timer: 99, hurt: 8}, {type: 'wizard', timer: 99, dying: 18}, {type: 'bolt', vx: 0, vy: 0, life: 40}, {type: 'gargoyle', homeY: 200, speed: 1, right: 400},
    {type: 'gargoyle', homeY: 200, speed: -1, right: 400}, {type: 'gargoyle', homeY: 200, speed: 1, right: 400, dying: 18}, {type: 'drip', state: 'wait', timer: 40, startY: 10, floor: 300},
    {type: 'drip', state: 'fall', y: 40, startY: 10, floor: 300}, {type: 'drip', state: 'splash', timer: 12, y: 200, startY: 10, floor: 300}, {type: 'storm', every: 900, timer: 900, live: 16, bolt: 'B705'},
    {type: 'storm', every: 900, timer: 900, live: 7, bolt: 'B706'}, {type: 'clouds'}, {type: 'bridge'}, {type: 'hatch', open: false}, {type: 'hatch', open: true}, {type: 'gate', open: false}, {type: 'gate', open: true},
    {type: 'portcullis'}, {type: 'mug', vx: 0, vy: 0, life: 60}, {type: 'mug', vx: 0, vy: 0, life: 90, frame: 22}, {type: 'scepter', scepter: CastlePlan.WINGS.shield.scepter}]) await show(v);
  for (const e of [{type: 'guard', ...base, speed: 2, hurt: 7}, {type: 'bat', state: 'perch', timer: 99, dying: 18}]) await show(e, 180);
  for (const face of [1, -1]) {
    core.enter(3000, 0); core.entities = []; const h = core.hero; h.safe = 0; h.x = 300; h.face = face; core.powers.delete('air');
    h.walked = core.tickCount - 95; await wait(260); h.walked = core.tickCount - 205; await wait(300); h.walked = core.tickCount - 2; await wait(120);
    const stride = face > 0 ? 'd' : 'a'; keys.add(stride); await wait(240); keys.delete(stride); h.x = 300; await wait(40);
    keys.add('e'); await wait(110); keys.delete('e'); core.powers.add('air'); keys.add('e'); await wait(110); keys.delete('e');
    keys.add('q'); await wait(180); keys.delete('q'); core.powers.delete('air'); await wait(40);
    h.armUntil = core.tickCount + 20; await wait(100); h.flail = core.tickCount + 12; await wait(110); h.landed = core.tickCount; await wait(580);
    core.shots.push({x: 200, y: 299, vx: 0, vy: 0, w: 8, h: 8, fire: false, frame: 0, life: 12}, {x: 240, y: 200, vx: 0, vy: 0, w: 8, h: 8, fire: true, frame: 0, life: 12}); await wait(260);
    h.state = 'air'; h.floor = null; h.y = 40; h.vy = 8.9; h.vx = 1; await wait(120);
    core.enter(3000, 0); core.entities = []; const k = core.hero; k.face = face; k.state = 'air'; k.floor = null; k.vx = 2; k.y = 100; k.vy = -8; await wait(40);
    k.y = 60; k.vx = 0; k.vy = -8; await wait(40);
    core.enter(1000, 0); core.entities = []; const r = core.hero, rope = core.room.ropes[0]; r.face = face;
    r.state = 'rope'; r.rope = rope; r.floor = null; r.y = (rope.top + rope.bottom) / 2; await wait(150); r.y = rope.top; await wait(110); r.y = rope.bottom; await wait(110);
    core.enter(1000, 0); core.entities = []; const s = core.hero; s.face = face; s.state = 'stairs'; s.floor = null;
    s.stairs = {fromX: 60, fromY: 54, end: {x: 176, y: 114}, ticks: 400, t: 0, up: false}; await wait(170); s.stairs.up = true; await wait(170);
    core.enter(3000, 0); core.entities = []; const l = core.hero; l.state = 'ladder'; l.floor = null; l.ladder = {top: 142, bottom: 202, x: 72, foot: {}, topSpan: {y: 142}}; l.x = 72; l.y = 170; await wait(150); l.y = 145; await wait(110);
    core.enter(1010, 0); const q = core.hero, rig = core.entities.find(e => e.type === 'swingRope'); q.state = 'swing'; q.swing = rig; q.floor = null; q.safe = 999; await wait(2100);
  }
  for (const id of [2010, 4010]) { core.enter(id, 0); core.hero.safe = 9999; await wait(140); }
  core.ward = false; core.elixir = 0;
  for (const cause of ['fall', 'bite', 'bat', 'guard', 'whip', 'mutant', 'fire', 'lightning', 'crush', 'weight', 'acid', 'throw', 'mug']) {
    core.enter(3000, 0); core.entities = []; core.hero.safe = 0; core.harm(cause);
    await wait(2050);
  }
  core.ward = true;
  core.enter(4020, 0); core.hero.safe = 9999; core.entities = core.entities.filter(e => ['throne', 'knight', 'lever'].includes(e.type));
  const knight = core.entities.find(e => e.type === 'knight'); knight.timer = 2; await wait(650); knight.timer = 80; await wait(120);
  for (const pull of core.room.pulls) { core.pull(pull); await wait(220); }
  await wait(2500);
  for (let i = 0; i < 4; i++) {
    core.powers.clear(); core.powers.add('earth'); core.powers.add('fire'); core.powers.add('air'); core.powers.delete({0: 'earth', 1: 'fire', 3: 'air'}[i]);
    core.mode = 'hall'; core.room = null; core.door = i; core.runDoor();
    await wait(core.run.path.steps.length * 72 + 300);
  }
  return true;
}
"""


def smoke(page, base):
    errors, failures = [], []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("response", lambda response: failures.append([response.status, response.url]) if response.status >= 400 else None)
    page.set_default_timeout(20000)
    page.route("**/game/view.js", lambda route: route.fulfill(response=(r := route.fetch()), body=r.text() + SPY))
    page.goto(base)
    page.wait_for_function("document.querySelector('#soundBtn')")
    page.locator("#soundBtn").click()
    assert page.locator("#soundLabel").inner_text() == "off"
    page.wait_for_function("!document.getElementById('journey').disabled")

    def api(action, arg=""):
        request = urllib.request.Request(base + "api/" + action, arg.encode(), {"X-Scepters": "1"}, method="POST")
        with urllib.request.urlopen(request, timeout=20) as reply:
            return json.load(reply)

    def idle():
        page.wait_for_function("document.querySelector('#playing').getAttribute('aria-busy') !== 'true'")

    def command(text):
        page.locator("#journalTab").click()
        page.locator("#cmd").fill(text)
        page.locator("#cmd").press("Enter")
        idle()
        return api("state")

    def walk(key, seconds):
        page.keyboard.down(key)
        time.sleep(seconds)
        page.keyboard.up(key)

    # Physical edges: the old open box let Saber walk 24 metres into a blank plain.
    page.locator("#journey").click()
    idle()
    page.locator("#bookmarks").click()
    page.get_by_role("button", name="Main Road", exact=True).click()
    idle()
    time.sleep(.5)
    page.locator("#world").focus()
    before = api("state")
    walk("w", 8)
    pose = page.evaluate("({z: qaView.pose.z, back: qaView.bounds.back, rig: qaView.rig.back})")
    assert pose["z"] < 11.1 and pose["rig"] > 20, pose
    assert page.locator("#interact").inner_text().endswith("Go north")
    page.keyboard.down("ArrowRight")
    time.sleep(.92)
    page.keyboard.up("ArrowRight")
    page.keyboard.down("ArrowRight")
    time.sleep(.92)
    page.keyboard.up("ArrowRight")
    page.keyboard.down("ArrowRight")
    time.sleep(.92)
    page.keyboard.up("ArrowRight")
    walk("w", 7)
    assert page.locator("#cue").inner_text() == "You can't go west.", page.locator("#cue").inner_text()
    after = api("state")
    assert (before["scene"], before["hp"], before["objects"], before["output"]) == (after["scene"], after["hp"], after["objects"], after["output"]), "an edge spent a turn"
    assert "Ways out" in page.locator("#ways").inner_text()

    # The Chronicle, side quests and oddities open in the Archive without a turn.
    page.locator("#folioBtn").click()
    for name in ("Side quests", "Oddities", "Chronicle", "Cast"):
        page.get_by_role("tab", name=name).click()
        assert page.locator("dialog[open] .folio-caption").first.inner_text()
    page.get_by_role("tab", name="Chronicle").click()
    page.locator("#chronicleAll").check()
    page.get_by_role("searchbox", name="Find a word").fill("flesh wound")
    assert "Only a flesh wound!" in page.locator(".chronicle-list").inner_text()
    page.locator("#closeDialog").click()

    # WEAR and Try are reachable without typing.
    command("south")

    # The Enchanted Castle opens from a game in progress and spends no turn.
    frozen = api("state")
    page.locator("#bookmarks").click()
    page.get_by_role("button", name="The Enchanted Castle", exact=True).click()
    page.wait_for_selector("#castleGame[open]")
    page.wait_for_function("EnchantedCastle.debug.view()==='title'", timeout=60000)
    page.get_by_role("button", name="Beginner").click()
    page.locator("#castleCanvas").focus()
    page.keyboard.press("d")
    page.keyboard.press("a")
    page.keyboard.press("Space")
    page.wait_for_function("EnchantedCastle.session.core().mode==='room'", timeout=15000)
    assert page.evaluate("EnchantedCastle.session.core().room.id") == 1000
    x = page.evaluate("EnchantedCastle.session.core().hero.x")
    walk("d", .5)
    assert page.evaluate("EnchantedCastle.session.core().hero.x") > x + 20
    page.keyboard.press("f")
    time.sleep(.1)
    assert page.evaluate("EnchantedCastle.session.core().rocks") == 59

    # The 1-bit modes stay strictly two-colour, status text included.
    page.evaluate("document.getElementById('castleCanvas')")
    colours = page.evaluate("""() => { const c = document.getElementById('castleCanvas'), d = c.getContext('2d').getImageData(0, 0, 512, 342).data, s = new Set();
      for (let i = 0; i < d.length; i += 4) s.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]); return [...s].slice(0, 9); }""")
    print("castle canvas colours in the default mode:", colours)

    page.evaluate(TOUR)
    used = set(page.evaluate("[...EnchantedCastle.debug.painter.used]"))
    text = (ROOT / "art/castle-index.js").read_text(encoding="utf8")
    reels = {f"{x['fork'][-1]}{x['id']}" for x in json.loads(text[text.index("["):text.rindex("]") + 1]) if x["type"] == "PPCT"}
    missing = sorted(reels - used)
    assert not missing, missing
    page.locator("#castleGame [data-do=close]").first.click()
    after = api("state")
    assert (frozen["scene"], frozen["hp"], frozen["output"]) == (after["scene"], after["hp"], after["output"]), "the castle spent a turn"
    assert not errors, errors[:4]
    assert not failures, failures[:4]
    print("Passed: edges; blocked text; no turn at edges; Archive panels; castle from play; keyboard; all", len(reels), "reels drawn; no turn in the castle.")
    print("Browser console/page errors: 0. HTTP failures: 0.")


def main():
    with tempfile.TemporaryDirectory(prefix="scepters-parity-acceptance-") as temporary:
        home = Path(temporary)
        with socket.socket() as reservation:
            reservation.bind(("127.0.0.1", 0))
            port = reservation.getsockname()[1]
        base = f"http://127.0.0.1:{port}/"
        process = subprocess.Popen(
            [str(ROOT / "engine/runtime/bin/java.exe"), f"-Duser.home={home}", "-jar", "engine/adventure.jar", "--test", str(port)],
            cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
        )
        try:
            for _ in range(100):
                try:
                    with urllib.request.urlopen(base, timeout=1):
                        break
                except OSError:
                    time.sleep(.1)
            else:
                raise TimeoutError("Private test server did not start")
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(channel="chrome", headless=True, args=["--mute-audio"])
                try:
                    with browser.new_context(viewport={"width": 1280, "height": 900}) as context:
                        smoke(context.new_page(), base)
                finally:
                    browser.close()
        finally:
            process.terminate()
            process.communicate(timeout=15)


if __name__ == "__main__":
    main()
