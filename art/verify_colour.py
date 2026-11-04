"""Silent browser audit of the playable colour mode. Start an isolated --test server first.

python art/verify_colour.py http://127.0.0.1:PORT/ [--out DIR] [--all-sheets]
Requires Playwright, Chrome and Pillow. The audit permits only the idle state API.
"""

import argparse
import base64
import csv
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

# Every room is tested. By default the optional output contains native panels for
# representative landmarks, open landscapes, underwater rooms and both odd-size plates.
EXAMPLES = {
    7990,
    21149,
    17888,
    22844,
    9709,
    23272,
    327,
    4223,
    15787,
    14688,
    7039,
    14057,
    12464,
    14750,
    4684,
    18458,
    27025,
    18366,
    9387,
}
SETUP = """() => {
  window.audit = new PlateView(document.createElement('canvas'));
  window.need = (ok, message) => { if (!ok) throw Error(message); };
  window.dark = px => Math.max(px & 255, (px >>> 8) & 255, (px >>> 16) & 255) <= 72;
}"""
CHART = """() => {
  const rooms = ES_DESIGNS.filter(r => r.type === 'ASCN');
  const chart = new WorldMap(document.createElement('canvas'), rooms);
  const current = rooms[0];
  for (const seen of [rooms.map(() => 1), rooms.map((r, i) => i % 2)]) {
    chart.draw(seen, current.id);
    const original = chart.pixels.slice();
    chart.draw(seen, current.id, true);
    need(original.every((p, i) => (p === chart.ink) === (chart.pixels[i] === chart.ink)), 'chart ink');
    rooms.forEach((r, i) => {
      const x0 = (r.worldX - 1) * chart.cell, y0 = (r.worldY - 1) * chart.cell;
      let changed = false;
      for (let y=1;y<chart.cell;y++) for (let x=1;x<chart.cell;x++) {
        const pixel = (y0+y)*chart.w + x0+x;
        if (original[pixel] !== chart.pixels[pixel]) changed = true;
      }
      need(changed === (r.id !== current.id && !!seen[i]), 'chart fog, marker or colour '+r.id);
    });
    chart.draw(seen, current.id);
    need(original.every((p, i) => p === chart.pixels[i]), 'chart monochrome round trip');
  }
}"""
ROOM = """async ([id, save]) => {
  const v = window.audit;
  const scene = ES_DESIGNS.find(d => d.type === 'ASCN' && d.id === id);
  v.setColour(false); v.setRefreshed(true);
  await v.load(scene);
  const check = (ok, msg) => need(ok, id + ' ' + msg);
  const panels = [];
  const panel = title => { if (save) panels.push([title, v.canvas.toDataURL().split(',')[1]]); };
  const matches = frame => frame.every((x, i) => v.pixels[i] === x);
  const mono = () => check(v.pixels.every(x => x === v.ink || x === v.paper), 'third monochrome colour');
  const finite = () => check(v.depth.every(t => Number.isFinite(t) && t > 0), 'invalid ray depth');
  function checkInk(at) {
    let drift = 0;
    for (let i=0;i<v.pixels.length;i++) if (dark(v.pixels[i]) !== (v.source.bits[i] === 1)) drift++;
    check(!drift, at + ' disk mismatch in ' + drift + ' pixels');
  }
  v.setRefreshed(false); v.render(); mono(); checkInk('Original');
  const original = v.pixels.slice();
  panel('Original doorway');
  v.setRefreshed(true); v.render(); mono();
  const refreshed = v.pixels.slice();
  v.setColour(true); v.render(); finite(); checkInk('Colour');
  check(v.canvas.width === 338 && v.canvas.height === 314, 'native canvas');
  check(ColourIndex.rooms[id] && v.colourRoom.themeName, 'missing room palette');
  for (const tex of [v.source, v.refreshClean, ...v.solids.map(s => s.layer).filter(Boolean)])
    check(tex.materials?.length === tex.w * tex.h, 'missing material pixels');
  const colours = new Set(v.pixels).size;
  check(colours > 2, 'monochrome doorway');
  panel('Lit doorway');
  v.move(0, 2.5);
  v.render(); finite();
  check(v.pose.z >= v.rear + .14 - 1e-6 && v.pose.z <= v.rig.back - .14 + 1e-6 &&
        v.pose.x >= v.rig.left + .14 - 1e-6 && v.pose.x <= v.rig.right - .14 + 1e-6, 'walk bounds');
  if (!v.solids.length) check(Math.abs(v.pose.z - Math.min(2.5, v.rig.back - .14)) < 1e-6, 'walk distance');
  panel('Walk z=' + v.pose.z.toFixed(2));
  v.reset();
  for (const yaw of [-1.4,1.4]) {
    v.pose.yaw = yaw; v.render(); finite();
    panel('Turn yaw=' + yaw);
  }
  v.reset();
  // Follow the actual collision method. A foreground solid may stop the walk.
  for (let z=0;z<v.rig.back+1;z+=.1) v.move(0,.1);
  v.pose.yaw = Math.PI;
  v.render(); finite(); panel('End of walk, facing entrance');
  const wall = v.pixels.slice();
  v.setRefreshed(false); v.render(); mono(); finite();
  v.setRefreshed(true); v.render(); finite();
  check(matches(wall), 'colour/Original round trip');
  v.reset(); v.setColour(false); v.render(); mono();
  check(matches(refreshed), 'changed Refreshed frame');
  v.setRefreshed(false); v.render(); mono();
  check(matches(original), 'changed Original frame');
  v.cache.clear();
  return {name:scene.name, theme:v.colourRoom.themeName, colours, panels};
}"""


SPRITES = """async () => {
  const v = window.audit;
  const meta = ES_DESIGNS.filter(d => ['ACHR','AOBJ'].includes(d.type) && d.width > 1);
  await v.load(ES_DESIGNS.find(d => d.type === 'ASCN' && d.id === 22673));
  v.setRefreshed(true); v.setColour(true); v.reset();
  let frames=0, icons=0, pixels=0;
  async function probe(m, key, cols, rows, native, flip) {
    const tex = await v.texture(m.path);
    const fw=m.width, fh=m.height;
    need(tex.w===fw*cols && tex.h===fh*rows.length, 'frame dimensions '+key);
    if (native) {
      need(tex.materials?.length === tex.w*tex.h,'sprite material mask '+key);
      const icon = await v.decodeImage(await v.colourIcon(m));
      need(icon.w===fw && icon.h===fh, 'Pack icon dimensions '+key);
      for (let i=0;i<tex.bits.length;i++) {
        const b=tex.bits[i], rgba=icon.rgba;
        need((rgba[4*i+3] >= 128) === !!b, 'icon silhouette '+key);
        if (b) need((Math.max(rgba[4*i],rgba[4*i+1],rgba[4*i+2])<=72) === (b===1),'icon ink '+key);
      }
      icons++;
    }
    const z=.75, r=v.rig, left=Math.floor((338-fw)/2), top=Math.floor((314-fh)/2);
    v.sprites=[];
    const s=await v.add(m,key,{cols,fw,fh,flip, x:(left+fw/2-r.cx)*z/r.focal,z,
      y:r.eye-(top+fh-r.cy)*z/r.focal,w:fw*z/r.focal,h:fh*z/r.focal});
    for(let row=0;row<rows.length;row++) for(let frame=0;frame<rows[row];frame++) {
      s.row=row;s.frame=frame;v.render();
      let opaque=0;
      for(let y=Math.max(0,top);y<Math.min(314,top+fh);y++) {
        for(let x=Math.max(0,left);x<Math.min(338,left+fw);x++) {
          const u=flip?fw-1-(x-left):x-left;
          const b=tex.bits[(row*fh+y-top)*tex.w+frame*fw+u];
          if (b) {
            opaque++; pixels++;
            need(dark(v.pixels[y*338+x]) === (b===1),'rendered sprite ink '+key+' '+frame);
          }
          if ((x+3*y)%11===0)
            need((v.hit(x+.5,y+.5)?.key===key)===!!b, 'native hit mask '+key+' '+frame);
        }
      }
      need(opaque>0,'empty sprite frame '+key); frames++;
    }
    v.sprites=[];v.cache.clear();
  }
  for (const m of meta) await probe(m,m.type+'/'+m.id,1,[1],true,false);
  await probe({path:'art/castle-wizard.png',width:48,height:46},'wizard',8,[8,7,6],false,false);
  for (const id of [300,908,912,915]) {
    const m=CastleGraphics.find(d=>d.type==='PPCT' && d.fork==='Data B' && d.id===id);
    await probe(m,'reel/'+id,m.frames,[m.frames],false,true);
  }
  return {icons,frames,pixels};
}"""


def write_sheet(target, name, panels):
    sheet = Image.new("RGB", (676, 3 * 334), "#e9eee8")
    labels = ImageDraw.Draw(sheet)
    for i, (label, data) in enumerate(panels):
        x, y = (i % 2) * 338, (i // 2) * 334
        with Image.open(BytesIO(base64.b64decode(data))) as frame:
            assert frame.size == (338, 314)
            sheet.paste(frame, (x, y + 20))
        labels.text((x + 3, y + 2), f"{name} | {label}", fill="#161816")
    sheet.save(target)


def cover_check(page):
    mode = page.locator("#pictureMode")
    page.wait_for_function("""document.querySelector('#world').width===338 &&
       new Set(new Uint32Array(document.querySelector('#world').getContext('2d')
       .getImageData(0,0,338,314).data.buffer)).size>2""")
    assert mode.input_value() == "colour"
    canvas = page.locator("#world")
    for style in ["ink", "colour"]:
        mode.select_option(style)
        canvas.focus()
        frame = canvas.evaluate("c => c.toDataURL()")
        page.keyboard.press("l")
        assert mode.input_value() == "original"
        assert frame != canvas.evaluate("c => c.toDataURL()")
        page.locator("#layerBtn").click()
        assert mode.input_value() == style and frame == canvas.evaluate("c => c.toDataURL()")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("server")
    parser.add_argument("--out", type=Path)
    parser.add_argument("--all-sheets", action="store_true")
    args = parser.parse_args()
    if args.out:
        args.out.mkdir(parents=True, exist_ok=True)
    errors = []

    def gate(route):
        if route.request.url.rsplit("/", 1)[-1] == "state":
            route.continue_()
        else:
            errors.append("Unexpected game action " + route.request.url)
            route.abort()

    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel="chrome", args=["--mute-audio"])
        page = browser.new_page()
        page.on("pageerror", lambda err: errors.append(str(err)))
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        page.route("**/api/*", gate)
        page.goto(args.server)
        page.locator("#soundBtn").click()
        assert page.locator("#soundLabel").inner_text() == "off"
        cover_check(page)
        page.evaluate(SETUP)
        page.evaluate(CHART)
        ids = page.evaluate("ES_DESIGNS.filter(d=>d.type==='ASCN').map(d=>d.id)")
        assert len(ids) == len(set(ids)) == 200
        rows = []
        for ident in ids:
            take_sheet = bool(args.out and (args.all_sheets or ident in EXAMPLES))
            r = page.evaluate(ROOM, [ident, take_sheet])
            if take_sheet:
                write_sheet(args.out / f"{ident}.png", r["name"], r["panels"])
            rows.append([ident, r["name"], r["theme"], r["colours"]])
        sprites = page.evaluate(SPRITES)
        browser.close()
    if errors:
        raise RuntimeError(errors)
    if args.out:
        with (args.out / "colour-results.tsv").open("w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f, delimiter="\t", lineterminator="\n")
            writer.writerow(["id", "room", "theme", "doorway_colours"])
            writer.writerows(rows)
    print(f"{len(rows)} rooms, exact disk ink at every doorway, both monochrome round trips")
    print(
        f"{sprites['icons']} native icons, {sprites['frames']} sprite frames, "
        f"{sprites['pixels']} opaque viewport pixels checked"
    )
    print("0 browser console or page errors")


if __name__ == "__main__":
    main()
