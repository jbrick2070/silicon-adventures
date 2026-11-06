/* The Enchanted Castle: the playable screen around game/castle-core.js.
   A new game for this library, built from the Dark Castle disk's rooms, cast and
   recordings with the four scepters of Enchanted Scepters at its heart. It runs
   beside the adventure and never sends the adventure a command, so it spends no
   turns. The strict 1-bit modes show only the disk's black and white. */
(() => {
  'use strict';
  const W = 512, H = 342, STATUS_Y = 309;
  const PALETTE = {hall: '#efe3cb', trouble: '#e9dcc3', fireball: '#f1d9b4', shield: '#d9e3da', knight: '#ddd3e8'};
  const INK = '#21163a';
  // The Remastered look draws the best art for each file. Painted files in art/castle-3d win, Codex's
  // full relief pack covers the rest, and the disk's art is the last resort. Duncan's left walk and
  // left arm are exact mirrors of the right ones, so one painted strip serves both.
  const HD_SCALE = 4;
  const HD_PAINTED = new Set(['B1000', 'B2020', 'B4020', 'B1010', 'B1020', 'B2000', 'B2010', 'B2030', 'B3000', 'B3010', 'B3020', 'B3030', 'B4000', 'B4010', 'A101', 'A105', 'A106', 'A112', 'B300', 'B310', 'B350', 'B412', 'B435', 'B710', 'B902', 'B903', 'B906', 'B908', 'A102', 'A103', 'A104', 'A107', 'A108', 'A109', 'A110', 'A114', 'A115', 'A116', 'A117', 'A118', 'A119', 'A120', 'A123', 'A125', 'A126', 'A128', 'A129', 'A130', 'A131', 'A149', 'B132', 'B133', 'B134', 'B146', 'B147', 'B155', 'B142', 'B143', 'B150', 'B151', 'B154', 'B157', 'B158', 'A124', 'A135', 'A136', 'A137', 'B139', 'B140', 'B141', 'B148', 'B152', 'B153', 'B156', 'A144', 'A145', 'B709', 'A113', 'A127', 'A138', 'A520', 'B904', 'B905', 'B910', 'B911', 'B912', 'B913', 'B914', 'B915', 'B916', 'B917', 'B920', 'B921', 'B712', 'B918', 'B919', 'B907', 'B922', 'B715', 'B716', 'B717', 'B200', 'B400', 'B401', 'B438', 'B410', 'B411', 'B413', 'B700', 'B900', 'B901', 'B311', 'B351', 'B352', 'B353', 'B354', 'B355', 'B356', 'B357', 'B405', 'B406', 'B407', 'B408', 'B414', 'B415', 'B416', 'B417', 'B418', 'B420', 'B421', 'B422', 'B423', 'B424', 'B425', 'B426', 'B428', 'B429', 'B430', 'B431', 'B432', 'B433', 'B434', 'B436', 'B437', 'A5000', 'A5010', 'B121', 'B122', 'B510', 'B511', 'B521', 'B522', 'B701', 'B702', 'B703', 'B704', 'B705', 'B706', 'B707', 'B708', 'B711', 'B714', 'A10008', 'A10010', 'A10011', 'A10012', 'A10013', 'A10020', 'A10021', 'A10022', 'A10023', 'A10024', 'A10030', 'A10031', 'A10032', 'A10033', 'A10034', 'A10040', 'A10041', 'A10042', 'A10043', 'A10050', 'A10051', 'A10052']);
  const HD_MIRRORS = {A100: 'A101', A111: 'A112'};
  // Painted rooms with a surface map take the moving torchlight. Only light moves, never geometry.
  const CINE_W = 640, CINE_H = 428, CINE_FRAMES = 48, CINE_RATE = 16, CINE_SHOT = CINE_FRAMES / CINE_RATE;
  const HD_NORMALS = ['B1000', 'B1010', 'B1020', 'B2000', 'B2010', 'B2020', 'B2030', 'B3000', 'B3010', 'B3020', 'B3030', 'B4000', 'B4010', 'B4020'];
  // These tiles are opaque on the disk. Their outer white must clear to show the room behind them.
  const HD_OPEN_TILES = new Set(['B510', 'B511', 'A5000']);
  const CAPTIONS = {bat: 'Leathery wings', rat: 'A rat squeaks', door: 'A door grinds', guard: 'A guard calls', guardDie: 'A guard falls', mutant: 'A mutant grunts',
    whip: 'A whip cracks', henchman: 'A boulder is heaved', boulder: 'Stone strikes stone', dragon: 'Dragon breath roars', drip: 'Something drips', eye: 'The eye crackles',
    gargoyle: 'Stone wings', knight: 'The Black Knight laughs', throne: 'The throne groans', mug: 'A mug flies', lever: 'A chain rattles', storm: 'Thunder', wizard: 'The wizard chants',
    gate: 'A gate slides', broom: 'A broom whisks', vulture: 'A vulture screeches', hatch: 'A hatch swings', weight: 'Something heavy is falling', plague: 'Plague', elixir: 'Elixir',
    heroHit: 'A blow lands', fall: 'A long fall', extraMan: 'An extra man', pickup: 'Picked up', fountain: 'The fountain hisses', title: 'Organ', hall: 'Organ', ending: 'Fanfare'};

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img); img.onerror = () => reject(new Error('Could not load ' + src)); img.src = src;
    });
  }
  function tinted(img, colour) {
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0); ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = colour; ctx.fillRect(0, 0, c.width, c.height);
    return c;
  }
  const assets = {reels: new Map(), info: new Map(), screens: new Map(), paper: new Map(), plates: new Map(), loaded: null};
  function loadAssets() {
    if (assets.loaded) return assets.loaded;
    const jobs = [];
    for (const a of window.CastleGraphics) {
      const key = a.fork.slice(-1) + a.id;
      if (a.type === 'PPCT') { assets.info.set(key, a); jobs.push(loadImage(a.path).then(img => assets.reels.set(key, img))); }
      else if (a.type === 'PSCR') jobs.push(loadImage(a.path).then(img => assets.screens.set(key, img)));
    }
    const paper = ['A-PICT-10000', 'A-PICT-10004', 'A-PICT-12100', 'A-PICT-12200', 'A-PICT-15100', 'A-PICT-15101', 'A-PICT-16000', 'A-PICT-16100', 'A-PICT-16101', 'A-PICT-16102', 'A-PICT-16103',
      'A-PICT-16200', 'B-PICT-16201', 'B-PICT-16202', 'B-PICT-16203', 'B-PICT-16204'];
    for (const name of paper) jobs.push(loadImage('archive/dc/paper/Data-' + name + '.png').then(img => assets.paper.set(name, img)));
    for (const wing of Object.values(window.CastlePlan.WINGS)) jobs.push(loadImage(wing.scepter.plate).then(img => assets.plates.set(wing.scepter.id, img)));
    assets.fonts = {};
    for (const [name, meta] of Object.entries(window.CASTLE_DATA.fonts)) {
      jobs.push(loadImage(meta.path).then(img => { assets.fonts[name] = {meta, black: tinted(img, '#000'), white: tinted(img, '#fff')}; }));
    }
    assets.loaded = Promise.all(jobs).then(prepareForegrounds);
    return assets.loaded;
  }
  function loadHD() {
    if (assets.hdLoaded) return assets.hdLoaded;
    assets.hd = {screens: new Map(), reels: new Map()};
    const jobs = [];
    const masks = new Set(Object.values(window.CastlePlan.SCREENS.masks));
    for (const a of window.CastleGraphics) {
      const key = a.fork.slice(-1) + a.id, file = a.path.split('/').pop(), mirror = a.type === 'PPCT' ? HD_MIRRORS[key] : null;
      if (a.type === 'PSCR' && (masks.has(key) || !+a.id || +a.id >= 12000)) continue; // Masks stay binary, and title and score screens stay as drawn.
      const painted = mirror || key, name = mirror ? `art/castle-3d/4x/${mirror[0]}-PPCT-${mirror.slice(1)}.png` : `art/${HD_PAINTED.has(key) ? 'castle-3d' : 'remaster-3d/full'}/4x/${file}`;
      jobs.push(loadImage(name).then(img => {
        if (a.type === 'PSCR') assets.hd.screens.set(key, img);
        else assets.hd.reels.set(key, {img: HD_OPEN_TILES.has(key) ? openTile(img, key) : img, mirror: !!mirror});
      }).catch(() => {}));
    }
    assets.hd.normals = new Map();
    for (const key of HD_NORMALS) jobs.push(loadImage(`art/castle-3d/normals/B-PSCR-${key.slice(1)}.png`).then(img => assets.hd.normals.set(key, img)).catch(() => {}));
    assets.hd.skies = new Map();
    for (const key of HD_SKIES) jobs.push(loadImage(`art/castle-3d/sky/B-PSCR-${key.slice(1)}.png`).then(img => assets.hd.skies.set(key, img)).catch(() => {}));
    assets.hd.scepters = new Map();
    for (const wing of Object.values(window.CastlePlan.WINGS)) jobs.push(loadImage(wing.scepter.plate.replace('archive/es/plates/', 'art/es-3d/scepters/4x/')).then(img => assets.hd.scepters.set(wing.scepter.id, img)).catch(() => {}));
    assets.hd.spins = new Map();
    for (const id of ['earth', 'fire', 'air', 'water']) loadImage(`art/es-3d/scepters/spin-${id}.png`).then(img => assets.hd.spins.set(id, img)).catch(() => {});
    loadImage('art/castle-3d/4x/A-PICT-10000.png').then(img => { assets.hd.hall = img; }).catch(() => {});
    loadImage('art/castle-3d/4x/A-PICT-10004.png').then(img => { assets.hd.tree = img; }).catch(() => {});
    assets.hd.cine = new Map();
    for (const key of ['knight', 'empty']) loadImage(`art/castle-3d/finale-${key}.png`).then(img => assets.hd.cine.set(key, img)).catch(() => {});
    assets.hdLoaded = Promise.all(jobs).then(prepareHDForegrounds);
    return assets.hdLoaded;
  }
  // Relights a painted room from its surface map. Without WebGL the room simply stays as painted.
  // Outdoor rooms carry a sky layer whose alpha marks what may drift. Its 4% margin hides the edges of the drift.
  const HD_SKIES = ['B2000', 'B3010', 'B3030'];
  class RoomLight {
    constructor() {
      this.canvas = document.createElement('canvas'); this.canvas.width = W * 2; this.canvas.height = H * 2;
      const gl = this.gl = this.canvas.getContext('webgl', {alpha: false, antialias: false});
      if (!gl) return;
      const shader = (type, code) => { const o = gl.createShader(type); gl.shaderSource(o, code); gl.compileShader(o); return o; };
      const program = gl.createProgram();
      gl.attachShader(program, shader(gl.VERTEX_SHADER, 'attribute vec2 p; varying vec2 v; void main() { v = vec2(p.x + 1., 1. - p.y) / 2.; gl_Position = vec4(p, 0., 1.); }'));
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `precision mediump float; varying vec2 v; uniform sampler2D art, normals, sky; uniform vec2 torch, drift; uniform float glow, outdoors;
        void main() {
          vec3 base = texture2D(art, v).rgb, raw = texture2D(normals, v).rgb * 2. - 1., n = normalize(raw + vec3(0., 0., .001));
          float solid = smoothstep(.2, .6, length(raw)); // Sky has no surface, so it stays as painted.
          vec3 to = vec3((torch.x - v.x) * 3., (v.y - torch.y) * 2.004, .35);
          float away = length(to), fall = 1. / (1. + away * away * 2.56), lit = max(dot(n, to / away), 0.);
          vec3 room = base * (mix(vec3(1.), vec3(.6, .62, .68), solid) + solid * 1.7 * glow * lit * fall * vec3(.9, .8, .5));
          float open = outdoors * texture2D(sky, v).a;
          gl_FragColor = vec4(mix(room, texture2D(sky, .5 + (v - .5) * .96 + drift).rgb, open), 1.);
        }`));
      gl.linkProgram(program); gl.useProgram(program);
      this.ok = gl.getProgramParameter(program, gl.LINK_STATUS);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const at = gl.getAttribLocation(program, 'p'); gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1i(gl.getUniformLocation(program, 'art'), 0); gl.uniform1i(gl.getUniformLocation(program, 'normals'), 1); gl.uniform1i(gl.getUniformLocation(program, 'sky'), 2);
      this.torch = gl.getUniformLocation(program, 'torch'); this.glow = gl.getUniformLocation(program, 'glow');
      this.drift = gl.getUniformLocation(program, 'drift'); this.outdoors = gl.getUniformLocation(program, 'outdoors');
      this.textures = new Map(); this.key = null;
    }
    texture(image) {
      const gl = this.gl; let t = this.textures.get(image);
      if (t) return t;
      t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      for (const [name, value] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, name, value);
      this.textures.set(image, t); return t;
    }
    draw(art, normals, sky, x, y, glow, drift) {
      const gl = this.gl;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texture(art));
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.texture(normals));
      if (sky) { gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.texture(sky)); }
      gl.uniform1f(this.outdoors, sky ? 1 : 0); gl.uniform2f(this.drift, drift, 0);
      gl.uniform2f(this.torch, x / W, y / H); gl.uniform1f(this.glow, glow);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return this.canvas;
    }
  }
  // Floods from each frame's border through the disk art's white, and clears those pixels at 4x.
  function openTile(img, key) {
    const info = assets.info.get(key), source = assets.reels.get(key), c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d', {willReadFrequently: true}); ctx.drawImage(img, 0, 0);
    const s = document.createElement('canvas'); s.width = source.naturalWidth; s.height = source.naturalHeight;
    const sctx = s.getContext('2d', {willReadFrequently: true}); sctx.drawImage(source, 0, 0);
    const bits = sctx.getImageData(0, 0, s.width, s.height).data, pix = ctx.getImageData(0, 0, c.width, c.height);
    const white = (x, y) => bits[(y * s.width + x) * 4 + 3] > 0 && bits[(y * s.width + x) * 4] > 128;
    const horizontal = s.width > info.width;
    for (let f = 0; f < info.frames; f++) {
      const left = horizontal ? f * info.width : 0, top = horizontal ? 0 : f * info.height, seen = new Set(), stack = [];
      for (let i = 0; i < info.width; i++) stack.push([left + i, top], [left + i, top + info.height - 1]);
      for (let i = 0; i < info.height; i++) stack.push([left, top + i], [left + info.width - 1, top + i]);
      while (stack.length) {
        const [x, y] = stack.pop(), id = y * s.width + x;
        if (x < left || y < top || x >= left + info.width || y >= top + info.height || seen.has(id) || !white(x, y)) continue;
        seen.add(id); stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        for (let v = 0; v < HD_SCALE; v++) for (let u = 0; u < HD_SCALE; u++) pix.data[((y * HD_SCALE + v) * c.width + x * HD_SCALE + u) * 4 + 3] = 0;
      }
    }
    ctx.putImageData(pix, 0, 0);
    return c;
  }
  // The disk's masks still decide what stands in front of Duncan. Only the pixels are new.
  function prepareHDForegrounds() {
    assets.hd.fronts = new Map();
    for (const [room, key] of Object.entries(window.CastlePlan.SCREENS.masks)) {
      const base = assets.hd.screens.get('B' + room), mask = assets.screens.get(key);
      if (!base || !mask) continue;
      const width = W * HD_SCALE, height = H * HD_SCALE, c = document.createElement('canvas'), m = document.createElement('canvas');
      c.width = m.width = width; c.height = m.height = height;
      const ctx = c.getContext('2d', {willReadFrequently: true}), mctx = m.getContext('2d', {willReadFrequently: true});
      ctx.drawImage(base, 0, 0); mctx.imageSmoothingEnabled = false; mctx.drawImage(mask, 0, 0, width, height);
      const pix = ctx.getImageData(0, 0, width, height), bits = mctx.getImageData(0, 0, width, height).data;
      for (let i = 0; i < pix.data.length; i += 4) if (bits[i] < 128) pix.data[i + 3] = 0;
      ctx.putImageData(pix, 0, 0);
      assets.hd.fronts.set(+room, c);
    }
  }
  // The disk's three mask screens mark what stands in front of the hero.
  function prepareForegrounds() {
    assets.fronts = new Map();
    for (const [room, key] of Object.entries(window.CastlePlan.SCREENS.masks)) {
      const base = assets.screens.get('B' + room), mask = assets.screens.get(key);
      if (!base || !mask) continue;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const ctx = c.getContext('2d', {willReadFrequently: true});
      ctx.drawImage(base, 0, 0);
      const pix = ctx.getImageData(0, 0, W, H), m = document.createElement('canvas');
      m.width = W; m.height = H;
      const mctx = m.getContext('2d', {willReadFrequently: true}); mctx.drawImage(mask, 0, 0);
      const bits = mctx.getImageData(0, 0, W, H).data;
      for (let i = 0; i < pix.data.length; i += 4) if (bits[i] < 128) pix.data[i + 3] = 0;
      ctx.putImageData(pix, 0, 0);
      assets.fronts.set(+room, c);
    }
  }

  class Painter {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      this.buffer = document.createElement('canvas'); this.buffer.width = W; this.buffer.height = H;
      this.b = this.buffer.getContext('2d'); this.b.imageSmoothingEnabled = false; this.ctx.imageSmoothingEnabled = false;
      this.used = new Set(); this.scale = 1; this.fullColour = false;
    }
    // Every drawing call keeps its 512 by 342 coordinates. The Remastered look only enlarges the page.
    setScale(scale) {
      this.scale = scale;
      for (const c of [this.buffer, this.canvas]) { c.width = W * scale; c.height = H * scale; }
      this.b.setTransform(scale, 0, 0, scale, 0, 0);
      this.b.imageSmoothingEnabled = false; this.ctx.imageSmoothingEnabled = false;
      this.stage = null;
    }
    // Lit rooms gather everything standing in them on a stage, so the torch can fall on it as one.
    openStage() {
      if (!this.stage) {
        const c = document.createElement('canvas'); c.width = W * this.scale; c.height = H * this.scale;
        this.stage = c.getContext('2d'); this.stage.setTransform(this.scale, 0, 0, this.scale, 0, 0); this.stage.imageSmoothingEnabled = false;
      }
      this.main = this.b; this.b = this.stage; this.b.clearRect(0, 0, W, H);
    }
    closeStage(x, y) {
      const s = this.b, g = s.createRadialGradient(x, y, 0, x, y, 340);
      g.addColorStop(0, 'rgba(214, 192, 120, .1)'); g.addColorStop(.14, 'rgba(214, 192, 120, .05)'); g.addColorStop(.26, 'rgba(12, 15, 24, 0)');
      g.addColorStop(.6, 'rgba(12, 15, 24, .26)'); g.addColorStop(1, 'rgba(12, 15, 24, .38)');
      s.globalCompositeOperation = 'source-atop'; s.fillStyle = g; s.fillRect(0, 0, W, H); s.globalCompositeOperation = 'source-over';
      this.b = this.main; this.b.drawImage(s.canvas, 0, 0, W, H);
    }
    reel(key, frame, x, y, flip) {
      const img = assets.reels.get(key), info = assets.info.get(key);
      if (!img || !info) return;
      this.used.add(key);
      const f = ((frame % info.frames) + info.frames) % info.frames;
      const fx = img.naturalWidth > info.width ? f * info.width : 0, fy = img.naturalWidth > info.width ? 0 : f * info.height;
      const hd = this.fullColour ? assets.hd?.reels.get(key) : null, k = hd ? HD_SCALE : 1, source = hd ? hd.img : img;
      if (!!flip !== !!hd?.mirror) {
        this.b.save(); this.b.translate(Math.round(x) + info.width, Math.round(y)); this.b.scale(-1, 1);
        this.b.drawImage(source, fx * k, fy * k, info.width * k, info.height * k, 0, 0, info.width, info.height); this.b.restore();
      } else this.b.drawImage(source, fx * k, fy * k, info.width * k, info.height * k, Math.round(x), Math.round(y), info.width, info.height);
    }
    // Text comes from the disks' own bitmap fonts, so every mode stays strictly two-colour.
    measure(name, text) {
      const {glyphs} = assets.fonts[name].meta;
      return [...text].reduce((sum, ch) => sum + (glyphs[ch.charCodeAt(0)]?.[3] ?? 6), 0);
    }
    text(name, text, x, y, colour = 'black', align = 'left') {
      const font = assets.fonts[name], {glyphs, ascent, descent} = font.meta, strip = font[colour];
      let pen = Math.round(align === 'left' ? x : x - this.measure(name, text) / (align === 'center' ? 2 : 1));
      for (const ch of text) {
        const g = glyphs[ch.charCodeAt(0)];
        if (g) this.b.drawImage(strip, g[0], 0, g[1], ascent + descent, pen + g[2], y - ascent, g[1], ascent + descent);
        pen += g ? g[3] : 6;
      }
    }
    // A line of the adventure's own voice, in the Enchanted Scepters font.
    plaque(text, y) {
      const width = Math.min(W - 16, this.measure('scepters', text) + 16), left = Math.round((W - width) / 2);
      this.b.fillStyle = '#000'; this.b.fillRect(left - 1, y - 1, width + 2, 22);
      this.b.fillStyle = '#fff'; this.b.fillRect(left, y, width, 20);
      this.text('scepters', text, left + 8, y + 14, 'black');
    }
    show(colour, tone) {
      const c = this.ctx;
      c.globalCompositeOperation = 'source-over';
      // Painted art already has its colour, so the two-colour tint must not wash over it.
      if (!colour || this.fullColour) { c.drawImage(this.buffer, 0, 0); return; }
      const width = this.canvas.width, height = this.canvas.height;
      c.fillStyle = PALETTE[tone] || PALETTE.hall; c.fillRect(0, 0, width, height);
      c.globalCompositeOperation = 'multiply'; c.drawImage(this.buffer, 0, 0);
      c.globalCompositeOperation = 'lighten'; c.fillStyle = INK; c.fillRect(0, 0, width, height);
      c.globalCompositeOperation = 'source-over';
    }
  }

  // Reel choices follow the hero code: the first of each pair faces left (hero-reels.json).
  const LONG_FALL = [0, 1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6];
  const SETTLE = [2, 2, 2, 2, 3, 3, 3, 2, 2, 2], LEVER_PULL = [0, 0, 1, 2, 3, 4, 4, 3, 3, 0];
  const UPDATE = 2.5;
  function upright(p, key, frame, h) {
    const info = assets.info.get(key);
    p.reel(key, frame, h.x + (32 - info.width) / 2, h.y + 40 - info.height);
  }
  function drawHero(p, core, reduced) {
    const h = core.hero, tick = core.tickCount, left = h.face < 0, step = Math.floor(tick / 3);
    const x = h.x, y = h.y, age = at => at === undefined ? 1e9 : (tick - at) / UPDATE;
    if (h.safe > 0 && !reduced && tick % 4 < 2) return;
    if (h.state === 'flail') {
      // Reach, lift, carry, swing and let go, from CODE 2 $1f34, $2028, $2150, $2106 and $2062.
      const f = h.flail;
      if (f.stage === 'reach') p.reel('B132', 0, x, y - 11);
      else if (f.stage === 'lift') p.reel('B134', 2, x, y - 18);
      else if (f.stage === 'swing') p.reel('B134', f.t < 1 ? 0 : 1, x, y - 18);
      else if (f.stage === 'drop') p.reel('B133', 2, x, y - 2);
      else p.reel('B133', f.moving ? Math.floor(tick / UPDATE) % 2 : 3, x, y - 2);
      return;
    }
    if (age(h.landed) < LONG_FALL.length) { upright(p, left ? 'A130' : 'A131', LONG_FALL[Math.floor(age(h.landed))], h); return; }
    if (age(h.pullAt) < 15) { upright(p, 'B147', age(h.pullAt) < 4 ? 0 : 1, h); return; }
    if (age(h.leverAt) < LEVER_PULL.length) { upright(p, x <= 200 ? 'B146' : 'B155', LEVER_PULL[Math.floor(age(h.leverAt))], h); return; }
    switch (h.state) {
      case 'walk': p.reel(left ? 'A100' : 'A101', step, x, y); break;
      case 'air': {
        if (h.arc) {
          // Reel frame and draw offset come from the same disk table as the jump's path.
          const row = h.arc.rows[Math.min(h.arc.rows.length - 1, Math.floor(h.arc.t))];
          const reel = h.arc.kind === 'running' ? (left ? 'A104' : 'A105') : (left ? 'A117' : 'A118');
          p.reel(reel, row[2], x, y + row[3]);
        } else p.reel('A123', Math.floor(tick / 4), x, y - 8);
        break;
      }
      case 'duck': p.reel(core.powers.has('air') ? 'A149' : left ? 'A119' : 'A120', core.powers.has('air') && left ? 1 : 0, x, y + (core.powers.has('air') ? 14 : 8)); break;
      case 'ladder': p.reel(h.y < h.ladder.top + 10 || h.y > h.ladder.bottom - 10 ? 'A103' : 'A102', Math.floor(y / 7), x, y - 8); break;
      case 'stairs': p.reel(h.stairs.up ? (left ? 'A109' : 'A107') : (left ? 'A110' : 'A108'), step, x, y - 8); break;
      case 'rope': {
        const r = h.rope;
        // Duncan hangs on the rope's near side, 5 or 10 pixels in (CODE 2 $1906-$1928).
        const inset = left ? 10 : 5;
        if (y <= r.top + 2 || y >= r.bottom - 2) p.reel('A116', left ? 0 : 1, x + inset, y - 16);
        else p.reel(left ? 'A114' : 'A115', Math.floor(y / 8), x + inset, y - 8);
        break;
      }
      case 'chute': p.reel('A125', 3, x, y); break;
      case 'teeter': {
        const age = Math.min(7, Math.floor((tick - h.teeterAt) / UPDATE));
        p.reel(left ? 'B152' : 'B153', [0, 1, 2, 1, 2, 1, 2, 3][age], x, y - 4);
        break;
      }
      case 'shield': p.reel(left ? 'A144' : 'A145', Math.floor(tick / UPDATE) & 1, x, y); break;
      case 'swing': {
        const a = Math.sin(h.swing.phase);
        p.reel(Math.cos(h.swing.phase) > 0 ? 'B121' : 'B122', Math.round((a + 1) * 2.5), x - 8, y - 16);
        break;
      }
      default: {
        const still = tick - (h.walked || 0);
        if (age(h.settled) < SETTLE.length) p.reel('A125', SETTLE[Math.floor(age(h.settled))], x, y);
        else if (still > 200) p.reel(left ? 'A128' : 'A129', Math.floor(tick / 8), x, y);
        else p.reel('A106', left ? 0 : 3, x, y);
      }
    }
    if (h.state !== 'stand') h.walked = tick;
    // The arm, from CODE 2 $3434-$3498. Frame 8 winds up, 9 or 10 throws, and the others hold the
    // aim. Standing with nothing to do, Duncan's arm rests on frame 7.
    const since = tick - (h.throwAt ?? -99), update = 2.5, throwing = since < update * 2;
    if (throwing || h.state === 'stand') {
      const frame = since < update ? 8 : throwing ? (h.arm > 192 ? 9 : 10) : h.armUntil > tick ? h.arm >> 6 : 7;
      p.reel(left ? 'A111' : 'A112', frame, x + (left ? (throwing ? 2 : -14) : (throwing ? -12 : 4)), y - 6);
    }
  }
  // Gaining a power, in the hero code's own order: states 35, 36 and 50.
  const SHIMMER = [0, 1, 2, 3, 4, 5, 6, 5, 6, 5, 4, 3, 2, 1, 0, 0], FLEX = [0, 1, 2, 1];
  function drawReward(p, core) {
    const h = core.hero, u = (core.tickCount - core.reward.at) / UPDATE, f = Math.floor(u), left = h.face < 0;
    switch (core.reward.id) {
      case 'fire':
        if (f < 4) upright(p, 'A106', 2, h);
        else if (f < 4 + SHIMMER.length) upright(p, 'B158', SHIMMER[f - 4], h);
        else upright(p, 'A126', FLEX[f % 4], h);
        break;
      case 'air':
        if (f < 6) upright(p, 'B142', Math.min(2, Math.floor(f / 2)), h);
        else if (f < 14) upright(p, 'B143', f & 1, h);
        else upright(p, left ? 'A144' : 'A145', f & 1, h);
        break;
      case 'water':
        if (f < 4) upright(p, 'A106', 2, h);
        else if (f < 12) upright(p, 'B151', f & 1, h);
        else if (f < 20) upright(p, 'B150', f & 1, h);
        else if (f < 24) upright(p, 'B154', 0, h);
        else upright(p, 'B157', f & 1, h);
        break;
      default: upright(p, 'A126', FLEX[Math.floor(f / 2) % 4], h);
    }
  }
  const DEATHS = {
    fall: [['A135', 26, 2], ['A137', 40, 8]], bite: [['A124', 40, 7]], bat: [['A124', 40, 7]],
    guard: [['B153', 22, 4], ['B148', 40, 9]], whip: [['B148', 20, 5], ['A137', 40, 8]], mutant: [['B152', 22, 4], ['A137', 40, 8]],
    fire: [['B140', 30, 6], ['B141', 40, 8]], lightning: [['B140', 40, 7]], crush: [['B139', 40, 7]], weight: [['A136', 22, 4], ['A137', 40, 8]],
    acid: [['B139', 40, 7]], throw: [['A136', 40, 5]], mug: [['B156', 26, 6], ['A124', 40, 7]]
  };
  function drawDeath(p, core) {
    const {cause, t} = core.dying, list = DEATHS[cause] || DEATHS.guard, h = core.hero;
    let start = 0;
    for (const [reel, until, rate] of list) {
      if (t < until) {
        const info = assets.info.get(reel);
        const frame = Math.min(info.frames - 1, Math.floor((t - start) / rate));
        p.reel(reel, frame, h.x + (32 - info.width) / 2, h.y + 40 - info.height);
        if (cause === 'weight') p.reel('B521', 0, h.x, h.y - 20);
        return;
      }
      start = until;
    }
    const [reel] = list[list.length - 1], info = assets.info.get(reel);
    p.reel(reel, info.frames - 1, h.x + (32 - info.width) / 2, h.y + 40 - info.height);
  }
  // Frame orders read from the creature routines (creature-reels.json).
  const HENCHMAN_THROW = [['B704', 0], ['B704', 1], ['B704', 1], ['B704', 1], ['B703', 0], ['B703', 0], ['B703', 0], ['B703', 0], ['B703', 1], ['B703', 1], ['B703', 1],
    ['B703', 2], ['B703', 2], ['B703', 2], ['B703', 3], ['B704', 2], ['B704', 2], ['B704', 2], ['B704', 0]];
  const WIZARD_IDLE = [5, 5, 5, 6, 6, 6, 5, 5, 5, 7, 7, 7, 7], THRONE_ROCK = [0, 1, 1, 0, 2, 2, 0, 1, 1, 0, 2, 2], THRONE_FALL = [0, 1, 1, 1];
  const HATCH_SWING = [0, 1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 1, 1];
  function drawEntity(p, e, core, reduced) {
    const tick = core.tickCount, slow = Math.floor(e.frame / 4);
    switch (e.type) {
      case 'door': p.reel(e.reel, e.open ? 1 : 0, e.x, e.y); break;
      case 'guard':
        if (e.dying) p.reel(e.whip ? 'B408' : e.speed > 0 ? 'B354' : 'B355', Math.floor((18 - e.dying) / 3), e.x, e.y + (e.whip ? 8 : 12));
        else if (e.whip) p.reel(e.lash > 8 ? 'B406' : e.hurt ? 'B407' : 'B405', e.lash > 8 ? Math.floor(e.lash / 4) : slow, e.x - (e.lash > 8 ? 24 : 0), e.y, e.lash > 8 && core.hero.x < e.x);
        else p.reel(e.hurt ? 'B350' : e.turned ? 'B351' : e.speed > 0 ? 'B352' : 'B353', slow, e.x, e.y);
        break;
      case 'arrow': p.reel(e.vx > 0 ? 'B357' : 'B356', 0, e.x, e.y); break;
      case 'rat': p.reel(e.speed > 0 ? 'B311' : 'B310', e.dying ? 2 : 1 - (Math.floor(e.frame / 2) & 1), e.x, e.y + 24); break;
      case 'ropeRat': p.reel('B310', Math.floor(e.frame / 2), e.x, e.y, e.speed < 0); break;
      case 'bat': p.reel('B300', e.dying ? 5 : e.state === 'perch' ? 0 : 1 + (Math.floor(e.frame / 2) & 1), e.x, e.y); break;
      case 'mutant':
        if (e.dying) p.reel('B436', Math.floor((18 - e.dying) / 3), e.x, e.y);
        else if (e.hurt) p.reel('B434', slow, e.x, e.y + 8);
        else p.reel('B435', (slow & 3) + (e.speed > 0 ? 4 : 0), e.x, e.y + 8);
        break;
      case 'vulture': p.reel('B701', Math.floor(e.frame / 3), e.x, e.y); break;
      case 'feather': p.reel('B702', Math.floor(e.frame / 3), e.x, e.y); break;
      case 'eye': p.reel(e.dying ? 'B426' : 'B425', Math.floor(e.frame / 2), e.x, e.y); break;
      case 'broom': {
        // The big broom is PPCT 420, then 421 and 422 as it splits, and 423 when stunned.
        const tier = e.tier || 0;
        p.reel(e.stun ? 'B423' : ['B420', 'B421', 'B422'][tier], Math.floor(e.frame / 3), e.x, e.y + [-25, 0, 11][tier], e.speed < 0);
        break;
      }
      case 'fountain': p.reel('B411', 0, e.x - 12, e.y + 52); break;
      case 'log': p.reel('B412', 0, e.x + 8, e.seg.y + 40); break;
      case 'logSink': {
        // Dropped pieces of the log, from the offset table at CODE 4 $3976.
        const row = [[8, 8, 0], [12, 14, 1], [16, 8, 2], [28, 10, 3], [32, 14, 4], [34, 18, 5], [34, 22, 5]][Math.min(6, Math.floor(e.step))];
        p.reel('B413', row[2], e.x + row[0], e.y + row[1]);
        break;
      }
      case 'torch': p.reel('A5000', slow, e.x, e.y); break;
      case 'faces': p.reel('B522', e.pose || 0, e.x, e.y); break;
      case 'item': p.reel('A5010', e.item === 'bag' ? 4 : 6, e.x, e.y); break;
      case 'henchman': {
        const [reel, frame] = HENCHMAN_THROW[Math.min(HENCHMAN_THROW.length - 1, Math.floor(e.step || 0))];
        p.reel(reel, frame, e.x, e.y);
        break;
      }
      case 'rock': p.reel('B428', Math.floor(e.frame / 2), e.x, e.y); break;
      case 'shards': p.reel('B429', 10 - e.broken, e.x, e.y); break;
      case 'weight': if (e.falling) p.reel('B521', 0, e.x, e.y); break;
      case 'dragon':
        p.reel('B710', e.breath ? 2 : slow % 2, e.x, e.y);
        if (e.dying) p.reel('B714', Math.floor(e.frame / 3), e.x - 40, e.y);
        else if (e.breath) p.reel('B711', Math.floor(e.frame / 3), e.x - 112, e.y + 4);
        break;
      case 'wizard':
        if (e.dying) p.reel('B433', Math.floor(e.frame / 3), e.x, e.y + 26);
        else if (e.hurt) p.reel('B431', slow, e.x, e.y);
        else if (e.timer < 4) p.reel('B432', slow, e.x, e.y);
        else if (e.timer < 14) p.reel('B430', 4 - Math.floor(e.timer / 3), e.x, e.y);
        else p.reel('B430', WIZARD_IDLE[Math.floor(e.frame / UPDATE) % WIZARD_IDLE.length], e.x, e.y);
        if (e.timer > 40 && e.timer < 46) p.reel('B437', 0, e.x - 20, e.y + 4);
        break;
      case 'bolt': p.reel('B424', Math.floor(e.frame / 2), e.x, e.y); break;
      case 'gargoyle':
        if (e.dying) p.reel('B922', Math.floor((18 - e.dying) / 2.7), e.x, e.y);
        else p.reel(e.speed < 0 ? 'B907' : 'B906', 1 + (Math.floor(e.frame / 3) & 1), e.x, e.y);
        break;
      case 'boulder': p.reel('B428', Math.floor(e.frame / 2), e.x, e.y); break;
      case 'drip':
        if (e.state === 'wait') p.reel('B414', 2 - Math.min(2, Math.floor(e.timer / 18)), e.x - 4, e.startY);
        else if (e.state === 'fall') p.reel('B415', 0, e.x, e.y);
        else p.reel('B416', 12 - e.timer, e.x - 16, e.y - 8);
        break;
      case 'storm':
        if (e.live > 0) {
          p.reel(e.bolt, 0, e.x, 20);
          if (e.live < 8) p.reel('B708', 0, e.x - 28, 150);
        }
        break;
      case 'clouds': p.reel('B707', Math.floor(tick / 20), e.x + Math.sin(tick * .01 + e.y) * 8, e.y); break;
      case 'swingRope': {
        const tip = core.swingTip(e), a = Math.sin(e.phase), reel = a < 0 ? 'B510' : 'B511';
        p.reel(reel, Math.min(5, Math.floor(Math.abs(a) * 6)), a < 0 ? e.x - 96 : e.x, e.y + 4);
        if (tip.y < 0) p.reel('A520', 0, tip.x, 0);
        break;
      }
      case 'hatch':
        p.reel('B715', e.open ? HATCH_SWING[Math.floor(e.t)] : 0, e.x, e.y);
        if (e.open) p.reel('B717', Math.floor(tick / 10), e.x - 8, e.y + 28);
        else p.reel('B716', Math.floor(tick / 12), e.x + 8, e.y + 30);
        break;
      case 'gate': p.reel('B438', e.open ? 1 : 0, e.x, e.open ? e.y - 60 : e.y); break;
      case 'platform': p.reel(core.room.id >= 4000 ? 'B901' : 'B410', e.mover.frame, e.x, e.y); break;
      case 'fallenFlail': p.reel('A520', 0, e.x, e.y); break;
      case 'portcullis': p.reel('B200', Math.min(2, Math.floor(e.frame / 9)), -24, core.hero.y - 43 > 0 ? e.fixedY ??= core.hero.y - 43 : 0); break;
      case 'throne':
        {
          // Both reels rock together (CODE 4 $2708-$2778), and the last topples them.
          const t = core.throne, u = t?.rocked === undefined ? 99 : Math.floor((tick - t.rocked) / UPDATE);
          const frame = t?.down ? THRONE_FALL[Math.min(THRONE_FALL.length - 1, u)] : u < THRONE_ROCK.length ? THRONE_ROCK[u] : 0;
          p.reel('B902', frame, e.x, e.y); p.reel('B903', frame, e.x - 48, e.y + 76);
        }
        p.reel('B900', 0, e.x - 8, e.y + 73);
        if (core.throne?.shaken) p.reel('B905', Math.floor(tick / 6), e.x + 8, e.y + 62);
        break;
      case 'knight':
        if (e.falling !== undefined) p.reel(e.falling > 40 ? 'B912' : e.falling > 20 ? 'B913' : 'B914', Math.floor(e.frame / 4), e.x, e.y);
        else if (e.throwing > 0) { e.throwing--; p.reel(e.throwing > 8 ? 'B911' : 'B916', Math.floor(e.throwing / 4), e.x, e.y); }
        else p.reel(core.throne?.shaken ? 'B915' : e.timer > 50 ? 'B910' : 'B908', Math.floor(e.frame / 8), e.x, e.y);
        break;
      case 'mug':
        p.reel(e.frame % 40 < 20 ? 'B904' : 'B917', Math.floor(e.frame / 3), e.x, e.y);
        break;
      case 'lever':
        p.reel(e.chain ? 'B918' : 'B712', e.pulled ? 4 : 0, e.x, e.y);
        if (core.pullsDone.size) { p.reel('B919', 2 + Math.floor(tick / 4) % 4, e.x + 8, e.y + 28); p.reel('B920', 0, e.x + 8, e.y + 34); p.reel('B921', Math.floor(tick / 6), e.x + 8, e.y + 22); }
        break;
      case 'scepter': {
        const hd = p.fullColour ? assets.hd?.scepters?.get(e.scepter.id) : null, img = hd || assets.plates.get(e.scepter.id);
        if (img) {
          // The drawings are room-sized, so the castle shows them at half scale, centred on the spot.
          const w = img.naturalWidth / (hd ? HD_SCALE : 1) >> 1, h = img.naturalHeight / (hd ? HD_SCALE : 1) >> 1;
          p.b.drawImage(img, Math.round(e.x + 12 - w / 2), Math.round(e.y + 15 - h / 2 + Math.sin(tick * .1) * (reduced ? 0 : 2)), w, h);
        }
        if (e.scepter.id === 'air') p.reel('B709', 0, e.x + 8, e.y - 26);
        break;
      }
    }
    if (e.type === 'guard' && e.hurt === 7) p.reel('B417', 0, e.x, e.y + 34);
    if (e.dying && ['bat', 'rat', 'ropeRat', 'vulture'].includes(e.type)) p.reel('B418', Math.floor((18 - e.dying) / 6), e.x, e.y);
  }
  function drawStatus(p, core) {
    const b = p.b, bar = assets.paper.get('A-PICT-16000');
    if (bar) b.drawImage(bar, 0, STATUS_Y);
    const wing = core.wing, title = wing ? assets.paper.get('B-PICT-' + window.CastlePlan.WINGS[wing].title) : assets.paper.get('A-PICT-16200');
    if (title) b.drawImage(title, 8, STATUS_Y + 7);
    if (core.room) {
      const inWing = core.data.order.filter(id => window.CastlePlan.WING_OF(id) === wing).indexOf(core.room.id);
      const numeral = assets.paper.get('A-PICT-' + (16100 + inWing));
      if (numeral) b.drawImage(numeral, 164, STATUS_Y + 7);
    }
    const row = STATUS_Y + 29, number = n => n.toLocaleString('en-US');
    p.text('score', number(core.score), 214, row, 'white', 'center'); p.text('score', number(core.bonus), 270, row, 'white', 'center');
    p.text('score', number(core.rocks), 318, row, 'white', 'center'); p.text('score', number(Math.max(0, core.lives)), 365, row, 'white', 'center');
    p.text('score', number(core.elixir), 412, row, 'white', 'center');
    const slots = [['earth', 1], ['fire', 2], ['air', 3]];
    slots.forEach(([power, frame], i) => { if (core.powers.has(power)) p.reel('A5010', frame, 443 + i * 23, STATUS_Y + 12); });
  }
  function drawRoom(p, core, reduced) {
    const b = p.b, room = core.room, hdArt = p.scale > 1 ? assets.hd?.screens.get('B' + room.id) : null, art = hdArt || assets.screens.get('B' + room.id);
    b.fillStyle = '#000'; b.fillRect(0, 0, W, H);
    const normals = hdArt ? assets.hd.normals?.get('B' + room.id) : null;
    let lit = false;
    if (normals) {
      assets.roomLight ||= new RoomLight();
      const light = assets.roomLight, h = core.hero, flicker = reduced ? 1 : .94 + .06 * Math.sin(core.tickCount * .37) * Math.sin(core.tickCount * .13);
      // Clouds drift slowly and shift a little against Duncan, so the sky sits far behind the castle.
      const drift = reduced ? 0 : Math.sin(core.tickCount * .008) * .008 - (h.x - W / 2) / W * .022;
      if (light.ok) { b.drawImage(light.draw(hdArt, normals, assets.hd.skies?.get('B' + room.id), h.x + 16, h.y + 16, flicker, drift), 0, 0, W, H); lit = true; } else b.drawImage(art, 0, 0, W, H);
    } else if (art) b.drawImage(art, 0, 0, W, H);
    p.fullColour = !!hdArt;
    if (lit) p.openStage();
    for (const e of core.entities) if (!['knight', 'lever'].includes(e.type)) drawEntity(p, e, core, reduced);
    // A pulled lever brings out its half of the bridge, behind Duncan (CODE 4 $2574-$257c).
    for (const e of core.entities) if (e.type === 'lever' && e.pulled) p.reel('B919', e.chain ? 1 : 0, e.chain ? 245 : 232, 141);
    // The wall switch in the Shield room lights only the real ledges.
    if (room.id === 3030 && core.ledgesShownUntil > core.tickCount) for (const seg of core.realLedges()) p.reel('B700', 0, seg.x0 + 16, seg.y + 40);
    if (core.mode === 'dying') drawDeath(p, core);
    else if (core.mode === 'leaving') drawReward(p, core);
    else drawHero(p, core, reduced);
    for (const e of core.entities) if (['knight', 'lever'].includes(e.type)) drawEntity(p, e, core, reduced);
    for (const shot of core.shots) {
      if (shot.fire) p.reel('B424', shot.frame, shot.x - 8, shot.y - 8);
      else p.reel('A113', shot.frame, shot.x - 8, shot.y - 4);
      if (shot.y > 296) p.reel('A127', shot.frame, shot.x - 16, 300);
      if (shot.life < 6 && !shot.fire) p.reel('A138', shot.life, shot.x - 8, shot.y);
    }
    const front = (hdArt && assets.hd.fronts?.get(room.id)) || assets.fronts?.get(room.id);
    if (front) p.b.drawImage(front, 0, 0, W, H);
    if (lit) p.closeStage(core.hero.x + 16, core.hero.y + 16);
    // The scepter just won, turning in the air: a real 3D model, in the Remastered look only.
    const spin = core.mode === 'leaving' && hdArt ? assets.hd.spins?.get(core.reward.id) : null;
    if (spin) {
      const age = core.tickCount - core.reward.at, f = reduced ? 0 : Math.floor(age / 2) % 24;
      p.b.save(); p.b.imageSmoothingEnabled = true; p.b.globalAlpha = Math.min(1, age / 10);
      p.b.drawImage(spin, f % 6 * 256, Math.floor(f / 6) * 256, 256, 256, W / 2 - 110, 56, 220, 220);
      p.b.restore();
    }
    if (core.mode === 'leaving') p.plaque('You have the ' + core.reward.name + '.', 30);
    if (core.flash && !reduced) { b.fillStyle = 'rgba(255,255,255,.65)'; b.fillRect(0, 0, W, STATUS_Y); }
    drawStatus(p, core);
  }
  // Until the hall has its painting, the disk's picture takes the tone of the painted figures.
  function sepia(hall) {
    if (!hall) return null;
    if (assets.sepiaHall) return assets.sepiaHall;
    const c = document.createElement('canvas'); c.width = hall.width || hall.naturalWidth; c.height = hall.height || hall.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(hall, 0, 0);
    x.globalCompositeOperation = 'multiply'; x.fillStyle = '#c9a56c'; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'lighten'; x.fillStyle = '#1c1618'; x.fillRect(0, 0, c.width, c.height);
    return assets.sepiaHall = c;
  }
  // A painted door opens inside the painted wall, so its masonry fades into the stone around it.
  function softDoor(key, frame) {
    const hd = assets.hd?.reels.get(key), info = assets.info.get(key), id = key + frame;
    if (!hd || !info) return null;
    assets.softDoors ||= new Map();
    if (assets.softDoors.has(id)) return assets.softDoors.get(id);
    const w = info.width * HD_SCALE, h = info.height * HD_SCALE, f = frame % info.frames;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.drawImage(hd.img, f * w, 0, w, h, 0, 0, w, h);
    x.globalCompositeOperation = 'multiply'; x.fillStyle = '#c4bcae'; x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'destination-in';
    const fade = (x0, y0, x1, y1) => {
      const g = x.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.16, '#000'); g.addColorStop(.84, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    };
    fade(0, 0, w, 0); fade(0, 0, 0, h * 1.1);
    assets.softDoors.set(id, c);
    return c;
  }
  function drawHall(p, core, holiday) {
    const b = p.b, hall = assets.paper.get('A-PICT-10000'), door = core.plan.DOORS[core.door];
    b.fillStyle = '#000'; b.fillRect(0, 0, W, H);
    p.fullColour = p.scale > 1;
    const painted = p.fullColour ? assets.hd?.hall || sepia(hall) : hall;
    if (painted) b.drawImage(painted, 0, 0, W, H);
    if (holiday) { const tree = assets.paper.get('A-PICT-10004'); if (tree) b.drawImage(assets.hd?.tree && p.fullColour ? assets.hd.tree : tree, 347, 82, 57, 87); }
    if (core.mode === 'run') {
      const path = core.run.path, step = path.steps[core.run.step];
      if (path.door && core.run.step > 2) {
        const key = 'A' + path.door, frame = Math.min(2, Math.floor(core.run.step / 6)), soft = p.fullColour ? softDoor(key, frame) : null;
        if (soft) { p.used.add(key); b.drawImage(soft, path.doorX, path.doorY, soft.width / HD_SCALE, soft.height / HD_SCALE); }
        else p.reel(key, frame, path.doorX, path.doorY);
      }
      if (step && step.frame >= 0) p.reel('A' + path.reels[Math.max(0, step.reel)], step.frame, step.x, step.y);
    } else {
      p.reel('A10008', Math.floor(core.tickCount / 12), 220, 208);
      p.reel('A520', 0, door.x - 16, 200);
      const width = p.measure('dialog', door.label) + 12, left = Math.max(4, Math.min(W - width - 4, door.x - width / 2));
      b.fillStyle = '#000'; b.fillRect(left, 222, width, 20);
      p.text('dialog', door.label, left + 6, 237, 'white');
    }
    drawStatus(p, core);
  }

  let scoreList = null;
  function defaultScores() {
    return window.CASTLE_DATA.preferences.scores.filter(s => s.name)
      .map(s => ({name: s.name, points: +s.points.replace(/,/g, '')})).sort((a, c) => c.points - a.points);
  }
  function scores() {
    if (scoreList) return scoreList;
    scoreList = defaultScores();
    try { const kept = JSON.parse(localStorage.getItem('castle-scores') || 'null'); if (Array.isArray(kept)) scoreList = kept; } catch { /* Storage may be blocked. */ }
    return scoreList;
  }
  function recordScore(points) {
    if (session?.core()?.preview) return null;
    const list = scores(), place = list.findIndex(s => points > s.points);
    const at = place < 0 ? list.length : place;
    if (at >= 8) return null;
    list.splice(at, 0, {name: 'You', points}); list.length = Math.min(8, list.length);
    try { localStorage.setItem('castle-scores', JSON.stringify(list)); } catch { /* Storage may be blocked. */ }
    return at === 0 ? 'Congratulations, you made the top score with ^0 points.' : 'Congratulations, you made a high score with ^0 points.';
  }
  let banner = '';
  function drawScores(p, tick, reduced) {
    const b = p.b, art = assets.screens.get('A15000');
    b.fillStyle = '#000'; b.fillRect(0, 0, W, H);
    if (art) b.drawImage(art, 0, 0);
    const door = assets.paper.get(tick % 240 < 120 || reduced ? 'A-PICT-15100' : 'A-PICT-15101');
    if (door) b.drawImage(door, 0, 0, 64, 126, 150, 126, 64, 126);
    scores().slice(0, 8).forEach((row, i) => {
      p.text('dialog', row.name, 342, 74 + i * 22, 'black');
      p.text('dialog', row.points.toLocaleString('en-US'), 486, 74 + i * 22, 'black', 'right');
    });
    if (banner) p.plaque(banner, 274);
  }
  function drawTitle(p, tick, reduced) {
    const b = p.b, flash = !reduced && tick % 200 > 190;
    b.drawImage(assets.screens.get(flash ? 'A12010' : 'A12000'), 0, 0);
    if (flash) { const bolt = assets.paper.get('A-PICT-12200'); if (bolt) b.drawImage(bolt, 256, 0, 256, 240, 256, 0, 256, 240); }
    if (!reduced) {
      const band = assets.paper.get('A-PICT-12100');
      if (band) b.drawImage(band, 0, 35 * (Math.floor(tick / 14) % 5), 288, 35, 111, 287, 288, 35);
    }
  }

  // One table for every place the controls are shown, so the title, the pause card and the
  // gamepad never disagree. Each name is the name on the touch buttons too.
  const controlRows = classic => [
    ['Move', 'Left and Right, or A and D', 'Stick or pad'],
    ['Climb', 'Up and Down, or W and S', 'Stick or pad'],
    ['Ropes', classic ? 'Left or Right turns, then changes rope or leaps off' : 'Left or Right changes rope. Space leaps off', 'Stick, then A'],
    ['Jump', 'Space. Hold Down too for a low jump', 'A'],
    classic ? ['Throw', 'Move the mouse to set the arm, then click. Stand still to throw', 'Right stick aims. X throws']
      : ['Throw', 'Click to throw at the pointer, or F for the nearest foe. Hold to keep throwing', 'Right stick aims. X throws'],
    ['Act', classic ? 'Q pulls, presses and picks up. Hold it to raise the shield' : 'Q pulls and presses. Hold it to raise the shield', 'B'],
    ['Duck', classic ? 'E' : 'Down on open floor, or E', 'Y'],
    ['Pause', 'Esc, P or Tab', 'Start'],
  ];
  const controlsTable = classic => '<tr><th>To</th><th>Keyboard and mouse</th><th>Gamepad</th></tr>'
    + controlRows(classic).map(([name, keys, pad]) => `<tr><th>${name}</th><td>${keys}</td><td>${pad}</td></tr>`).join('');

  let session = null;
  function open(host) {
    if (session) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const dialog = document.createElement('dialog');
    dialog.id = 'castleGame'; dialog.setAttribute('aria-labelledby', 'castleTitle');
    dialog.innerHTML = `
      <div class="bar"><img class="castle-mark" src="archive/dc/paper/Dark-Castle-ICNN-128.png" alt=""><span id="castleTitle">THE ENCHANTED CASTLE</span><span class="barlines"></span><button type="button" data-do="close" aria-label="Close the castle">×</button></div>
      <div class="castle-stage"><canvas id="castleCanvas" width="${W}" height="${H}" tabindex="0" role="img" aria-label="The Enchanted Castle. The controls are listed below the game."></canvas></div>
      <p class="castle-line" id="castleLine" role="status"></p>
      <div class="castle-menu" data-panel="menu">
        <p class="eyebrow">A NEW GAME FROM THE TWO DISKS</p>
        <p>Enter the Black Knight’s castle by its four doors and bring out the four scepters. Rooms, floors, creatures, placements and recordings come from the 1986 Dark Castle disk. The rules follow its manual cards and are rebuilt for this edition. It spends no turns in the adventure.</p>
        <div class="castle-buttons">
          <button type="button" data-do="play" data-level="0" class="primary-mini">Beginner</button>
          <button type="button" data-do="play" data-level="1">Intermediate</button>
          <button type="button" data-do="play" data-level="2">Advanced</button>
          <button type="button" data-do="demo">Demo</button>
          <button type="button" data-do="scores">Scores of Merit</button>
          <button type="button" data-do="info">Info</button>
          <button type="button" data-do="options">Options</button>
        </div>
        <table class="castle-controls" data-controls></table>
        <p class="castle-touch-note">The buttons under the game move, climb, jump, throw, act and duck.</p>
      </div>
      <div class="castle-menu" data-panel="pause" hidden>
        <p class="eyebrow">PAUSED</p>
        <table class="castle-controls" data-controls></table>
      </div>
      <div class="castle-menu" data-panel="options" hidden>
        <label><input type="checkbox" data-opt="classic"> Classic 1986 controls: fixed jumps, throw only when standing, Q picks things up</label>
        <label><input type="checkbox" data-opt="ward"> Elron’s ward: blows cost bonus instead of a life</label>
        <label><input type="checkbox" data-opt="vertical"> Classic mouse moves the arm up and down, not left and right</label>
        <label><input type="checkbox" data-opt="captions" checked> Sound captions</label>
        <label><input type="checkbox" data-opt="remastered"> Remastered art: full colour in every room</label>
        <div class="castle-buttons">
          <button type="button" data-do="remaster" data-room="4020">See the remastered throne room</button>
          <button type="button" data-do="remaster" data-room="2020">See the remastered river</button>
          <button type="button" data-do="remaster" data-room="1000">See the remastered first room</button>
        </div>
        <p class="castle-volume"><img src="archive/dc/paper/Data-A-PICT-32000.png" alt="">Sound Volume follows the Effects slider above the game.</p>
        <button type="button" data-do="menu">Back</button>
      </div>
      <div class="castle-touch" hidden>
        <div class="castle-pad"><button type="button" data-key="left" aria-label="Move left">◀</button><div><button type="button" data-key="up" aria-label="Climb up">▲</button><button type="button" data-key="down" aria-label="Climb down">▼</button></div><button type="button" data-key="right" aria-label="Move right">▶</button></div>
        <div class="castle-pad"><button type="button" data-key="jump">Jump</button><button type="button" data-key="fire">Throw</button><button type="button" data-key="action">Act</button><button type="button" data-key="duck">Duck</button></div>
      </div>
      <div class="knock-tools"><button type="button" data-do="pause">Pause</button><button type="button" data-do="menu">Title</button><button type="button" data-do="close">Leave the castle</button></div>`;
    document.body.append(dialog);
    const $ = q => dialog.querySelector(q), canvas = $('canvas'), line = $('#castleLine');
    // A key tapped between two ticks still counts for one tick.
    const painter = new Painter(canvas), keys = new Set(), tapped = new Set(), input = {};
    let core = null, view = 'loading', frame = 0, last = 0, spare = 0, paused = false, tick = 0, cine = null, padDir = 0, padA = false, padLock = false;
    let pointer = null, usedMouse = false, lineUntil = 0;
    const options = {classic: false, ward: false, vertical: false, captions: true, remastered: true};
    try { Object.assign(options, JSON.parse(localStorage.getItem('castle-options') || '{}')); } catch { /* Storage may be blocked. */ }
    for (const box of dialog.querySelectorAll('[data-opt]')) {
      box.checked = !!options[box.dataset.opt];
      box.addEventListener('change', () => {
        options[box.dataset.opt] = box.checked;
        showControls();
        if (box.dataset.opt === 'remastered') applyLook();
        try { localStorage.setItem('castle-options', JSON.stringify(options)); } catch { /* Storage may be blocked. */ }
      });
    }
    const say = text => {
      line.textContent = text; lineUntil = performance.now() + 2600;
      window.SiliconChronicle?.note(text, 0, '');
    };
    const panel = name => { for (const p of dialog.querySelectorAll('[data-panel]')) p.hidden = p.dataset.panel !== name; };
    function applyLook() {
      const on = !!options.remastered;
      return (on ? loadHD() : Promise.resolve()).then(() => { painter.setScale(on ? HD_SCALE : 1); canvas.classList.toggle('castle-hd', on); });
    }
    function showControls() { for (const table of dialog.querySelectorAll('[data-controls]')) table.innerHTML = controlsTable(options.classic); }
    showControls();
    function begin(level, demo = false) {
      core = new window.CastleCore({data: window.CASTLE_DATA, plan: window.CastlePlan, difficulty: level, ward: options.ward, demo, modern: !options.classic && !demo, seed: Math.floor(performance.now()) || 1});
      view = 'game'; paused = false; panel(''); banner = '';
      if (demo) core.startDemo();
      $('.castle-touch').hidden = false;
      say(demo ? 'The input recorded on the disk, played in this edition. Press any key to stop.' : 'Choose a door with A and D. Press Space to go through it.');
      canvas.focus({preventScroll: true});
    }
    function toTitle() {
      view = 'title'; core = null; panel('menu'); $('.castle-touch').hidden = true; say('');
      const organ = window.CastlePlan.SOUNDS.title;
      host.onCue?.('dc:' + organ[tick % organ.length]);
    }
    function showScores(message) { view = 'scores'; panel('menu'); $('.castle-touch').hidden = true; say(message || 'Scores of Merit'); }
    // Rendered 3D shots of the throne, for the Remastered look only. Any key skips them.
    function playCine(key, then, hold) {
      const img = assets.hd?.cine?.get(key);
      if (painter.scale === 1 || !img) { then(); return; }
      cine = {img, start: performance.now(), then, hold, armed: false};
      view = 'cine'; $('.castle-touch').hidden = true;
    }
    function drawCine() {
      const b = painter.b, age = (performance.now() - cine.start) / 1000, shot = (reduced.matches ? 0 : CINE_SHOT) + cine.hold;
      const f = reduced.matches ? CINE_FRAMES - 1 : Math.min(CINE_FRAMES - 1, Math.floor(age * CINE_RATE));
      b.save(); b.imageSmoothingEnabled = true; b.imageSmoothingQuality = 'high';
      b.drawImage(cine.img, f % 8 * CINE_W, Math.floor(f / 8) * CINE_H, CINE_W, CINE_H, 0, 0, W, H);
      b.fillStyle = '#000'; b.globalAlpha = Math.max(0, 1 - age / .4, 1 - (shot - age) / .4); b.fillRect(0, 0, W, H);
      b.restore();
    }
    function onEvents(list) {
      for (const event of list) {
        if (event.type === 'sound') {
          host.onCue?.('dc:' + event.id);
          if (options.captions && CAPTIONS[event.role]) say(CAPTIONS[event.role]);
        } else if (event.type === 'text') say(event.text);
        else if (event.type === 'scepter') { say('You have the ' + event.name + '.'); host.onScepter?.(event); }
        else if (core.demo) continue;
        else if (event.type === 'over') {
          const text = recordScore(event.score);
          host.onFinish?.({won: false, score: event.score});
          showScores(text ? text.replace('^0', event.score.toLocaleString('en-US')) : 'Game over!');
        } else if (event.type === 'won') {
          const text = recordScore(event.score);
          host.onFinish?.({won: true, score: event.score});
          banner = 'Elron: Bravo! You have saved Callion!';
          playCine('empty', () => showScores(text ? text.replace('^0', event.score.toLocaleString('en-US')) : banner), 3);
        }
      }
    }
    function readInput() {
      const on = (...names) => names.some(n => keys.has(n) || tapped.has(n));
      input.left = on('a', 'arrowleft', 'left');
      input.right = on('d', 'arrowright', 'right');
      input.up = on('w', 'arrowup', 'up');
      input.down = on('s', 'arrowdown', 'down');
      input.jump = on(' ', 'jump');
      input.action = on('q', 'action');
      input.duck = on('e', 'duck');
      input.fire = on('f', 'fire', 'mouse');
      // Modern aim goes straight at the pointer. The classic mouse is one axis, as on the disk.
      input.aimAt = usedMouse && !options.classic ? pointer : null;
      input.arm = usedMouse && options.classic && pointer ? Math.round(Math.max(0, Math.min(511, options.vertical ? pointer.y * 512 / H : pointer.x))) : null;
      tapped.clear();
      readGamepad();
    }
    // The standard pad layout: stick or d-pad, A jump, B act, X throw, Y duck, Start pause.
    let startHeld = false;
    function readGamepad() {
      const pad = [...(navigator.getGamepads?.() || [])].find(Boolean);
      if (!pad) return;
      const button = i => !!pad.buttons[i]?.pressed, x = pad.axes[0] || 0, y = pad.axes[1] || 0;
      input.left ||= x < -.4 || button(14); input.right ||= x > .4 || button(15);
      input.up ||= y < -.5 || button(12); input.down ||= y > .5 || button(13);
      // The press that chose a menu item must not also jump or go through a door.
      if (padLock && !button(0)) padLock = false;
      input.jump ||= button(0) && !padLock; input.action ||= button(1); input.fire ||= button(2) || button(7); input.duck ||= button(3);
      usedMouse = usedMouse && !button(2);
      // The right stick aims. Modern play aims at a point, and Classic moves the arm along its range.
      const aimX = pad.axes[2] || 0, aimY = pad.axes[3] || 0;
      if (Math.hypot(aimX, aimY) > .4 && core?.hero) {
        usedMouse = false; input.arm = null;
        if (options.classic) input.arm = Math.round((aimX + 1) * 255.5);
        else input.aimAt = {x: core.hero.x + 16 + aimX * 200, y: core.hero.y + 16 + aimY * 200};
      }
      if (button(9) && !startHeld) togglePause();
      startHeld = button(9);
    }
    const padNow = () => [...(navigator.getGamepads?.() || [])].find(Boolean);
    const padPressed = () => !!padNow()?.buttons.some((b, i) => b.pressed && i !== 8);
    // Menus, scores and the pause panel work from a controller: move with the stick or pad, choose with A.
    function menuPad() {
      const pad = padNow();
      if (!pad) return;
      const button = i => !!pad.buttons[i]?.pressed, x = pad.axes[0] || 0, y = pad.axes[1] || 0;
      const dir = y < -.5 || x < -.5 || button(12) || button(14) ? -1 : y > .5 || x > .5 || button(13) || button(15) ? 1 : 0;
      const list = [...dialog.querySelectorAll('[data-panel]:not([hidden]) button, [data-panel]:not([hidden]) input')].filter(b => b.offsetParent && !b.disabled);
      const at = list.indexOf(document.activeElement);
      if (dir && dir !== padDir && list.length) list[at < 0 ? 0 : (at + dir + list.length) % list.length].focus();
      padDir = dir;
      if (button(0) && !padA) { padLock = true; (at >= 0 ? list[at] : list[0])?.click(); }
      padA = button(0);
      if (paused && button(9) && !startHeld) togglePause();
      startHeld = button(9);
    }
    function togglePause() {
      paused = !paused; keys.clear(); panel(paused ? 'pause' : '');
      $('.knock-tools [data-do=pause]').textContent = paused ? 'Resume' : 'Pause';
    }
    const KEY_WORDS = {action: 'Q · ', up: 'Up · ', down: 'Down · ', jump: 'Space · ', climb: 'Up or Down · ', fire: 'Click or F · ', hall: ''};
    function showPrompt() {
      if (view !== 'game' || !core || core.demo || lineUntil) return;
      const prompt = core.prompt(), text = prompt ? KEY_WORDS[prompt[0]] + prompt[1] : '';
      if (line.textContent !== text) line.textContent = text;
    }
    function step() {
      tick++;
      if (cine) {
        const held = keys.size || padPressed();
        if (!held) cine.armed = true;
        const age = (performance.now() - cine.start) / 1000, shot = (reduced.matches ? 0 : CINE_SHOT) + cine.hold;
        if ((cine.armed && held) || age > shot) { const {then} = cine; cine = null; then(); }
        return;
      }
      if (view !== 'game' || paused || !core) { menuPad(); return; }
      if (core.demo) {
        onEvents(core.tick(core.demoInput()));
        if (core.script.done || core.mode === 'over') toTitle();
        return;
      }
      readInput();
      onEvents(core.tick(input));
      // The first sight of the Black Knight's wing.
      if (view === 'game' && !core.sawKnight && !core.preview && core.mode === 'room' && core.room?.id === 4000) {
        core.sawKnight = true;
        playCine('knight', () => { view = 'game'; $('.castle-touch').hidden = false; }, 1.2);
      }
    }
    function paint() {
      const b = painter.b;
      painter.fullColour = false;
      if (view === 'title') { drawTitle(painter, tick, reduced.matches); painter.show(false); return; }
      if (view === 'scores') { drawScores(painter, tick, reduced.matches); painter.show(false); return; }
      if (view === 'loading') { b.fillStyle = '#000'; b.fillRect(0, 0, W, H); painter.show(false); return; }
      if (cine) { drawCine(); painter.show(false); return; }
      if (!core) return;
      if (core.mode === 'hall' || core.mode === 'run') {
        const now = new Date();
        drawHall(painter, core, now.getMonth() === 11 && now.getDate() === 25);
      } else if (core.room) drawRoom(painter, core, reduced.matches);
      if (paused) {
        b.fillStyle = '#000'; b.fillRect(196, 150, 120, 30);
        painter.text('dialog', 'Paused', 256, 171, 'white', 'center');
      }
      painter.show(!!host.colour?.(), core.wing || 'hall');
    }
    function loop(ms) {
      if (!dialog.open) return;
      frame = requestAnimationFrame(loop);
      if (!document.hidden) {
        spare = Math.min(.2, spare + (ms - last) / 1000); last = ms;
        while (spare >= 1 / 30) { step(); spare -= 1 / 30; }
        paint();
      } else last = ms;
      if (lineUntil && performance.now() > lineUntil) { line.textContent = ''; lineUntil = 0; }
      showPrompt();
    }
    function close() {
      cancelAnimationFrame(frame); dialog.close(); dialog.remove(); session = null;
      host.onExit?.();
    }
    dialog.addEventListener('click', e => {
      const button = e.target.closest('[data-do]');
      if (!button) return;
      const act = button.dataset.do;
      if (act === 'close') close();
      else if (act === 'play') begin(+button.dataset.level);
      else if (act === 'demo') begin(0, true);
      else if (act === 'scores') showScores();
      else if (act === 'info') host.openInfo?.();
      else if (act === 'options') panel('options');
      else if (act === 'remaster') {
        // A preview: it starts in the last room, with Elron's ward, and records no score.
        options.remastered = true; $('[data-opt=remastered]').checked = true;
        try { localStorage.setItem('castle-options', JSON.stringify(options)); } catch { /* Storage may be blocked. */ }
        applyLook().then(() => { begin(0); core.preview = true; core.ward = true; core.enter(+button.dataset.room, 0); say('Remastered art preview.'); });
      }
      else if (act === 'menu') toTitle();
      else if (act === 'pause') togglePause();
    });
    // Escape pauses a game in progress, as it does in any modern game. Elsewhere it leaves.
    dialog.addEventListener('cancel', e => {
      e.preventDefault();
      if (view === 'game' && core && !core.demo) togglePause(); else close();
    });
    dialog.addEventListener('keydown', e => {
      if (e.target.matches?.('input')) return;
      const k = e.key.toLowerCase();
      if (k === 'tab' || k === 'p') { e.preventDefault(); if (!e.repeat) togglePause(); return; }
      // Handled here so a second press can never close the window, which a browser may do to a dialog.
      if (k === 'escape') {
        e.preventDefault();
        if (e.repeat) return;
        if (view === 'game' && core && !core.demo) togglePause(); else close();
        return;
      }
      if (['a', 'd', 'w', 's', 'q', 'e', 'f', ' ', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(k)) {
        if (e.target.tagName === 'BUTTON' && k === ' ') return;
        e.preventDefault(); keys.add(k); tapped.add(k); if (paused) togglePause();
        if (core?.demo) toTitle(); // Any key ends the Demo, as it does on a title screen.
      }
    });
    dialog.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
    const blur = () => keys.clear();
    window.addEventListener('blur', blur);
    dialog.addEventListener('close', () => window.removeEventListener('blur', blur), {once: true});
    const point = e => {
      const r = canvas.getBoundingClientRect();
      return {x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height};
    };
    canvas.addEventListener('pointermove', e => { pointer = point(e); usedMouse = e.pointerType === 'mouse'; });
    canvas.addEventListener('pointerdown', e => {
      canvas.focus({preventScroll: true}); pointer = point(e); usedMouse = e.pointerType === 'mouse';
      if (paused) return;
      if (core?.mode === 'hall') {
        const p = point(e), doors = core.plan.DOORS;
        let best = 0; doors.forEach((d, i) => { if (Math.abs(d.x - p.x) < Math.abs(doors[best].x - p.x)) best = i; });
        core.door = best; core.runDoor();
      } else { keys.add('mouse'); tapped.add('mouse'); }
    });
    canvas.addEventListener('pointerup', () => keys.delete('mouse'));
    for (const button of dialog.querySelectorAll('.castle-touch [data-key]')) {
      const k = button.dataset.key;
      button.addEventListener('pointerdown', e => { e.preventDefault(); try { button.setPointerCapture(e.pointerId); } catch { /* Synthetic pointers have no capture. */ } keys.add(k); tapped.add(k); });
      for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(ev, () => keys.delete(k));
      button.addEventListener('contextmenu', e => e.preventDefault());
    }
    dialog.showModal();
    say('Loading the castle…');
    session = {dialog, used: painter.used, core: () => core};
    window.EnchantedCastle.session = session;
    window.EnchantedCastle.debug = {begin, playCine, view: () => view, painter, keys, fronts: () => [...(assets.hd?.fronts?.keys() || [])]};
    loadAssets().then(() => {
      if (!dialog.open) return;
      if (options.remastered) applyLook();
      view = 'title'; say(''); last = performance.now();
      frame = requestAnimationFrame(loop);
    }).catch(error => {
      say(error.message);
      const sad = new Image(); sad.src = 'archive/dc/paper/Data-A-ICON-2050.png'; sad.alt = ''; line.prepend(sad);
    });
  }
  window.EnchantedCastle = {open, session: null, scores};
})();
