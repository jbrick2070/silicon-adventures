import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Independent verification: no pixels are changed by this script. The expected
// hashes below identify the PNGs inspected before remastering, not the resource
// fork hashes in castle-index.js.
const here = path.dirname(fileURLToPath(import.meta.url));
const outputRoot = path.resolve(here, '..');
const repository = path.resolve(outputRoot, '..', '..');
const sourceRoot = path.join(repository, 'art', 'castle');
const reportPath = path.join(outputRoot, 'validation.json');
const assets = [
  { name: 'B-PSCR-4020.png', kind: 'screen', width: 512, height: 342, frames: 1,
    sourceSha256: '3e6ba63dbc8e24f2a34c07a25fdc228b8a8ddb85386df4376e4ff8a3f2872873' },
  { name: 'A-PPCT-101.png', kind: 'sprite', width: 32, height: 40, frames: 6,
    sourceSha256: 'a54c6c29b3fc58b28f6929bfb7d8da166d9879be100b429052b21eeac66fd4be' },
  { name: 'B-PPCT-906.png', kind: 'sprite', width: 48, height: 32, frames: 3,
    sourceSha256: '633b46f4f533d1782ae0426a2c4c45bacc7cc84a7b33e46280d21f86553ebfa6' },
];
const failures = [];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const luminance = (bytes, i) => 0.2126 * bytes[i] + 0.7152 * bytes[i + 1] + 0.0722 * bytes[i + 2];
const recordFailure = (scope, message) => failures.push({ scope, message });

async function loadPNG(filename) {
  const bytes = await readFile(filename);
  const metadata = await sharp(bytes).metadata();
  const { data, info } = await sharp(bytes).toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return {
    filename, data, width: info.width, height: info.height,
    metadata: {
      path: filename, sha256: digest(bytes), format: metadata.format,
      width: info.width, height: info.height, channels: info.channels,
      hasAlpha: metadata.hasAlpha, colourspace: metadata.space,
    },
  };
}

function boundsAndCounts(im, frame, frameWidth, frameHeight, scale = 1) {
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  let nontransparentPixels = 0, opaquePixels = 0, partiallyTransparentPixels = 0;
  const alpha = [];
  for (let y = 0; y < frameHeight * scale; y++) {
    for (let x = 0; x < frameWidth * scale; x++) {
      const i = ((y * im.width) + frame * frameWidth * scale + x) * 4;
      const a = im.data[i + 3];
      alpha.push(a);
      if (a) {
        nontransparentPixels++;
        x0 = Math.min(x0, x); y0 = Math.min(y0, y);
        x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
      if (a === 255) opaquePixels++;
      else if (a) partiallyTransparentPixels++;
    }
  }
  return {
    frameIndex: frame,
    sourceRectangle: [frame * frameWidth * scale, 0, frameWidth * scale, frameHeight * scale],
    alphaBoundingBoxExclusive: nontransparentPixels ? [x0, y0, x1 + 1, y1 + 1] : null,
    nontransparentPixels, opaquePixels, partiallyTransparentPixels,
    alphaSha256: digest(Buffer.from(alpha)),
  };
}

function compare(source, rendered, asset, scale) {
  const scope = `${asset.name} ${scale}x`;
  const expectedWidth = asset.width * asset.frames * scale;
  const expectedHeight = asset.height * scale;
  const dimensionsMatch = rendered.width === expectedWidth && rendered.height === expectedHeight;
  const result = {
    ...rendered.metadata, scale,
    expectedDimensions: [expectedWidth, expectedHeight], dimensionsMatch,
    frameLayout: { columns: asset.frames, rows: 1, cellWidth: asset.width * scale, cellHeight: asset.height * scale, padding: 0 },
  };
  if (rendered.metadata.format !== 'png') recordFailure(scope, 'Output is not PNG.');
  if (!dimensionsMatch) {
    recordFailure(scope, `Dimensions ${rendered.width}x${rendered.height} differ from expected ${expectedWidth}x${expectedHeight}; pixel comparisons skipped.`);
    return result;
  }
  let alphaMismatches = 0, thresholdMismatches = 0, blockMeanThresholdMismatches = 0;
  let sourceOpaquePixelsCompared = 0, expandedOpaquePixelsCompared = 0;
  const examples = { alpha: [], threshold: [], blockMeanThreshold: [] };
  const frames = Array.from({ length: asset.frames }, (_, frame) => ({
    ...boundsAndCounts(rendered, frame, asset.width, asset.height, scale),
    alphaMismatches: 0, thresholdMismatches: 0, blockMeanThresholdMismatches: 0,
  }));
  for (let y = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {
      const si = (y * source.width + x) * 4;
      const sourceAlpha = source.data[si + 3];
      const sourceBlack = luminance(source.data, si) < 128;
      const frame = frames[Math.floor(x / asset.width)];
      let blockLuminance = 0;
      if (sourceAlpha === 255) sourceOpaquePixelsCompared++;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const ox = x * scale + dx, oy = y * scale + dy;
          const oi = (oy * rendered.width + ox) * 4;
          if (rendered.data[oi + 3] !== sourceAlpha) {
            alphaMismatches++; frame.alphaMismatches++;
            if (examples.alpha.length < 10) examples.alpha.push({ source: [x, y], output: [ox, oy], expected: sourceAlpha, actual: rendered.data[oi + 3] });
          }
          if (sourceAlpha === 255) {
            const luma = luminance(rendered.data, oi);
            blockLuminance += luma;
            expandedOpaquePixelsCompared++;
            if ((luma < 128) !== sourceBlack) {
              thresholdMismatches++; frame.thresholdMismatches++;
              if (examples.threshold.length < 10) examples.threshold.push({ source: [x, y], output: [ox, oy], expectedBlack: sourceBlack, outputLuminance: luma });
            }
          }
        }
      }
      if (sourceAlpha === 255 && ((blockLuminance / (scale * scale) < 128) !== sourceBlack)) {
        blockMeanThresholdMismatches++; frame.blockMeanThresholdMismatches++;
        if (examples.blockMeanThreshold.length < 10) examples.blockMeanThreshold.push({ source: [x, y], expectedBlack: sourceBlack, blockMeanLuminance: blockLuminance / (scale * scale) });
      }
    }
  }
  Object.assign(result, {
    alphaComparedPixels: rendered.width * rendered.height,
    alphaMismatches, exactSourceAlphaExpansion: alphaMismatches === 0,
    sourceOpaquePixelsCompared, expandedOpaquePixelsCompared,
    thresholdMismatches, exactOpaqueBinaryPartitionAtEverySubpixel: thresholdMismatches === 0,
    blockMeanThresholdMismatches, exactOpaqueBinaryPartitionAfterBlockMean: blockMeanThresholdMismatches === 0,
    noCropOrPaddingChange: dimensionsMatch && alphaMismatches === 0,
    frames, mismatchExamples: examples,
  });
  if (alphaMismatches) recordFailure(scope, `${alphaMismatches} alpha bytes differ from the exact source expansion.`);
  if (thresholdMismatches) recordFailure(scope, `${thresholdMismatches} opaque output pixels cross the original black/white threshold.`);
  if (blockMeanThresholdMismatches) recordFailure(scope, `${blockMeanThresholdMismatches} original-pixel blocks cross the original black/white threshold after mean reduction.`);
  return result;
}

const report = {
  schemaVersion: 1, generatedAt: new Date().toISOString(),
  sourceRoot, outputRoot, reportPath,
  method: {
    geometry: 'Exact image dimensions and horizontal cell rectangles; exact source alpha replicated into every integer-scale subpixel.',
    structure: 'For every originally opaque pixel, compare its black/white class against Rec.709-weighted sRGB code values (0.2126 R + 0.7152 G + 0.0722 B), threshold 128. Test every output subpixel and the mean of each corresponding source-pixel block.',
    luminanceNote: 'This is a defined code-value threshold, not linear-light physical luminance.',
    rgbComparisonOutsideSourceMask: 'Excluded; exact alpha is still checked everywhere, including transparent holes and sheet margins.',
    frameNumbering: 'Zero-based; bounding-box right and bottom are exclusive.',
    limit: 'Exact binary partition preservation establishes original pixel contours and internal line locations at this threshold. It does not establish anatomical interpretation, lighting quality, or animation coherence; these need visual review.',
  },
  assets: [], failures,
};

try {
  const filename = path.join(repository, 'art', 'castle-index.js');
  const text = await readFile(filename, 'utf8');
  const manifest = JSON.parse(text.replace(/^\s*window\.CastleGraphics\s*=\s*/, '').replace(/;\s*$/, ''));
  const reels = manifest.filter(a => a.type === 'PPCT');
  const counts = { spriteReels: reels.length, spriteFrames: reels.reduce((sum, a) => sum + a.frames, 0), screens: manifest.filter(a => a.type === 'PSCR').length };
  report.manifest = { path: filename, ...counts, matchesExpectedCounts: counts.spriteReels === 172 && counts.spriteFrames === 684 && counts.screens === 20 };
  if (!report.manifest.matchesExpectedCounts) recordFailure('manifest', 'Counts differ from expected 172 sprite reels / 684 frames / 20 screens.');
} catch (error) {
  recordFailure('manifest', error.message);
}

for (const asset of assets) {
  const row = { name: asset.name, kind: asset.kind, frameCount: asset.frames, frameWidth: asset.width, frameHeight: asset.height, outputs: [] };
  report.assets.push(row);
  let source;
  try {
    source = await loadPNG(path.join(sourceRoot, asset.name));
    row.source = { ...source.metadata, expectedSha256: asset.sourceSha256, hashMatchesOriginal: source.metadata.sha256 === asset.sourceSha256 };
    if (!row.source.hashMatchesOriginal) recordFailure(asset.name, 'Source PNG hash differs from the inspected original.');
    if (source.width !== asset.width * asset.frames || source.height !== asset.height) {
      recordFailure(asset.name, 'Source dimensions differ from the inspected original; output comparisons skipped.');
      continue;
    }
    row.source.frames = Array.from({ length: asset.frames }, (_, i) => boundsAndCounts(source, i, asset.width, asset.height));
    let invalidOpaqueSourceColours = 0, nonBinarySourceAlphaPixels = 0;
    for (let i = 0; i < source.data.length; i += 4) {
      const a = source.data[i + 3];
      if (a !== 0 && a !== 255) nonBinarySourceAlphaPixels++;
      if (a === 255 && !((source.data[i] === 0 && source.data[i + 1] === 0 && source.data[i + 2] === 0) || (source.data[i] === 255 && source.data[i + 1] === 255 && source.data[i + 2] === 255))) invalidOpaqueSourceColours++;
    }
    row.source.invalidOpaqueSourceColours = invalidOpaqueSourceColours;
    row.source.nonBinarySourceAlphaPixels = nonBinarySourceAlphaPixels;
    if (invalidOpaqueSourceColours || nonBinarySourceAlphaPixels) recordFailure(asset.name, 'Source is not an exact black/white PNG with binary alpha.');
  } catch (error) {
    recordFailure(asset.name, `Cannot read source: ${error.message}`);
    continue;
  }
  for (const [directory, scale] of [['native', 1], ['4x', 4]]) {
    const filename = path.join(outputRoot, directory, asset.name);
    try {
      row.outputs.push(compare(source, await loadPNG(filename), asset, scale));
    } catch (error) {
      row.outputs.push({ path: filename, scale, error: error.message });
      recordFailure(`${asset.name} ${scale}x`, `Cannot validate output: ${error.message}`);
    }
  }
}

report.summary = {
  sourceAssets: assets.length,
  sourceSpriteFrames: assets.filter(a => a.kind === 'sprite').reduce((sum, a) => sum + a.frames, 0),
  outputFilesExpected: assets.length * 2,
  outputFilesCompared: report.assets.reduce((sum, a) => sum + a.outputs.filter(o => o.frames).length, 0),
  spriteFramesComparedAcrossBothScales: report.assets.filter(a => a.kind === 'sprite').reduce((sum, a) => sum + a.outputs.reduce((n, o) => n + (o.frames?.length ?? 0), 0), 0),
  failureCount: failures.length,
  pass: failures.length === 0,
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, ...report.summary }, null, 2));
if (failures.length) {
  for (const failure of failures) console.error(`FAIL [${failure.scope}]: ${failure.message}`);
  process.exitCode = 1;
}
