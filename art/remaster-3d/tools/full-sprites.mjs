import '../../../game/castle-plan.js';
import { SCALE, blurField, distance, shadeRelief } from './full-shading.mjs';

// Use the game's reel inventory to keep related actions on one material palette.
const familyByReel = new Map(
  Object.entries(globalThis.CastlePlan.REELS).flatMap(([family, reels]) =>
    reels.map(reel => [reel, family])),
);

const materials = {
  skin: [239, 182, 126],
  hair: [139, 91, 58],
  jacket: [216, 205, 182],
  breeches: [122, 136, 170],
  leather: [178, 138, 87],
  iron: [140, 155, 174],
  plate: [153, 173, 191],
  steel: [178, 196, 207],
  bronze: [217, 171, 99],
  gold: [248, 194, 104],
  stone: [169, 181, 186],
  gargoyle: [161, 190, 173],
  oak: [189, 146, 96],
  water: [121, 179, 189],
  fire: [242, 132, 59],
  flameCore: [250, 192, 95],
  bolt: [169, 214, 241],
  paper: [252, 248, 231],
  ropeBacking: [145, 161, 172],
  bone: [210, 199, 177],
  robe: [162, 140, 182],
  beard: [218, 217, 198],
  armorCloth: [142, 167, 188],
  earth: [160, 153, 137],
  creature: [164, 184, 132],
  hide: [184, 137, 100],
  wing: [161, 148, 172],
  aura: [145, 211, 233],
};

const familyMaterial = {
  arm: 'stone', icons: 'bronze', bat: 'wing', rat: 'hide', gate: 'iron',
  ledges: 'stone', drip: 'water', fountain: 'water', broom: 'oak',
  boulder: 'stone', mutant: 'creature', rope: 'oak', weight: 'iron',
  prisoners: 'bone', vulture: 'hide', storm: 'bolt', lever: 'bronze',
  hatch: 'iron', gargoyle: 'gargoyle', hallDoor: 'oak',
};

// Known exceptions in families that include both characters and separate props.
const reelMaterial = {
  A113: 'stone', A127: 'water', A138: 'stone', A520: 'iron',
  A137: 'earth', A5010: 'gold',
  B200: 'oak', B356: 'steel', B357: 'steel', B411: 'water',
  B412: 'oak', B413: 'oak', B417: 'water', B418: 'earth',
  B424: 'fire', B437: 'bolt', B521: 'iron', B702: 'beard',
  B707: 'steel', B708: 'bolt', B709: 'steel', B710: 'creature', B714: 'creature',
  B716: 'water', B717: 'water', B901: 'stone', B902: 'bronze',
  B903: 'stone', B904: 'iron', B905: 'bronze', B917: 'iron',
  B920: 'bronze', B921: 'iron',
};

const heroFamilies = new Set(['hero', 'pull', 'power', 'harm', 'shield', 'hallRun']);
const bodyFamilies = new Set(['guard', 'whip', 'henchman']);
const paperReels = new Set(['A5000', 'B510', 'B511']);
const shieldReels = new Set(['A144', 'A145']);

// Native cell coordinates. The aim reels rotate around a stationary sleeve;
// the throwing cells move that attachment to the other side of the cell.
const rightHandTips = [[4, 2], [9, 3], [14, 6], [18, 11], [19, 17], [18, 23],
  [15, 27], [11, 29], [21, 13], [13, 7], [10, 21]];
const throwingShoulders = [[22, 21], [21, 17], [20, 17]];
const ladderHeads = [[10, 8, 19, 18], [10, 8, 18, 16], [10, 11, 19, 19],
  [13, 17, 22, 23], [11, 10, 20, 19]];
const rockCenters = [[8, 17, 8.7], [25, 8, 8.4], [12, 8, 8.4], [39, 13, 8.5]];

function armMaterial(reel, pose, x, y) {
  const mirror = reel === 'A111';
  const [handX, handY] = rightHandTips[pose];
  const [shoulderX, shoulderY] = pose < 8 ? [4, 17] : throwingShoulders[pose - 8];
  const alongX = handX - shoulderX;
  const alongY = handY - shoulderY;
  const wristDistance = ((handX - (mirror ? 31 - x : x)) * alongX +
    (handY - y - (mirror && pose === 9 ? 1 : 0)) * alongY) / Math.hypot(alongX, alongY);
  return wristDistance <= 2.9 ? 'skin' : 'jacket';
}

function dragonBreathMaterial(x, y) {
  // Trace the snout and the underside of the jaw. Between the two ink edges
  // the blast is visible, including the few flame pixels inside the mouth.
  const snout = y < 23 && x >= 46;
  const upperLip = y >= 23 && y < 27 && x >= 48 + (y - 23) * 6;
  const outerJaw = y >= 23 && y <= 40 && x >= (y < 31 ? 73 : 73 - (y - 31) * 1.7);
  const throat = y >= 32 && y <= 39 && x >= 65 - (y - 32) * 1.1 && x < 78;
  if (snout || upperLip || outerJaw || throat) return 'creature';
  return 'fire';
}

function flameAlbedo(x, y) {
  const axis = 28 + (48 - x) * .10;
  const core = Math.exp(-Math.abs(y - axis) / 6) * .72 + Math.min(x / 95, .25);
  return materials.fire.map((channel, index) => channel + (materials.flameCore[index] - channel) * core);
}

function raisedHeroMaterial(reel, pose, x, y, ink) {
  if (reel === 'A102') {
    if (x >= 10 && x < 21 && y >= 10 && y < 19) return 'hair';
    if (y < 11 || (y < 17 && (x < 7 || x > 23))) return 'skin';
    return y < 35 ? 'jacket' : y < 41 ? 'breeches' : 'leather';
  }
  if (reel === 'A103') {
    const [left, top, right, bottom] = ladderHeads[pose];
    if (x >= left && x <= right && y >= top && y <= bottom) return 'hair';
    if ((pose === 0 && y < 18 && (x < 8 || x > 21)) ||
        (pose > 0 && y >= top + 13 && (x < 7 || x > 24))) return 'skin';
    return y < top + 24 ? 'jacket' : y < 41 ? 'breeches' : 'leather';
  }
  if (reel === 'A116' || reel === 'A123') {
    const hanging = reel === 'A116';
    if (y < (hanging ? 13 : 8)) return 'skin';
    if (x >= (hanging ? 10 : 11) && x < 22 && y < (hanging ? 21 : 17)) {
      return ink && y < (hanging ? 16 : 12) ? 'hair' : 'skin';
    }
    const waist = hanging ? 34 : pose ? 25 : 32;
    return y < waist ? 'jacket' : y < waist + 9 ? 'breeches' : 'leather';
  }
  return null;
}

function profileFor(asset) {
  const reel = `${asset.fork.at(-1)}${asset.id}`;
  const family = familyByReel.get(reel);
  if (!family) throw new Error(`No sprite material family for ${reel}`);
  if (reelMaterial[reel]) return { reel, material: reelMaterial[reel] };
  if (reel === 'A111' || reel === 'A112') return { reel, anatomy: 'arm' };
  if (reel === 'B711') return { reel, anatomy: 'breath' };
  if (reel === 'A5000' || reel === 'B433') return { reel, anatomy: 'fire' };
  if (heroFamilies.has(family)) return { reel, anatomy: 'hero', hallRun: family === 'hallRun' };
  if (bodyFamilies.has(family)) return { reel, anatomy: family };
  if (['eye', 'knight', 'wizard'].includes(family)) return { reel, anatomy: family };
  return { reel, material: familyMaterial[family] ?? 'stone' };
}

function anatomyMaterial(profile, u, v, ink) {
  if (profile.anatomy === 'hero') {
    if (profile.hallRun) {
      if (v < .145) return ink ? 'hair' : 'skin';
      if (v < .20) return 'skin';
      if (v < .57) return 'jacket';
      return v < .84 ? 'breeches' : 'leather';
    }
    if (v < .11) return ink ? 'hair' : 'skin';
    if (v < .26) return 'skin';
    if (v < .61) return 'jacket';
    return v < .82 ? 'breeches' : 'leather';
  }
  if (profile.anatomy === 'knight') {
    const shieldTop = profile.reel === 'B914' ? 0 : .24;
    if (u > .72 && v > shieldTop && v < .88) return 'steel';
    return ink ? 'iron' : 'plate';
  }
  if (profile.anatomy === 'wizard') {
    return !ink && v > .43 && v < .82 && u > .30 && u < .69 ? 'beard' : 'robe';
  }
  if (profile.anatomy === 'eye') return Math.hypot(u - .5, v - .5) < .27 ? 'gold' : 'hide';
  if (profile.anatomy === 'fire') return v < .42 ? 'fire' : 'flameCore';
  if (profile.anatomy === 'henchman') return v < .63 ? 'hide' : 'leather';
  if (v < .18) return 'steel';
  return v < .65 ? 'armorCloth' : 'leather';
}

function shieldBody(alpha, width) {
  const seen = new Uint8Array(alpha.length);
  let body = [];
  for (let start = 0; start < alpha.length; start++) {
    if (!alpha[start] || seen[start]) continue;
    const component = [start];
    seen[start] = 1;
    for (let i = 0; i < component.length; i++) {
      const p = component[i];
      const x = p % width;
      const neighbors = [x > 0 ? p - 1 : -1, x + 1 < width ? p + 1 : -1,
        p - width, p + width];
      for (const next of neighbors) {
        if (!alpha[next] || seen[next]) continue;
        seen[next] = 1;
        component.push(next);
      }
    }
    if (component.length > body.length) body = component;
  }
  const mask = new Uint8Array(alpha.length);
  for (const pixel of body) mask[pixel] = 1;
  return mask;
}

function framePixels(source, left, top, width, height) {
  const alpha = new Uint8Array(width * height);
  const ink = new Uint8Array(alpha.length);
  const bounds = { left: width, top: height, right: -1, bottom: -1 };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const offset = ((top + y) * source.width + left + x) * 4;
      alpha[p] = source.data[offset + 3];
      if (!alpha[p]) continue;
      ink[p] = Number(source.data[offset] < 128);
      bounds.left = Math.min(bounds.left, x);
      bounds.top = Math.min(bounds.top, y);
      bounds.right = Math.max(bounds.right, x);
      bounds.bottom = Math.max(bounds.bottom, y);
    }
  }
  return { alpha, ink, bounds, width, height };
}

function frameMaterials(frame, profile, pose, paper) {
  const { alpha, ink, bounds, width, height } = frame;
  const result = new Array(alpha.length);
  const across = x => (x - bounds.left) / Math.max(1, bounds.right - bounds.left);
  const down = y => (y - bounds.top) / Math.max(1, bounds.bottom - bounds.top);
  const shield = shieldReels.has(profile.reel) ? shieldBody(alpha, width) : null;
  const rock = profile.reel === 'B703' ? rockCenters[pose] : null;
  for (let p = 0; p < alpha.length; p++) {
    if (!alpha[p]) continue;
    const x = p % width;
    const y = Math.floor(p / width);
    if (paper && !ink[p]) result[p] = profile.reel === 'A5000' ? 'paper' : 'ropeBacking';
    else if (shield && !shield[p]) result[p] = 'aura';
    else if (rock && Math.hypot(x - rock[0], y - rock[1]) <= rock[2]) result[p] = 'stone';
    else if (profile.anatomy === 'arm') result[p] = armMaterial(profile.reel, pose, x, y);
    else if (profile.anatomy === 'breath') result[p] = dragonBreathMaterial(x, y);
    else result[p] = profile.material ?? raisedHeroMaterial(profile.reel, pose, x, y, ink[p]) ??
      anatomyMaterial(profile, across(x), down(y), ink[p]);
  }
  if (profile.anatomy !== 'hero' && profile.anatomy !== 'knight') return result;

  // Give a fully enclosed source panel one material. The white exterior rim and
  // panels spanning the entire body keep the proportional classifier above.
  const seen = new Uint8Array(alpha.length);
  for (let p = 0; p < alpha.length; p++) {
    if (!alpha[p] || ink[p] || seen[p]) continue;
    const panel = [p];
    seen[p] = 1;
    let touchesSilhouette = false;
    let totalX = 0;
    let totalY = 0;
    let minY = height;
    let maxY = -1;
    for (let i = 0; i < panel.length; i++) {
      const index = panel[i];
      const x = index % width;
      const y = Math.floor(index / width);
      totalX += x;
      totalY += y;
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      const neighbors = [x ? index - 1 : -1, x + 1 < width ? index + 1 : -1,
        y ? index - width : -1, y + 1 < height ? index + width : -1];
      for (const neighbor of neighbors) {
        if (neighbor < 0 || !alpha[neighbor]) {
          touchesSilhouette = true;
        } else if (!ink[neighbor] && !seen[neighbor]) {
          seen[neighbor] = 1;
          panel.push(neighbor);
        }
      }
    }
    if (touchesSilhouette || down(maxY) - down(minY) > .49) continue;
    const u = across(totalX / panel.length);
    const v = down(totalY / panel.length);
    if (profile.anatomy === 'knight') {
      const falling = profile.reel === 'B914';
      const visor = panel.length <= 5 && (falling
        ? u > .30 && u < .51 && v > .21 && v < .25
        : u > .30 && u < .71 && v > .07 && v < .20);
      if (visor) for (const index of panel) result[index] = 'gold';
      continue;
    }
    const smallHand = v > .27 && v < .56 && (u < .25 || u > .75) && panel.length <= 18;
    const material = smallHand ? 'skin' : raisedHeroMaterial(profile.reel, pose,
      totalX / panel.length, totalY / panel.length, false) ?? anatomyMaterial(profile, u, v, false);
    for (const index of panel) result[index] = material;
  }
  return result;
}

function renderFrame(frame, profile, pose) {
  const { alpha: sourceAlpha, ink: sourceInk, bounds } = frame;
  const width = frame.width * SCALE;
  const height = frame.height * SCALE;
  const length = width * height;
  if (bounds.right < 0) return Buffer.alloc(length * 4);
  const paper = paperReels.has(profile.reel);
  const palette = frameMaterials(frame, profile, pose, paper).map((material, pixel) =>
    profile.anatomy === 'breath' && material === 'fire'
      ? flameAlbedo(pixel % frame.width, Math.floor(pixel / frame.width))
      : materials[material] ?? materials.stone,
  );
  const alpha = new Uint8Array(length);
  const ink = new Uint8Array(length);
  const body = new Uint8Array(length);
  const panels = new Uint8Array(length);
  const albedo = new Float32Array(length * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const source = Math.floor(y / SCALE) * frame.width + Math.floor(x / SCALE);
      alpha[p] = sourceAlpha[source];
      if (!alpha[p]) continue;
      ink[p] = sourceInk[source];
      body[p] = Number(!paper || !!ink[p]);
      panels[p] = Number(!paper && !ink[p]);
      albedo.set(palette[source], p * 3);
    }
  }
  const bodyDistance = distance(body, width, height);
  const panelDistance = distance(panels, width, height);
  const heightField = new Float32Array(length);
  const radius = paper ? 1.6 : profile.anatomy === 'knight' ? 4.8 : profile.anatomy ? 3.6 : 3.15;
  for (let p = 0; p < length; p++) {
    if (!body[p]) continue;
    const t = Math.min(1, bodyDistance[p] / (radius * SCALE));
    const dome = radius * Math.sqrt(t * (2 - t));
    const rim = Math.min(1.4, panelDistance[p] / SCALE);
    // Round the silhouette as a whole, then lift original interior panels.
    heightField[p] = dome + .27 * rim - (ink[p] && !paper ? .24 : 0);
  }
  return shadeRelief({
    heightField: blurField(heightField, width, height), albedo, alpha, ink,
    width, height, kind: 'sprite',
  });
}

export function renderSprite(asset, source) {
  const { width, height, frames } = asset;
  const horizontal = source.width > width;
  const expectedWidth = width * (horizontal ? frames : 1);
  const expectedHeight = height * (horizontal ? 1 : frames);
  if (source.width !== expectedWidth || source.height !== expectedHeight ||
      source.data.length !== source.width * source.height * 4) {
    throw new Error(`Sprite dimensions or RGBA buffer differ from the reel manifest for ${asset.path}`);
  }

  const profile = profileFor(asset);
  const result = Buffer.alloc(source.width * source.height * SCALE ** 2 * 4);
  const frameStride = width * SCALE * 4;
  const sheetStride = source.width * SCALE * 4;
  for (let index = 0; index < frames; index++) {
    const x = horizontal ? index * width : 0;
    const y = horizontal ? 0 : index * height;
    const frame = renderFrame(framePixels(source, x, y, width, height), profile, index);
    for (let row = 0; row < height * SCALE; row++) {
      const target = (y * SCALE + row) * sheetStride + x * SCALE * 4;
      frame.copy(result, target, row * frameStride, (row + 1) * frameStride);
    }
  }
  return result;
}
