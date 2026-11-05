import {copyFile, mkdir, readFile, rename} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {SCALE} from './full-shading.mjs';
import {renderRoom} from './full-rooms.mjs';
import {renderSprite} from './full-sprites.mjs';

const sampleRoot = path.resolve(import.meta.dirname, '..');
const repo = path.resolve(sampleRoot, '../..');
const destination = path.join(sampleRoot, 'full');
const maskIds = new Set([2022, 3012, 3032]);
const refinedFiles = new Set(['A-PPCT-101.png', 'B-PPCT-906.png', 'B-PSCR-4020.png']);
const index = await readFile(path.join(repo, 'art/castle-index.js'), 'utf8');
const inventory = JSON.parse(index.trim().replace(/^window\.CastleGraphics\s*=\s*/, '').replace(/;$/, ''));

async function readPixels(file) {
  const {data, info} = await sharp(file).toColourspace('srgb').ensureAlpha().raw().toBuffer({resolveWithObject: true});
  return {data, width: info.width, height: info.height};
}

async function writePng(file, data, width, height) {
  const temporary = `${file}.${process.pid}.tmp`;
  await sharp(data, {raw: {width, height, channels: 4}}).png({compressionLevel: 7}).toFile(temporary);
  await rename(temporary, file);
}

function matchDimensions(asset, source) {
  const horizontal = source.width === asset.width * asset.frames && source.height === asset.height;
  const vertical = source.width === asset.width && source.height === asset.height * asset.frames;
  if (!horizontal && !vertical) throw new Error(`${asset.path}: source and index frame layout disagree`);
}

const luminance = (red, green, blue) => .2126 * red + .7152 * green + .0722 * blue;

// Both the image validator and the legacy mask path can recover the original ink.
function restoreInkClass(data, offset, dark) {
  let red = data[offset], green = data[offset + 1], blue = data[offset + 2];
  if (dark) {
    red = Math.min(red, 124);
    const value = luminance(red, green, blue);
    if (value > 124) {
      const gain = 124 / value;
      red *= gain;
      green *= gain;
      blue *= gain;
    }
  } else {
    red = Math.max(red, 132);
    const value = luminance(red, green, blue);
    if (value < 132) {
      const lift = (132 - value) / (255 - value);
      red += (255 - red) * lift;
      green += (255 - green) * lift;
      blue += (255 - blue) * lift;
    }
  }
  data[offset] = Math.round(red);
  data[offset + 1] = Math.round(green);
  data[offset + 2] = Math.round(blue);
}

function boxAverage(source, high, mask) {
  const {width, height, data} = source;
  const stride = width * SCALE;
  const native = Buffer.alloc(data.length);
  if (high.length !== data.length * SCALE * SCALE) throw new Error('Renderer returned an invalid buffer size');
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];
      let red = 0, green = 0, blue = 0;
      for (let dy = 0; dy < SCALE; dy++) {
        for (let dx = 0; dx < SCALE; dx++) {
          const offset = ((y * SCALE + dy) * stride + x * SCALE + dx) * 4;
          if (mask) {
            data.copy(high, offset, index, index + 4);
          } else {
            if (high[offset + 3] !== alpha) throw new Error(`Renderer changed alpha at (${x},${y})`);
            if (alpha) restoreInkClass(high, offset, data[index] === 0);
          }
          red += high[offset];
          green += high[offset + 1];
          blue += high[offset + 2];
        }
      }
      const samples = SCALE * SCALE;
      native[index] = Math.round(red / samples);
      native[index + 1] = Math.round(green / samples);
      native[index + 2] = Math.round(blue / samples);
      native[index + 3] = alpha;
    }
  }
  return native;
}

const names = new Set(process.argv.slice(2));
const selected = names.size ? inventory.filter(asset => names.has(path.basename(asset.path))) : inventory;
if (names.size && selected.length !== names.size) throw new Error('Pass manifest PNG filenames to render a subset');
await mkdir(path.join(destination, 'native'), {recursive: true});
await mkdir(path.join(destination, '4x'), {recursive: true});

for (const [i, asset] of selected.entries()) {
  const name = path.basename(asset.path);
  const originalPath = path.join(repo, asset.path);
  const source = await readPixels(originalPath);
  matchDimensions(asset, source);
  const isRoom = asset.type === 'PSCR';
  const isMask = isRoom && maskIds.has(asset.id);
  const width = source.width * SCALE, height = source.height * SCALE;
  let high;
  if (isMask) {
    high = Buffer.alloc(width * height * 4);
  } else if (refinedFiles.has(name)) {
    const sample = await readPixels(path.join(sampleRoot, '4x', name));
    if (sample.width !== width || sample.height !== height) throw new Error(`${name}: invalid sample dimensions`);
    high = sample.data;
  } else {
    high = isRoom ? renderRoom(asset, source) : renderSprite(asset, source);
  }
  const native = boxAverage(source, high, isMask);
  await writePng(path.join(destination, '4x', name), high, width, height);
  if (isMask) await copyFile(originalPath, path.join(destination, 'native', name));
  else await writePng(path.join(destination, 'native', name), native, source.width, source.height);
  if ((i + 1) % 20 === 0 || isRoom || selected.length < 20) {
    console.log(`${i + 1}/${selected.length} ${name}${isMask ? ' (data mask)' : ''}`);
  }
}
console.log(`Rendered ${selected.length} native and 4x pairs to ${destination}`);
