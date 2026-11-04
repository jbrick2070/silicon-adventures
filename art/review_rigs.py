"""Render the cover preview through the game's own L handler. No journey or audio.

  python art/review_rigs.py http://127.0.0.1:PORT OUTPUT_DIR [ASCN_ID ...]
Requires Pillow, Playwright and local Chrome. Run against an isolated --test server.
"""
import argparse
import base64
import csv
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ART = Path(__file__).resolve().parent

# Borrow the idle cover's view, which gives the scratch room the real L handler.
# No engine action is needed. Capture the two output colours without resizing.
CAPTURE = """async id => {
  const v = window.auditView, R = window.RefreshEngine;
  const scene = ES_DESIGNS.find(d => d.type === 'ASCN' && d.id === id);
  await v.load(scene);
  const poses = [], stats = {}, walls = {};
  function check(ok, msg) { if (!ok) throw Error(id + ' ' + msg); }
  function capture(label) {
    v.render();
    check(v.canvas.width === 338 && v.canvas.height === 314, 'viewport');
    check(v.pixels.every(px => px === v.ink || px === v.paper), 'third colour at ' + label);
    check(v.depth.every(t => t > 0 && Number.isFinite(t)), 'invalid depth at ' + label);
    poses.push([label, v.canvas.toDataURL().split(',')[1]]);
  }
  function toggle(enabled) {
    document.dispatchEvent(new KeyboardEvent('keydown', {key:'l', bubbles:true}));
    document.dispatchEvent(new KeyboardEvent('keyup', {key:'l', bubbles:true}));
    check(v.refreshed === enabled && v.rig === (enabled ? v.refreshRig : v.origRig), 'L routing');
    check(document.getElementById('layerBtn').getAttribute('aria-pressed') === String(enabled), 'L button');
  }
  const shade = R.shadeUnseenWorld;
  R.shadeUnseenWorld = function(view, face, ...rest) {
    const bit = shade(view, face, ...rest);
    if (Math.abs(face) < 3) {
      const w = walls[face] ||= [0,0];
      w[bit-1]++;
    }
    return bit;
  };
  try {
    check(v.refreshed && v.source.tones, 'refresh assets');
    toggle(false);
    capture('Original doorway');
    const original = v.pixels.slice();
    check(original.every((px, i) => px === (v.source.bits[i] === 1 ? v.ink : v.paper)), 'disk registration');
    toggle(true);
    capture('Refreshed doorway');
    const different = original.reduce((n, px, i) => n + (px !== v.pixels[i]), 0);
    stats.drift = different / original.length;
    check(stats.drift <= .015, 'doorway drift ' + stats.drift);
    v.move(0, 2.5);
    stats.walk = v.pose.z;
    check(Math.abs(stats.walk - 2.5) < 1e-7, 'requested walk outside rig');
    capture('Walk  z=' + v.pose.z.toFixed(2));
    v.reset();
    for (const yaw of [-1.4, 1.4]) {
      v.pose.yaw = yaw; capture('Turn  yaw=' + yaw);
    }
    v.reset();
    for (let z = 0; z < v.rig.back + 1; z += .1) v.move(0, .1);
    check(Math.abs(v.pose.z - (v.rig.back-.14)) < 1e-7, 'wall stop');
    stats.back = v.pose.z;
    v.render();
    check(v.depth.every(t => t > 0 && Number.isFinite(t)), 'front wall depth');
    v.pose.yaw = Math.PI;
    capture('At back wall, facing entrance');
    const atWall = v.pixels.slice();
    toggle(false);
    capture('L at wall  Original');
    toggle(true);
    capture('L again  Refreshed');
    check(v.pose.z === stats.back && atWall.every((px, i) => px === v.pixels[i]), 'L round trip');
    if (v.rig.back > v.origRig.back) {
      toggle(false);
      v.move(0, .25); // Looking back into the room, away from the clamped wall.
      const walked = v.pose.z;
      toggle(true);
      check(v.pose.z === walked, 'walking after L restored a stale position');
    }
    check(Object.values(walls).every(([ink,paper]) => ink + paper < 64 || (ink && paper)), 'solid unseen wall');
    for (const [surface, pattern] of Object.entries(v.rig.unseen || {})) {
      if (typeof pattern !== 'number') continue;
      const tile = ScepterPatterns[pattern];
      check(pattern >= 1 && pattern <= 29 && tile?.some(row => row !== 0) &&
        tile.some(row => row !== 255), 'solid or unknown ' + surface + ' pattern');
    }
    // Check each side/rear face at close and far distances, away from doors,
    // edges and mortar. An 8x8 tile must use both output colours.
    stats.wallInk = [];
    for (const t of [2, 8]) for (const face of [-1, 1, 2]) {
      let ink = 0;
      for (let x=0;x<8;x++) for(let y=0;y<8;y++) {
        if(shade(v, face, 1.37, 1.16, 3.39, t, x, y, .1, -.08, -1) === 1) ink++;
      }
      stats.wallInk.push(ink);
      check(ink > 0 && ink < 64, 'solid unseen sample, face ' + face + ' t=' + t);
    }
    // Check source-sized sprite registration on both horizons, including in
    // rooms where the disk initially places no inhabitant or pickup.
    v.reset();
    const residents = ES_DESIGNS.filter(d => ['ACHR','AOBJ'].includes(d.type) &&
      d.initialLocation?.toLowerCase() === scene.name.toLowerCase());
    const fixtures = residents.length ? residents : [ES_DESIGNS.find(d => d.type === 'AOBJ' && d.id === 14168)];
    for (const m of fixtures) await v.add(m, m.type + '/' + m.id);
    for (const refreshed of [false, true]) {
      toggle(refreshed);
      for (const s of v.sprites) {
        const m = s.plate, r = v.rig, scale = r.focal / s.z;
        check(s.texture.w === m.width && s.texture.h === m.height, 'sprite frame ' + s.key);
        check(Math.abs(s.w*scale-m.width) < 1e-6 && Math.abs(s.h*scale-m.height) < 1e-6 &&
          Math.abs(r.cx+s.x*scale-m.x-m.width/2) < 1e-6 &&
          Math.abs(r.cy-(s.y-r.eye)*scale-m.y-m.height) < 1e-6, 'sprite anchor ' + s.key);
      }
    }
    stats.sprites = fixtures.length;
    v.cache.clear();
    return {name:scene.name,poses,stats};
  } finally { R.shadeUnseenWorld = shade; }
}"""


def sheet(name, ident, poses, path):
    canvas = Image.new("1", (338 * 2, (314 + 20) * 4), 1)
    draw = ImageDraw.Draw(canvas)
    for i, (label, data) in enumerate(poses):
        x, y = i % 2 * 338, i // 2 * 334
        frame = Image.open(io.BytesIO(base64.b64decode(data))).convert("L")
        assert frame.size == (338, 314)
        canvas.paste(frame.point(lambda p: 255 if p > 127 else 0, "1"), (x, y + 20))
        draw.text((x + 3, y + 2), f"{ident} {name} | {label}", fill=0)
    canvas.save(path)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("server")
    p.add_argument("out", type=Path)
    p.add_argument("ids", nargs="*", type=int)
    args = p.parse_args()
    full_review = not args.ids
    if full_review:
        with (ART / "refresh/room-review.tsv").open(encoding="utf-8") as source:
            args.ids = [int(r["id"]) for r in csv.DictReader(source, delimiter="\t")
                        if r["status"] != "left generic"]
    args.out.mkdir(parents=True, exist_ok=True)
    errors = []
    metrics = [["id", "doorway_drift_percent", "walk_z", "wall_stop_z", "sprite_frames",
                "side_and_rear_ink_per_64_near_then_far"]]
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel="chrome", args=["--mute-audio"])
        page = browser.new_page()
        page.on("pageerror", lambda err: errors.append(str(err)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.goto(args.server)
        page.locator("#soundBtn").click()
        assert page.locator("#soundLabel").inner_text() == "off"
        # The cover renderer has no sound or simulation. Capture its instance
        # on the next frame without exporting a test hook in the game.
        page.evaluate("""() => {
          const render = PlateView.prototype.render;
          PlateView.prototype.render = function(...args) {
            if (this.source) { window.auditView = this; PlateView.prototype.render = render; }
            return render.apply(this, args);
          };
          document.getElementById('homeView').click();
        }""")
        page.wait_for_function("window.auditView?.source && !document.getElementById('cover').hidden")
        for ident in args.ids:
            result = page.evaluate(CAPTURE, ident)
            sheet(result["name"], ident, result["poses"], args.out / f"{ident}.png")
            s = result["stats"]
            row = [ident, f"{100*s['drift']:.4f}", f"{s['walk']:.2f}", f"{s['back']:.2f}",
                   s["sprites"], ",".join(map(str, s["wallInk"]))]
            metrics.append(row)
            print(*row, sep="\t", flush=True)
        browser.close()
    if errors:
        raise RuntimeError(json.dumps(errors))
    if full_review:
        with (args.out / "verification.tsv").open("w", encoding="utf-8", newline="") as output:
            csv.writer(output, delimiter="\t", lineterminator="\n").writerows(metrics)
    print("0 browser console or page errors")


if __name__ == "__main__":
    main()
