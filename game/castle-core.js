/* The Enchanted Castle: game rules. No browser code lives here, so tests can
   play it headlessly. One tick is 1/30 s. Coordinates are the disk's: a hero
   position is the top-left of his 32 by 40 frame, on a 512 by 342 screen. */
(() => {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const WALL = new Set([6, 27]), KILL = 29, LADDER_TOP = 2, LADDER_FOOT = 3, EXIT = 5, STAIR_TOP = 9, STAIR_FOOT = 10,
    MOVER = 14, STEP = 16, SWITCH = 23, PULL = 35, LEVER = 36, WIDE_ROPE = 40;
  // The hero code moves 8 pixels a walking update, 10 on a ladder, and falls 10 then 8 more each
  // update (CODE 2 $2bf6, $e1e, $149a, $14c2). Those numbers are the disk's. Its update rate is
  // not proven, so UPDATE is a judged pace: 2.5 of our ticks, or 12 updates a second.
  const UPDATE = 2.5, WALK = 8 / UPDATE, LADDER = 10 / UPDATE, FALL_START = 10 / UPDATE, FALL_STEP = 8 / UPDATE / UPDATE;
  // Rope climbs and rope leaps have not been traced, so these remain this edition's.
  // Modern control help, in ticks and pixels. None of it applies with classic controls.
  const JUMP_BUFFER = 6, LEDGE_GRACE = 5, REACH = 14, LANDING_HELP = 8, AIR_NUDGE = 28;
  // Kinds 38 and 39 are the ends of a ladder that joins two rooms (CODE 2 $8b0-$8e6).
  const LADDER_IN_TOP = 38, LADDER_IN_FOOT = 39;
  // The arm runs from 0 straight up through 300 level to 511 steeply down. The mouse sets it and
  // it divides the rock's speed (CODE 2 $2d5a, $3528). Holding the button throws every six
  // updates, and the arm stays up for 25 (CODE 2 $3434-$3466).
  const ARM_LEVEL = 300, ARM_HOLD = 25 * UPDATE, HELD_THROW = 6 * UPDATE, ROCK_GRAVITY = 0xd555 / 65536 / UPDATE / UPDATE;
  const ROPE_CLIMB = 2.1, ROPE_LEAP = 3.7, ROPE_GRAVITY = .62, FALL_LIMIT = 18, HARD_LANDING = 90, HERO_W = 32, HERO_H = 40;
  const random = seed => () => {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const DEMO_CONTROLS = ['x', 'y', 'jump', 'fire', 'action', 'duck'];
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
    // `modern` keeps the disk's physics and adds today's control help. False is the 1986 feel.
    constructor({data, plan, difficulty = 0, ward = false, seed = 1986, demo = false, rooms = null, modern = true}) {
      Object.assign(this, {data, plan, difficulty, ward, demo, modern});
      this.random = random(seed);
      this.rooms = rooms || new Map(data.order.map(id => [id, buildRoom(id, data.rooms[id])]));
      this.events = [];
      this.score = 0; this.rocks = plan.RULES.startRocks; this.lives = plan.RULES.lives; this.elixir = 3;
      this.nextMan = plan.RULES.extraMan[difficulty]; this.powers = new Set(); this.visited = new Set();
      this.seen = new Set(); // Reels and sounds met in play, for the coverage record
      this.mode = 'hall'; this.tickCount = 0; this.door = 0; this.bonus = 0; this.room = null; this.entities = []; this.shots = [];
      this.hero = this.freshHero(); this.flash = 0; this.pullsDone = new Set();
      this.cooldown = 0; this.lastJump = false; this.lastAction = false; this.lastUp = false; this.lastSide = 0;
      this.say('hall');
    }
    freshHero() {
      return {x: 240, y: 0, vx: 0, vy: 0, face: 1, state: 'stand', frame: 0, floor: null, ladder: null, stairs: null, rope: null,
        swing: null, shield: 0, safe: 0, drop: 0, arm: ARM_LEVEL, armUntil: 0, hurt: null};
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
      hero.x = (start.x0 + start.x1) / 2; hero.y = start.y; hero.shield = this.hero.shield; hero.arm = this.hero.arm;
      this.hero = hero;
      const here = this.floorAt(hero.x, hero.y, true);
      const door = here?.spans.find(s => (s.kind === LADDER_IN_TOP || s.kind === LADDER_IN_FOOT) && hero.x >= s.x0 && hero.x <= s.x1);
      if (door) this.arriveByLadder(door);
      else if (here) { hero.floor = here; hero.y = here.y; hero.state = 'stand'; hero.x = Math.max(here.x0, Math.min(here.x1, hero.x)); }
      else hero.state = 'air';
      this.bonus = this.plan.RULES.bonus[this.difficulty];
      this.spawn(room); this.shots = [];
    }
    // A ladder that joins two rooms carries Duncan on to the floor with no key held.
    arriveByLadder(door) {
      const up = door.kind === LADDER_IN_FOOT, other = this.room.byAt.get(up ? door.a : door.b);
      this.onLadder(up ? door : other, up ? other : door, up ? -1 : 1);
      this.hero.ladder.auto = up ? -1 : 1;
    }
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
        if ((input.jump && !this.lastJump) || (input.action && !this.lastAction) || (input.up && !this.lastUp)) this.runDoor();
      } else if (this.mode === 'run') this.tickRun();
      else if (this.mode === 'room') this.tickRoom(input);
      else if (this.mode === 'dying') this.tickDying();
      else if (this.mode === 'leaving' && --this.leaving <= 0) this.enterHall();
      this.lastJump = !!input.jump; this.lastAction = !!input.action; this.lastUp = !!input.up;
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
      if (hero.stun > 0) { hero.stun--; return; }
      this.aimArm(input);
      if (input.fire && this.tickCount >= (hero.nextThrow || 0) && this.throwRock(input)) hero.nextThrow = this.tickCount + HELD_THROW;
      if (input.action && !this.lastAction && this.tryAction()) { /* handled */ }
      else if (input.action && !this.lastAction && this.powers.has('air')) { hero.shield = this.plan.RULES.shieldTicks; this.say('heroHit'); }
      const jump = input.jump && !this.lastJump;
      if (jump) hero.jumpAsked = this.tickCount;
      switch (hero.state) {
        case 'stand': case 'walk': case 'duck': this.updateGround(input, jump); break;
        case 'air': this.updateAir(input, jump); break;
        case 'ladder': this.updateLadder(input); break;
        case 'stairs': this.updateStairs(input); break;
        case 'rope': this.updateRope(input, jump); break;
        case 'swing': this.updateSwing(input, jump); break;
      }
    }
    updateGround(input, jump) {
      const hero = this.hero, seg = hero.floor;
      const side = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const duck = () => { if (hero.state !== 'duck') this.say('duck'); hero.state = 'duck'; };
      if (input.duck && !this.modern) { duck(); return; }
      const span = seg.spans.find(s => hero.x >= s.x0 - 1 && hero.x <= s.x1 + 1) || seg.spans[0];
      const wantJump = jump || (this.modern && this.tickCount - (hero.jumpAsked ?? -99) <= JUMP_BUFFER);
      // Modern controls find a ladder or stair that is nearly under Duncan's feet.
      const reach = this.modern ? REACH : 1;
      const near = kinds => seg.spans.find(s => kinds.includes(s.kind) && hero.x >= s.x0 - reach && hero.x <= s.x1 + reach);
      if (input.up) { const at = near([LADDER_FOOT, STAIR_FOOT, STEP]); if (at && this.tryUp(at)) return; }
      if (input.down && !wantJump) { const at = near([LADDER_TOP, STAIR_TOP, STEP]); if (at && this.tryDown(at)) return; }
      if (wantJump) { this.startJump(input, side); return; }
      // Down with nothing to climb is a duck, so Down never does nothing.
      if (input.duck || (this.modern && input.down)) { duck(); return; }
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
    startJump(input, side) {
      // The disk picks one of three tables: moving, standing, or holding down.
      const hero = this.hero, kind = side ? 'running' : input.down ? 'downward' : 'standing';
      hero.state = 'air'; hero.floor = null; hero.vx = hero.vy = 0; hero.peak = hero.y; hero.jumpAsked = undefined; hero.ledgeAt = undefined;
      hero.arc = {kind, rows: this.data.jumps[kind], t: 0, x: hero.x, y: hero.y, nudge: 0}; this.say('jump');
      if (side) hero.face = side;
    }
    leaveLedge(x) {
      const hero = this.hero;
      hero.ledgeAt = this.tickCount;
      hero.x = x; hero.state = 'air'; hero.floor = null; hero.vy = FALL_START; hero.vx = hero.face * 1.4; hero.drop = 4; hero.peak = hero.y;
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
      hero.y += direction * LADDER;
    }
    updateLadder(input) {
      const hero = this.hero, l = hero.ladder;
      const go = l.auto || (input.down ? 1 : 0) - (input.up ? 1 : 0);
      if (!go) return;
      hero.y += go * LADDER;
      if (this.tickCount % 9 === 0) this.say('ladder');
      if (hero.y <= l.top) this.ladderEnd(l.topSpan, l.x);
      else if (hero.y >= l.bottom) this.ladderEnd(l.foot, l.x);
    }
    // Reaching the far end of a joining ladder leaves by the exit record that follows it.
    ladderEnd(span, x) {
      if (span.kind === LADDER_IN_TOP || span.kind === LADDER_IN_FOOT) {
        const exit = this.room.byAt.get(span.at + 18);
        this.leaveRoom(exit.a, exit.b);
      } else this.landOn(span.y, x);
    }
    landOn(y, x) {
      const hero = this.hero;
      hero.y = y; hero.x = x; hero.vx = hero.vy = 0; hero.ladder = hero.stairs = hero.rope = null; hero.arc = null; hero.light = false; hero.peak = null;
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
          hero.state = 'rope'; hero.rope = rope; hero.x = (rope.x0 + rope.x1) / 2; hero.vx = hero.vy = 0; hero.arc = null; hero.light = false; this.say('rope');
          return true;
        }
      }
      return false;
    }
    updateRope(input, jump) {
      const hero = this.hero, rope = hero.rope;
      const go = (input.down ? 1 : 0) - (input.up ? 1 : 0), side = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (go) {
        hero.y = Math.max(rope.top, Math.min(rope.bottom, hero.y + go * ROPE_CLIMB));
        if (this.tickCount % 8 === 0) this.say('climb');
      }
      if (jump) {
        hero.state = 'air'; hero.rope = null; hero.vy = side ? -4.6 : 0; hero.vx = side * ROPE_LEAP; hero.drop = 10; hero.releaseAt = this.tickCount; hero.light = true; hero.peak = hero.y;
        if (side) hero.face = side;
        this.say('jump');
      }
    }
    updateSwing(input, jump) {
      const hero = this.hero, rope = hero.swing, tip = this.swingTip(rope);
      hero.x = tip.x - 24; hero.y = tip.y - 8;
      hero.face = Math.cos(rope.phase) > 0 ? 1 : -1;
      if (jump) {
        hero.state = 'air'; hero.swing = null; rope.cool = 30; hero.vx = Math.cos(rope.phase) * 4.2; hero.vy = -3; hero.light = true; hero.peak = hero.y; this.say('jump');
        if (input.right) hero.vx = Math.abs(hero.vx) + 1; if (input.left) hero.vx = -Math.abs(hero.vx) - 1;
      }
    }
    swingTip(e) {
      const angle = Math.sin(e.phase) * .78;
      return {x: e.x + Math.sin(angle) * 92, y: e.y + Math.cos(angle) * 92 + 10};
    }
    updateAir(input, jump) {
      const hero = this.hero, before = hero.y, startX = hero.x;
      const side = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (this.modern && jump && !hero.arc && this.tickCount - (hero.ledgeAt ?? -99) <= LEDGE_GRACE) { this.startJump(input, side); return; }
      if (hero.arc) {
        // A jump is a fixed path on the disk. Positions come from the table itself, so rows
        // are never stretched by rounding to our ticks.
        const arc = hero.arc;
        arc.t = Math.min(arc.rows.length, arc.t + 1 / UPDATE);
        const whole = Math.floor(arc.t), part = arc.t - whole;
        let along = 0, rise = 0;
        arc.rows.forEach((row, i) => { const share = i < whole ? 1 : i === whole ? part : 0; along += row[0] * share; rise += row[1] * share; });
        // Modern controls let Duncan lean a jump left or right. The disk's arc stays the base path.
        if (this.modern && side) arc.nudge = Math.max(-AIR_NUDGE, Math.min(AIR_NUDGE, arc.nudge + side * 1.2));
        hero.vy = arc.y + rise - hero.y;
        hero.y = arc.y + rise; hero.x = Math.max(-4, Math.min(482, arc.x + hero.face * along + arc.nudge));
        if (arc.t >= arc.rows.length) { hero.arc = null; hero.vx = 0; hero.vy = FALL_START; }
      } else if (hero.light) {
        if (side) { hero.vx = Math.max(-ROPE_LEAP, Math.min(ROPE_LEAP, hero.vx + side * .34)); hero.face = side; }
        hero.vy = Math.min(9, hero.vy + ROPE_GRAVITY);
        hero.y += hero.vy; hero.x = Math.max(-4, Math.min(482, hero.x + hero.vx));
      } else {
        hero.vy = Math.min(FALL_LIMIT, hero.vy + FALL_STEP);
        hero.y += hero.vy; hero.x = Math.max(-4, Math.min(482, hero.x + hero.vx));
      }
      hero.peak = Math.min(hero.peak ?? hero.y, hero.y);
      if (hero.drop > 0) hero.drop--;
      if (!(hero.releaseAt && this.tickCount - hero.releaseAt < 10) && this.grabRope()) return;
      for (const e of this.entities) {
        if (e.type === 'swingRope' && !e.cool && !hero.swing) {
          const tip = this.swingTip(e);
          if (Math.abs(tip.x - (hero.x + 16)) < 22 && Math.abs(tip.y - hero.y) < 30) {
            hero.state = 'swing'; hero.swing = e; hero.arc = null; hero.light = false; this.say('swing'); return;
          }
        }
      }
      if (hero.vy >= 0 && !hero.drop) {
        for (const floor of this.room.floors) {
          if (floor.y < before - .5 || floor.y > hero.y) continue;
          // Sweep the whole step, as the disk does. Wall ledges are single points set exactly
          // where the standing jump comes down (CODE 2 $12a0-$1392).
          const margin = this.modern ? LANDING_HELP : 3, low = Math.min(startX, hero.x) - margin, high = Math.max(startX, hero.x) + margin;
          const seg = floor.segments.find(s => s.x1 >= low && s.x0 <= high);
          if (seg) {
            const exit = seg.spans.find(s => s.kind === EXIT && s.x1 >= low && s.x0 <= high && s.x1 - s.x0 > 40);
            if (exit) { this.leaveRoom(exit.a, exit.b); return; }
            const fell = floor.y - (hero.peak ?? floor.y) >= HARD_LANDING;
            hero.y = floor.y; hero.vy = hero.vx = 0; hero.floor = seg; hero.state = 'stand'; hero.arc = null; hero.light = false; hero.peak = null;
            hero.x = Math.max(seg.x0, Math.min(seg.x1, hero.x)); this.say('land');
            hero.settled = this.tickCount;
            // The long fall: flat on the floor for 24 updates (CODE 2 table $172e).
            if (fell) { hero.safe = 8; hero.landed = this.tickCount; hero.stun = 24 * UPDATE; this.say('splat'); }
            return;
          }
        }
      }
      const pit = this.room.kills.find(y => hero.y >= y);
      if (pit !== undefined || hero.y > 300) this.harm('fall');
    }
    tryAction() {
      const hero = this.hero;
      // The prompt and the key agree on how close is close enough.
      const reach = this.modern ? REACH : 2, within = s => hero.x >= s.x0 - reach && hero.x <= s.x1 + reach;
      for (const pull of this.room.pulls) {
        if (hero.floor && hero.floor.y === pull.y && within(pull)) {
          hero.pullAt = this.tickCount; hero.stun = 15 * UPDATE; this.pull(pull); return true;
        }
      }
      const here = hero.floor?.spans.find(s => within(s) && (s.kind === SWITCH || s.kind === LEVER)) || hero.floor?.spans.find(s => hero.x >= s.x0 - 2 && hero.x <= s.x1 + 2);
      if (here?.kind === SWITCH) {
        const hatch = this.entities.find(e => e.type === 'hatch');
        hero.pullAt = this.tickCount; hero.stun = 15 * UPDATE;
        if (hatch && !hatch.open) { hatch.open = true; hatch.t = 0; this.say('hatch'); }
        return true;
      }
      if (here?.kind === LEVER) {
        const lever = this.entities.find(e => e.type === 'lever' && (e.x < 240) === (hero.x < 240));
        hero.leverAt = this.tickCount; hero.stun = 10 * UPDATE; this.say('lever');
        if (lever) lever.pulled = !lever.pulled;
        return true;
      }
      const box = this.heroBox();
      for (const e of this.entities) {
        if (e.type === 'item' && overlap(box, {x: e.x - 8, y: e.y - 8, w: e.w + 16, h: e.h + 16})) {
          this.take(e); return true;
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
        this.throne.shaken++; this.throne.rocked = this.tickCount; this.say('throne');
        this.tell('The throne rocks on its footing.');
        if (this.throne.shaken >= this.room.pulls.length) this.toppleThrone();
      }
    }
    toppleThrone() {
      this.throne.down = true; this.award(this.plan.RULES.throne); this.say('throne');
      for (const e of this.entities) if (e.type === 'knight') { e.falling = 60; }
      this.tell('The Black Knight falls.');
    }
    aimArm(input) {
      const hero = this.hero, arm = input.arm ?? (input.aimAt ? this.armToward(input.aimAt) : null);
      if (arm === null || arm === hero.arm) return;
      hero.arm = arm; hero.armUntil = this.tickCount + ARM_HOLD;
    }
    // The arm position that sends a rock at a point. Gravity's small drop is left out.
    armToward(point) {
      const dx = Math.abs(point.x - this.hero.x - 16), dy = point.y - this.hero.y - 12;
      return Math.round(Math.min(511, ARM_LEVEL + ARM_LEVEL * dy / ((dx + Math.abs(dy)) || 1)));
    }
    throwRock(input) {
      const hero = this.hero;
      // The disk draws the arm only for Duncan standing still (CODE 2 $d28, $d6c). Modern controls
      // let him throw from any footing, at the pointer or at the nearest foe.
      if (!(this.modern ? ['stand', 'walk', 'air', 'duck'] : ['stand']).includes(hero.state)) return false;
      if (this.rocks <= 0) { this.tell('You are out of rocks.'); return true; }
      this.rocks--;
      if (this.modern) {
        const foe = input.aimAt ? null : this.nearestFoe();
        const point = input.aimAt || (foe && {x: foe.x + foe.w / 2, y: foe.y + foe.h / 2});
        hero.arm = point ? this.armToward(point) : ARM_LEVEL;
        if (point) hero.face = point.x >= hero.x + 16 ? 1 : -1;
      }
      // The hand's place and the rock's speed, from CODE 2 $35a2 and $3512-$354c. Rocks and
      // fireballs fly the same path.
      const fire = this.powers.has('fire'), arm = hero.arm, low = arm >= 256, left = hero.face < 0;
      const across = (arm < ARM_LEVEL ? arm : 2 * ARM_LEVEL - arm) / 8 / UPDATE;
      this.shots.push({x: hero.x + (left ? (low ? 14 : 13) : (low ? 7 : 4)), y: hero.y + (low ? 13 : -3),
        vx: hero.face * across, vy: (arm - ARM_LEVEL) / 8 / UPDATE, w: 8, h: 8, fire, frame: 0, life: 60});
      hero.throwAt = this.tickCount; hero.armUntil = this.tickCount + ARM_HOLD; this.say(fire ? 'fireball' : 'throwRock');
      return true;
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
        shot.vy += ROCK_GRAVITY; shot.x += shot.vx; shot.y += shot.vy; shot.frame++; shot.life--;
        for (const e of this.entities) {
          if (!e.foes || e.dying || !overlap({x: shot.x, y: shot.y, w: 8, h: 8}, e)) continue;
          shot.life = 0; this.say('rockHit');
          if (e.type === 'gargoyle' && !shot.fire) { this.tell('Rocks bounce off the gargoyle.'); break; }
          this.strike(e, shot.fire ? 2 : 1);
          break;
        }
        // The disk's bounds for a rock (CODE 2 $337e-$339c).
        if (shot.x <= 4 || shot.x >= 504 || shot.y <= 4 || shot.y >= 334) shot.life = 0;
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
      const {steps, release} = this.plan.HENCHMAN;
      if (--e.timer > 0) return;
      e.step = (e.step || 0) + 1 / UPDATE;
      if (e.step >= release && !e.thrown) {
        e.thrown = true; this.say('henchman');
        const toward = this.hero.x > e.x ? 1 : -1;
        this.entities.push({type: 'rock', x: e.x + 8, y: e.y + 8, vx: toward * 2.4, vy: -1.4, w: 16, h: 16, frame: 0});
      }
      if (e.step >= steps) { e.step = 0; e.thrown = false; e.timer = 50 + Math.floor(this.random() * 60); }
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
    run_item(e) {
      // Modern controls collect by walking over. Classic play uses the action key.
      if (this.modern && !(e.item === 'bag' && this.rocks >= this.plan.RULES.rockCap) && overlap(this.heroBox(), e)) this.take(e);
    }
    // What the action or climb keys would do here, for the on-screen prompt.
    prompt() {
      const hero = this.hero;
      if (this.mode === 'hall') return ['hall', 'Left or Right picks a door. Space goes in.'];
      if (this.mode !== 'room') return null;
      if (hero.state === 'rope') return ['climb', 'Climb. Jump with a direction to leap.'];
      if (hero.state === 'swing') return ['jump', 'Jump to let go'];
      if (!hero.floor) return null;
      const near = kind => hero.floor.spans.find(s => s.kind === kind && hero.x >= s.x0 - (this.modern ? REACH : 1) && hero.x <= s.x1 + (this.modern ? REACH : 1));
      if (near(PULL) && !this.pullsDone.has(near(PULL).at)) return ['action', 'Pull the chain'];
      if (near(SWITCH)) return ['action', 'Press the switch'];
      if (near(LEVER)) return ['action', 'Work the lever'];
      if (near(LADDER_FOOT) || near(STAIR_FOOT)) return ['up', 'Climb up'];
      if (near(LADDER_TOP) || near(STAIR_TOP)) return ['down', 'Climb down'];
      const box = this.heroBox(), item = this.entities.find(e => e.type === 'item' && overlap(box, {x: e.x - 8, y: e.y - 8, w: e.w + 16, h: e.h + 16}));
      return item && !this.modern ? ['action', 'Pick it up'] : null;
    }
    run_gate(e) {
      if (!e.open && this.hero.y < e.y + e.h - 12 && this.hero.y > e.y - 30 && this.hero.x > e.x - 24 && this.hero.x < e.x + 2) this.hero.x = e.x - 24;
    }
    run_hatch(e) { if (e.open && (e.t += 1 / UPDATE) >= 24) { e.open = false; e.t = 0; } }
    run_scepter(e) {
      if (!overlap(this.heroBox(), {x: e.x - 6, y: e.y - 6, w: e.w + 12, h: e.h + 12})) return;
      e.gone = true; this.claim(e.scepter);
    }
    claim(scepter) {
      this.powers.add(scepter.id); this.award(this.plan.RULES.power); this.say('pickup');
      this.tell('You have the ' + scepter.name + '.');
      this.events.push({type: 'scepter', id: scepter.id, name: scepter.name});
      this.mode = 'leaving'; this.leaving = 75; this.reward = {id: scepter.id, name: scepter.name, at: this.tickCount};
    }

    /* The Demo button replays the input recorded on the disk, one 1986 update at a time. */
    startDemo() {
      this.script = {at: 0, wait: null, clock: 0, done: false, held: {}};
      this.enter(this.plan.WINGS.trouble.first, 0);
    }
    demoInput() {
      const s = this.script, list = this.data.demo;
      s.clock += 1 / UPDATE;
      while (s.clock >= 1) {
        s.clock -= 1;
        if (s.wait === null && s.at < list.length) s.wait = list[s.at][0];
        if (s.wait > 0) { s.wait--; continue; }
        while (s.at < list.length && (s.wait === null || s.wait === 0)) {
          const [wait, control, value] = list[s.at];
          if (s.wait === null && wait > 0) { s.wait = wait; break; }
          this.applyDemo(s.held, DEMO_CONTROLS[control], value);
          s.at++; s.wait = null;
        }
        if (s.at >= list.length) s.done = true;
      }
      const h = s.held;
      return {left: h.x < 0, right: h.x > 0, up: h.y < 0, down: h.y > 0, jump: h.jump, action: h.action, duck: h.duck, fire: !!h.fire,
        arm: h.fire ? Math.min(511, h.fire) : null};
    }
    applyDemo(held, control, value) { held[control] = value; }

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
