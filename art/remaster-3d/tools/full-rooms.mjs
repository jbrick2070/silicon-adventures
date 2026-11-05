// Full-screen material relief derived exclusively from the original 1-bit art.
// This module changes shading only: no source coordinate, pixel, edge or text is
// resampled. The caller applies the shared final tonal/alpha constraints.
import { SCALE, distance, blurField, shadeRelief } from './full-shading.mjs';

const MASK_IDS = new Set([2022, 3012, 3032]);
const CAVE_IDS = new Set([2010, 2020, 2030]);
const EXTERIOR_IDS = new Set([2000, 3010, 3030]);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const mix = (a, b, t) => a.map((v, c) => v * (1 - t) + b[c] * t);
const inside = (x, y, r) => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1;

function components(mask, w, h) {
  const labels = new Int32Array(w * h).fill(-1), queue = new Int32Array(w * h), rows = [];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || labels[start] >= 0) continue;
    const row = { id: rows.length, x0: w, y0: h, x1: 0, y1: 0, count: 0, sx: 0, sy: 0 };
    let head = 0, tail = 1;
    queue[0] = start; labels[start] = row.id;
    while (head < tail) {
      const p = queue[head++], x = p % w, y = Math.floor(p / w);
      row.count++; row.sx += x; row.sy += y;
      row.x0 = Math.min(row.x0, x); row.y0 = Math.min(row.y0, y);
      row.x1 = Math.max(row.x1, x + 1); row.y1 = Math.max(row.y1, y + 1);
      for (const next of [x ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (next >= 0 && mask[next] && labels[next] < 0) { labels[next] = row.id; queue[tail++] = next; }
      }
    }
    row.width = row.x1 - row.x0; row.height = row.y1 - row.y0;
    row.fill = row.count / (row.width * row.height);
    rows.push(row);
  }
  return { labels, rows };
}

function nearestLabels(labels, w, h) {
  const near = new Int32Array(labels), queue = new Int32Array(labels.length);
  let head = 0, tail = 0;
  for (let p = 0; p < labels.length; p++) if (labels[p] >= 0) queue[tail++] = p;
  while (head < tail) {
    const p = queue[head++], x = p % w, y = Math.floor(p / w);
    for (const next of [x ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y ? p - w : -1, y < h - 1 ? p + w : -1]) {
      if (next >= 0 && near[next] < 0) { near[next] = near[p]; queue[tail++] = next; }
    }
  }
  return near;
}

function areaMean(src, w, h, radius) {
  const stride = w + 1, integral = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) { row += src[y * w + x]; integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1] + row; }
  }
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const x0 = Math.max(0, x - radius), x1 = Math.min(w, x + radius + 1);
    const y0 = Math.max(0, y - radius), y1 = Math.min(h, y + radius + 1);
    out[y * w + x] = (integral[y1 * stride + x1] - integral[y1 * stride + x0] - integral[y0 * stride + x1] + integral[y0 * stride + x0]) / ((x1 - x0) * (y1 - y0));
  }
  return out;
}

function ladderColumns(rows) {
  // Ladder holes are wider and taller than the repeating 7x3 brick cells.
  // A column needs six actual enclosed holes; arch blocks and slots fail.
  const groups = new Map(), ladders = [];
  for (const r of rows) {
    if (r.width < 9 || r.width > 15 || r.height < 4 || r.height > 10 || r.fill < .6) continue;
    const key = `${r.x0}:${r.x1}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  for (const group of groups.values()) {
    group.sort((a, b) => a.y0 - b.y0);
    let run = [];
    const flush = () => {
      if (run.length >= 6 && run.at(-1).y1 - run[0].y0 >= 40) ladders.push({ x0: run[0].x0 - 3, x1: run[0].x1 + 3, y0: Math.max(0, run[0].y0 - 5), y1: run.at(-1).y1 + 4, holes: new Set(run.map(r => r.id)) });
      run = [];
    };
    for (const r of group) {
      if (run.length && r.y0 - run.at(-1).y1 > 13) flush();
      run.push(r);
    }
    flush();
  }
  return ladders;
}

function sourceLadders(white, black, w, h) {
  // A real ladder has two continuous source-white rails 16 pixels apart,
  // black borders beside both rails, and repeated white rungs between them.
  // This also finds ladders whose holes contain the room's brick texture.
  const rails = [];
  for (let x = 1; x < w - 1; x++) {
    let start = -1;
    for (let y = 0; y <= Math.min(h, 310); y++) {
      if (y < h && y < 310 && white[y * w + x]) { if (start < 0) start = y; continue; }
      if (start >= 0 && y - start >= 24) {
        let border = 0;
        for (let yy = start; yy < y; yy++) border += black[yy * w + x - 1] + black[yy * w + x + 1];
        if (border / (2 * (y - start)) > .58) rails.push({ x, y0: start, y1: y });
      }
      start = -1;
    }
  }
  const result = [];
  for (const a of rails) for (const b of rails) {
    if (b.x - a.x !== 16) continue;
    const y0 = Math.max(a.y0, b.y0), y1 = Math.min(a.y1, b.y1);
    if (y1 - y0 < 28) continue;
    const rungs = [];
    for (let y = y0; y < y1; y++) {
      let count = 0;
      for (let x = a.x + 1; x < b.x; x++) count += white[y * w + x];
      if (count >= 13 && (!rungs.length || y - rungs.at(-1) >= 3)) rungs.push(y);
    }
    if (rungs.length >= 3 && rungs.at(-1) - rungs[0] >= 18) result.push({ x0: a.x - 1, x1: b.x + 2, y0, y1, rungs, explicit: true });
  }
  return result;
}

function sourceTrim(white, black, w, h) {
  const trim = new Uint8Array(w * h);
  for (let y = 2; y < Math.min(h - 2, 310); y++) {
    let start = -1;
    for (let x = 0; x <= w; x++) {
      if (x < w && white[y * w + x]) { if (start < 0) start = x; continue; }
      if (start >= 0 && x - start >= 28) {
        let bounded = 0;
        for (let xx = start; xx < x; xx++) bounded += (black[(y - 1) * w + xx] || black[(y - 2) * w + xx]) && (black[(y + 1) * w + xx] || black[(y + 2) * w + xx]) ? 1 : 0;
        if (bounded / (x - start) >= .72) for (let xx = start; xx < x; xx++) {
          trim[y * w + xx] = 1;
          if (black[(y - 1) * w + xx]) trim[(y - 1) * w + xx] = 1;
          if (black[(y + 1) * w + xx]) trim[(y + 1) * w + xx] = 1;
        }
      }
      start = -1;
    }
  }
  return trim;
}

const PALETTES = {
  stone: { wall: [169, 181, 186], recess: [149, 165, 177], trim: [229, 205, 163], rope: [218, 183, 124], dark: [76, 87, 99] },
  cave: { wall: [172, 175, 170], recess: [146, 163, 174], trim: [206, 190, 155], rope: [216, 184, 132], dark: [63, 78, 92] },
  exterior: { wall: [176, 182, 179], recess: [161, 181, 194], trim: [224, 208, 172], rope: [219, 184, 126], dark: [70, 82, 101] },
  title: { wall: [167, 179, 188], recess: [167, 184, 195], trim: [227, 203, 159], rope: [196, 170, 131], dark: [69, 76, 93] },
};

function expandOriginal(source) {
  const { width: w, height: h, data } = source, W = w * SCALE, out = Buffer.alloc(W * h * SCALE * 4);
  for (let y = 0; y < h * SCALE; y++) for (let x = 0; x < W; x++) {
    const from = (Math.floor(y / SCALE) * w + Math.floor(x / SCALE)) * 4;
    const to = (y * W + x) * 4;
    for (let c = 0; c < 4; c++) out[to + c] = data[from + c];
  }
  return out;
}

export function renderRoom(asset, source) {
  const id = Number(asset.id), { width: w, height: h, data } = source;
  if (w !== 512 || h !== 342 || data.length !== w * h * 4) throw new Error(`Unexpected room dimensions for ${asset.path}: ${w}x${h}`);
  if (MASK_IDS.has(id)) return expandOriginal(source);
  const title = id >= 10000, cave = CAVE_IDS.has(id), exterior = EXTERIOR_IDS.has(id);
  const palette = PALETTES[title ? 'title' : cave ? 'cave' : exterior ? 'exterior' : 'stone'];
  const N = w * h, W = w * SCALE, H = h * SCALE;
  const lightPixels = new Uint8Array(N), darkPixels = new Uint8Array(N);
  for (let p = 0; p < N; p++) { lightPixels[p] = data[p * 4] >= 128 ? 1 : 0; darkPixels[p] = 1 - lightPixels[p]; }
  const bright = components(lightPixels, w, h), dark = components(darkPixels, w, h);
  const near = nearestLabels(bright.labels, w, h), density = areaMean(darkPixels, w, h, 6), macroDensity = areaMean(darkPixels, w, h, 20);
  const nativeBlackDistance = distance(darkPixels, w, h);
  const ladders = title || id === 2000 ? [] : sourceLadders(lightPixels, darkPixels, w, h);
  // Connected holes cover the occasional short ladder that lacks long rails.
  if (!title && id !== 2000) for (const candidate of ladderColumns(bright.rows)) {
    if (!ladders.some(r => Math.abs(r.x0 - candidate.x0) < 4 && r.y0 < candidate.y1 && candidate.y0 < r.y1)) ladders.push(candidate);
  }
  // Shield1's platform caps join its wall regions, so it needs this source-row
  // pass. Elsewhere long white mortar courses can satisfy the same pattern;
  // keep those rooms on the connected-slab classifier instead.
  const trim = id === 3000 ? sourceTrim(lightPixels, darkPixels, w, h) : new Uint8Array(N);
  const paperLabel = id === 15000 ? bright.labels[100 * w + 400] : -1;
  const material = new Uint8Array(N), base = new Float32Array(N), colors = new Float32Array(N * 3), shape = new Uint8Array(N), patina = new Uint8Array(N);
  // Codes: 0 wall, 1 brick, 2 trim, 3 rope/rail, 4 recess, 5 cavern,
  // 6 lettering/paper, 7 dark opening. Region membership remains source-derived.
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = y * w + x, r = bright.rows[near[p]], black = !!darkPixels[p], d = density[p];
    const blackRegion = dark.rows[dark.labels[p]];
    let type = 0, z = .7, color = palette.wall;
    const largeWhite = !r || r.count > 2000 || r.width > 150 || r.height > 130;
    const isBrick = r && r.count >= 5 && r.count <= 220 && r.width >= 3 && r.width <= 35 && r.height >= 2 && r.height <= 9 && r.fill > .48;
    const isSlab = r && r.count >= 35 && r.width >= 18 && r.height <= 8 && r.width / r.height >= 4 && r.fill > .64;
    const isCord = r && r.width <= 3 && r.height >= 24 && r.fill > .65;
    let ladder = null;
    for (const candidate of ladders) if (inside(x, y, candidate)) { ladder = candidate; break; }
    if (cave) {
      type = 5; z = .6 + 2.8 * clamp(1 - macroDensity[p], 0, 1);
      color = mix(palette.wall, [193, 176, 146], .12 + .12 * Math.sin(x / 97 + y / 111));
    } else if (largeWhite) {
      const facing = clamp((d - .065) / .25, 0, 1);
      type = facing < .5 ? 4 : 0; z = .15 + .85 * facing;
      color = mix(palette.recess, palette.wall, facing);
    } else if (isBrick) {
      type = 1; z = .9;
      const variation = 1 + .045 * Math.sin(r.id * 3.113 + id * .013);
      color = palette.wall.map(v => v * variation);
    }
    if (!title && (isSlab || trim[p])) { type = 2; z = 3.5; color = palette.trim; }
    if (!title && isCord) { type = 3; z = 3.2; color = palette.rope; }
    if (ladder) {
      const inHole = ladder.explicit
        ? x > ladder.x0 + 2 && x < ladder.x1 - 3 && !ladder.rungs.some(row => Math.abs(row - y) <= 1)
        : bright.labels[p] >= 0 && ladder.holes.has(bright.labels[p]);
      if (inHole) { type = 4; z = .15; color = palette.recess; }
      else { type = 3; z = 3.9; color = palette.rope; }
    }
    // Three source-straight ropes in Trouble1. Only their original three-pixel
    // strips receive rope material; this cannot reproduce the wandering paths
    // seen in unconstrained painted alternatives.
    if (id === 1000 && y >= 0 && y < 264 && ((x >= 416 && x <= 418) || (x >= 442 && x <= 444) || (x >= 469 && x <= 471))) {
      type = 3; z = 3.3; color = palette.rope;
    }
    if (black && nativeBlackDistance[p] > 1.5 && blackRegion?.count > 160 && !ladder) {
      type = 7; z = -2.1 - Math.min(1.8, nativeBlackDistance[p] * .06); color = palette.dark;
    }
    if (id === 3020 && y >= 295 && y <= 300 && (x < 51 || (x >= 172 && x < 219) || (x >= 375 && x < 506))) {
      // These three bottom landing pads use separate white cap stones, so no
      // single component is long enough for the automatic slab classifier.
      // The source's top/underside rows and vertical joints stay untouched.
      type = 2; z = 3.5; color = palette.trim;
    }
    if (id === 4010) {
      // The hanging wall pull and lower chain are small disconnected drawings.
      // Pick complete contained source components, never their background box.
      const pull = [{ x0: 182, y0: 63, x1: 201, y1: 100 }, { x0: 335, y0: 224, x1: 358, y1: 302 }];
      const region = black ? blackRegion : r;
      if (region && pull.some(box => region.x0 >= box.x0 && region.x1 <= box.x1 && region.y0 >= box.y0 && region.y1 <= box.y1)) { type = 3; z = 3.7; color = palette.rope; }
    }
    if (title) {
      // The cover art is embossed in cool stone and brass. The scores page's
      // paper and all original lettering remain exactly where the disk put it.
      if (id === 15000 && near[p] === paperLabel) { type = 6; z = 1.8; color = [231, 218, 187]; }
      else if ((id === 12000 || id === 12010) && blackRegion && blackRegion.x0 >= 230 && blackRegion.x1 <= 485 && blackRegion.y0 >= 120 && blackRegion.y1 <= 260 && blackRegion.count >= 400) {
        // Select actual connected lettering, not a rectangle across the sky.
        // Both words in 12000 are joined silhouettes; 12010 has outlined glyphs.
        type = 6; z = 2.7; color = [178, 154, 108];
      }
      else if (!black && largeWhite) { type = 4; z = -.5; color = palette.recess; }
    }
    // Source ink streaks are creases; isolated 1-bit stipple remains shallow
    // patina rather than being interpreted as a field of tall blocks.
    let horizontal = 1, vertical = 1;
    if (black) for (const sign of [-1, 1]) for (let k = 1; k <= 3; k++) {
      const xx = x + sign * k; if (xx < 0 || xx >= w || !darkPixels[y * w + xx]) break; horizontal++;
    }
    if (black) for (const sign of [-1, 1]) for (let k = 1; k <= 3; k++) {
      const yy = y + sign * k; if (yy < 0 || yy >= h || !darkPixels[yy * w + x]) break; vertical++;
    }
    shape[p] = horizontal >= 3 || vertical >= 3 ? 1 : 0;
    const tiny = black ? blackRegion && blackRegion.count <= 4 && !shape[p] : r && r.count <= 4 && r.width <= 4 && r.height <= 4;
    if (tiny && type !== 2 && type !== 3 && type !== 6 && !ladder) {
      // Retain every stipple bit, but treat it as patina. Tiny white specks in
      // black masonry must not cast the same tall shadow as a whole ledge.
      patina[p] = 1;
      if (!black && density[p] > .45) z = Math.max(-.65, z - .8);
    }
    material[p] = type; base[p] = z;
    const keyPool = Math.exp(-(((x - 80) / 420) ** 2) - ((y - 25) / 300) ** 2);
    const ambient = title ? .96 + .06 * keyPool : .88 + .13 * keyPool;
    for (let c = 0; c < 3; c++) colors[p * 3 + c] = color[c] * ambient + (title ? 0 : [9, 3, -3][c] * keyPool + [0, 2, 7][c] * (1 - keyPool));
  }
  const wideBase = areaMean(base, w, h, 10);
  const alpha = new Uint8Array(W * H), ink = new Uint8Array(W * H), white4 = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = Math.floor(y / SCALE) * w + Math.floor(x / SCALE), q = y * W + x;
    alpha[q] = data[p * 4 + 3]; ink[q] = darkPixels[p]; white4[q] = lightPixels[p];
  }
  const whiteDistance = distance(white4, W, H);
  let heights = new Float32Array(W * H);
  const albedo = new Float32Array(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = Math.floor(y / SCALE) * w + Math.floor(x / SCALE), q = y * W + x;
    const type = material[p], white = !!white4[q], d = whiteDistance[q] / SCALE;
    let z = base[p], bump = 0;
    if (type === 1) bump = white ? .48 * Math.sqrt(clamp(d / 1.4, 0, 1)) : -.16;
    else if (type === 2 || type === 3 || type === 6) bump = white ? 1.15 * Math.sqrt(1 - (1 - clamp(d / 1.4, 0, 1)) ** 2) : -.28;
    else if (type === 5) bump = white ? .4 * Math.sqrt(clamp(d / 2.4, 0, 1)) : shape[p] ? -.20 : -.03;
    else if (type === 0) bump = white ? .14 + .25 * clamp(d / 1.4, 0, 1) : shape[p] ? -.12 : .08;
    else if (type === 4) bump = white ? .04 * clamp(d, 0, 1) : -.015;
    heights[q] = z + (patina[p] ? bump * .18 : bump);
    // Broad ambient contact beneath taller regions augments the shared light's
    // directional shadow pass. It never adds edges or changes the source ink.
    const contact = 1 - .12 * clamp((wideBase[p] - z) / 2.6, 0, 1);
    const grain = 1 + .006 * Math.sin(x * 1.31 + y * .79) + .004 * Math.sin(x * .37 - y * 1.79);
    const diffuseVariation = cave ? 1 + .025 * Math.sin(x / 57 + Math.sin(y / 71)) : 1;
    for (let c = 0; c < 3; c++) albedo[q * 3 + c] = colors[p * 3 + c] * contact * grain * diffuseVariation;
    // Remove specular prominence from isolated dark stipple without deleting it.
    if (!white && !shape[p] && (type === 0 || type === 4 || type === 5)) for (let c = 0; c < 3; c++) albedo[q * 3 + c] *= .96;
  }
  heights = blurField(heights, W, H);
  const result = shadeRelief({ heightField: heights, albedo, alpha, ink, width: W, height: H, kind: 'room' });
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = Math.floor(y / SCALE) * w + Math.floor(x / SCALE), q = (y * W + x) * 4;
    if (!patina[p]) continue;
    const target = darkPixels[p] ? (cave ? [112, 116, 119] : [112, 119, 125]) : (cave ? [153, 153, 146] : [150, 158, 164]);
    for (let c = 0; c < 3; c++) result[q + c] = Math.round(result[q + c] * .35 + target[c] * .65);
  }
  if (!title) {
    // The original 32-row HUD reservation is data, not scenery. Copy all four
    // channels exactly rather than assuming that future screens are pure white.
    for (let y = 310 * SCALE; y < H; y++) for (let x = 0; x < W; x++) {
      const p = (Math.floor(y / SCALE) * w + Math.floor(x / SCALE)) * 4, q = (y * W + x) * 4;
      for (let c = 0; c < 4; c++) result[q + c] = data[p + c];
    }
  }
  return result;
}
