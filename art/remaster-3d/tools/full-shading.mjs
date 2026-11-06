export const SCALE = 4;

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

export function distance(mask, width, height) {
  const field = Float32Array.from(mask, value => value ? 1e6 : 0);
  const diagonal = Math.SQRT2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (!mask[p]) continue;
      let value = x && y ? field[p] : 1;
      if (x) value = Math.min(value, field[p - 1] + 1);
      if (y) value = Math.min(value, field[p - width] + 1);
      if (x && y) value = Math.min(value, field[p - width - 1] + diagonal);
      if (x < width - 1 && y) value = Math.min(value, field[p - width + 1] + diagonal);
      field[p] = value;
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const p = y * width + x;
      if (!mask[p]) continue;
      let value = x === width - 1 || y === height - 1 ? Math.min(field[p], 1) : field[p];
      if (x < width - 1) value = Math.min(value, field[p + 1] + 1);
      if (y < height - 1) value = Math.min(value, field[p + width] + 1);
      if (x < width - 1 && y < height - 1) value = Math.min(value, field[p + width + 1] + diagonal);
      if (x && y < height - 1) value = Math.min(value, field[p + width - 1] + diagonal);
      field[p] = value;
    }
  }
  return field;
}

export function blurField(field, width, height) {
  const weights = [1 / 16, 4 / 16, 6 / 16, 4 / 16, 1 / 16];
  const horizontal = new Float32Array(field.length);
  const result = new Float32Array(field.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      for (let k = -2; k <= 2; k++) horizontal[p] += field[y * width + clamp(x + k, 0, width - 1)] * weights[k + 2];
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      for (let k = -2; k <= 2; k++) result[p] += horizontal[clamp(y + k, 0, height - 1) * width + x] * weights[k + 2];
    }
  }
  return result;
}

const shadowSamples = [1, 2, 3.5, 5.5, 8, 11].map(reach => ({
  x: Math.round(reach * SCALE * .66), y: Math.round(reach * SCALE), rise: reach * .38,
}));

export function shadeRelief({heightField, albedo, alpha, ink, width, height, kind}) {
  const room = kind === 'room';
  const output = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const pixel = p * 4;
      output[pixel + 3] = alpha[p];
      if (!alpha[p]) continue;
      const dx = (heightField[y * width + Math.min(width - 1, x + 1)] - heightField[y * width + Math.max(0, x - 1)]) * SCALE / 2;
      const dy = (heightField[Math.min(height - 1, y + 1) * width + x] - heightField[Math.max(0, y - 1) * width + x]) * SCALE / 2;
      const inverse = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const diffuse = Math.max(0, (.43 * dx + .58 * dy + .69) * inverse);
      const gloss = Math.max(0, (.23 * dx + .31 * dy + .923) * inverse) ** (room ? 20 : 16);
      let shadow = 0;
      if (room) {
        for (const sample of shadowSamples) {
          if (x < sample.x || y < sample.y) break;
          const blocker = heightField[(y - sample.y) * width + x - sample.x];
          shadow = Math.max(shadow, clamp((blocker - heightField[p] - sample.rise) / 1.75, 0, 1));
        }
      }
      const inkGain = ink[p] ? (room ? .72 : .51 + .13 * diffuse) : 1;
      const exposure = (.51 + .67 * diffuse) * (1 - .28 * shadow) * inkGain;
      const sheen = gloss * (ink[p] ? 6 : room ? 14 : 22) * (1 - shadow * .70);
      const coolFill = 1 - diffuse + shadow;
      output[pixel] = clamp(Math.round(albedo[3 * p] * exposure + sheen + 5 * diffuse), 0, 255);
      output[pixel + 1] = clamp(Math.round(albedo[3 * p + 1] * exposure + sheen + 3 * coolFill), 0, 255);
      output[pixel + 2] = clamp(Math.round(albedo[3 * p + 2] * exposure + sheen + 8 * coolFill), 0, 255);
    }
  }
  return output;
}
