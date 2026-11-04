/* The Enchanted Castle: game rules. No browser code lives here, so tests can
   play it headlessly. One tick is 1/30 s. Coordinates are the disk's: a hero
   position is the top-left of his 32 by 40 frame, on a 512 by 342 screen. */
(() => {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const WALL = new Set([6, 27]), KILL = 29, LADDER_TOP = 2, LADDER_FOOT = 3, EXIT = 5, STAIR_TOP = 9, STAIR_FOOT = 10,
    MOVER = 14, STEP = 16, PULL = 35, WIDE_ROPE = 40;
  const WALK = 3.1, RUN_JUMP = 3.7, CLIMB = 2.1, GRAVITY = .62, HIGH_JUMP = -8.6, LONG_JUMP = -6.7, HERO_W = 32, HERO_H = 40;
  const random = seed => () => {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

  // Turns one room's decoded tables into walkable segments, links and ropes.
  function buildRoom(id, raw) {
    const room = {id, floors: [], ropes: [], swings: [], kills: [], pulls: [], movers: [], byAt: new Map(), entries: raw.entries, sounds: raw.sounds};
    for (const floor of raw.floors) {
      const spans = floor.spans.map(([at, x0, x1, kind, a, b, c, d, e, f]) => ({at, x0, x1, kind, a, b, c, d, e, f, y: floor.y}));
      const walk = [];
      for (const span of spans) {
        room.byAt.set(span.at, span);
        if (span.kind === KILL) room.kills.push(floor.y);
        else if (span.kind === 525) room.swings.push(span);
        else if (span.kind >= 500) {
          const top = span.kind === 545 || span.kind === 546 || span.kind === 543 ? span.e : span.c;
          const bottom = span.kind === 545 || span.kind === 546 || span.kind === 543 ? span.f : span.d;
          if (span.x1 - span.x0 <= WIDE_ROPE && !room.ropes.some(r => r.x0 === span.x0 && r.top === top))
            room.ropes.push({x0: span.x0, x1: span.x1, x: span.x1 + 3, top: Math.min(top, bottom), bottom: Math.max(top, bottom)});
        } else if (!WALL.has(span.kind) && !(span.kind === MOVER && raw.movers.length)) walk.push(span);
      }
      walk.sort((p, q) => p.x0 - q.x0);
      const segments = [];
      for (const span of walk) {
        const last = segments[segments.length - 1];
        if (last && span.x0 <= last.x1 + 1) { last.x1 = Math.max(last.x1, span.x1); last.spans.push(span); }
        else segments.push({x0: span.x0, x1: span.x1, y: floor.y, spans: [span], stopLeft: false, stopRight: false});
      }
      for (const segment of segments) {
        segment.stopLeft = spans.some(s => WALL.has(s.kind) && s.x1 >= segment.x0 - 2 && s.x1 < segment.x0 + 1);
        segment.stopRight = spans.some(s => WALL.has(s.kind) && s.x0 <= segment.x1 + 2 && s.x0 > segment.x1 - 1);
        if (segment.x0 <= 3) segment.stopLeft = true;
        if (segment.x1 >= 478) segment.stopRight = true;
      }
      if (segments.length) room.floors.push({y: floor.y, segments});
      for (const span of spans) if (span.kind === PULL && !room.pulls.some(p => p.at === span.at)) room.pulls.push(span);
    }
    // A moving platform is a floor segment whose ends travel. Saber rides it.
    for (const mover of raw.movers) {
      const seg = {x0: mover.x0, x1: mover.x1, y: mover.y, spans: [{kind: MOVER, x0: mover.x0, x1: mover.x1, y: mover.y}], stopLeft: false, stopRight: false, moving: true};
      room.movers.push({...mover, seg});
      let floor = room.floors.find(f => f.y === mover.y);
      if (!floor) { floor = {y: mover.y, segments: []}; room.floors.push(floor); }
      floor.segments.push(seg);
    }
    room.floors.sort((a, b) => a.y - b.y);
    return room;
  }

  class CastleCore {
    constructor({data, plan, difficulty = 0, ward = false, seed = 1986, demo = false, rooms = null}) {
      Object.assign(this, {data, plan, difficulty, ward, demo});
      this.random = random(seed);
      this.rooms = rooms || new Map(data.order.map(id => [id, buildRoom(id, data.rooms[id])]));
      this.events = [];
      this.score = 0; this.rocks = plan.RULES.startRocks; this.lives = plan.RULES.lives; this.elixir = 3;
      this.nextMan = plan.RULES.extraMan[difficulty]; this.powers = new Set(); this.visited = new Set();
      this.seen = new Set(); // Reels and sounds met in play, for the coverage record
      this.mode = 'hall'; this.tickCount = 0; this.door = 0; this.bonus = 0; this.room = null; this.entities = []; this.shots = [];
      this.hero = this.freshHero(); this.flash = 0; this.pullsDone = new Set();
      this.cooldown = 0; this.lastJump = false; this.lastAction = false; this.lastThrow = false; this.lastSide = 0;
      this.say('hall');
    }
    freshHero() {
      return {x: 240, y: 0, vx: 0, vy: 0, face: 1, state: 'stand', frame: 0, floor: null, ladder: null, stairs: null, rope: null,
        swing: null, shield: 0, safe: 0, drop: 0, aim: 4, armUntil: 0, hurt: null};
    }
    say(role) {
      const list = this.plan.SOUNDS[role];
      if (!list?.length) return;
      const id = list[Math.floor(this.random() * list.length)];
      this.events.push({type: 'sound', id, role});
    }
    tell(text) { this.events.push({type: 'text', text}); }
    award(points) {
      this.score += points;
      while (this.score >= this.nextMan) {
        this.nextMan += this.plan.RULES.extraMan[this.difficulty];
        this.lives++; this.say('extraMan'); this.tell('An extra man.');
      }
    }
    get wing() { return this.room ? this.plan.WING_OF(this.room.id) : null; }

    /* Great Hall */
    enterHall() {
      this.mode = 'hall'; this.room = null; this.entities = []; this.shots = []; this.say('hall');
      if (['earth', 'fire', 'air', 'water'].every(p => this.powers.has(p))) this.finish();
    }
    canEnter(door) {
      if (door.wing !== 'knight') return !this.powers.has(this.plan.WINGS[door.wing].scepter.id);
      return ['earth', 'fire', 'air'].every(p => this.powers.has(p));
    }
    chooseDoor(step) { this.door = (this.door + step + this.plan.DOORS.length) % this.plan.DOORS.length; }
    runDoor() {
      const door = this.plan.DOORS[this.door];
      if (!this.canEnter(door)) {
        this.tell(door.wing === 'knight' ? 'The great doors hold fast until three scepters are found.' : 'That wing has given up its scepter.');
        return false;
      }
      this.run = {path: this.data.paths[door.path], step: 0, door};
      this.mode = 'run'; this.say('hallRun');
      return true;
    }
    tickRun() {
      const {path} = this.run;
      if (this.tickCount % 2) return;
      this.run.step++;
      if (this.run.step % 3 === 0) this.say('hallRun');
      if (this.run.step >= path.steps.length - 1) this.enter(this.plan.WINGS[this.run.door.wing].first, 0);
    }

    /* Rooms */
    enter(id, variant) {
      const room = this.rooms.get(id), hero = this.freshHero(), start = room.entries[variant] || room.entries[0];
      this.room = room; this.mode = 'room'; this.entry = {id, variant};
      this.visited.add(id);
      hero.x = (start.x0 + start.x1) / 2; hero.y = start.y; hero.shield = this.hero.shield; hero.aim = this.hero.aim;
      this.hero = hero;
      if (start.y < -30) { const seg = this.topFloor(room); hero.x = Math.max(seg.x0, Math.min(seg.x1, hero.x)); hero.y = seg.y; }
      const here = this.floorAt(hero.x, hero.y, true);
      if (here) { hero.floor = here; hero.y = here.y; hero.state = 'stand'; hero.x = Math.max(here.x0, Math.min(here.x1, hero.x)); }
      else hero.state = 'air';
      this.bonus = this.plan.RULES.bonus[this.difficulty];
      this.spawn(room); this.shots = [];
    }
    topFloor(room) { return room.floors.find(f => f.y >= 0 && f.segments.some(s => !s.moving)).segments.filter(s => !s.moving).at(-1); }
    floorAt(x, y, near = false) {
      for (const floor of this.room.floors) {
        if (near ? Math.abs(floor.y - y) > 6 : floor.y !== y) continue;
        const seg = floor.segments.find(s => x >= s.x0 - 1 && x <= s.x1 + 1);
        if (seg) return seg;
      }
      return null;
    }
    spawn(room) {
      this.entities = [];
      for (const mover of room.movers) { mover.seg.x0 = mover.x0; mover.seg.x1 = mover.x1; mover.dx = mover.speed; }
      if (room.id < 4000 ? false : this.exitsToHall(room)) this.entities.push({type: 'portcullis', x: 0, y: 0, w: 64, h: 83, frame: 0});
      for (const spec of this.plan.ROOMS[room.id] || []) {
        if ((spec.min || 0) > this.difficulty) continue;
        const add = this['add_' + spec.type];
        if (add) add.call(this, spec);
        else this.entities.push({...spec, w: 32, h: 32, frame: 0, timer: 0});
      }
      const wing = this.plan.WINGS[this.plan.WING_OF(room.id)];
      if (wing.scepter.room === room.id && !this.powers.has(wing.scepter.id) && wing.scepter.id !== 'water')
        this.entities.push({type: 'scepter', scepter: wing.scepter, x: wing.scepter.x, y: wing.scepter.y, w: 24, h: 30, frame: 0});
    }
    add_doorGuard(s) {
      this.entities.push({type: 'door', x: s.x <= 0 ? 0 : 480, y: s.y - 7, w: 32, h: 48, left: s.left, right: s.right, speed: s.speed, reel: s.x <= 0 ? 'B400' : 'B401',
        frame: 0, timer: 40 + Math.floor(this.random() * 90), left_: s.hits, spawnY: s.y});
    }
    add_guard(s) { this.entities.push(this.guard(s.x, s.y, s.left, s.right, s.whip ? 1.4 : 2, s.whip)); }
    guard(x, y, left, right, speed, whip) {
      return {type: 'guard', x, y, w: 26, h: 46, left, right, speed: speed || 2, whip: !!whip, hp: whip ? 2 : 1, frame: 0, timer: 0, foes: true};
    }
    add_bat(s) { this.entities.push({type: 'bat', x: s.x, y: Math.max(4, s.y), homeX: s.x, homeY: Math.max(4, s.y), w: 24, h: 20, floor: s.floor, frame: 0, timer: Math.floor(this.random() * 120), state: 'perch', hp: 1, foes: true}); }
    add_rat(s) { this.entities.push({type: 'rat', x: s.x, y: s.y, w: 28, h: 12, left: s.left, right: s.right, speed: s.x > 240 ? -2.5 : 2.5, frame: 0, hp: 1, foes: true}); }
    add_ropeRat(s) { this.entities.push({type: 'ropeRat', x: s.x - 8, y: s.top + Math.floor(this.random() * 120), w: 24, h: 14, top: s.top, bottom: s.bottom, speed: 1.3, frame: 0, hp: 1, foes: true}); }
    add_mutant(s) { this.entities.push({type: 'mutant', x: s.x > 478 ? 478 : s.x, y: s.y, w: 28, h: 40, left: s.left, right: s.right, speed: s.speed, frame: 0, hp: 2, foes: true}); }
    add_vulture(s) { this.entities.push({type: 'vulture', x: s.x, y: s.y, w: 40, h: 26, homeY: s.y, frame: 0, timer: Math.floor(this.random() * 60), hp: 1, foes: true}); }
    add_eye(s) { this.entities.push({type: 'eye', x: s.x, y: s.y, w: 28, h: 28, frame: 0, phase: this.random() * 6, hp: 2, foes: true}); }
    add_broom(s) { this.entities.push({type: 'broom', x: s.x, y: s.y, w: 24, h: 40, left: s.left, right: s.right, speed: -2.2, frame: 0, hp: 2, foes: true}); }
    add_fountain(s) { this.entities.push({type: 'fountain', x: s.x, y: s.y, w: 40, h: 60, frame: 0, timer: 0}); }
    add_torch(s) { this.entities.push({type: 'torch', x: s.x, y: s.y, w: 32, h: 18, frame: 0}); }
    add_faces(s) { this.entities.push({type: 'faces', x: s.x, y: s.y, w: 16, h: 13, frame: 0, timer: Math.floor(this.random() * 60)}); }
    add_item(s) { this.entities.push({type: 'item', item: s.item, x: s.x, y: s.y, w: 18, h: 18, frame: 0}); }
    add_henchman(s) { this.entities.push({type: 'henchman', x: s.x, y: s.y, w: 32, h: 56, frame: 0, timer: 70, hp: 3, foes: true}); }
    add_weight(s) { this.entities.push({type: 'weight', x: s.x, y: -40, w: 36, h: 26, frame: 0, timer: 90, falling: false}); }
    add_dragon(s) { this.entities.push({type: 'dragon', x: s.x, y: s.y, w: 72, h: 60, frame: 0, timer: 50, hp: 8, foes: true, breath: 0}); }
    add_wizard(s) { this.entities.push({type: 'wizard', x: s.x, y: s.y, w: 34, h: 48, frame: 0, timer: 50, hp: 5, foes: true}); }
    add_gargoyle(s) { this.entities.push({type: 'gargoyle', x: s.x, y: s.y, homeY: s.y, w: 34, h: 30, right: s.right, speed: 2, frame: 0, timer: 0, hp: 2, foes: true}); }
    add_boulder(s) { this.entities.push({type: 'boulder', x: s.x, y: s.y, startX: s.x, startY: s.y, speed: s.speed, w: 24, h: 24, vy: 0, frame: 0, foes: false}); }
    add_drip(s) { this.entities.push({type: 'drip', x: s.x, y: 0, startY: s.y, w: 8, h: 12, floor: s.floor, frame: 0, timer: Math.floor(this.random() * 90), state: 'wait'}); }
    add_storm(s) { this.entities.push({type: 'storm', every: s.every, x: 0, y: 0, w: 32, h: 180, timer: s.every, live: 0, frame: 0}); }
    add_clouds(s) { this.entities.push({type: 'clouds', x: s.x, y: s.y, w: 80, h: 17, frame: 0}); }
    add_swingRope(s) { this.entities.push({type: 'swingRope', x: s.x, y: s.y, reel: s.reel, w: 40, h: 40, frame: 0, phase: s.reel === 'left' ? 0 : Math.PI}); }
    add_bridge(s) { this.entities.push({type: 'bridge', x: s.x, y: s.y, w: 48, h: 56, frame: 0, timer: 0}); }
    add_hatch(s) { this.entities.push({type: 'hatch', x: s.x, y: s.y, w: 48, h: 40, frame: 0, open: false}); }
    add_gates() { this.entities.push({type: 'gate', x: 248, y: 40, w: 16, h: 71, frame: 0, open: false}); this.pullsDone = new Set(); }
    add_platforms() { for (const mover of this.room.movers) this.entities.push({type: 'platform', mover, x: mover.x0, y: mover.y + 40, w: 48, h: 9, frame: 0}); }
    exitsToHall(room) { return room.floors.some(f => f.segments.some(s => s.spans.some(p => p.kind === EXIT && p.a === -1))); }
    add_knight(s) {
      this.throne = {shaken: 0, down: false};
      this.entities.push({type: 'throne', x: s.x, y: s.y + 11, w: 48, h: 77, frame: 0});
      this.entities.push({type: 'knight', x: s.x + 2, y: s.y + 26, w: 44, h: 58, frame: 0, timer: 70, hp: 0});
      this.pullsDone = new Set();
    }
    add_lever(s) { this.entities.push({type: 'lever', x: s.x - 16, y: s.y, chain: s.chain, w: 32, h: 40, frame: 0}); }

    /* One tick */
    tick(input = {}) {
      this.tickCount++;
      if (this.mode === 'hall') {
        const side = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        if (side && side !== this.lastSide) this.chooseDoor(side);
        this.lastSide = side;
        if ((input.jump && !this.lastJump) || (input.action && !this.lastAction)) this.runDoor();
      } else if (this.mode === 'run') this.tickRun();
      else if (this.mode === 'room') this.tickRoom(input);
      else if (this.mode === 'dying') this.tickDying();
      else if (this.mode === 'leaving' && --this.leaving <= 0) this.enterHall();
      this.lastJump = !!input.jump; this.lastAction = !!input.action; this.lastThrow = !!input.fire;
      return this.events.splice(0);
    }
    tickRoom(input) {
      if (this.tickCount % 3 === 0 && this.bonus > 0) this.bonus = Math.max(0, this.bonus - 10);
      if (this.tickCount % 300 === 0 && this.random() < .4) this.say('ambience');
      if (this.flash > 0) this.flash--;
      this.record();
      this.updateHero(input);
      if (this.mode !== 'room') return;
      this.updateShots();
      for (const e of this.entities.slice()) this.updateEntity(e);
      this.entities = this.entities.filter(e => !e.gone);
    }
    // What this run has met, kept for the Chronicle's Dark Castle notes.
    record() { if (this.room) this.seen.add(this.room.id); }
    heroBox() {
      const h = this.hero, duck = h.state === 'duck';
      return {x: h.x + 8, y: h.y + (duck ? 20 : 4), w: 16, h: duck ? 20 : 36};
    }
    updateHero(input) {
      const hero = this.hero;
      hero.frame++;
      if (hero.safe > 0) hero.safe--;
      if (hero.shield > 0) { hero.shield--; if (!input.action) hero.shield = 0; }
      if (input.aim !== undefined) hero.aim = Math.max(0, Math.min(10, input.aim));
      if (input.fire && !this.lastThrow) this.throwRock(input.aimAt);
      if (input.action && !this.lastAction && this.tryAction()) { /* handled */ }
      else if (input.action && !this.lastAction && this.powers.has('air')) { hero.shield = this.plan.RULES.shieldTicks; this.say('heroHit'); }
      const jump = input.jump && !this.lastJump;
      switch (hero.state) {
        case 'stand': case 'walk': case 'duck': this.updateGround(input, jump); break;
        case 'air': this.updateAir(input); break;
        case 'ladder': this.updateLadder(input); break;
        case 'stairs': this.updateStairs(input); break;
        case 'rope': this.updateRope(input, jump); break;
        case 'swing': this.updateSwing(input, jump); break;
      }
    }
    updateGround(input, jump) {
      const hero = this.hero, seg = hero.floor;
      const side = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (input.duck) { if (hero.state !== 'duck') this.say('duck'); hero.state = 'duck'; return; }
      const span = seg.spans.find(s => hero.x >= s.x0 - 1 && hero.x <= s.x1 + 1) || seg.spans[0];
      if (input.up && this.tryUp(span)) return;
      if (input.down && !jump && this.tryDown(span)) return;
      if (jump) {
        hero.state = 'air'; hero.floor = null; this.say('jump');
        if (input.down) { hero.vy = 1; hero.vx = side * 1.2; hero.drop = 4; }
        else { hero.vy = side ? LONG_JUMP : HIGH_JUMP; hero.vx = side * RUN_JUMP; }
        if (side) hero.face = side;
        return;
      }
      if (!side) { hero.state = 'stand'; return; }
      hero.face = side; hero.state = 'walk';
      if (this.tickCount % 7 === 0) this.say('step');
      const next = hero.x + side * WALK;
      if (span.kind === EXIT && this.takeExit(span, side)) return;
      if (next < seg.x0) {
        const out = seg.spans.find(s => s.kind === EXIT && s.x0 <= hero.x + 8);
        if (out && this.takeExit(out, side)) return;
        if (seg.stopLeft) { hero.x = seg.x0; return; }
        this.leaveLedge(next);
      } else if (next > seg.x1) {
        const out = seg.spans.find(s => s.kind === EXIT && s.x1 >= hero.x - 8);
        if (out && this.takeExit(out, side)) return;
        if (seg.stopRight) { hero.x = seg.x1; return; }
        this.leaveLedge(next);
      } else hero.x = next;
    }
    leaveLedge(x) {
      const hero = this.hero;
      hero.x = x; hero.state = 'air'; hero.floor = null; hero.vy = .5; hero.vx = hero.face * 1.4; hero.drop = 4;
    }
    takeExit(span, side) {
      // A span's far end leads out. The exit runs toward the nearer edge of the screen.
      const outward = span.x0 > 240 ? 1 : -1;
      if (side !== outward) return false;
      this.leaveRoom(span.a, span.b);
      return true;
    }
    leaveRoom(index, variant) {
      this.award(this.bonus);
      if (index < 0) { this.enterHall(); return; }
      const id = this.data.order[index];
      if (id !== undefined) this.enter(id, variant);
    }
    tryUp(span) {
      const hero = this.hero;
      if (span.kind === LADDER_FOOT) {
        const top = this.room.byAt.get(span.a);
        if (top) { this.onLadder(span, top, -1); return true; }
      }
      if (span.kind === STAIR_FOOT || span.kind === STEP) {
        const top = this.room.byAt.get(span.a);
        if (top && top.y < span.y) { this.onStairs(span, top); return true; }
      }
      return false;
    }
    tryDown(span) {
      if (span.kind === LADDER_TOP) {
        const foot = this.room.byAt.get(span.b);
        if (foot) { this.onLadder(foot, span, 1); return true; }
      }
      if (span.kind === STAIR_TOP) {
        const foot = this.room.byAt.get(span.b);
        if (foot) { this.onStairs(span, foot); return true; }
      }
      if (span.kind === STEP) {
        const foot = this.room.byAt.get(span.a);
        if (foot && foot.y > span.y) { this.onStairs(span, foot); return true; }
      }
      return false;
    }
    onLadder(foot, top, direction) {
      const hero = this.hero;
      hero.state = 'ladder'; hero.floor = null;
      hero.ladder = {top: top.y, bottom: foot.y, x: (foot.x0 + foot.x1) / 2, foot, topSpan: top};
      hero.x = hero.ladder.x; this.say('ladder');
      hero.y += direction * CLIMB;
    }
    updateLadder(input) {
      const hero = this.hero, l = hero.ladder;
      const go = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      if (!go) return;
      hero.y += go * CLIMB;
      if (this.tickCount % 9 === 0) this.say('ladder');
      if (hero.y <= l.top) this.landOn(l.topSpan.y, l.x);
      else if (hero.y >= l.bottom) this.landOn(l.bottom, l.x);
    }
    landOn(y, x) {
      const hero = this.hero;
      hero.y = y; hero.x = x; hero.vx = hero.vy = 0; hero.ladder = hero.stairs = hero.rope = null;
      hero.floor = this.floorAt(x, y) || this.floorAt(x, y, true);
      hero.state = hero.floor ? 'stand' : 'air';
    }
    onStairs(from, to) {
      const hero = this.hero, ticks = Math.max(8, Math.abs(to.y - from.y) * 1.25);
      const end = {x: (to.x0 + to.x1) / 2, y: to.y};
      hero.state = 'stairs'; hero.floor = null;
      hero.stairs = {fromX: hero.x, fromY: hero.y, end, ticks, t: 0, up: to.y < from.y};
      hero.face = end.x > hero.x ? 1 : -1;
    }
    updateStairs() {
      const hero = this.hero, s = hero.stairs;
      s.t++;
      const p = Math.min(1, s.t / s.ticks);
      hero.x = s.fromX + (s.end.x - s.fromX) * p; hero.y = s.fromY + (s.end.y - s.fromY) * p;
      if (this.tickCount % 7 === 0) this.say('step');
      if (p >= 1) this.landOn(s.end.y, s.end.x);
    }
    grabRope() {
      const hero = this.hero;
      if (hero.vy < -6) return false;
      for (const rope of this.room.ropes) {
        if (hero.x >= rope.x0 - 3 && hero.x <= rope.x1 + 3 && hero.y >= rope.top && hero.y <= rope.bottom) {
          hero.state = 'rope'; hero.rope = rope; hero.x = (rope.x0 + rope.x1) / 2; hero.vx = hero.vy = 0; this.say('rope');
          return true;
        }
      }
      return false;
    }
    updateRope(input, jump) {
      const hero = this.hero, rope = hero.rope;
      const go = (input.down ? 1 : 0) - (input.up ? 1 : 0), side = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (go) {
        hero.y = Math.max(rope.top, Math.min(rope.bottom, hero.y + go * CLIMB));
        if (this.tickCount % 8 === 0) this.say('climb');
      }
      if (jump) {
        hero.state = 'air'; hero.rope = null; hero.vy = side ? -4.6 : 0; hero.vx = side * RUN_JUMP; hero.drop = 10; hero.releaseAt = this.tickCount;
        if (side) hero.face = side;
        this.say('jump');
      }
    }
    updateSwing(input, jump) {
      const hero = this.hero, rope = hero.swing, tip = this.swingTip(rope);
      hero.x = tip.x - 24; hero.y = tip.y - 8;
      hero.face = Math.cos(rope.phase) > 0 ? 1 : -1;
      if (jump) {
        hero.state = 'air'; hero.swing = null; rope.cool = 30; hero.vx = Math.cos(rope.phase) * 4.2; hero.vy = -3; this.say('jump');
        if (input.right) hero.vx = Math.abs(hero.vx) + 1; if (input.left) hero.vx = -Math.abs(hero.vx) - 1;
      }
    }
    swingTip(e) {
      const angle = Math.sin(e.phase) * .78;
      return {x: e.x + Math.sin(angle) * 92, y: e.y + Math.cos(angle) * 92 + 10};
    }
    updateAir(input) {
      const hero = this.hero;
      const side = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (side) { hero.vx += side * .34; hero.vx = Math.max(-RUN_JUMP, Math.min(RUN_JUMP, hero.vx)); hero.face = side; }
      const before = hero.y;
      hero.vy = Math.min(9, hero.vy + GRAVITY);
      hero.y += hero.vy; hero.x = Math.max(-4, Math.min(482, hero.x + hero.vx));
      if (hero.drop > 0) hero.drop--;
      if (!(hero.releaseAt && this.tickCount - hero.releaseAt < 10) && this.grabRope()) return;
      for (const e of this.entities) {
        if (e.type === 'swingRope' && !e.cool && !hero.swing) {
          const tip = this.swingTip(e);
          if (Math.abs(tip.x - (hero.x + 16)) < 22 && Math.abs(tip.y - hero.y) < 30) {
            hero.state = 'swing'; hero.swing = e; this.say('swing'); return;
          }
        }
      }
      if (hero.vy >= 0 && !hero.drop) {
        for (const floor of this.room.floors) {
          if (floor.y < before - .5 || floor.y > hero.y) continue;
          const seg = floor.segments.find(s => hero.x >= s.x0 - 3 && hero.x <= s.x1 + 3);
          if (seg) {
            const exit = seg.spans.find(s => s.kind === EXIT && hero.x >= s.x0 - 3 && hero.x <= s.x1 + 3 && s.x1 - s.x0 > 40);
            if (exit) { this.leaveRoom(exit.a, exit.b); return; }
            const fell = hero.vy > 8.9;
            hero.y = floor.y; hero.vy = hero.vx = 0; hero.floor = seg; hero.state = 'stand';
            hero.x = Math.max(seg.x0, Math.min(seg.x1, hero.x)); this.say('land');
            if (fell) { hero.safe = 8; hero.landed = this.tickCount; this.say('splat'); }
            return;
          }
        }
      }
      const pit = this.room.kills.find(y => hero.y >= y);
      if (pit !== undefined || hero.y > 300) this.harm('fall');
    }
    tryAction() {
      const hero = this.hero;
      for (const pull of this.room.pulls) {
        if (hero.floor && hero.floor.y === pull.y && hero.x >= pull.x0 - 2 && hero.x <= pull.x1 + 2) { this.pull(pull); return true; }
      }
      const box = this.heroBox();
      for (const e of this.entities) {
        if (e.type === 'item' && overlap(box, {x: e.x - 8, y: e.y - 8, w: e.w + 16, h: e.h + 16})) {
          this.take(e); return true;
        }
        if (e.type === 'hatch' && !e.open && Math.abs(hero.x - e.x) < 44 && Math.abs(hero.y - e.y) < 44) {
          e.open = true; this.say('hatch'); return true;
        }
      }
      const foe = this.entities.find(e => e.foes && !e.dying && Math.abs(e.x - hero.x) < 34 && Math.abs(e.y - hero.y) < 34);
      if (foe) { hero.armUntil = this.tickCount + 10; hero.flail = this.tickCount + 12; this.strike(foe, 1); this.say('throwRock'); return true; }
      return false;
    }
    take(e) {
      e.gone = true; this.say('pickup');
      if (e.item === 'bag') {
        if (this.rocks >= this.plan.RULES.rockCap) { e.gone = false; this.tell('Your bags are full.'); return; }
        this.rocks = Math.min(this.plan.RULES.rockCap, this.rocks + this.plan.RULES.bagRocks); this.tell('A bag of rocks.');
      } else if (e.item === 'elixir') { this.elixir++; this.say('elixir'); this.tell('A bottle of elixir.'); }
    }
    pull(span) {
      if (this.pullsDone.has(span.at)) return;
      this.pullsDone.add(span.at); this.say('lever');
      const gate = this.entities.find(e => e.type === 'gate');
      if (gate) {
        gate.frame = 1;
        if (this.pullsDone.size === this.room.pulls.length) { gate.open = true; this.say('gate'); this.tell('The gate rises.'); }
      }
      if (this.throne && !this.throne.down) {
        this.throne.shaken++; this.say('throne');
        this.tell('The throne rocks on its footing.');
        if (this.throne.shaken >= this.room.pulls.length) this.toppleThrone();
      }
    }
    toppleThrone() {
      this.throne.down = true; this.award(this.plan.RULES.throne); this.say('throne');
      for (const e of this.entities) if (e.type === 'knight') { e.falling = 60; }
      this.tell('The Black Knight falls.');
    }
    throwRock(aimAt) {
      const hero = this.hero;
      if (!['stand', 'walk', 'air', 'duck'].includes(hero.state)) return;
      if (this.rocks <= 0) { this.tell('You are out of rocks.'); return; }
      this.rocks--;
      const fire = this.powers.has('fire');
      let angle;
      if (aimAt) {
        angle = Math.atan2(aimAt.y - (hero.y + 12), aimAt.x - (hero.x + 16));
        hero.face = Math.cos(angle) >= 0 ? 1 : -1;
        hero.aim = Math.max(0, Math.min(10, Math.round((Math.abs(Math.atan2(Math.sin(angle), Math.abs(Math.cos(angle)))) + (Math.sin(angle) > 0 ? 0 : 0)) / (Math.PI / 2) * 5 + (Math.sin(angle) > 0 ? 5 : -5) * 0 + 5 * (Math.sin(angle) > 0 ? 1 : 0))));
      } else {
        const target = this.nearestFoe();
        angle = target ? Math.atan2(target.y + target.h / 2 - (hero.y + 12), target.x + target.w / 2 - (hero.x + 16)) : (hero.face > 0 ? 0 : Math.PI);
        if (target) hero.face = Math.cos(angle) >= 0 ? 1 : -1;
      }
      const speed = fire ? 7 : 6;
      this.shots.push({x: hero.x + 16, y: hero.y + 10, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, w: 8, h: 8, fire, frame: 0, life: 60});
      hero.armUntil = this.tickCount + 9; this.say(fire ? 'fireball' : 'throwRock');
    }
    nearestFoe() {
      const hero = this.hero;
      let best = null, far = 1e9;
      for (const e of this.entities) {
        if (!e.foes || e.dying) continue;
        const d = Math.hypot(e.x - hero.x, e.y - hero.y);
        if (d < far) { far = d; best = e; }
      }
      return far < 300 ? best : null;
    }
    updateShots() {
      for (const shot of this.shots) {
        shot.x += shot.vx; shot.y += shot.vy; shot.vy += shot.fire ? 0 : .12; shot.frame++; shot.life--;
        for (const e of this.entities) {
          if (!e.foes || e.dying || !overlap({x: shot.x, y: shot.y, w: 8, h: 8}, e)) continue;
          shot.life = 0; this.say('rockHit');
          if (e.type === 'gargoyle' && !shot.fire) { this.tell('Rocks bounce off the gargoyle.'); break; }
          this.strike(e, shot.fire ? 2 : 1);
          break;
        }
        if (shot.y > 306 || shot.x < -8 || shot.x > 520) shot.life = 0;
      }
      this.shots = this.shots.filter(s => s.life > 0);
    }
    strike(e, damage) {
      e.hp -= damage; e.hurt = 8;
      if (e.hp > 0) return;
      e.dying = 18; e.frame = 0;
      const points = this.plan.POINTS[e.whip ? 'whip' : e.type];
      if (points) this.award(points);
      this.say({guard: 'guardDie', rat: 'rat', ropeRat: 'rat', bat: 'bat', mutant: 'mutant', eye: 'eye', broom: 'broom', henchman: 'henchman', dragon: 'dragon', gargoyle: 'gargoyle', wizard: 'wizard'}[e.type] || 'guardDie');
      if (e.type === 'dragon') { const hatch = this.entities.find(h => h.type === 'hatch'); if (hatch) hatch.open = true; }
      if (e.type === 'wizard') this.tell('The wizard is gone in a burst of flame.');
    }
    updateEntity(e) {
      e.frame = (e.frame || 0) + 1;
      if (e.hurt) e.hurt--;
      if (e.dying) { if (--e.dying <= 0) e.gone = true; return; }
      const fn = this['run_' + e.type];
      if (fn) fn.call(this, e);
      if (e.foes && overlap(this.heroBox(), e)) this.touch(e);
    }
    touch(e) {
      const cause = {rat: 'bite', ropeRat: 'bite', bat: 'bat', guard: e.whip ? 'whip' : 'guard', mutant: 'mutant', eye: 'fire', wizard: 'fire', dragon: 'fire', vulture: 'bat', broom: 'guard', gargoyle: 'throw'}[e.type] || 'guard';
      this.harm(cause);
    }
    patrol(e) {
      e.x += e.speed;
      if (e.x <= e.left) { e.x = e.left; e.speed = Math.abs(e.speed); e.turned = 8; }
      if (e.x >= e.right) { e.x = e.right; e.speed = -Math.abs(e.speed); e.turned = 8; }
      if (e.turned) e.turned--;
    }
    run_door(e) {
      if (e.open) { if (--e.open <= 0) e.frame = 0; }
      if (--e.timer > 0 || e.left_ <= 0) return;
      e.timer = 260 + Math.floor(this.random() * 200); e.left_--; e.open = 20; this.say('door');
      const x = e.x ? e.x - 8 : 24;
      this.entities.push(this.guard(x, e.spawnY - 7, Math.max(0, e.left), e.right, Math.abs(e.speed)));
    }
    run_guard(e) {
      this.patrol(e);
      if (e.whip && Math.abs(e.x - this.hero.x) < 70 && Math.abs(e.y - this.hero.y) < 30) {
        e.lash = (e.lash || 0) + 1;
        if (e.lash === 12) this.say('whip');
        if (e.lash === 18 && Math.abs(e.x - this.hero.x) < 62) this.harm('whip');
        if (e.lash > 34) e.lash = 0;
      } else e.lash = 0;
      if (this.tickCount % 50 === 0 && this.random() < .3) this.say('guard');
      // Guards loose an arrow along the floor when Saber stands in their line.
      if (!e.whip && this.tickCount % 90 === 0 && Math.abs(e.y + 6 - this.hero.y) < 12 && Math.abs(e.x - this.hero.x) > 70 && this.random() < .5) {
        const vx = this.hero.x > e.x ? 4 : -4;
        this.entities.push({type: 'arrow', x: e.x + 8, y: e.y + 20, vx, w: 16, h: 6, frame: 0, life: 90});
      }
    }
    run_arrow(e) {
      e.x += e.vx;
      if (--e.life <= 0) e.gone = true;
      if (overlap(this.heroBox(), e)) { e.gone = true; this.harm('guard'); }
    }
    run_rat(e) { this.patrol(e); if (this.tickCount % 60 === 0 && this.random() < .3) this.say('rat'); }
    run_ropeRat(e) { e.y += e.speed; if (e.y <= e.top) e.speed = 1.3; if (e.y >= e.bottom) e.speed = -1.3; }
    run_mutant(e) { this.patrol(e); if (this.tickCount % 80 === 0 && this.random() < .3) this.say('mutant'); }
    run_broom(e) { this.patrol(e); if (this.tickCount % 40 === 0 && this.random() < .4) this.say('broom'); }
    run_bat(e) {
      if (e.state === 'perch') {
        if (--e.timer <= 0 && Math.abs(e.x - this.hero.x) < 170) { e.state = 'fly'; e.t = 0; this.say('bat'); }
        return;
      }
      e.t++;
      const dx = this.hero.x + 8 - e.x;
      e.x += Math.sign(dx) * 1.9;
      e.y = Math.min(e.floor - 16, e.homeY + 70 * Math.abs(Math.sin(e.t * .05)) + (this.hero.y - e.homeY) * .35 * Math.min(1, e.t / 60));
      if (e.t > 190) { e.state = 'back'; }
      if (e.state === 'back') {
        e.x += Math.sign(e.homeX - e.x) * 2.4; e.y += Math.sign(e.homeY - e.y) * 2;
        if (Math.abs(e.x - e.homeX) < 4 && Math.abs(e.y - e.homeY) < 4) { e.state = 'perch'; e.timer = 110 + Math.floor(this.random() * 120); }
      }
    }
    run_vulture(e) {
      e.x += Math.sin(this.tickCount * .02 + e.homeY) * 1.6;
      e.y = e.homeY + Math.sin(this.tickCount * .05) * 14;
      if (++e.timer > 220) {
        e.timer = 0; this.say('vulture');
        this.entities.push({type: 'feather', x: e.x + 12, y: e.y + 16, w: 16, h: 16, frame: 0, vy: 1.6});
      }
    }
    run_feather(e) { e.y += e.vy; if (e.y > 290) e.gone = true; if (overlap(this.heroBox(), e)) { e.gone = true; this.harm('bite'); } }
    run_eye(e) {
      e.phase += .03;
      e.x += Math.sign(this.hero.x - e.x) * .7 + Math.sin(e.phase * 3) * .9; e.y += Math.sign(this.hero.y - e.y) * .5 + Math.cos(e.phase * 2.3) * .8;
      if (this.tickCount % 70 === 0 && this.random() < .4) this.say('eye');
    }
    run_gargoyle(e) {
      e.x += e.speed;
      if (e.x < 20 || e.x > e.right) e.speed = -e.speed;
      e.y = e.homeY + Math.sin(this.tickCount * .04 + e.homeY) * 34;
      if (this.tickCount % 90 === 0 && this.random() < .4) this.say('gargoyle');
    }
    run_fountain(e) { if (this.tickCount % 80 === 0 && Math.abs(this.hero.x - e.x) < 200) this.say('fountain'); }
    run_faces(e) { if (--e.timer <= 0) { e.timer = 40 + Math.floor(this.random() * 70); e.pose = Math.floor(this.random() * 3); } }
    run_henchman(e) {
      if (--e.timer > 0) return;
      e.timer = 80 + Math.floor(this.random() * 60); this.say('henchman');
      const toward = this.hero.x > e.x ? 1 : -1;
      this.entities.push({type: 'rock', x: e.x + 8, y: e.y + 8, vx: toward * 2.4, vy: -1.4, w: 16, h: 16, frame: 0});
    }
    run_rock(e) {
      e.vy += .22; e.x += e.vx; e.y += e.vy;
      if (overlap(this.heroBox(), e)) { e.gone = true; this.harm('crush'); }
      if (e.y > 304) { e.broken = 10; e.type = 'shards'; e.vy = 0; e.vx = 0; this.say('boulder'); }
    }
    run_shards(e) { if (--e.broken <= 0) e.gone = true; }
    run_weight(e) {
      if (!e.falling) {
        if (--e.timer <= 0 && Math.abs(this.hero.x + 8 - e.x) < 60) { e.falling = true; e.x = this.hero.x; e.y = -30; this.say('weight'); }
        return;
      }
      e.y += 6.5;
      if (overlap(this.heroBox(), e)) { e.gone = true; this.harm('weight'); return; }
      if (e.y > 300) { e.falling = false; e.timer = 200; e.y = -40; this.say('boulder'); }
    }
    run_boulder(e) {
      e.vy = Math.min(5, e.vy + .3); e.x += e.speed; e.y += e.vy;
      const seg = this.floorAt(e.x + 8, Math.round(e.y) + 16, true);
      if (seg && e.vy > 0) { e.y = seg.y - 16; e.vy = 0; }
      if (overlap(this.heroBox(), e)) { this.harm('crush'); e.x = e.startX; e.y = e.startY; }
      if (e.x < -30 || e.x > 530 || e.y > 320) { e.x = e.startX; e.y = e.startY; e.vy = 0; this.say('boulder'); }
    }
    run_drip(e) {
      if (e.state === 'wait') { if (--e.timer <= 0) { e.state = 'fall'; e.y = e.startY; this.say('drip'); } return; }
      if (e.state === 'splash') { if (--e.timer <= 0) { e.state = 'wait'; e.timer = 60 + Math.floor(this.random() * 100); e.y = 0; } return; }
      e.y += 4.2;
      if (overlap(this.heroBox(), e)) { e.state = 'splash'; e.timer = 12; this.harm('acid'); }
      else if (e.y >= e.floor) { e.state = 'splash'; e.timer = 12; }
    }
    run_storm(e) {
      if (e.live > 0) { e.live--; if (e.live === 10 && Math.abs(this.hero.x + 16 - e.x - 16) < 22 && this.hero.y < 250) this.harm('lightning'); return; }
      if (--e.timer <= 0) { e.timer = e.every; e.live = 16; e.x = Math.floor(40 + this.random() * 420); e.bolt = this.random() < .5 ? 'B705' : 'B706'; this.flash = 4; this.say('storm'); }
    }
    run_swingRope(e) {
      e.phase += .055; if (e.cool) e.cool--;
      if (this.hero.swing === e && this.tickCount % 46 === 0) this.say('swing');
    }
    run_dragon(e) {
      if (e.breath > 0) {
        e.breath--;
        const box = {x: e.x - 112, y: e.y + 4, w: 112, h: 44};
        if (overlap(this.heroBox(), box)) this.harm('fire');
        return;
      }
      if (--e.timer <= 0) { e.timer = 90 + Math.floor(this.random() * 40); e.breath = 28; this.say('dragon'); }
    }
    run_wizard(e) {
      if (--e.timer > 0) return;
      e.timer = 70 + Math.floor(this.random() * 40); this.say('wizard');
      const a = Math.atan2(this.hero.y - e.y, this.hero.x - e.x);
      this.entities.push({type: 'bolt', x: e.x, y: e.y + 10, vx: Math.cos(a) * 3.2, vy: Math.sin(a) * 3.2, w: 16, h: 16, frame: 0, life: 110});
    }
    run_bolt(e) {
      e.x += e.vx; e.y += e.vy;
      if (--e.life <= 0) e.gone = true;
      if (overlap(this.heroBox(), e)) { e.gone = true; this.harm('fire'); }
    }
    run_knight(e) {
      if (e.falling !== undefined) {
        e.y += 3; e.frame = 0;
        if (--e.falling <= 0) {
          e.gone = true; this.say('knight');
          const water = this.plan.WINGS.knight.scepter;
          this.entities.push({type: 'scepter', scepter: water, x: water.x, y: water.y, w: 24, h: 30, frame: 0});
        }
        return;
      }
      if (--e.timer > 0) return;
      e.timer = 62 + Math.floor(this.random() * 36); e.throwing = 16; this.say('knight');
      const a = Math.atan2(this.hero.y - e.y, this.hero.x - e.x);
      this.entities.push({type: 'mug', x: e.x + 12, y: e.y + 10, vx: Math.cos(a) * 3.6, vy: Math.sin(a) * 3.6, w: 16, h: 16, frame: 0, life: 110});
      this.say('mug');
    }
    run_mug(e) {
      e.x += e.vx; e.y += e.vy; e.vy += .03;
      if (--e.life <= 0 || e.y > 310) e.gone = true;
      if (overlap(this.heroBox(), e)) { e.gone = true; this.harm('mug'); }
    }
    run_platform(e) {
      const m = e.mover, seg = m.seg;
      seg.x0 += m.dx; seg.x1 += m.dx;
      if (this.hero.floor === seg) this.hero.x += m.dx;
      if ((m.dx > 0 && seg.x1 >= m.right + (m.x1 - m.x0)) || (m.dx < 0 && seg.x0 <= m.left)) m.dx = -m.dx;
      e.x = seg.x0;
    }
    run_gate(e) {
      if (!e.open && this.hero.y < e.y + e.h - 12 && this.hero.y > e.y - 30 && this.hero.x > e.x - 24 && this.hero.x < e.x + 2) this.hero.x = e.x - 24;
    }
    run_hatch(e) { if (e.open && !e.opened) { e.opened = true; this.say('hatch'); } }
    run_scepter(e) {
      if (!overlap(this.heroBox(), {x: e.x - 6, y: e.y - 6, w: e.w + 12, h: e.h + 12})) return;
      if (e.scepter.id === 'air') { const hatch = this.entities.find(h => h.type === 'hatch'); if (hatch && !hatch.open) return; }
      e.gone = true; this.powers.add(e.scepter.id); this.award(this.plan.RULES.power); this.say('pickup');
      this.tell('You have the ' + e.scepter.name + '.');
      this.events.push({type: 'scepter', id: e.scepter.id, name: e.scepter.name});
      this.mode = 'leaving'; this.leaving = 45;
    }

    /* Harm */
    harm(cause) {
      const hero = this.hero;
      if (this.mode !== 'room' || hero.safe > 0 || hero.shield > 0) return;
      if ((cause === 'bite' || cause === 'bat') && this.elixir > 0) {
        this.elixir--; hero.safe = 60; this.say('plague'); this.say('elixir');
        this.tell('Plague. The elixir holds it off.');
        return;
      }
      if (this.ward && cause !== 'fall') {
        hero.safe = 60; this.bonus = Math.max(0, this.bonus - 200); this.say('heroHit');
        this.tell('Elron’s ward takes the blow.');
        return;
      }
      this.say(cause === 'fall' ? 'fall' : 'heroHit');
      hero.state = 'dead'; hero.floor = hero.rope = hero.ladder = hero.swing = hero.stairs = null;
      this.mode = 'dying'; this.dying = {cause, t: 0};
    }
    tickDying() {
      this.dying.t++;
      if (this.dying.t === 12) this.say('heroDie');
      if (this.dying.t < 60) return;
      this.lives--;
      if (this.lives < 0) { this.mode = 'over'; this.events.push({type: 'over', score: this.score}); return; }
      this.enter(this.entry.id, this.entry.variant);
    }
    finish() {
      this.mode = 'won'; this.say('ending');
      this.events.push({type: 'won', score: this.score});
    }
  }
  root.CastleCore = CastleCore;
})();
