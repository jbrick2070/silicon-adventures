/* Saber's chart: a fog-of-war map of the 10 × 20 room grid recorded in the
   scene designs (worldX, worldY; y grows south). Drawn in strict 1-bit with
   the disk's own CODE 1 tiles: visited rooms take Pattern 3, the current room
   Pattern 8 with a paper dot, and each visited cell shows an ink edge where
   its map bearing is blocked and a gap where it opens. Nothing is drawn for
   rooms not yet seen. */
class WorldMap {
  constructor(canvas, rooms, cell = 10) {
    this.canvas = canvas;
    this.rooms = rooms;
    this.cell = cell;
    this.cols = Math.max(...rooms.map(r => r.worldX));
    this.rows = Math.max(...rooms.map(r => r.worldY));
    this.w = canvas.width = this.cols * cell + 1;
    this.h = canvas.height = this.rows * cell + 1;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.frame = this.ctx.createImageData(this.w, this.h);
    this.pixels = new Uint32Array(this.frame.data.buffer);
    this.byCell = new Map(rooms.map((r, i) => [(r.worldX - 1) + ',' + (r.worldY - 1), i]));
    this.ink = 0xff161816;
    this.paper = 0xffe8eee9;
  }
  roomAt(px, py) {
    const cx = Math.floor((px - 0.5) / this.cell), cy = Math.floor((py - 0.5) / this.cell);
    const i = this.byCell.get(cx + ',' + cy);
    return i === undefined ? null : this.rooms[i];
  }
  draw(visited, currentId) {
    const { w, h, cell, pixels, ink, paper } = this;
    const tiles = window.ScepterPatterns;
    const bit = (pat, x, y) => !!(tiles[pat][y & 7] & (128 >> (x & 7)));
    pixels.fill(paper);
    for (let x = 0; x < w; x++) { pixels[x] = ink; pixels[(h - 1) * w + x] = ink; }
    for (let y = 0; y < h; y++) { pixels[y * w] = ink; pixels[y * w + w - 1] = ink; }
    this.rooms.forEach((r, i) => {
      if (!visited[i] && r.id !== currentId) return;
      const x0 = (r.worldX - 1) * cell + 1, y0 = (r.worldY - 1) * cell + 1, n = cell - 1;
      const current = r.id === currentId;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        pixels[(y0 + y) * w + x0 + x] = bit(current ? 8 : 3, x0 + x, y0 + y) ? ink : paper;
      }
      if (current) {
        const mx = x0 + (n >> 1) - 1, my = y0 + (n >> 1) - 1;
        for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) pixels[(my + y) * w + mx + x] = paper;
      }
      const b = r.blocked || {};
      // Edges sit on the shared gridlines: ink where this room's bearing is blocked, open otherwise.
      for (let k = -1; k <= n; k++) {
        if (b.north) pixels[(y0 - 1) * w + x0 + k] = ink;
        if (b.south) pixels[(y0 + n) * w + x0 + k] = ink;
        if (b.west) pixels[(y0 + k) * w + x0 - 1] = ink;
        if (b.east) pixels[(y0 + k) * w + x0 + n] = ink;
      }
    });
    this.ctx.putImageData(this.frame, 0, 0);
  }
}
