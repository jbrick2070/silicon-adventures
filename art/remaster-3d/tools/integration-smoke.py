"""Acceptance test for the full-pack toggle after renderer integration.

Run from the repository root: python art/remaster-3d/tools/integration-smoke.py
Full-mode assertions require the full loader and runtime rope mask first.
The test serves the checkout on loopback and uses a temporary, muted Chrome
profile. It writes scene captures to the remaster work directory by default.
"""

import argparse
from base64 import b64decode
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[3]
DEFAULT_OUTPUT = ROOT / "art/remaster-3d/work/live-scenes"
SCRIPTS = (
    "art/castle-index.js",
    "archive/dc/castle-data.js",
    "game/castle-plan.js",
    "game/castle-core.js",
    "game/enchanted-castle.js",
)
HARNESS = ('<!doctype html><meta charset="utf-8">'
           '<title>Castle remaster smoke test</title>'
           '<link rel="stylesheet" href="/game/style.css">'
           + ''.join(f'<script src="/{name}"></script>' for name in SCRIPTS)).encode()


class CastleHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path != "/castle-remaster-smoke":
            return super().do_GET()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(HARNESS)))
        self.end_headers()
        self.wfile.write(HARNESS)

    def log_message(self, *_args):
        pass


ROOM_SCENE = """
async ({id, scale, capture}) => {
  const E = EnchantedCastle;
  const image = new Image();
  const directory = scale === 4 ? 'art/remaster-3d/full/4x' : 'art/castle';
  image.src = `${directory}/B-PSCR-${id}.png`;
  await image.decode();

  E.debug.begin(0);
  const core = E.session.core();
  core.preview = true;
  core.ward = true;
  core.fixedLedges = 0;
  core.enter(id, 0);
  core.hero.safe = 9999;
  const hero = core.hero;
  const entry = {x: hero.x, y: hero.y, state: hero.state, box: core.heroBox()};
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const painter = E.debug.painter;
  const {width, height} = painter.canvas;
  const reference = document.createElement('canvas');
  reference.width = width;
  reference.height = height;
  const ctx = reference.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0);
  const wanted = ctx.getImageData(0, 0, width, height).data;
  const actual = painter.ctx.getImageData(0, 0, width, height).data;
  let samples = 0, matches = 0, coloured = 0;
  // Sample the room above the HUD; actors can cover some reference pixels.
  for (let y = 7 * scale; y < 300 * scale; y += 12 * scale) {
    for (let x = 7 * scale; x < width; x += 12 * scale) {
      const i = (y * width + x) * 4;
      samples++;
      if (actual[i] === wanted[i] && actual[i + 1] === wanted[i + 1] && actual[i + 2] === wanted[i + 2]) matches++;
      if (actual[i] !== actual[i + 1] || actual[i] !== actual[i + 2]) coloured++;
    }
  }
  return {width, height, fullColour: painter.fullColour, entry, samples, matches, coloured,
          image: capture ? painter.canvas.toDataURL('image/png') : null};
}
"""


ROPE_ALPHA = """
() => {
  const painter = EnchantedCastle.debug.painter;
  const ctx = painter.b;
  const side = 96 * painter.scale;
  const original = ctx.getImageData(0, 0, side, side);
  const rows = [];
  ctx.save();
  try {
    for (const reel of ['B510', 'B511']) {
      for (let frame = 0; frame < 6; frame++) {
        ctx.clearRect(0, 0, 96, 96);
        painter.reel(reel, frame, 0, 0);
        const pixels = ctx.getImageData(0, 0, side, side).data;
        let visible = 0;
        for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) visible++;
        rows.push({reel, frame, visible, total: side * side});
      }
    }
  } finally {
    ctx.restore();
    ctx.putImageData(original, 0, 0);
  }
  return rows;
}
"""


def toggle_art(page, enabled):
    page.locator('#castleGame [data-panel="menu"] [data-do="options"]').click()
    page.locator('#castleGame [data-opt="remastered"]').set_checked(enabled)
    page.wait_for_function('scale => EnchantedCastle.debug.painter.scale === scale',
                           arg=4 if enabled else 1, timeout=45_000)
    page.locator('#castleGame [data-panel="options"] [data-do="menu"]').click()
    page.locator('#castleGame [data-do="play"][data-level="0"]').click()


def check_room(page, room, scale, capture):
    state = page.evaluate(ROOM_SCENE, {"id": room, "scale": scale, "capture": capture})
    assert (state["width"], state["height"]) == (512 * scale, 342 * scale), (room, state)
    assert state["fullColour"] == (scale == 4), (room, state)
    assert state["matches"] >= state["samples"] * 0.8, (room, state["matches"], state["samples"])
    if scale == 4:
        assert state["coloured"] > state["samples"] // 2, (room, state["coloured"])
    else:
        assert state["coloured"] == 0, (room, state["coloured"])
    return state


def check_browser(page, output):
    page.evaluate('EnchantedCastle.open({colour: () => false})')
    page.wait_for_function("EnchantedCastle.debug?.view() === 'title'")
    assert page.evaluate('EnchantedCastle.debug.painter.scale') == 1

    toggle_art(page, True)
    inventory = page.evaluate('EnchantedCastle.debug.remaster()')
    assert inventory == {"kind": "full", "screens": 17, "reels": 172, "fronts": 3}, inventory
    remastered = {}
    output.mkdir(parents=True, exist_ok=True)
    for room in (2020, 3030, 4020, 1010):
        scene = check_room(page, room, 4, capture=True)
        encoded = scene.pop("image").split(',', 1)[1]
        (output / f"scene-{room}.png").write_bytes(b64decode(encoded))
        remastered[room] = scene

    remastered_ropes = page.evaluate(ROPE_ALPHA)
    for row in remastered_ropes:
        assert 0 < row["visible"] < row["total"] // 4, row

    page.locator('#castleGame .knock-tools [data-do="menu"]').click()
    toggle_art(page, False)
    for room in remastered:
        original = check_room(page, room, 1, capture=False)
        assert original["entry"] == remastered[room]["entry"], room
    for row in page.evaluate(ROPE_ALPHA):
        assert row["visible"] == row["total"], row

    return {"inventory": inventory, "rooms": remastered, "ropeFramesChecked": len(remastered_ropes),
            "originalModeRestored": True, "screenshotDirectory": str(output)}


def run(output):
    handler = partial(CastleHandler, directory=str(ROOT))
    with ThreadingHTTPServer(('127.0.0.1', 0), handler) as server:
        worker = Thread(target=server.serve_forever, daemon=True)
        worker.start()
        try:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(channel="chrome", headless=True, args=["--mute-audio"])
                try:
                    page = browser.new_page(reduced_motion="reduce")
                    errors = []
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    page.goto(f'http://127.0.0.1:{server.server_port}/castle-remaster-smoke')
                    summary = check_browser(page, output)
                    assert not errors, errors
                    print(json.dumps(summary, indent=2))
                finally:
                    browser.close()
        finally:
            server.shutdown()
            worker.join()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT)
    run(parser.parse_args().output.resolve())
