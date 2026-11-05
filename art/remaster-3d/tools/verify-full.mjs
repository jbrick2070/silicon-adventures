import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const repo = path.resolve(import.meta.dirname, '../../..');
const output = path.join(repo, 'art/remaster-3d/full');
const manifestPath = path.join(repo, 'art/castle-index.js');
const maskNames = new Set(['B-PSCR-2022.png', 'B-PSCR-3012.png', 'B-PSCR-3032.png']);
const scale = 4;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

async function readPng(filename) {
  const bytes = await readFile(filename);
  const png = sharp(bytes);
  const { format } = await png.metadata();
  if (format !== 'png') throw new Error(`${filename} is not a PNG`);
  const { data, info } = await png.toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { bytes, data, width: info.width, height: info.height, sha256: digest(bytes) };
}

function hasDimensions(image, width, height) {
  return image.width === width && image.height === height;
}

// Use integer weights for Rec.709 luma of the sRGB code values.
function darkByLuma(data, i) {
  return 2126 * data[i] + 7152 * data[i + 1] + 722 * data[i + 2] < 1280000;
}

function compare(source, native, master, isMask, asset) {
  const counts = {
    sourceOpaquePixels: 0,
    sourceNonBinaryPixels: 0,
    nativeChangedRgbPixels: 0,
    nativeAlphaMismatches: 0,
    nativeRedMismatches: 0,
    nativeLumaMismatches: 0,
    nativeBoxMeanMismatches: 0,
    masterAlphaMismatches: 0,
    masterRedMismatches: 0,
    masterLumaMismatches: 0,
    masterMaskPixelMismatches: 0,
  };
  const frames = Array.from({ length: asset.frames }, (_, frame) => ({
    frame,
    rectangle: [frame * asset.width, 0, asset.width, asset.height],
    opaquePixels: 0,
    changedRgbPixels: 0,
  }));

  for (let y = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {
      const i = (y * source.width + x) * 4;
      const alpha = source.data[i + 3];
      const red = source.data[i];
      const green = source.data[i + 1];
      const blue = source.data[i + 2];
      const dark = red < 128;
      if ((alpha !== 0 && alpha !== 255) ||
          (alpha && (red !== green || red !== blue || (red !== 0 && red !== 255)))) {
        counts.sourceNonBinaryPixels++;
      }
      if (native.data[i + 3] !== alpha) counts.nativeAlphaMismatches++;
      if (alpha) {
        const frame = frames[Math.floor(x / asset.width)];
        counts.sourceOpaquePixels++;
        frame.opaquePixels++;
        if ((native.data[i] < 128) !== dark) counts.nativeRedMismatches++;
        if (darkByLuma(native.data, i) !== dark) counts.nativeLumaMismatches++;
        if (native.data[i] !== red || native.data[i + 1] !== green || native.data[i + 2] !== blue) {
          counts.nativeChangedRgbPixels++;
          frame.changedRgbPixels++;
        }
      }
      let redSum = 0, greenSum = 0, blueSum = 0, alphaSum = 0;
      for (let dy = 0; dy < scale; dy++) {
        let j = ((y * scale + dy) * master.width + x * scale) * 4;
        for (let dx = 0; dx < scale; dx++, j += 4) {
          const mr = master.data[j];
          const mg = master.data[j + 1];
          const mb = master.data[j + 2];
          const ma = master.data[j + 3];
          redSum += mr;
          greenSum += mg;
          blueSum += mb;
          alphaSum += ma;
          if (ma !== alpha) counts.masterAlphaMismatches++;
          if (alpha && (mr < 128) !== dark) counts.masterRedMismatches++;
          if (alpha && darkByLuma(master.data, j) !== dark) counts.masterLumaMismatches++;
          if (isMask && (mr !== red || mg !== green || mb !== blue || ma !== alpha)) {
            counts.masterMaskPixelMismatches++;
          }
        }
      }
      const area = scale * scale;
      if (native.data[i] !== Math.round(redSum / area) ||
          native.data[i + 1] !== Math.round(greenSum / area) ||
          native.data[i + 2] !== Math.round(blueSum / area) ||
          native.data[i + 3] !== Math.round(alphaSum / area)) {
        counts.nativeBoxMeanMismatches++;
      }
    }
  }
  return { counts, frames };
}

async function verifyAsset(asset) {
  const name = path.basename(asset.path);
  const isMask = maskNames.has(name);
  const row = { name, type: asset.type, isMask, framesExpected: asset.frames, failures: [] };
  try {
    const [source, native, master] = await Promise.all([
      readPng(path.join(repo, asset.path)),
      readPng(path.join(output, 'native', name)),
      readPng(path.join(output, '4x', name)),
    ]);
    row.images = Object.fromEntries(Object.entries({ source, native, master }).map(([key, image]) => [
      key, { dimensions: [image.width, image.height], sha256: image.sha256 },
    ]));
    const width = asset.width * asset.frames;
    const height = asset.height;
    if (!hasDimensions(source, width, height) || !hasDimensions(native, width, height) ||
        !hasDimensions(master, width * scale, height * scale)) {
      throw new Error(`Invalid image dimensions or frame layout. Expected ${width} × ${height} and its exact 4× expansion.`);
    }
    if (isMask && !native.bytes.equals(source.bytes)) row.failures.push('Native mask bytes differ from the source PNG.');
    Object.assign(row, compare(source, native, master, isMask, asset));
    for (const [key, value] of Object.entries(row.counts)) {
      if ((key.endsWith('Mismatches') || key === 'sourceNonBinaryPixels') && value) row.failures.push(`${key}: ${value}`);
    }
    if (!isMask && row.counts.sourceOpaquePixels && !row.counts.nativeChangedRgbPixels) {
      row.failures.push('The visible asset has no recolored pixels.');
    }
  } catch (error) {
    row.failures.push(error.message);
  }
  return row;
}

const manifestBytes = await readFile(manifestPath);
const manifest = JSON.parse(manifestBytes.toString('utf8')
  .replace(/^\s*window\.CastleGraphics\s*=\s*/, '').replace(/;\s*$/, ''));
const reels = manifest.filter(asset => asset.type === 'PPCT');
const screens = manifest.filter(asset => asset.type === 'PSCR');
const frameCount = reels.reduce((sum, asset) => sum + asset.frames, 0);
const expectedNames = new Set(manifest.map(asset => path.basename(asset.path)));
const failures = [];
if (manifest.length !== 192 || expectedNames.size !== 192 || reels.length !== 172 ||
    frameCount !== 684 || screens.length !== 20 || [...maskNames].some(name => !expectedNames.has(name))) {
  failures.push('Source manifest does not contain 192 unique assets, 172 sprite reels with 684 frames, and 20 screens including the three data masks.');
}
for (const directory of ['native', '4x']) {
  try {
    const entries = await readdir(path.join(output, directory));
    const extra = entries.filter(name => /\.png$/i.test(name) && !expectedNames.has(name));
    if (extra.length) failures.push(`${directory}: unexpected PNGs: ${extra.join(', ')}`);
  } catch (error) {
    failures.push(error.message);
  }
}

const assets = [];
for (const asset of manifest) assets.push(await verifyAsset(asset));
const failureCount = failures.length + assets.reduce((sum, asset) => sum + asset.failures.length, 0);
const summary = {
  assetPairsExpected: 192,
  assetPairsCompared: assets.filter(asset => asset.counts).length,
  spriteReels: reels.length,
  spriteFrames: frameCount,
  spriteFramesCompared: assets.filter(asset => asset.type === 'PPCT')
    .reduce((sum, asset) => sum + (asset.frames?.length ?? 0), 0),
  screens: screens.length,
  dataMasks: screens.filter(asset => maskNames.has(path.basename(asset.path))).length,
  recoloredVisibleAssets: assets.filter(asset => !asset.isMask && asset.counts?.nativeChangedRgbPixels).length,
  transparentAssets: assets.filter(asset => asset.counts?.sourceOpaquePixels === 0).map(asset => asset.name),
  failureCount,
  pass: failureCount === 0,
};

await mkdir(output, { recursive: true });
const reportPath = path.join(output, 'validation.json');
await writeFile(reportPath, `${JSON.stringify({
  schemaVersion: 1,
  manifestSha256: digest(manifestBytes),
  source: 'art/castle',
  checks: [
    'Manifest counts, exact dimensions and frame layout',
    'Exact source alpha at native scale and each 4× subpixel',
    'Original opaque ink recovered at red and Rec.709 sRGB luma thresholds of 128',
    'Native RGBA equals rounded 4× box means',
    'Native data masks identical as PNG bytes and 4× masks exact nearest-neighbor expansions',
    'At least one native RGB change in every visible, non-mask asset',
  ],
  summary,
  failures,
  assets,
}, null, 2)}\n`);

console.log(JSON.stringify({ reportPath, ...summary }, null, 2));
if (failureCount) {
  for (const message of failures) console.error(message);
  for (const asset of assets.filter(asset => asset.failures.length).slice(0, 20)) {
    console.error(`${asset.name}: ${asset.failures.join(' | ')}`);
  }
  process.exitCode = 1;
}
