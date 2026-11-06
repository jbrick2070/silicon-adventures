"""Silent Windows acceptance of save, input, and Archive polish.

Run from the repository root: python game/tests/polish_smoke.py
The test owns a throwaway JVM home and Chrome profile; it never opens the real save.
"""

import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import urllib.request
import uuid

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[2]


def smoke(page, base, home):
    errors = []
    failures = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("response", lambda response: failures.append([response.status, response.url]) if response.status >= 400 else None)
    page.set_default_timeout(15000)

    def api(action, arg=""):
        # Test-only native API access for inspecting state and constructing an
        # actual old-release save trailer. It does not spend a game turn.
        request = urllib.request.Request(base + "api/" + action, arg.encode(),
                                         {"X-Scepters": "1"}, method="POST")
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.load(response)

    def idle():
        page.wait_for_function("document.querySelector('#playing').getAttribute('aria-busy') !== 'true'")

    def command(text):
        page.locator("#cmd").fill(text)
        page.locator("#cmd").press("Enter")
        idle()

    def hint_without_turn(expected):
        before_hint = api("state")
        # Read through the third clue and repeat it. None of these UI reads may
        # consume the next turn in a timed trap.
        for _ in range(4):
            page.locator("#hint").click()
        try:
            expect(page.locator("#log p.hint").last).to_contain_text(expected)
        except AssertionError:
            print("HINT FAILURE:", json.dumps(api("state"), ensure_ascii=True), flush=True)
            print("JOURNAL:", page.locator("#log").inner_text()[-7000:], flush=True)
            raise
        assert api("state") == before_hint, "Reading a hint advanced the original game"

    def click_object(key):
        point = page.evaluate("""key => {
            const v = window.acceptanceView;
            for(let y=0;y<314;y++) for(let x=0;x<338;x++)
              if(v.hit(x+.5,y+.5)?.key===key) return {x:x+.5,y:y+.5};
            return null;
        }""", key)
        assert point, "No native clickable pixel for " + key
        bounds = page.locator("#world").bounding_box()
        page.locator("#world").click(position={"x": point["x"] * bounds["width"] / 338,
                                               "y": point["y"] * bounds["height"] / 314})
        idle()

    def room(name):
        try:
            expect(page.locator("#roomTitle")).to_have_text(name, ignore_case=True)
        except AssertionError:
            print("ROOM FAILURE:", json.dumps(api("state"), ensure_ascii=True), flush=True)
            print("JOURNAL:", page.locator("#log").inner_text()[-7000:], flush=True)
            raise

    def begin():
        page.locator("#bookmarks").click()
        page.get_by_role("button", name="Saber’s quarters", exact=True).click()
        idle()
        room("quarters")

    def restore():
        page.locator("#load").click()
        page.get_by_role("button", name="Restore saved adventure", exact=True).click()
        idle()

    # Observe the actual PlateView source loads across navigation. The wrapper
    # only records IDs; it calls the unchanged implementation.
    def observe_loads(route):
        response = route.fetch()
        instrument = """
        ;(() => {
          const load = PlateView.prototype.load;
          window.acceptanceLoads = [];
          PlateView.prototype.load = function(meta) {
            acceptanceLoads.push(meta.id);
            window.acceptanceView = this;
            return load.call(this, meta);
          };
        })();
        """
        route.fulfill(response=response, body=response.text() + instrument)

    page.route("**/game/view.js", observe_loads)
    page.goto(base)
    expect(page.locator("#soundBtn")).to_have_attribute("aria-pressed", "true")
    page.locator("#soundBtn").click()
    expect(page.locator("#soundBtn")).to_have_attribute("aria-pressed", "false")
    expect(page.locator("#journey")).to_be_enabled()

    # Prove save isolation before any subsequent test relies on the server.
    marker = "acceptance-private-" + uuid.uuid4().hex
    api("save", marker)
    save = home / "Saved Games" / "Silicon Adventures" / "adventure.sav"
    assert marker.encode() in save.read_bytes(), "Save was not written under the throwaway home"

    page.locator("#journey").click()
    idle()
    room("quarters")

    # Manual A -> checkpoint B -> restore -> same-server reload keeps the B
    # journal and ownership, so the following doorway still checkpoints.
    page.locator("#save").click()
    idle()
    expect(page.locator("#saveState")).to_contain_text("Manual save")
    command("south")
    room("marble hall")
    expect(page.locator("#saveState")).to_contain_text("Doorway checkpoint · Marble Hall")
    restore()
    room("marble hall")
    expect(page.locator("#log")).to_contain_text("polished marble hallway")
    before = page.locator("#log").inner_text()
    page.reload()
    idle()
    room("marble hall")
    assert page.locator("#log").inner_text() == before, "Reload duplicated journal output"
    command("north")
    room("quarters")
    expect(page.locator("#saveState")).to_contain_text("Doorway checkpoint · Quarters")

    # A legacy eb863f3 save has a valid pose/scene trailer but no pending reply.
    begin()
    for text in ("south", "south", "yes"):
        command(text)
    room("throne room")
    expect(page.locator("#actions").get_by_role("button", name="Yes", exact=True)).to_be_visible()
    snapshot = api("state")
    assert any(obj["id"] == 27297 for obj in snapshot["objects"]), "King is not present at the question"
    legacy = {"x": 0, "z": 0, "yaw": 0, "pitch": 0, "scene": 17888,
              "read": False, "shortcut": False, "hp": snapshot["hp"]}
    # Imported/old saves lack a matching saveId. Leave a deliberately unrelated
    # saved journal behind to prove Restore cannot splice it into this save.
    journal_marker = "UNRELATED-JOURNAL-" + uuid.uuid4().hex
    page.evaluate("""marker => localStorage.setItem('scepters-saved-journal', JSON.stringify({
        saveId:'unrelated-save-id', entries:[{text:marker,cls:'aside'}]
    }))""", journal_marker)
    api("save", json.dumps(legacy))
    restore()
    assert journal_marker not in page.locator("#log").inner_text(), "Imported legacy save replayed an unrelated journal"
    expect(page.locator("#actions").get_by_role("button", name="Yes", exact=True)).to_be_visible()
    page.locator("#routeTab").click()
    assert all(button.is_disabled() for button in page.locator("#travel button").all())
    command("yes")
    assert not api("state")["ended"], "Accepting the restored King's question killed the player"
    expect(page.locator("#log")).to_contain_text("Perhaps this sword will aid you")

    # A new journey must not overwrite an existing save at its first doorway.
    # Pressing Save is the explicit choice that replaces it and turns checkpoints on.
    page.locator("#save").click()
    idle()
    kept = save.read_bytes()
    begin()
    expect(page.locator("#log")).to_contain_text("Your saved adventure is safe")
    command("south")
    room("marble hall")
    assert save.read_bytes() == kept, "A new journey overwrote the existing save"
    page.locator("#save").click()
    idle()
    assert save.read_bytes() != kept, "Save did not replace the kept adventure"
    command("north")
    expect(page.locator("#saveState")).to_contain_text("Doorway checkpoint · Quarters")

    # Keys stay with the game after a tab, the chart, or a volume slider takes focus.
    def walks():
        before_pose = page.evaluate("JSON.stringify(acceptanceView.pose)")
        page.keyboard.down("w")
        page.wait_for_timeout(250)
        page.keyboard.up("w")
        assert page.evaluate("JSON.stringify(acceptanceView.pose)") != before_pose, "W did not walk"
        page.evaluate("acceptanceView.reset()")

    page.locator("#packTab").click()
    walks()
    page.locator("#routeTab").click()
    page.locator("#map").click(position={"x": 5, "y": 5})
    walks()
    page.locator("#journalTab").click()
    walks()
    page.locator("#effectsVolume").focus()
    walks()
    level = page.locator("#effectsVolume").input_value()
    page.keyboard.press("ArrowLeft")
    assert page.locator("#effectsVolume").input_value() != level, "Slider lost its arrow keys"
    page.keyboard.press("ArrowRight")
    page.locator("#journalTab").focus()
    page.keyboard.press("ArrowRight")
    assert page.locator("#packTab").get_attribute("aria-selected") == "true", "Tab arrows stopped working"
    page.locator("#journalTab").click()

    # Excursion progress survives Restore followed by a same-launch reload.
    page.locator("#bookmarks").click()
    page.get_by_role("button", name="The Answering Knock", exact=True).click()
    expect(page.locator("#knockQuest")).to_be_visible()
    page.get_by_role("button", name="Knock back", exact=True).click()
    page.locator(".knock-choices button", has_text="Crescent").click()
    page.get_by_role("button", name="Strike the selected shield").click()
    page.get_by_role("button", name="Climb to the watchtower").click()
    page.locator('#knockQuest [data-action="save"]').click()
    expect(page.locator("#knockQuest .knock-feedback")).to_contain_text("Saved here")
    page.locator('#knockQuest [aria-label="Close excursion"]').click()
    page.locator("#save").click()
    idle()
    restore()
    expect(page.locator("#actions")).to_contain_text("Revisit the watchtower")
    page.reload()
    idle()
    expect(page.locator("#actions")).to_contain_text("Revisit the watchtower")

    # Reload after an intentional refusal keeps the death room rather than the
    # initial High Altar cover source.
    begin()
    for text in ("south", "south", "yes", "no"):
        command(text)
    assert api("state")["ended"]
    expect(page.locator("#log")).to_contain_text("Saber fell in throne room")
    page.reload()
    idle()
    expect(page.locator("#roomTitle")).to_have_text("Journey’s end")
    expect(page.locator("#plateCode")).to_have_text("ASCN · 17888")
    assert page.evaluate("acceptanceLoads.at(-1)") == 17888, "Death reload kept the cover's altar drawing"
    live = page.evaluate("JSON.parse(sessionStorage.getItem('scepters-live'))")
    assert live["scene"] == 17888 and live["sceneName"] == "throne room"
    assert "Saber fell in high altar" not in page.locator("#log").inner_text()

    # Preserve a second typed command while a real first response is delayed.
    begin()
    waiting = []

    def hold_turn(route):
        waiting.append(route)

    page.route("**/api/turn", hold_turn)
    page.locator("#cmd").fill("south")
    page.locator("#cmd").press("Enter")
    expect(page.locator("#playing")).to_have_attribute("aria-busy", "true")
    page.locator("#cmd").fill("north")
    page.locator("#cmd").press("Enter")
    expect(page.locator("#cmd")).to_have_value("north")
    expect(page.locator("#cue")).to_contain_text("Your command is still here")
    assert len(waiting) == 1, "A second turn was sent while busy"
    route = waiting.pop()
    route.fulfill(response=route.fetch())
    page.unroute("**/api/turn", hold_turn)
    idle()
    room("marble hall")
    expect(page.locator("#cmd")).to_have_value("north")
    page.locator("#cmd").press("Enter")
    idle()
    room("quarters")

    # The Archive is a UI-only view: every tab works without altering WAGE.
    before_archive = api("state")
    page.locator("#folioBtn").click()
    for name in ("Manual cards", "Bestiary", "Great Hall", "Scepters notes"):
        page.get_by_role("tab", name=name, exact=True).click()
        expect(page.get_by_role("tab", name=name, exact=True)).to_have_attribute("aria-selected", "true")
    page.locator("#closeDialog").click()
    after_archive = api("state")
    for field in ("scene", "hp", "inventory", "objects", "characters"):
        assert before_archive[field] == after_archive[field], "Archive changed " + field

    # Open a real shipped bookmark to inspect the chip without spending a turn.
    page.locator("#bookmarks").click()
    page.get_by_role("button", name="Computer", exact=True).click()
    idle()
    room("computer")
    before_pack = api("state")
    page.locator("#packTab").click()
    page.locator("#pack").get_by_role("button", name="chip", exact=True).click()
    expect(page.locator("#packCard")).to_contain_text("68000")
    expect(page.locator("#packCard").get_by_role("button", name="Insert chip", exact=True)).to_be_visible()
    after_pack = api("state")
    for field in ("scene", "hp", "inventory", "objects", "characters"):
        assert before_pack[field] == after_pack[field], "Pack study changed " + field
    page.locator("#packCard").get_by_role("button", name="Insert chip", exact=True).click()
    idle()
    assert any(obj["id"] == 2718 for obj in api("state")["objects"])

    # Live colour and monochrome modes retain their native dimensions and exact
    # binary monochrome output even with the new powered-computer effect.
    page.locator("#pictureMode").select_option("ink")
    page.wait_for_timeout(80)
    assert page.evaluate("""() => {
        const canvas = document.querySelector('#world');
        const data = canvas.getContext('2d').getImageData(0,0,338,314).data;
        const values = new Set();
        for (let i=0;i<data.length;i+=4) values.add(Array.from(data.slice(i,i+4)).join(','));
        return canvas.width===338 && canvas.height===314 && values.size===2;
    }"""), "Refreshed 1-bit acquired extra colours"
    page.locator("#layerBtn").click()
    expect(page.locator("#pictureMode")).to_have_value("original")
    page.locator("#layerBtn").click()
    expect(page.locator("#pictureMode")).to_have_value("ink")

    # Follow the real temple scripts from the shipped Dogleg bookmark. Hints
    # are read at every state and the original game receives only deliberate
    # exits/clicks. Door toggles are followed only while still in their room.
    page.locator("#bookmarks").click()
    page.get_by_role("button", name="Dogleg", exact=True).click()
    idle()
    room("dogleg")
    # Heal legally in this safe room before the original random spider encounter.
    # This is the same native spell a player can use, not a patched save or RNG.
    command("cast heal spell")
    assert not api("state")["ended"]
    hint_without_turn("Go east to the slide floor")
    command("open")
    hint_without_turn("Go east to the slide floor")
    command("east")
    room("slide floor")
    hint_without_turn("Go east immediately")
    command("east")
    room("jumping door")
    hint_without_turn("Go south")
    for _ in range(2):
        command("south")
        if api("state")["scene"] != 9691:
            break
        hint_without_turn("Go south")
    room("ball")
    hint_without_turn("Go south immediately")
    command("south")
    room("spikes")
    hint_without_turn("Click the floor stone first")
    click_object("AOBJ/10836")
    hint_without_turn("Go west")
    command("west")
    room("web")
    # The preserved ACOD randomly introduces SPIDER before processing CUT and
    # can consume that command. React to the actual actor and WEB.1 state, as
    # the clue now explains, rather than assuming one CUT removed the web.
    spider_frozen = False
    casts = 0
    cuts = 0
    while any(obj["id"] == 5800 for obj in api("state")["objects"]):
        snapshot = api("state")
        if any(actor["id"] == 30432 for actor in snapshot["characters"]) and not spider_frozen:
            # Native combat can miss; a failed cast is an in-world turn, never
            # a restarted test. Keep the original transcript on any failure.
            while not spider_frozen and casts < 8:
                command("cast freeze spell")
                casts += 1
                snapshot = api("state")
                if snapshot["ended"]:
                    print("SPIDER COMBAT FAILURE:", json.dumps(snapshot, ensure_ascii=True), flush=True)
                    print("JOURNAL:", page.locator("#log").inner_text()[-7000:], flush=True)
                    raise AssertionError("Original spider combat killed Saber before the web was cut")
                spider_frozen = "The spell is effective!" in snapshot["output"]
            assert spider_frozen, "Eight deliberate native freeze casts failed; test did not restart or change RNG"
        hint_without_turn("Type CUT")
        command("cut")
        cuts += 1
        assert cuts <= 2, "WEB.1 remained after encounter handling and two CUT commands"
    hint_without_turn("Go west")
    command("west")
    # The spider can stop a move on the original engine, as the hint warns. A player simply tries
    # again, so the test does too. It never restarts or changes the engine's dice.
    for _ in range(6):
        snapshot = api("state")
        if snapshot["ended"] or not any(actor["id"] == 30432 for actor in snapshot["characters"]):
            break
        if page.locator("#roomTitle").inner_text().strip().lower() != "web":
            break
        command("west")
    room("squasher")
    hint_without_turn("Click the narrow door")
    click_object("AOBJ/27105")
    hint_without_turn("Go west immediately")
    command("west")
    room("high altar")
    assert not api("state")["ended"], "Following the corrected temple clues killed Saber"

    assert not errors, errors
    assert not failures, failures
    print("Passed: private save; checkpoint/journal reload; legacy King save; imported-journal mismatch; death reload; busy command; Archive; Pack; native modes; live temple hint route.")
    print("Browser console/page errors: 0. HTTP failures: 0.")


def main():
    with tempfile.TemporaryDirectory(prefix="scepters-polish-acceptance-") as temporary:
        home = Path(temporary)
        with socket.socket() as reservation:
            reservation.bind(("127.0.0.1", 0))
            port = reservation.getsockname()[1]
        base = f"http://127.0.0.1:{port}/"
        process = subprocess.Popen(
            [str(ROOT / "engine/runtime/bin/java.exe"), f"-Duser.home={home}",
             "-jar", "engine/adventure.jar", "--test", str(port)],
            cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
        )
        try:
            for _ in range(100):
                if process.poll() is not None:
                    raise RuntimeError(process.stderr.read().decode(errors="replace"))
                try:
                    with urllib.request.urlopen(base, timeout=1):
                        break
                except OSError:
                    time.sleep(0.1)
            else:
                raise TimeoutError("Private test server did not start")
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(channel="chrome", headless=True, args=["--mute-audio"])
                try:
                    with browser.new_context(viewport={"width": 1280, "height": 900}) as context:
                        smoke(context.new_page(), base, home)
                finally:
                    browser.close()
        finally:
            process.terminate()
            process.communicate(timeout=15)


if __name__ == "__main__":
    main()
