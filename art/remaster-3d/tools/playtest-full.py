"""Exercise the full pack with the real renderer in a muted, temporary browser."""

from base64 import b64decode
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sys
from threading import Thread

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[3]
SCRIPTS = ["art/castle-index.js", "archive/dc/castle-data.js", "game/castle-plan.js",
           "game/castle-core.js", "game/enchanted-castle.js"]
PAGE = '<!doctype html><link rel="stylesheet" href="/game/style.css">' + ''.join(
    f'<script src="/{script}"></script>' for script in SCRIPTS)


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def review_renderer():
    renderer = (ROOT / SCRIPTS[-1]).read_text(encoding='utf-8')
    start = renderer.index('  function loadHD() {')
    end = renderer.index('  function prepareHDForegrounds()', start)
    loader = '''  function loadHD() {
    if (assets.hdLoaded) return assets.hdLoaded;
    assets.hd = {screens: new Map(), reels: new Map()};
    const masks = new Set(Object.values(window.CastlePlan.SCREENS.masks));
    const jobs = window.CastleGraphics.map(async asset => {
      const key = asset.fork.slice(-1) + asset.id;
      if (masks.has(key)) return;
      const image = await loadImage('/art/remaster-3d/full/4x/' + asset.path.split('/').at(-1));
      const original = (asset.type === 'PPCT' ? assets.reels : assets.screens).get(key);
      if (image.naturalWidth !== original.naturalWidth * HD_SCALE ||
          image.naturalHeight !== original.naturalHeight * HD_SCALE) throw new Error(key + ': invalid 4x size');
      if (asset.type === 'PPCT') assets.hd.reels.set(key, {img: image, mirror: false});
      else assets.hd.screens.set(key, image);
    });
    assets.hdLoaded = Promise.all(jobs).then(prepareHDForegrounds);
    return assets.hdLoaded;
  }
'''
    hook = '''window.EnchantedCastle.artReview = {
      counts: () => [assets.hd?.screens.size, assets.hd?.reels.size, assets.hd?.fronts?.size],
      rooms: () => window.CASTLE_DATA.order,
      draw: (id, high, capture) => {
        const snapshot = new window.CastleCore({data: window.CASTLE_DATA, plan: window.CastlePlan,
          difficulty: 0, ward: true, modern: true, seed: 2037});
        snapshot.enter(id, 0);
        const testCanvas = document.createElement('canvas'), testPainter = new Painter(testCanvas);
        testPainter.setScale(high ? HD_SCALE : 1);
        drawRoom(testPainter, snapshot, true);
        testPainter.show(false, snapshot.wing);
        const body = {x: snapshot.hero.x, y: snapshot.hero.y, state: snapshot.hero.state,
          box: snapshot.heroBox(), floor: snapshot.hero.floor?.y};
        return {body, used: [...testPainter.used], colour: testPainter.fullColour,
          pixels: capture ? testCanvas.toDataURL('image/png') : null};
      }
    };'''
    return renderer[:start] + loader + renderer[end:].replace(
        'window.EnchantedCastle = {open, session: null, scores};',
        'window.EnchantedCastle = {open, session: null, scores};\n  ' + hook, 1)


def run(output):
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{server.server_port}'
    renderer = review_renderer()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(channel='chrome', headless=True, args=['--mute-audio'])
            page = browser.new_page(reduced_motion='reduce')
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.route('**/art-review', lambda route: route.fulfill(body=PAGE, content_type='text/html'))
            page.route('**/game/enchanted-castle.js', lambda route: route.fulfill(
                body=renderer, content_type='application/javascript'))
            page.add_init_script("localStorage.setItem('castle-options', JSON.stringify({remastered:true}));")
            page.goto(url + '/art-review')
            page.evaluate('EnchantedCastle.open({})')
            page.wait_for_function('EnchantedCastle.debug.painter.scale === 4', timeout=45_000)
            review = page.evaluate('EnchantedCastle.artReview.counts()')
            assert review == [17, 172, 3], review
            rooms = page.evaluate('EnchantedCastle.artReview.rooms()')
            output.mkdir(parents=True, exist_ok=True)
            for room in rooms:
                capture = room in {1000, 1010, 2020, 3030, 4020}
                classic, full = page.evaluate('([room, capture]) => [EnchantedCastle.artReview.draw(room, false, false), '
                                              'EnchantedCastle.artReview.draw(room, true, capture)]', [room, capture])
                assert classic['body'] == full['body'], room
                assert classic['used'] == full['used'] and full['used'], room
                assert full['colour'] and not classic['colour'], room
                if full['pixels']:
                    (output / f'scene-{room}.png').write_bytes(b64decode(full['pixels'].split(',', 1)[1]))
            assert not errors, errors
            browser.close()
            print(json.dumps({'playableRoomsRendered': len(rooms), 'visibleScreensDecoded': review[0],
                              'reelsDecoded': review[1], 'foregroundLayers': review[2],
                              'matchingRoomEntryState': True, 'screenshotDirectory': str(output)}))
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    run(Path(sys.argv[1]).resolve())
