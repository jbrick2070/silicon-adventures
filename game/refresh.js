/* Non-destructive visual refresh layer for Enchanted Scepters.
 * Preserves the native 338 × 314 viewport, original plates, separated command
 * PNGs, and sprite dimensions/anchors while adding:
 *   1. Aligned High Altar 3D footprints, plinth-contact altar, and stair shaft
 *   2. Steady camera-coherent CODE 1 ScepterPatterns halftone rendering
 *   3. Lit stone, shadow, and distance modulation using the disk's tile ramp
 *   4. Drawn QuickDraw ink borders and bevels on newly visible 3D stone faces
 *   5. Separate 1-pixel paper silhouette rims for Dark Castle crossover reels
 */
(() => {
  'use strict';

  // Monotonic tonal ramp built strictly from original CODE 1 ScepterPatterns:
  // 1 (0%), 2 (6.2%), 3 (12.5%), 4 (25%), 13 (37.5%), 5 (50%), 6 (75%), 7 (87.5%), 8 (100%)
  const TONE_RAMP = [1, 2, 3, 4, 13, 5, 6, 7, 8];
  const RAMP_INDEX = {
    1: 0, 2: 1, 3: 2, 14: 2,
    4: 3, 10: 3, 12: 3,
    13: 4, 18: 4,
    5: 5,
    6: 6, 9: 6,
    7: 7,
    8: 8
  };

  function shiftPattern(pat, delta) {
    if (!delta || pat === 1 || pat === 8) return pat;
    const idx = RAMP_INDEX[pat];
    if (idx === undefined) return pat; // Preserve pictorial motifs (e.g. 15 door planks, 19 brick, 27 frieze)
    const next = Math.max(1, Math.min(7, idx + delta));
    return TONE_RAMP[next];
  }

  function samplePattern(pat, sx, sy) {
    const tiles = window.ScepterPatterns;
    if (!tiles || !tiles[pat]) return pat >= 6;
    return !!(tiles[pat][sy & 7] & (128 >> (sx & 7)));
  }

  function toneUrl(url) {
    if (!url) return null;
    if (url.startsWith('archive/es/plates/ASCN-')) {
      return 'art/refresh/plates/' + url.slice('archive/es/plates/'.length);
    }
    if (url.startsWith('art/foreground/')) {
      return 'art/refresh/foreground/' + url.slice('art/foreground/'.length);
    }
    if (/^art\/(altar|quarters|sanctum|court)-.+\.png$/.test(url)) {
      return 'art/refresh/' + url.slice(4);
    }
    return null;
  }

  function spriteRimUrl(url) {
    return window.RefreshPalette?.spriteRims?.[url] || null;
  }

  function buildPlanes(points) {
    const cx = points.reduce((v, p) => v + p[0], 0) / points.length;
    const cz = points.reduce((v, p) => v + p[1], 0) / points.length;
    return points.map(([ax, az], i) => {
      const [bx, bz] = points[(i + 1) % points.length];
      const len = Math.hypot(bz - az, bx - ax) || 1e-6;
      const ux = (bx - ax) / len, uz = (bz - az) / len;
      let nx = (az - bz) / len, nz = (bx - ax) / len;
      if (nx * (cx - ax) + nz * (cz - az) < 0) { nx = -nx; nz = -nz; }
      return { ax, az, bx, bz, len, ux, uz, nx, nz, offset: nx * ax + nz * az };
    });
  }

  // Refreshed High Altar (ASCN 7990) geometry layer:
  // Convex footprints enclose 100% of ASCN commands 16–20, 23, and 25–27 from
  // the doorway while leaving clear walking and gesture room behind left-column.
  window.AltarRefresh = {
    eye: 1.8, focal: 215, cx: 169, cy: 123,
    left: -2.16, right: 2.436, back: 5.55, ceiling: 3.38,
    wallTop: 2.834, courseH: 1.417, slabW: 1.28, slabD: 1.34,
    separatedShell: true,
    clean: 'art/altar-clean.png',
    solids: [
      {
        id: 'dais', kind: 'dais',
        footprint: [[-1.385, 3.721], [1.748, 3.721], [1.875, 5.235], [-1.480, 5.485]],
        y0: 0, y1: 0.172,
        texture: 'art/altar-dais.png', commands: [16, 23],
        patterns: { front: 4, top: 5, east: 5, west: 6, back: 6, side: 6 }
      },
      {
        id: 'left-column', kind: 'pillar',
        footprint: [[-1.275, 4.185], [-0.595, 4.185], [-0.478, 4.90], [-1.225, 4.86]],
        y0: 0.172, y1: 3.38, silhouette: true,
        texture: 'art/altar-column-left.png', commands: [19, 20],
        patterns: { front: 4, top: 7, east: 6, west: 5, back: 6, side: 5 }
      },
      {
        id: 'right-column', kind: 'pillar',
        footprint: [[1.012, 4.235], [1.602, 4.235], [1.555, 4.90], [0.918, 4.90]],
        y0: 0.172, y1: 3.38, silhouette: true,
        texture: 'art/altar-column-right.png', commands: [17, 18],
        patterns: { front: 4, top: 7, east: 5, west: 6, back: 6, side: 6 }
      },
      {
        id: 'plinth', kind: 'plinth',
        footprint: [[-0.341, 4.070], [0.842, 4.070], [0.855, 5.185], [-0.190, 5.185]],
        y0: 0.172, y1: 0.305,
        texture: 'art/altar-plinth.png', commands: [25, 26, 27],
        patterns: { front: 4, top: 5, east: 5, west: 6, back: 6, side: 6 },
        cavity: {
          footprint: [[-0.128, 4.425], [0.768, 4.425], [0.688, 4.790], [-0.004, 4.790]],
          z0: 4.425, z1: 4.790, top: 0.305, bottom: -0.46, steps: 3
        }
      }
    ],
    // AOBJ 14168 sits flush on the plinth top (y = 0.305) at native [160, 165, 45, 31].
    lid: { x: 0.27647, z: 4.40308, y: 0.305, w: 0.92158, h: 0.63486 }
  };

  // Refreshed rigs for landmark story rooms. Used only while view.refreshed is
  // true; the Original mode keeps the generic fallback rig. Horizons (cy) come
  // from the vanishing points of the drawn floor edges, depths from the wall
  // bases, and widths from the wall edges, all measured on the 338 × 314 ASCN
  // vector commands in archive/es/Scepters.rsrc. The `unseen` block names the
  // plate's own CODE 1 patterns so walls, floors and ceilings continue past the
  // plate edges without a step seam when the camera turns. The separated forms
  // under art/refresh/forms/ are lifted plate pixels (see art/build_refresh.py).
  const F = 'art/refresh/forms/';
  function post(x, z, rx, rz) { return [[x - rx, z - rz], [x + rx, z - rz], [x + rx, z + rz], [x - rx, z + rz]]; }
  window.RefreshRoomLayouts = {
    // Throne room: dais steps (Cmd 12–15) and obsidian throne (9–11, 16–21) stand free of the arcaded wall.
    17888: {
      cy: 92, left: -3.9, right: 3.9, back: 4.96, ceiling: 4.6, wallTop: 3.95, environment: 'chamber',
      clean: F + '17888-clean.png',
      unseen: { floor: 4, east: 3, west: 3, rear: 3, ceiling: 6, courses: false, baseboard: false },
      solids: [
        { id: 'dais-lower', kind: 'dais', texture: F + '17888-dais-lower.png', commands: [12, 13],
          footprint: [[-1.82, 2.46], [1.53, 2.46], [1.35, 3.71], [-1.88, 3.71]], y0: 0, y1: 0.16,
          patterns: { front: 8, top: 3, east: 5, west: 6, back: 6, side: 5 } },
        { id: 'dais-upper', kind: 'dais', texture: F + '17888-dais-upper.png', commands: [14, 15],
          footprint: [[-1.58, 2.64], [1.20, 2.64], [1.13, 3.47], [-1.66, 3.47]], y0: 0.16, y1: 0.30,
          patterns: { front: 8, top: 3, east: 5, west: 6, back: 6, side: 5 } },
        { id: 'throne', kind: 'throne', texture: F + '17888-throne.png', commands: [9, 10, 11, 16, 17, 18, 19, 20, 21],
          footprint: [[-0.87, 3.04], [0.41, 3.04], [0.29, 3.52], [-0.75, 3.52]], y0: 0.30, y1: 2.05,
          silhouette: true, twoSided: true, reversePattern: 6,
          patterns: { front: 5, top: 7, east: 6, west: 6, back: 7, side: 6 } }
      ]
    },
    // Marble hall: runner edges vanish at y = 95; the far door stands 7.7 m away.
    22844: {
      cy: 95, left: -1.32, right: 1.27, back: 7.74, ceiling: 4.0, wallTop: 3.5, environment: 'chamber',
      unseen: { floor: 1, east: 3, west: 3, rear: 3, ceiling: 6, courses: false, baseboard: true }
    },
    // Banquet hall: wall bases vanish at y = 170; the trestle table (Cmd 33–38) is lifted off the far wall.
    8807: {
      cy: 170, left: -4.46, right: 3.93, back: 9.4, ceiling: 5.0, wallTop: 3.07, environment: 'chamber',
      clean: F + '8807-clean.png',
      unseen: { floor: 4, east: 5, west: 5, rear: 5, ceiling: 6, courses: false, baseboard: false },
      solids: [
        { id: 'table top', kind: 'table', texture: F + '8807-table.png', commands: [33, 38],
          footprint: [[-2.07, 3.37], [1.33, 3.37], [1.18, 4.30], [-1.90, 4.30]], y0: 0.72, y1: 0.88,
          patterns: { front: 5, top: 5, east: 6, west: 6, back: 6, side: 6 } },
        { id: 'table leg 1', kind: 'table', texture: F + '8807-table.png', commands: [34], footprint: post(-1.63, 3.33, 0.10, 0.10), y0: 0, y1: 0.74, patterns: { front: 5, side: 6, back: 6 } },
        { id: 'table leg 2', kind: 'table', texture: F + '8807-table.png', commands: [35], footprint: post(0.94, 3.33, 0.10, 0.10), y0: 0, y1: 0.74, patterns: { front: 5, side: 6, back: 6 } },
        { id: 'table leg 3', kind: 'table', texture: F + '8807-table.png', commands: [36], footprint: post(-1.48, 3.99, 0.09, 0.09), y0: 0, y1: 0.74, patterns: { front: 5, side: 6, back: 6 } },
        { id: 'table leg 4', kind: 'table', texture: F + '8807-table.png', commands: [37], footprint: post(0.70, 3.99, 0.09, 0.09), y0: 0, y1: 0.74, patterns: { front: 5, side: 6, back: 6 } }
      ]
    },
    // Armory: the frontal rack wall stands 3.3 m away beneath a low 2.5 m ceiling.
    20357: {
      cy: 117, left: -3.0, right: 1.65, back: 3.28, ceiling: 2.52, wallTop: 2.49, environment: 'chamber',
      unseen: { floor: 4, east: 5, west: 5, rear: 5, ceiling: 6, courses: false, baseboard: false }
    },
    // Bridge room: crank wall bases vanish at y = 137.
    7395: {
      cy: 137, left: -3.5, right: 1.6, back: 5.3, ceiling: 3.3, wallTop: 3.25, environment: 'chamber',
      unseen: { floor: 4, east: 5, west: 5, rear: 5, ceiling: 6, courses: false, baseboard: false }
    },
    // Mirror room: a narrow smooth-stone hallway ending at the framed mirror.
    20791: {
      cy: 140, left: -1.05, right: 0.95, back: 3.3, ceiling: 3.6, wallTop: 3.5, environment: 'chamber',
      unseen: { floor: 13, east: 7, west: 7, rear: 13, ceiling: 13, courses: false, baseboard: false }
    },
    // Lava tunnel: rock walls meet the dark floor at y ≈ 195.
    17983: {
      cy: 125, left: -3.0, right: 3.0, back: 5.5, ceiling: 5.2, wallTop: 5.0, environment: 'cave',
      unseen: { floor: 6, east: 13, west: 4, rear: 5, ceiling: 7, courses: false, baseboard: false }
    },
    // Dogleg: ashlar blocks and 2.6 m floor slabs continue around the bend.
    3122: {
      cy: 120, left: -1.9, right: 3.0, back: 6.3, ceiling: 5.5, wallTop: 5.3, environment: 'chamber',
      courseH: 2.6, blockW: 2.4, slabW: 2.6, slabD: 3.0,
      unseen: { floor: 7, east: 5, west: 6, rear: 5, ceiling: 8, courses: true, baseboard: false }
    },
    // Queen's Chamber: rug and platform edges vanish at y ≈ 90; the white platform (Cmd 10–11) is lifted.
    18458: {
      cy: 90, left: -2.05, right: 2.6, back: 4.95, ceiling: 4.4, wallTop: 4.27, environment: 'chamber',
      clean: F + '18458-clean.png',
      unseen: { floor: 14, east: 4, west: 5, rear: 5, ceiling: 6, courses: false, baseboard: true },
      solids: [
        { id: 'platform', kind: 'dais', texture: F + '18458-platform.png', commands: [10, 11],
          footprint: [[-1.30, 3.17], [1.58, 3.17], [1.67, 4.80], [-1.27, 4.80]], y0: 0, y1: 0.147,
          patterns: { front: 5, top: 1, east: 4, west: 5, back: 5, side: 4 } }
      ]
    },
    // Finale: the brick wall (Pattern 19) carries on around the chamber.
    18366: {
      cy: 140, left: -2.6, right: 2.6, back: 3.17, ceiling: 4.0, wallTop: 3.78, environment: 'chamber',
      unseen: { floor: 6, east: 19, west: 19, rear: 19, ceiling: 7, courses: false, baseboard: false }
    },
    // Cavern: light rock walls close in around the nest.
    18391: {
      cy: 150, left: -3.2, right: 3.2, back: 5.5, ceiling: 4.2, wallTop: 4.0, environment: 'cave',
      unseen: { floor: 5, east: 3, west: 3, rear: 2, ceiling: 2, courses: false, baseboard: false }
    },
    // Cave entrance: the sky meets the far ground at y ≈ 100.
    10850: { cy: 100, left: -4.7, right: 4.7, back: 9.6, ceiling: 6.2, environment: 'open' }
  };

  // Grounded contact shadow beneath floor-standing sprites (AOBJ pickups, ACHR inhabitants).
  function spriteShadow(view, x, z) {
    const spots = view.shadowSpots;
    if (!spots || !spots.length) return false;
    for (let k = 0; k < spots.length; k++) {
      const s = spots[k];
      const dx = (x - s.x) / s.rx, dz = (z - s.z) / s.rz;
      if (dx * dx + dz * dz < 1) return true;
    }
    return false;
  }

  // Trace descending 3D stone stairwell inside the High Altar plinth opening (Cmd 27).
  function traceCavity(cavity, p, eye, dx, dy, dz, tEntry, pen, sx, sy) {
    const hx = p.x + dx * tEntry, hz = p.z + dz * tEntry;
    const cPlanes = cavity.planes;
    for (let k = 0; k < cPlanes.length; k++) {
      if (cPlanes[k].nx * hx + cPlanes[k].nz * hz - cPlanes[k].offset < 0) return null;
    }
    let tWall = Infinity, wallPlane = null;
    for (let k = 0; k < cPlanes.length; k++) {
      const cp = cPlanes[k];
      const rate = cp.nx * dx + cp.nz * dz;
      if (rate < -1e-9) {
        const tw = -(cp.nx * p.x + cp.nz * p.z - cp.offset) / rate;
        if (tw > tEntry && tw < tWall) { tWall = tw; wallPlane = cp; }
      }
    }
    const span = (cavity.z1 - cavity.z0) / cavity.steps;
    let step = Math.max(0, Math.min(cavity.steps - 1, Math.floor((hz - cavity.z0) / span)));
    for (let iter = 0; iter <= cavity.steps; iter++) {
      const yTread = cavity.top - 0.145 - step * 0.165;
      const zLo = cavity.z0 + step * span, zHi = zLo + span;
      const tTread = dy < -1e-9 ? (yTread - eye) / dy : Infinity;
      const tNextZ = Math.abs(dz) > 1e-9 ? ((dz > 0 ? zHi : zLo) - p.z) / dz : Infinity;
      if (Math.min(tTread, tWall) <= tNextZ) {
        if (tTread <= tWall && tTread > tEntry) {
          const zHit = p.z + dz * tTread;
          const nosing = zHit - zLo;
          let pat = step === 0 ? 6 : step === 1 ? 7 : 8;
          if (nosing < 1.5 * pen) pat = 8;
          else if (nosing < 2.8 * pen && step < 2) pat = step === 0 ? 5 : 6;
          return { t: tTread, bit: samplePattern(pat, sx, sy) ? 1 : 2 };
        }
        break;
      }
      const nextStep = step + (dz > 0 ? 1 : -1);
      if (nextStep < 0 || nextStep >= cavity.steps) break;
      const nextTread = cavity.top - 0.145 - nextStep * 0.165;
      const yCross = eye + dy * tNextZ;
      if (yCross <= nextTread && tNextZ > tEntry) {
        const topDist = nextTread - yCross;
        const pat = topDist < 1.6 * pen ? 8 : (nextStep === 0 ? 6 : 7);
        return { t: tNextZ, bit: samplePattern(pat, sx, sy) ? 1 : 2 };
      }
      step = nextStep;
    }
    if (tWall < Infinity) {
      const yHit = eye + dy * tWall;
      const rim = cavity.top - yHit;
      let pat = yHit > 0.16 ? 6 : yHit > -0.02 ? 7 : 8;
      if (wallPlane && wallPlane.nz < -0.5) pat = shiftPattern(pat, 1); // Far north shaft wall in deeper shadow
      if (rim < 1.8 * pen) pat = 8;
      return { t: tWall, bit: samplePattern(pat, sx, sy) ? 1 : 2 };
    }
    return { t: tEntry + 0.35, bit: 1 };
  }

  // Grounded contact/cast shadow test on horizontal surfaces (floor and dais top).
  function hasContactShadow(solids, selfSolid, x, y, z) {
    // Light arrives from upper-front-right; shadows cast slightly back-and-left (-x, +z).
    for (let k = 0; k < solids.length; k++) {
      const s = solids[k];
      if (s === selfSolid || s.noCollision && !s.silhouette || s.collisionOnly) continue;
      if (s.y0 > y + 0.06 || s.y1 <= y + 0.04) continue;
      const lift = Math.min(0.45, (s.y1 - y) * 0.18);
      const sx = x + 0.16 * lift, sz = z - 0.30 * lift;
      let maxOut = -Infinity;
      for (let m = 0; m < s.planes.length; m++) {
        const pl = s.planes[m];
        const inside = pl.nx * sx + pl.nz * sz - pl.offset;
        const out = -inside;
        if (out > maxOut) maxOut = out;
      }
      if (maxOut <= 0.075) return true;
    }
    return false;
  }

  // Build 2x Chamfer SDF + medial stroke ridge + slab fill propagation once per room
  // so close-up views keep QuickDraw 2px pen strokes crisp instead of 8x jagged bars.
  function prepareToneFields(w, h, tones, borders) {
    const n = w * h, W = w * 2, H = h * 2, N = W * H, INF = 1e6;
    const ink2 = new Uint8Array(N);
    for (let y = 0; y < h; y++) {
      const r0 = (y * 2) * W, r1 = r0 + W, sy = y * w;
      for (let x = 0; x < w; x++) {
        if (tones[sy + x] === 8) {
          const x2 = x * 2;
          ink2[r0 + x2] = ink2[r0 + x2 + 1] = ink2[r1 + x2] = ink2[r1 + x2 + 1] = 1;
        }
      }
    }
    const dpIn = new Float32Array(N), dpOut = new Float32Array(N);
    for (let q = 0; q < N; q++) {
      dpIn[q] = ink2[q] ? INF : 0;
      dpOut[q] = ink2[q] ? 0 : INF;
    }
    for (const dp of [dpIn, dpOut]) {
      for (let y = 0; y < H; y++) {
        const row = y * W;
        for (let x = 0; x < W; x++) {
          let v = dp[row + x];
          if (v === 0) continue;
          if (y > 0) {
            const prev = row - W + x;
            if (dp[prev] + 3 < v) v = dp[prev] + 3;
            if (x > 0 && dp[prev - 1] + 4 < v) v = dp[prev - 1] + 4;
            if (x + 1 < W && dp[prev + 1] + 4 < v) v = dp[prev + 1] + 4;
          }
          if (x > 0 && dp[row + x - 1] + 3 < v) v = dp[row + x - 1] + 3;
          dp[row + x] = v;
        }
      }
      for (let y = H - 1; y >= 0; y--) {
        const row = y * W;
        for (let x = W - 1; x >= 0; x--) {
          let v = dp[row + x];
          if (v === 0) continue;
          if (y + 1 < H) {
            const next = row + W + x;
            if (dp[next] + 3 < v) v = dp[next] + 3;
            if (x + 1 < W && dp[next + 1] + 4 < v) v = dp[next + 1] + 4;
            if (x > 0 && dp[next - 1] + 4 < v) v = dp[next - 1] + 4;
          }
          if (x + 1 < W && dp[row + x + 1] + 3 < v) v = dp[row + x + 1] + 3;
          dp[row + x] = v;
        }
      }
    }
    const sdf2 = new Float32Array(N), tmp = new Float32Array(N), ridge2 = new Float32Array(N);
    for (let q = 0; q < N; q++) {
      sdf2[q] = ink2[q] ? (dpIn[q] - 1.5) / 6 : -(dpOut[q] - 1.5) / 6;
    }
    for (let y = 0; y < H; y++) {
      const row = y * W;
      for (let x = 0; x < W; x++) {
        let m = -INF;
        const x0 = Math.max(0, x - 4), x1 = Math.min(W - 1, x + 4);
        for (let k = x0; k <= x1; k++) if (sdf2[row + k] > m) m = sdf2[row + k];
        tmp[row + x] = m;
      }
    }
    for (let y = 0; y < H; y++) {
      const y0 = Math.max(0, y - 4), y1 = Math.min(H - 1, y + 4), row = y * W;
      for (let x = 0; x < W; x++) {
        let m = -INF;
        for (let k = y0; k <= y1; k++) if (tmp[k * W + x] > m) m = tmp[k * W + x];
        ridge2[row + x] = m;
      }
    }

    const fillTone = new Uint8Array(n), bevelTone = new Uint8Array(n);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x, t = tones[i];
        if (!t) continue;
        const rVal = ridge2[(y * 2) * W + (x * 2)];
        const thinInk = t === 8 && rVal <= 3.2;
        if (!borders[i] && !thinInk) fillTone[i] = t;
        for (let dy = -1; dy <= 1 && !bevelTone[i]; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;
            const ni = ny * w + nx;
            if (borders[ni] && tones[ni] && tones[ni] !== 8) { bevelTone[i] = tones[ni]; break; }
          }
        }
      }
    }
    for (let pass = 0; pass < 6; pass++) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          if (fillTone[i] || !tones[i]) continue;
          fillTone[i] = (x > 0 && fillTone[i - 1]) || (x + 1 < w && fillTone[i + 1]) ||
                        (y > 0 && fillTone[i - w]) || (y + 1 < h && fillTone[i + w]) || 0;
        }
      }
    }
    for (let i = 0; i < n; i++) if (!fillTone[i] && tones[i]) fillTone[i] = tones[i] === 8 ? 6 : tones[i];
    return { W, H, sdf2, ridge2, fillTone, bevelTone };
  }

  function bilerp(grid, W, H, gx, gy) {
    const cx = Math.max(0, Math.min(W - 1.001, gx)), cy = Math.max(0, Math.min(H - 1.001, gy));
    const x0 = Math.floor(cx), y0 = Math.floor(cy), tx = cx - x0, ty = cy - y0;
    const r0 = y0 * W + x0, r1 = r0 + W;
    const a = grid[r0] + (grid[r0 + 1] - grid[r0]) * tx;
    const b = grid[r1] + (grid[r1 + 1] - grid[r1]) * tx;
    return a + (b - a) * ty;
  }

  function resolvePlateSample(tex, fx, fy, mag, pIdx) {
    const fields = tex.fields;
    if (!fields || mag <= 1.18) return { pat: tex.tones[pIdx], border: tex.borders[pIdx] };
    const gx = fx * 2 - 0.5, gy = fy * 2 - 0.5;
    const sdf = bilerp(fields.sdf2, fields.W, fields.H, gx, gy);
    const ridge = bilerp(fields.ridge2, fields.W, fields.H, gx, gy);
    if (ridge > 3.2) {
      if (sdf >= 0) return { pat: 8, border: 0 };
      return { pat: fields.fillTone[pIdx], border: 0 };
    }
    if (ridge > 0.15) {
      const dCenter = Math.max(0, ridge - sdf);
      const halfInk = Math.min(ridge, 0.95 / mag);
      if (sdf >= -0.15 && dCenter <= halfInk) return { pat: 8, border: 1 };
      const bTone = fields.bevelTone[pIdx];
      if (bTone && sdf < halfInk && dCenter <= halfInk + 1.35 / mag) {
        return { pat: bTone, border: 1 };
      }
      return { pat: fields.fillTone[pIdx], border: 0 };
    }
    return { pat: fields.fillTone[pIdx] || tex.tones[pIdx], border: 0 };
  }

  // Modulate a plate/layer's base CODE 1 pattern for lit stone, shadow, and distance
  // without slicing circular rings through flat QuickDraw polygons.
  function shadePlateTone(view, solid, face, x, y, z, t, tex, pIdx, fx, fy, sx, sy) {
    const r = view.rig;
    // The new single-plate surveys use camera-space depth on both sides of
    // the ratio. At the drawing's eye z/t is one, even in the far corners.
    const t0 = view.axialPlateDepth ? z : Math.hypot(x, y - r.eye, z);
    const mag = Math.abs(face) === 3
      ? Math.max(t0 / Math.max(0.15, t), (z / Math.max(0.25, t)) * 1.15)
      : t0 / Math.max(0.15, t);
    const { pat, border: isBorder } = resolvePlateSample(tex, fx, fy, mag, pIdx);
    const fallbackBit = tex.bits[pIdx];
    if (pat === 8) return 1;
    if (pat === 1) return 2;
    const dRel = t - t0; // Positive when player walks farther away than doorway, negative when closer

    // Preserve pictorial motif patterns (e.g. 15 wooden door planks, 19 brick, 27 diamond frieze)
    if (RAMP_INDEX[pat] === undefined) {
      if (dRel > 1.8 && t > 6.8 && !view.outside) return samplePattern(7, sx, sy) ? 1 : 2;
      return fallbackBit;
    }
    if (isBorder) {
      let bPat = pat;
      if (pat === 4 && dRel < -0.9 && t < 2.2 && !view.outside && r.environment !== 'submerged') bPat = 3;
      else if (dRel > 1.6 && t > 6.4 && !view.outside) bPat = shiftPattern(pat, 1);
      return samplePattern(bPat, sx, sy) ? 1 : 2;
    }

    let delta = 0;
    if (r.environment === 'submerged') {
      if (dRel > 1.4 && t > 6.6) delta += 1;
      else if (dRel < -1.0 && t < 2.4 && face === 3) delta -= 1;
    } else if (view.outside) {
      if (dRel > 1.8 && t > 8.5 && face !== -3) delta -= 1;
      if (face === 3 && (hasContactShadow(view.solids, solid, x, y, z) || (!solid && spriteShadow(view, x, z)))) delta += 1;
    } else {
      // Indoor stone chambers
      if (face === 3) {
        if (hasContactShadow(view.solids, solid, x, y, z) || (!solid && spriteShadow(view, x, z))) {
          delta += 1;
        } else if (!solid && view.meta?.id === 7990 && z > r.back - 0.22) {
          delta += 1; // Deep shadow along the recessed rear wall behind the dais
        } else if (dRel > 1.35 && t > 5.8) {
          delta += 1;
        }
      } else if (face === -3) {
        if (dRel > 1.5 && t > 6.4) delta += 1;
      } else if (!solid) {
        // Room walls: step clean architectural courses rather than curved radial arcs
        if (view.meta?.id === 7990 && Math.abs(z - r.back) < 0.09 && y < 1.255) {
          // Recessed lower dado course (right below the horizontal mortar line) behind columns & altar
          delta += 1;
        } else if (dRel > 1.35 && t > 5.9) {
          delta += 1;
        }
      } else {
        // Separated 3D foreground solid (columns, dais, plinth, furniture)
        if (face === 3 && spriteShadow(view, x, z)) {
          delta += 1; // A pickup or inhabitant standing on a dais top
        } else if (solid.kind === 'pillar' && face !== 3 && y - solid.y0 < 0.08) {
          delta += 1; // Grounded contact where monolith shaft meets the dais
        } else if (dRel > 1.45 && t > 6.0) {
          delta += 1;
        }
      }
    }

    let finalPat = shiftPattern(pat, Math.max(-1, Math.min(2, delta)));
    if (finalPat === 1 && delta > 0) finalPat = 2; // Even paper-white floors take a faint grounded shadow
    return samplePattern(finalPat, sx, sy) ? 1 : 2;
  }

  // Draw newly visible faces of 3D solids with QuickDraw 2px ink borders, 1px stone bevels, and CODE 1 patterns.
  function shadeSolidFace(view, hit, solid, face, x, y, z, t, dx, dz, sx, sy) {
    const f = view.rig.focal;
    const pen = Math.max(0.0035, t / f);

    if (Math.abs(face) === 3) {
      let minEdge = Infinity;
      for (let k = 0; k < solid.planes.length; k++) {
        const pl = solid.planes[k];
        const d = pl.nx * x + pl.nz * z - pl.offset;
        if (d < minEdge) minEdge = d;
      }
      if (minEdge < 1.75 * pen) return 1;
      let pat = face === 3 ? (solid.patterns?.top || 5) : 7;
      if (face === 3 && minEdge < 3.0 * pen) pat = shiftPattern(pat, -1);
      else if (face === 3 && hasContactShadow(view.solids, solid, x, y, z)) pat = shiftPattern(pat, 1);
      return samplePattern(pat, sx, sy) ? 1 : 2;
    }

    const pl = hit.plane;
    const v0 = y - solid.y0, v1 = solid.y1 - y;
    const vMin = Math.min(v0, v1);
    const isCurved = solid.planes.length > 8; // e.g. 32-sided Courtyard basin or Sanctum lectern foot

    if (vMin < 1.75 * pen) return 1;
    let u = 0, uMin = Infinity, uLit = Infinity;
    if (pl) {
      u = (x - pl.ax) * pl.ux + (z - pl.az) * pl.uz;
      uMin = Math.min(u, pl.len - u);
      const uToLight = pl.ux * 0.38 + pl.uz * (-0.72);
      uLit = uToLight < 0 ? u : pl.len - u;
      if (!isCurved && uMin < 1.75 * pen) return 1;
      if (isCurved && Math.abs(pl.nx * dx + pl.nz * dz) < 0.22) return 1;
    }

    const ox = pl ? -pl.nx : 0, oz = pl ? -pl.nz : 1;
    const litDot = ox * 0.38 + oz * (-0.72);
    let pat = 5;
    if (solid.patterns) {
      if (oz > 0.45) pat = solid.patterns.back ?? solid.patterns.side ?? 6;
      else if (oz < -0.45) pat = solid.patterns.front ?? 4;
      else if (ox > 0.35) pat = solid.patterns.east ?? solid.patterns.side ?? 5;
      else if (ox < -0.35) pat = solid.patterns.west ?? solid.patterns.side ?? 6;
      else pat = solid.patterns.side ?? 6;
    } else {
      pat = litDot > 0.25 ? 4 : litDot > -0.22 ? 5 : 6;
    }

    // Subtle base grounding where monolith columns meet the dais
    if (solid.kind === 'pillar' && v0 < 0.08) {
      pat = shiftPattern(pat, 1);
    }

    // QuickDraw 1-pixel inner stone bevel along top lip and light-facing vertical arris
    if ((solid.kind === 'dais' || solid.kind === 'plinth') && v1 < 3.1 * pen) {
      pat = shiftPattern(pat, -1);
    } else if (!isCurved && uLit < 3.0 * pen) {
      pat = shiftPattern(pat, -1);
    } else if (t > 5.8 && !view.outside) {
      pat = shiftPattern(pat, 1);
    }

    return samplePattern(pat, sx, sy) ? 1 : 2;
  }

  // Shade unseen world surfaces (side wall extensions, rear doorway wall, ceilings, horizons) with CODE 1 patterns.
  // With a colour surround, carry the material in the upper bits of the
  // result. Both presentations then use the very same ridge and gunwale.
  function panoramaBit(pat, sx, sy, surround, band) {
    return (samplePattern(pat, sx, sy) ? 1 : 2) | (surround ? surround[band] << 2 : 0);
  }
  function shadeUnseenWorld(view, face, x, y, z, t, sx, sy, dx, dy, dz, surround) {
    const r = view.rig;
    const pen = Math.max(0.004, t / r.focal);
    const cave = view.env === 'cave';
    if (view.outside && dx === undefined) {
      dx = x - view.pose.x; dz = z - view.pose.z; dy = y - r.eye;
    }

    // For surveyed landscapes the box limits walking, but does not bound the
    // water, sky or ground. Use the same horizon across wall, floor and cap.
    if (view.outside && r.unseen?.ridge) {
      const u = r.unseen;
      const elevation = dy / Math.max(1e-6, Math.hypot(dx, dz));
      const angle = Math.atan2(dx, dz);
      const crest = r.flatHorizon ? 0 : .019 * Math.sin(7 * angle) + .012 * Math.cos(11 * angle);
      const foot = r.flatHorizon ? crest : Math.min(-.035, crest - .022);
      let band = elevation >= crest ? 0 : elevation >= foot ? 1 : 2;
      let pat = band === 0 ? u.sky : band === 1 ? u.ridge : u.floor;
      // The wreck's planking ends at the feet of its low bulwarks. Over
      // their top edges the same distant seabed continues around the ship.
      if (u.deck && face === 3) { pat = u.deck; band = 3; }
      if (u.deck && Math.abs(face) !== 3 && y < r.gunwaleHeight) {
        return y >= r.gunwaleHeight - pen ? 1 : panoramaBit(u.gunwale, sx, sy, surround, 3);
      }
      if (elevation < foot && dy < 0 && (!u.deck || face === 3) && view.shadowSpots.length) {
        const ground = -r.eye / dy;
        if (spriteShadow(view, view.pose.x + dx * ground, view.pose.z + dz * ground)) {
          pat = shiftPattern(pat, 1);
        }
      }
      return panoramaBit(pat, sx, sy, surround, band);
    }

    if (r.environment === 'submerged') {
      const angle = Math.atan2(x, z), ridge = 1.65 + 0.13 * Math.sin(angle * 8) + 0.06 * Math.cos(angle * 15);
      if (face !== 3 && Math.abs(y - ridge) < 1.3 * pen) return 1;
      let pat = face === 3 ? 4 : y < ridge ? 5 : 7;
      if (t > 6.6) pat = shiftPattern(pat, 1);
      return panoramaBit(pat, sx, sy, surround, face === 3 ? 2 : y < ridge ? 1 : 0);
    }

    if (view.outside) {
      if (face === 3) {
        let pat = t < 3.4 ? 13 : t < 7.2 ? 5 : 4;
        if (hasContactShadow(view.solids, null, x, y, z) || spriteShadow(view, x, z)) pat = shiftPattern(pat, 1);
        return panoramaBit(pat, sx, sy, surround, 2);
      }
      // One horizon at infinity: the ridge depends only on the ray's bearing and elevation,
      // so it holds still while walking and never seams between the wall and ceiling faces.
      const a = Math.atan2(dx, dz), ridge = 1.6 + 0.23 * Math.sin(a * 13) + 0.30 * Math.cos(a * 4);
      const elev = dy / Math.max(1e-6, Math.hypot(dx, dz)), ridgeElev = (ridge - r.eye) / 12;
      if (Math.abs(elev - ridgeElev) < 1.35 * pen / 12) return 1;
      const band = elev < ridgeElev ? (elev < ridgeElev - 0.08 ? 2 : 1) : 0;
      const pat = band === 2 ? 5 : band === 1 ? 6 : (r.unseen?.sky || 3);
      return panoramaBit(pat, sx, sy, surround, band);
    }

    // Indoor stone chamber, or a cave: rock without courses, cornice or baseboard
    const wallTop = r.wallTop || r.ceiling;
    const unseen = r.unseen || null;
    if (face === -3 || (Math.abs(face) !== 3 && y >= wallTop)) {
      if (!cave && Math.abs(face) !== 3 && y < wallTop + 1.6 * pen) return 1; // Cornice ink line
      const cPat = unseen?.ceiling ? shiftPattern(unseen.ceiling, t > 6.5 ? 1 : 0) : (t > 6.5 ? 8 : 7);
      return samplePattern(cPat, sx, sy) ? 1 : 2;
    }

    // Doorways only where the map (or the room text) actually opens: rear wall
    // for south, unseen stretches of the side walls for east and west.
    const exits = view.exits;
    if (Math.abs(face) !== 3) {
      let along = null;
      if (face === 2 && (!exits || exits.south)) along = x;
      else if (face === -1 && exits?.east) along = z - view.sideDoorZ;
      else if (face === 1 && exits?.west) along = z - view.sideDoorZ;
      if (along !== null && cave && Math.abs(along) < 0.7) {
        // A dark mouth in the rock, its edge wandering like the plates' own tunnel openings
        const mouthTop = 2.15 - 1.5 * (along / 0.62) * (along / 0.62) + 0.07 * Math.sin(along * 11);
        const halfW = 0.62 - 0.05 * Math.cos(y * 7.3);
        if (y < mouthTop && Math.abs(along) < halfW) {
          const edge = Math.min(halfW - Math.abs(along), mouthTop - y);
          if (edge < 1.8 * pen) return 1;
          return samplePattern(edge < 5.0 * pen ? 7 : 8, sx, sy) ? 1 : 2;
        }
      } else if (along !== null && Math.abs(along) < 0.62) {
        const archTop = 2.28 - Math.max(0, Math.abs(along) - 0.26) * 0.68;
        if (y < archTop) {
          const edge = Math.min(0.62 - Math.abs(along), archTop - y);
          if (edge < 2.0 * pen) return 1;
          if (edge < 3.4 * pen) return samplePattern(4, sx, sy) ? 1 : 2;
          if (face === 2) {
            // Arched iron grate across the entrance behind the doorway viewpoint
            const gx = Math.floor((along + 1) * 30), gy = Math.floor(y * 32);
            return ((gx % 8 !== 0) && (gy % 26 !== 0 || Math.abs(along) > 0.48)) ? 1 : (samplePattern(6, sx, sy) ? 1 : 2);
          }
          // Open side passage receding into shadow
          return samplePattern(edge < 6.5 * pen ? 7 : 8, sx, sy) ? 1 : 2;
        }
      }
    }

    const isFloor = face === 3;
    const courses = cave ? false : (unseen ? unseen.courses !== false : true);
    const courseH = isFloor ? (r.slabD || 1.15) : (r.courseH || 0.96);
    const blockW = isFloor ? (r.slabW || 1.24) : (r.blockW || 1.18);
    const along = (isFloor || Math.abs(face) === 2) ? x : z;
    const up = isFloor ? z : y;

    const row = Math.floor(up / courseH);
    const vDist = Math.min(up - row * courseH, (row + 1) * courseH - up);
    const uShift = along + (row & 1) * blockW * 0.5;
    const col = Math.floor(uShift / blockW);
    const uDist = Math.min(uShift - col * blockW, (col + 1) * blockW - uShift);

    // Crisp screen-consistent QuickDraw black mortar joint + 1px lit stone bevel
    if (courses && (vDist < 1.55 * pen || uDist < 1.55 * pen)) return 1;
    if (!cave && !isFloor && unseen?.baseboard && y < 1.6 * pen) return 1; // Baseboard ink line
    const onBevel = courses && ((up - row * courseH > courseH - 3.0 * pen) || (uShift - col * blockW < 2.9 * pen));

    let pat;
    if (isFloor) {
      pat = unseen?.floor ? shiftPattern(unseen.floor, t > 5.75 ? 1 : 0) : (t > 5.75 ? 6 : 5);
      if (hasContactShadow(view.solids, null, x, y, z) || spriteShadow(view, x, z)) pat = pat === 1 ? 2 : shiftPattern(pat, 1);
    } else if (face === -1) {
      // East / right lit chamber wall continues the plate's pattern seamlessly from its edge
      pat = unseen?.east ? shiftPattern(unseen.east, t > 5.85 ? 1 : 0) : (t > 5.85 ? 6 : 5);
    } else if (face === 1) {
      pat = unseen?.west ? shiftPattern(unseen.west, t > 5.85 ? 1 : 0) : ((y > wallTop - 0.35 || t > 5.85) ? 7 : 6);
    } else {
      // Rear entrance wall
      pat = unseen?.rear ? shiftPattern(unseen.rear, t > 5.85 ? 1 : 0) : ((y > wallTop - 0.35 || t > 5.85) ? 7 : 6);
    }

    if (onBevel) pat = shiftPattern(pat, -1);
    return samplePattern(pat, sx, sy) ? 1 : 2;
  }

  window.RefreshEngine = {
    toneUrl,
    spriteRimUrl,
    prepareToneFields,
    buildPlanes,
    traceCavity,
    shadePlateTone,
    shadeSolidFace,
    shadeUnseenWorld,
    samplePattern,
    shiftPattern
  };
})();
