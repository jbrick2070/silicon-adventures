import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const repo = path.resolve(import.meta.dirname, '../../..');
const root = path.join(repo, 'art/remaster-3d/full');
const preview = path.join(root, 'preview');
const masks = new Set([2022, 3012, 3032]);
const manifest = JSON.parse((await readFile(path.join(repo, 'art/castle-index.js'), 'utf8'))
  .replace(/^\s*window\.CastleGraphics\s*=\s*/, '').replace(/;\s*$/, ''));
const nameOf = asset => path.basename(asset.path);
const labelOf = asset => path.basename(asset.path, '.png');
const nativePath = asset => path.join(root, 'native', nameOf(asset));

function escapeXml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function label(x, y, value, size = 13, colour = '#d8e0e4') {
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${colour}">${escapeXml(value)}</text>`;
}

function plate(x, y, width, height, colour) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" fill="${colour}"/>`;
}

async function savePage(filename, width, height, title, subtitle, labels, images) {
  const backdrop = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#172129"/>
    <g font-family="Segoe UI, Arial, sans-serif">
      ${label(24, 35, title, 24, '#f4dfbb')}
      ${label(24, 57, subtitle, 14, '#a8bdc8')}
      ${labels.join('\n')}
    </g>
  </svg>`);
  await sharp(backdrop).composite(images).png().toFile(path.join(preview, filename));
}

async function roomPage(rooms) {
  const columns = 4;
  const tileWidth = 256;
  const tileHeight = 171;
  const strideX = tileWidth + 16;
  const strideY = tileHeight + 33;
  const images = [];
  const labels = [];
  for (const [i, asset] of rooms.entries()) {
    const left = 24 + (i % columns) * strideX;
    const top = 78 + Math.floor(i / columns) * strideY;
    const input = await sharp(nativePath(asset)).resize(tileWidth, tileHeight).png().toBuffer();
    images.push({ input, left, top });
    labels.push(label(left, top + tileHeight + 18, labelOf(asset), 14));
  }
  await savePage('rooms.png', 48 + columns * strideX - 16, 84 + Math.ceil(rooms.length / columns) * strideY,
    'Castle remaster · screens', `${rooms.length} visible screens from the native exports`, labels, images);
}

async function scenePage(directory) {
  const scenes = [[1000, 'Entrance stairs and ropes'], [1010, 'Swinging ropes'],
    [2020, 'River cave and foreground rock'], [4020, 'Black Knight and throne']];
  const labels = [], images = [];
  for (const [index, [room, description]] of scenes.entries()) {
    const left = 24 + (index % 2) * 528;
    const top = 78 + Math.floor(index / 2) * 374;
    const input = await sharp(path.join(directory, `scene-${room}.png`))
      .resize(512, 342).png().toBuffer();
    images.push({input, left, top});
    labels.push(label(left, top + 363, `${room}  ·  ${description}`, 14));
  }
  await savePage('play-scenes.png', 1088, 830,
    'Castle remaster · play scenes', 'Four rooms captured with the game renderer at play size', labels, images);
}

function spritePages(reels) {
  const pages = [[]];
  let top = 78;
  for (const asset of reels) {
    // Fit each reel on one row at 1× or 2×. Native art stays on a pixel grid.
    const fitsAtDoubleSize = asset.frames * (asset.width * 2 + 10) <= 1352;
    const scale = fitsAtDoubleSize && asset.height <= 100 ? 2 : 1;
    const rowHeight = asset.height * scale + 65;
    if (pages.at(-1).length && top + rowHeight > 1320) {
      pages.push([]);
      top = 78;
    }
    pages.at(-1).push({ asset, top, scale, rowHeight });
    top += rowHeight;
  }
  return pages;
}

async function spritePage(rows, page, totalPages, width) {
  const images = [];
  const labels = [];
  for (const { asset, top, scale } of rows) {
    const { data, info } = await sharp(nativePath(asset)).toColourspace('srgb').ensureAlpha().raw()
      .toBuffer({ resolveWithObject: true });
    const frameWidth = asset.width * scale;
    const frameHeight = asset.height * scale;
    labels.push(label(24, top + 15,
      `${labelOf(asset)}   ·   ${asset.width} × ${asset.height}   ·   ${asset.frames} ${asset.frames === 1 ? 'frame' : 'frames'}`, 14, '#f4dfbb'));
    for (let f = 0; f < asset.frames; f++) {
      const left = 24 + f * (frameWidth + 10);
      const frameTop = top + 26;
      const stride = asset.width * 4;
      const frame = Buffer.alloc(stride * asset.height);
      for (let y = 0; y < asset.height; y++) {
        const start = y * info.width * 4 + f * stride;
        data.copy(frame, y * stride, start, start + stride);
      }
      const input = await sharp(frame, { raw: { width: asset.width, height: asset.height, channels: 4 } })
        .resize(frameWidth, frameHeight, { kernel: 'nearest' }).png().toBuffer();
      images.push({ input, left, top: frameTop });
      labels.push(plate(left - 3, frameTop - 3, frameWidth + 6, frameHeight + 6, '#25343f'));
      labels.push(label(left, frameTop + frameHeight + 19, f + 1, 11, '#9bb0bc'));
    }
  }
  const height = rows.at(-1).top + rows.at(-1).rowHeight + 6;
  await savePage(`sprites-${String(page).padStart(2, '0')}.png`, width, height,
    'Castle remaster · sprites', `Page ${page} of ${totalPages} · native frames in reel order`, labels, images);
}

const rooms = manifest.filter(asset => asset.type === 'PSCR' && !masks.has(asset.id));
const reels = manifest.filter(asset => asset.type === 'PPCT');
await mkdir(preview, { recursive: true });
await roomPage(rooms);
const pages = spritePages(reels);
for (const [i, rows] of pages.entries()) {
  const width = Math.max(680, ...rows.map(({ asset, scale }) => 48 + asset.frames * (asset.width * scale + 10)));
  await spritePage(rows, i + 1, pages.length, width);
}
if (process.argv[2]) await scenePage(path.resolve(process.argv[2]));
console.log(`Wrote room overview and ${pages.length} sprite contact sheets for ${reels.length} reels in ${preview}`);
