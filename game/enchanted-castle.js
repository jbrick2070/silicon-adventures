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
    assets.loaded = Promise.all(jobs).then(prepareForegrounds);
    return assets.loaded;
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
      this.b = this.buffer.getContext('2d', {willReadFrequently: true}); this.b.imageSmoothingEnabled = false; this.ctx.imageSmoothingEnabled = false;
      this.used = new Set();
    }
    reel(key, frame, x, y, flip) {
      const img = assets.reels.get(key), info = assets.info.get(key);
      if (!img || !info) return;
      this.used.add(key);
      const f = ((frame % info.frames) + info.frames) % info.frames;
      const fx = img.naturalWidth > info.width ? f * info.width : 0, fy = img.naturalWidth > info.width ? 0 : f * info.height;
      if (flip) {
        this.b.save(); this.b.translate(Math.round(x) + info.width, Math.round(y)); this.b.scale(-1, 1);
        this.b.drawImage(img, fx, fy, info.width, info.height, 0, 0, info.width, info.height); this.b.restore();
      } else this.b.drawImage(img, fx, fy, info.width, info.height, Math.round(x), Math.round(y), info.width, info.height);
    }
    // Canvas text is antialiased. Snapping it keeps the 1-bit modes strictly two-colour.
    snap(x, y, w, h) {
      const im = this.b.getImageData(x, y, w, h), d = im.data;
      for (let i = 0; i < d.length; i += 4) { const v = d[i] < 128 ? 0 : 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
      this.b.putImageData(im, x, y);
    }
    show(colour, tone) {
      const c = this.ctx;
      c.globalCompositeOperation = 'source-over';
      if (!colour) { c.drawImage(this.buffer, 0, 0); return; }
      c.fillStyle = PALETTE[tone] || PALETTE.hall; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'multiply'; c.drawImage(this.buffer, 0, 0);
      c.globalCompositeOperation = 'lighten'; c.fillStyle = INK; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
    }
  }

  function drawHero(p, core, reduced) {
    const h = core.hero, tick = core.tickCount, left = h.face < 0, step = Math.floor(tick / 3);
    const x = h.x, y = h.y;
    if (h.safe > 0 && !reduced && tick % 4 < 2) return;
    if (h.flail > tick) {
      p.reel(left ? 'B133' : 'B134', 12 - (h.flail - tick), x - 8, y - 12);
      return;
    }
    if (h.landed && tick - h.landed < 16) { p.reel(left ? 'A131' : 'A130', Math.floor((tick - h.landed) / 2.3), x - 8, y - 2); return; }
    switch (h.state) {
      case 'walk': p.reel(left ? 'A101' : 'A100', step, x, y); break;
      case 'air': {
        if (h.arc) {
          // Reel frame and draw offset come from the same disk table as the jump's path.
          const row = h.arc.rows[Math.min(h.arc.rows.length - 1, Math.floor(h.arc.t))];
          const reel = h.arc.kind === 'running' ? (left ? 'A105' : 'A104') : (left ? 'A118' : 'A117');
          p.reel(reel, row[2], x, y + row[3]);
        } else if (h.vy > 10) p.reel('B132', 0, x, y - 11);
        else p.reel(left ? 'A105' : 'A104', 4, x, y - 5);
        break;
      }
      case 'duck': p.reel(core.powers.has('air') ? 'A149' : left ? 'A120' : 'A119', 0, x, y + (core.powers.has('air') ? 14 : 8)); break;
      case 'ladder': p.reel(h.y < h.ladder.top + 10 || h.y > h.ladder.bottom - 10 ? 'A103' : 'A102', Math.floor(y / 7), x, y - 8); break;
      case 'stairs': {
        const up = h.stairs.up;
        p.reel(up ? (left ? 'A108' : 'A107') : (left ? 'A110' : 'A109'), step, x, y - 8);
        break;
      }
      case 'rope': {
        const r = h.rope;
        if (y <= r.top + 2) p.reel('A123', Math.floor(tick / 12), x, y - 8);
        else if (y >= r.bottom - 2) p.reel('A116', Math.floor(tick / 12), x, y - 16);
        else p.reel(left ? 'A115' : 'A114', Math.floor(y / 8), x, y - 8);
        break;
      }
      case 'swing': {
        const a = Math.sin(h.swing.phase);
        p.reel(Math.cos(h.swing.phase) > 0 ? 'B121' : 'B122', Math.round((a + 1) * 2.5), x - 8, y - 16);
        break;
      }
      default: {
        const still = tick - (h.walked || 0);
        if (still > 200) p.reel(left ? 'A129' : 'A128', Math.floor(tick / 8), x, y);
        else if (still > 90) p.reel('A106', Math.floor(tick / 14), x, y);
        else if (still < 6) p.reel('A125', Math.floor(still / 2), x, y);
        else p.reel('A126', Math.floor(tick / 18), x, y);
      }
    }
    if (h.state !== 'stand') h.walked = tick;
    if (h.armUntil > tick) p.reel(left ? 'A112' : 'A111', h.aim, x, y + 2);
    if (h.shield > 0) p.reel(left ? 'A145' : 'A144', Math.floor(tick / 3), x - 8, y - 3);
  }
  const DEATHS = {
    fall: [['A135', 26, 2], ['A137', 40, 8]], bite: [['B151', 18, 5], ['A124', 40, 7]], bat: [['B150', 18, 5], ['A124', 40, 7]],
    guard: [['B152', 22, 4], ['B148', 40, 9]], whip: [['B146', 22, 4], ['B155', 40, 8]], mutant: [['B147', 18, 5], ['B153', 40, 7]],
    fire: [['B140', 30, 6], ['B141', 40, 8]], lightning: [['B140', 40, 7]], crush: [['B139', 40, 7]], weight: [['B143', 30, 6], ['B139', 40, 7]],
    acid: [['B158', 44, 5]], throw: [['A136', 40, 5]], mug: [['B142', 16, 5], ['B156', 26, 6], ['B157', 36, 6], ['B154', 44, 9]]
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
      case 'rat': p.reel(e.speed > 0 ? 'B310' : 'B311', Math.floor(e.frame / 2), e.x, e.y + 24); break;
      case 'ropeRat': p.reel('B310', Math.floor(e.frame / 2), e.x, e.y, e.speed < 0); break;
      case 'bat': p.reel('B300', e.state === 'perch' ? 0 : Math.floor(e.frame / 2), e.x, e.y); break;
      case 'mutant':
        if (e.dying) p.reel('B436', Math.floor((18 - e.dying) / 3), e.x, e.y);
        else p.reel(e.hurt ? 'B435' : 'B434', slow, e.x, e.y + 8, e.speed < 0);
        break;
      case 'vulture': p.reel('B701', Math.floor(e.frame / 3), e.x, e.y); break;
      case 'feather': p.reel('B702', Math.floor(e.frame / 3), e.x, e.y); break;
      case 'eye': p.reel(e.dying ? 'B426' : 'B425', Math.floor(e.frame / 2), e.x, e.y); break;
      case 'broom': p.reel(e.dying ? 'B423' : e.hurt ? 'B421' : 'B422', Math.floor(e.frame / 3), e.x, e.y, e.speed < 0); break;
      case 'fountain': p.reel('B420', slow, e.x, e.y); p.reel('B411', 0, e.x - 12, e.y + 52); break;
      case 'torch': p.reel('A5000', slow, e.x, e.y); break;
      case 'faces': p.reel('B522', e.pose || 0, e.x, e.y); break;
      case 'item': p.reel('A5010', e.item === 'bag' ? 4 : 6, e.x, e.y); break;
      case 'henchman': p.reel(e.dying ? 'B704' : 'B703', e.dying ? Math.floor((18 - e.dying) / 6) : e.timer < 14 ? 3 - Math.floor(e.timer / 5) : 0, e.x, e.y); break;
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
        else p.reel(e.timer < 14 ? 'B432' : e.hurt ? 'B431' : 'B430', slow, e.x, e.y);
        if (e.timer > 40 && e.timer < 46) p.reel('B437', 0, e.x - 20, e.y + 4);
        break;
      case 'bolt': p.reel('B424', Math.floor(e.frame / 2), e.x, e.y); break;
      case 'gargoyle':
        if (e.dying) p.reel('B922', Math.floor((18 - e.dying) / 2.7), e.x, e.y);
        else p.reel(e.speed > 0 ? 'B907' : 'B906', slow, e.x, e.y, e.speed < 0);
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
      case 'bridge':
        p.reel('B413', Math.floor(tick / 9), e.x, e.y);
        p.reel('B412', 0, e.x, e.y + 56); p.reel('B700', 0, e.x + 8, e.y - 6);
        break;
      case 'hatch':
        p.reel('B715', e.open ? 3 : 0, e.x, e.y);
        if (e.open) p.reel('B717', Math.floor(tick / 10), e.x - 8, e.y + 28);
        else p.reel('B716', Math.floor(tick / 12), e.x + 8, e.y + 30);
        break;
      case 'gate': p.reel('B438', e.open ? 1 : 0, e.x, e.open ? e.y - 60 : e.y); break;
      case 'platform': p.reel(core.room.id >= 4000 ? 'B901' : 'B410', e.mover.frame, e.x, e.y); break;
      case 'portcullis': p.reel('B200', Math.min(2, Math.floor(e.frame / 9)), -24, core.hero.y - 43 > 0 ? e.fixedY ??= core.hero.y - 43 : 0); break;
      case 'throne':
        if (core.throne) p.reel('B902', core.throne.down ? 2 : core.throne.shaken % 2, e.x, e.y);
        p.reel('B903', core.throne?.down ? 2 : Math.min(1, core.throne?.shaken || 0), e.x - 48, e.y + 76);
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
        p.reel(e.chain ? 'B918' : 'B712', core.pullsDone.size ? Math.min(4, core.pullsDone.size) : 0, e.x, e.y);
        if (core.pullsDone.size) { p.reel('B919', Math.floor(tick / 4), e.x + 8, e.y + 28); p.reel('B920', 0, e.x + 8, e.y + 34); p.reel('B921', Math.floor(tick / 6), e.x + 8, e.y + 22); }
        break;
      case 'scepter': {
        const img = assets.plates.get(e.scepter.id);
        if (img) p.b.drawImage(img, e.x, e.y + Math.sin(tick * .1) * (reduced ? 0 : 2));
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
    b.fillStyle = '#fff'; b.font = '11px Consolas, "Lucida Console", monospace'; b.textAlign = 'center';
    const row = STATUS_Y + 27;
    b.fillText(String(core.score), 214, row); b.fillText(String(core.bonus), 270, row);
    b.fillText(String(core.rocks), 318, row); b.fillText(String(Math.max(0, core.lives)), 365, row); b.fillText(String(core.elixir), 412, row);
    b.textAlign = 'left';
    const slots = [['earth', 1], ['fire', 2], ['air', 3]];
    slots.forEach(([power, frame], i) => { if (core.powers.has(power)) p.reel('A5010', frame, 443 + i * 23, STATUS_Y + 12); });
    p.snap(0, STATUS_Y, W, H - STATUS_Y);
  }
  function drawRoom(p, core, reduced) {
    const b = p.b, room = core.room, art = assets.screens.get('B' + room.id);
    b.fillStyle = '#000'; b.fillRect(0, 0, W, H);
    if (art) b.drawImage(art, 0, 0);
    for (const e of core.entities) if (!['knight', 'lever'].includes(e.type)) drawEntity(p, e, core, reduced);
    if (core.mode === 'dying') drawDeath(p, core); else drawHero(p, core, reduced);
    for (const e of core.entities) if (['knight', 'lever'].includes(e.type)) drawEntity(p, e, core, reduced);
    for (const shot of core.shots) {
      if (shot.fire) p.reel('B424', shot.frame, shot.x - 8, shot.y - 8);
      else p.reel('A113', shot.frame, shot.x - 8, shot.y - 4);
      if (shot.y > 296) p.reel('A127', shot.frame, shot.x - 16, 300);
      if (shot.life < 6 && !shot.fire) p.reel('A138', shot.life, shot.x - 8, shot.y);
    }
    const front = assets.fronts?.get(room.id);
    if (front) b.drawImage(front, 0, 0);
    if (core.flash && !reduced) { b.fillStyle = 'rgba(255,255,255,.65)'; b.fillRect(0, 0, W, STATUS_Y); }
    drawStatus(p, core);
  }
  function drawHall(p, core, holiday) {
    const b = p.b, hall = assets.paper.get('A-PICT-10000'), door = core.plan.DOORS[core.door];
    b.fillStyle = '#000'; b.fillRect(0, 0, W, H);
    if (hall) b.drawImage(hall, 0, 0);
    if (holiday) { const tree = assets.paper.get('A-PICT-10004'); if (tree) b.drawImage(tree, 347, 82); }
    if (core.mode === 'run') {
      const path = core.run.path, step = path.steps[core.run.step];
      if (path.door && core.run.step > 2) p.reel('A' + path.door, Math.min(2, Math.floor(core.run.step / 6)), path.doorX, path.doorY);
      if (step && step.frame >= 0) p.reel('A' + path.reels[Math.max(0, step.reel)], step.frame, step.x, step.y);
    } else {
      p.reel('A10008', Math.floor(core.tickCount / 12), 220, 208);
      p.reel('A520', 0, door.x - 16, 200);
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
    const list = scores(), place = list.findIndex(s => points > s.points);
    const at = place < 0 ? list.length : place;
    if (at >= 8) return null;
    list.splice(at, 0, {name: 'You', points}); list.length = Math.min(8, list.length);
    try { localStorage.setItem('castle-scores', JSON.stringify(list)); } catch { /* Storage may be blocked. */ }
    return at === 0 ? 'Congratulations, you made the top score with ^0 points.' : 'Congratulations, you made a high score with ^0 points.';
  }
  function drawScores(p, tick, reduced) {
    const b = p.b, art = assets.screens.get('A15000');
    b.fillStyle = '#000'; b.fillRect(0, 0, W, H);
    if (art) b.drawImage(art, 0, 0);
    const door = assets.paper.get(tick % 240 < 120 || reduced ? 'A-PICT-15100' : 'A-PICT-15101');
    if (door) b.drawImage(door, 0, 0, 64, 126, 150, 126, 64, 126);
    b.fillStyle = '#000'; b.font = 'bold 13px Georgia, serif';
    scores().slice(0, 8).forEach((row, i) => {
      b.textAlign = 'left'; b.fillText(row.name, 342, 74 + i * 22);
      b.textAlign = 'right'; b.fillText(row.points.toLocaleString('en-US'), 486, 74 + i * 22);
    });
    b.textAlign = 'left';
    p.snap(330, 56, 170, 190);
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

  let session = null;
  function open(host) {
    if (session) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const dialog = document.createElement('dialog');
    dialog.id = 'castleGame'; dialog.setAttribute('aria-labelledby', 'castleTitle');
    dialog.innerHTML = `
      <div class="bar"><img class="castle-mark" src="archive/dc/paper/Dark-Castle-ICNN-128.png" alt=""><span id="castleTitle">THE ENCHANTED CASTLE</span><span class="barlines"></span><button type="button" data-do="close" aria-label="Close the castle">×</button></div>
      <div class="castle-stage"><canvas id="castleCanvas" width="${W}" height="${H}" tabindex="0" role="img" aria-label="The Enchanted Castle. A D move, W S climb, Space jump, F or click throw, Q action or shield, E duck, Tab pause."></canvas></div>
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
      </div>
      <div class="castle-menu" data-panel="options" hidden>
        <label><input type="checkbox" data-opt="ward"> Elron’s ward: blows cost bonus instead of a life</label>
        <label><input type="checkbox" data-opt="vertical"> Mouse Tracking: Vertical (arm follows up and down)</label>
        <label><input type="checkbox" data-opt="captions" checked> Sound captions</label>
        <p class="castle-volume"><img src="archive/dc/paper/Data-A-PICT-32000.png" alt="">Sound Volume follows the Effects slider above the game.</p>
        <p class="castle-keys">A D move · W S climb · Space jump · S with Space jumps down · F or click throws · Q acts, or holds the shield · E ducks · Tab pauses</p>
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
    let core = null, view = 'loading', frame = 0, last = 0, spare = 0, paused = false, tick = 0, demoUntil = 0;
    let aimAt = null, usedMouse = false, lineUntil = 0;
    const options = {ward: false, vertical: false, captions: true};
    try { Object.assign(options, JSON.parse(localStorage.getItem('castle-options') || '{}')); } catch { /* Storage may be blocked. */ }
    for (const box of dialog.querySelectorAll('[data-opt]')) {
      box.checked = !!options[box.dataset.opt];
      box.addEventListener('change', () => {
        options[box.dataset.opt] = box.checked;
        try { localStorage.setItem('castle-options', JSON.stringify(options)); } catch { /* Storage may be blocked. */ }
      });
    }
    const say = text => {
      line.textContent = text; lineUntil = performance.now() + 2600;
      window.SiliconChronicle?.note(text, 0, '');
    };
    const panel = name => { for (const p of dialog.querySelectorAll('[data-panel]')) p.hidden = p.dataset.panel !== name; };
    function begin(level, demo = false) {
      core = new window.CastleCore({data: window.CASTLE_DATA, plan: window.CastlePlan, difficulty: level, ward: options.ward, demo, seed: Math.floor(performance.now()) || 1});
      view = 'game'; paused = false; panel(''); demoUntil = demo ? performance.now() + 26000 : 0;
      $('.castle-touch').hidden = false;
      say(demo ? window.CASTLE_DATA.demoVersion : 'Choose a door with A and D. Press Space to go through it.');
      canvas.focus({preventScroll: true});
    }
    function toTitle() {
      view = 'title'; core = null; panel('menu'); $('.castle-touch').hidden = true; say('');
      const organ = window.CastlePlan.SOUNDS.title;
      host.onCue?.('dc:' + organ[tick % organ.length]);
    }
    function showScores(message) { view = 'scores'; panel('menu'); $('.castle-touch').hidden = true; say(message || 'Scores of Merit'); }
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
          showScores('Elron: Bravo! You have saved Callion! ' + (text ? text.replace('^0', event.score.toLocaleString('en-US')) : ''));
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
      input.aimAt = usedMouse ? aimAt : null;
      tapped.clear();
    }
    // A small driver for the Demo: it walks, jumps and throws, and every room still plays by the rules.
    function demoInput() {
      const t = core.tickCount;
      return {left: t % 420 > 300, right: t % 420 <= 300, up: t % 90 < 30, down: t % 170 < 12, jump: t % 53 === 0, fire: t % 37 === 0, action: t % 211 === 0};
    }
    function step() {
      tick++;
      if (view !== 'game' || paused || !core) return;
      if (core.demo) {
        onEvents(core.tick(demoInput()));
        if (performance.now() > demoUntil || core.mode === 'over') toTitle();
        return;
      }
      readInput();
      onEvents(core.tick(input));
    }
    function paint() {
      const b = painter.b;
      if (view === 'title') { drawTitle(painter, tick, reduced.matches); painter.show(false); return; }
      if (view === 'scores') { drawScores(painter, tick, reduced.matches); painter.show(false); return; }
      if (view === 'loading') { b.fillStyle = '#000'; b.fillRect(0, 0, W, H); painter.show(false); return; }
      if (!core) return;
      if (core.mode === 'hall' || core.mode === 'run') {
        const now = new Date();
        drawHall(painter, core, now.getMonth() === 11 && now.getDate() === 25);
      } else if (core.room) drawRoom(painter, core, reduced.matches);
      if (paused) {
        b.fillStyle = '#000'; b.fillRect(196, 150, 120, 30); b.fillStyle = '#fff'; b.font = '13px Consolas, monospace'; b.textAlign = 'center';
        b.fillText('Paused', 256, 170); b.textAlign = 'left'; painter.snap(196, 150, 120, 30);
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
      else if (act === 'menu') toTitle();
      else if (act === 'pause') { paused = !paused; button.textContent = paused ? 'Resume' : 'Pause'; }
    });
    dialog.addEventListener('cancel', e => { e.preventDefault(); close(); });
    dialog.addEventListener('keydown', e => {
      if (e.target.matches?.('input')) return;
      const k = e.key.toLowerCase();
      if (k === 'tab') { e.preventDefault(); if (!e.repeat) paused = !paused; return; }
      if (['a', 'd', 'w', 's', 'q', 'e', 'f', ' ', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(k)) {
        if (e.target.tagName === 'BUTTON' && k === ' ') return;
        e.preventDefault(); keys.add(k); tapped.add(k); if (paused) paused = false;
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
    canvas.addEventListener('pointermove', e => {
      if (!options.vertical && core) { const p = point(e); aimAt = {x: p.x, y: core.hero.y + 12}; }
      else aimAt = point(e);
      usedMouse = e.pointerType === 'mouse';
    });
    canvas.addEventListener('pointerdown', e => {
      canvas.focus({preventScroll: true}); aimAt = point(e); usedMouse = e.pointerType === 'mouse';
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
    window.EnchantedCastle.debug = {begin, view: () => view, painter, keys};
    loadAssets().then(() => {
      if (!dialog.open) return;
      view = 'title'; say(''); last = performance.now();
      frame = requestAnimationFrame(loop);
    }).catch(error => {
      say(error.message);
      const sad = new Image(); sad.src = 'archive/dc/paper/Data-A-ICON-2050.png'; sad.alt = ''; line.prepend(sad);
    });
  }
  window.EnchantedCastle = {open, session: null, scores};
})();
