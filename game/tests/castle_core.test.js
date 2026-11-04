const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..', '..');
function boot() {
  const context = {};
  context.window = context;
  vm.createContext(context);
  for (const file of ['art/castle-index.js', 'archive/dc/castle-data.js', 'game/castle-plan.js', 'game/castle-core.js'])
    vm.runInContext(readFileSync(path.join(root, file), 'utf8'), context);
  return context;
}
// Rule tests run with classic controls, so they measure the disk's physics alone.
const make = (opts = {}) => {
  const c = boot();
  return new c.CastleCore({data: c.CASTLE_DATA, plan: c.CastlePlan, modern: false, ...opts});
};
const quiet = core => { core.entities = []; core.say = () => {}; return core; };

test('every Dark Castle reel and sound on the disk has a place in the plan', () => {
  const c = boot();
  const onDisk = c.CastleGraphics.filter(a => a.type === 'PPCT').map(a => a.fork.slice(-1) + a.id);
  const planned = new Set(Object.values(c.CastlePlan.REELS).flat());
  assert.equal(onDisk.length, 172);
  assert.equal(onDisk.filter(id => !planned.has(id)).length, 0);
  assert.equal([...planned].filter(id => !onDisk.includes(id)).length, 0);
  const bank = new Set(readFileSync(path.join(root, 'audio/dark-castle-bank.js'), 'utf8').match(/"(\d+)":"/g).map(s => +s.slice(1, -3)));
  const sounds = new Set(Object.values(c.CastlePlan.SOUNDS).flat());
  assert.equal(bank.size, 72);
  assert.equal([...bank].filter(id => !sounds.has(id)).length, 0);
  assert.equal([...sounds].filter(id => !bank.has(id)).length, 0);
});

test('the fourteen rooms decode cleanly and join the way the disk says', () => {
  const core = make();
  assert.equal(core.rooms.size, 14);
  for (const room of core.rooms.values()) {
    assert.ok(room.floors.length > 0, 'floors in ' + room.id);
    assert.ok(room.entries.length === 2);
  }
  const exits = id => core.rooms.get(id).floors.flatMap(f => f.segments.flatMap(s => s.spans)).filter(s => s.kind === 5).map(s => s.a);
  assert.equal(exits(1000).join(), '1');
  assert.equal([...exits(2000)].sort().join(), '-1,4');
  assert.ok(exits(3000).includes(8));
  assert.ok(exits(4010).includes(13));
});

test('a walk reaches the end of the floor and a wall stops it', () => {
  const core = quiet(make());
  core.enter(3000, 0); quiet(core);
  assert.equal(core.hero.floor.y, 264);
  for (let i = 0; i < 200; i++) core.tick({right: true});
  assert.ok(core.hero.x >= 440, 'walked to ' + core.hero.x);
  assert.equal(core.hero.state === 'walk' || core.hero.state === 'stand', true);
  assert.equal(core.hero.y, 264);
});

test('stairs and ladders run between the floors the disk links', () => {
  const core = quiet(make());
  core.enter(1000, 0); quiet(core);
  const top = core.room.floors.find(f => f.y === 54).segments[0].spans.find(s => s.kind === 9);
  core.hero.x = (top.x0 + top.x1) / 2;
  for (let i = 0; i < 120 && core.hero.y !== 114; i++) core.tick({down: true});
  assert.equal(core.hero.y, 114);
  core.enter(3000, 0); quiet(core);
  const foot = core.room.floors.find(f => f.y === 264).segments.flatMap(s => s.spans).find(s => s.kind === 3);
  core.hero.x = (foot.x0 + foot.x1) / 2;
  for (let i = 0; i < 80 && core.hero.y !== 202; i++) core.tick({up: true});
  assert.equal(core.hero.y, 202);
  assert.equal(core.hero.state, 'stand');
});

test('standing, running and downward jumps follow the manual card', () => {
  const core = quiet(make());
  core.enter(3000, 0); quiet(core);
  core.hero.x = 200;
  core.tick({}); core.tick({jump: true});
  let top = core.hero.y;
  for (let i = 0; i < 40 && core.hero.state === 'air'; i++) { core.tick({}); top = Math.min(top, core.hero.y); }
  assert.ok(264 - top >= 40, 'standing jump height ' + (264 - top));
  assert.ok(Math.abs(core.hero.x - 266) < 8, 'a standing jump leaps forward ' + core.hero.x);
  assert.equal(core.hero.y, 264);
  core.hero.x = 200;
  core.tick({}); core.tick({right: true, jump: true});
  top = core.hero.y;
  for (let i = 0; i < 40 && core.hero.state === 'air'; i++) { core.tick({right: true}); top = Math.min(top, core.hero.y); }
  assert.ok(Math.abs(core.hero.x - 310) < 10, 'running jump distance ' + (core.hero.x - 200));
  assert.ok(264 - top <= 26, 'running jump stays low ' + (264 - top));
  core.enter(3000, 0); quiet(core);
  core.landOn(29, 216); core.hero.face = 1;
  core.tick({}); core.tick({down: true, jump: true});
  for (let i = 0; i < 80 && core.hero.state === 'air'; i++) core.tick({});
  assert.equal(core.hero.y, 82, 'a downward jump off a ledge lands on the floor below');
});

test('the three jumps are the disk\u2019s tables', () => {
  const {jumps} = make().data;
  const across = rows => rows.reduce((sum, row) => sum + row[0], 0);
  const lowest = rows => { let y = 0, top = 0; for (const row of rows) { y += row[1]; top = Math.min(top, y); } return top; };
  assert.equal(across(jumps.running), 110);
  assert.equal(lowest(jumps.running), -23);
  assert.equal(across(jumps.standing), 66);
  assert.equal(lowest(jumps.standing), -44);
  assert.equal(across(jumps.downward), 65);
  assert.equal(lowest(jumps.downward), -14);
  assert.equal(jumps.running.length, 7);
  assert.equal(jumps.standing.length, 9);
  assert.equal(jumps.downward.length, 8);
});

test('a jump catches a rope, and climbing stops at the disk limits', () => {
  const core = quiet(make());
  core.enter(1000, 0); quiet(core);
  const rope = core.room.ropes[0];
  assert.ok(core.room.ropes.length >= 3);
  core.hero.state = 'air'; core.hero.floor = null; core.hero.x = (rope.x0 + rope.x1) / 2; core.hero.y = rope.bottom - 40; core.hero.vy = 0; core.hero.vx = 0;
  core.tick({});
  assert.equal(core.hero.state, 'rope');
  for (let i = 0; i < 300; i++) core.tick({up: true});
  assert.equal(core.hero.y, rope.top);
});

test('rats bite, elixir holds the plague off, and then a life goes', () => {
  const core = quiet(make());
  core.enter(3000, 0); quiet(core);
  core.elixir = 1;
  core.harm('bite');
  assert.equal(core.elixir, 0);
  assert.equal(core.mode, 'room');
  core.hero.safe = 0;
  core.harm('bite');
  assert.equal(core.mode, 'dying');
  const lives = core.lives;
  for (let i = 0; i < 80; i++) core.tick({});
  assert.equal(core.lives, lives - 1);
  assert.equal(core.mode, 'room');
});

test('Elron’s ward lets anyone finish without dying from a blow', () => {
  const core = quiet(make({ward: true}));
  core.enter(3000, 0); quiet(core);
  core.harm('guard');
  assert.equal(core.mode, 'room');
  assert.ok(core.bonus < 2000);
});

test('rocks start at sixty and a full pack refuses a bag', () => {
  const core = quiet(make());
  assert.equal(core.rocks, 60);
  core.enter(1020, 0); quiet(core);
  core.rocks = 80;
  const bag = {type: 'item', item: 'bag', x: 0, y: 0, w: 18, h: 18};
  core.take(bag);
  assert.equal(core.rocks, 80);
  assert.equal(bag.gone, false);
  core.rocks = 70;
  core.take(bag);
  assert.equal(core.rocks, 80);
});

test('the Black Knight door waits for three scepters, and four win the castle', () => {
  const core = quiet(make());
  core.door = 2;
  assert.equal(core.runDoor(), false);
  for (const p of ['earth', 'fire', 'air']) core.powers.add(p);
  assert.equal(core.runDoor(), true);
  core.powers.add('water');
  core.enterHall();
  assert.equal(core.mode, 'won');
});

test('pulling every chain topples the throne and drops the Water Scepter', () => {
  const core = make();
  core.enter(4020, 0);
  core.entities = core.entities.filter(e => e.type === 'throne' || e.type === 'knight');
  for (const pull of core.room.pulls) core.pull(pull);
  assert.equal(core.throne.down, true);
  for (let i = 0; i < 90; i++) { core.hero.safe = 9; core.tick({}); }
  assert.ok(core.powers.has('water') || core.entities.some(e => e.type === 'scepter' && e.scepter.id === 'water'));
});

test('taking a scepter carries Saber home to the Great Hall', () => {
  const core = make();
  core.say = () => {};
  core.enter(1020, 1);
  core.entities = core.entities.filter(e => e.type === 'scepter');
  const scepter = core.entities[0];
  assert.equal(scepter.scepter.id, 'earth');
  core.hero.x = scepter.x; core.hero.y = scepter.y - 10; core.hero.floor = null; core.hero.state = 'rope'; core.hero.rope = {top: 0, bottom: 300};
  const points = core.score;
  const events = core.tick({});
  assert.ok(events.some(e => e.type === 'scepter' && e.id === 'earth'));
  assert.equal(core.score, points + 1000 + 0);
  for (let i = 0; i < 90; i++) core.tick({});
  assert.equal(core.mode, 'hall');
  assert.ok(core.powers.has('earth'));
  core.door = 0;
  assert.equal(core.runDoor(), false, 'the wing has given up its scepter');
});

test('a fall into a killing floor costs a life and returns to the room entry', () => {
  const core = quiet(make());
  core.enter(3000, 0); quiet(core);
  const {x, y} = core.hero, lives = core.lives;
  core.hero.state = 'air'; core.hero.floor = null; core.hero.y = 285; core.hero.vy = 6; core.hero.x = 200;
  for (let i = 0; i < 90; i++) core.tick({});
  assert.equal(core.lives, lives - 1);
  assert.equal(Math.round(core.hero.x), Math.round(x));
  assert.equal(core.hero.y, y);
});

test('the Demo replays the disk\u2019s recorded input to its end', () => {
  const core = make({demo: true});
  core.say = () => {};
  core.startDemo();
  assert.equal(core.room.id, 1000);
  const x = core.hero.x;
  for (let t = 0; t < 30; t++) core.tick(core.demoInput());
  assert.ok(core.hero.x > x, 'the recording opens by walking right');
  core.lives = 1e6; core.ward = true;
  let throws = 0;
  for (let t = 0; t < 30000 && !core.script.done; t++) {
    const input = core.demoInput();
    if (input.fire) throws++;
    core.tick(input);
    if (core.mode === 'over' || core.mode === 'won') break;
  }
  assert.ok(core.script.done, 'stream consumed at ' + core.script.at);
  assert.ok(throws > 0);
});

test('the Air Scepter waits where the disk grants the Shield', () => {
  const c = make(), air = c.plan.WINGS.shield.scepter;
  assert.equal(air.room, 3030);
  const spot = c.rooms.get(3030).floors.find(f => f.y === 51).segments.flatMap(s => s.spans).find(s => s.kind === 25);
  assert.ok(air.x >= spot.x0 - 8 && air.x <= spot.x1 + 8);
});

test('a standing jump climbs the single-point ledges in the Shield room', () => {
  const core = quiet(make());
  core.enter(3030, 0); quiet(core);
  core.landOn(232, 72); core.hero.face = 1;
  core.tick({}); core.tick({jump: true});
  for (let i = 0; i < 40 && core.hero.state === 'air'; i++) core.tick({});
  assert.equal(core.hero.y, 211);
  assert.equal(core.hero.x, 128);
});

test('modern controls forgive a late or early jump press', () => {
  const core = quiet(make({modern: true}));
  core.enter(3000, 0); quiet(core);
  core.hero.x = 200;
  core.tick({}); core.tick({jump: true}); core.tick({});
  for (let i = 0; i < 40 && core.hero.vy <= 0; i++) core.tick({});
  for (let i = 0; i < 40 && core.hero.y < 258; i++) core.tick({});
  assert.equal(core.hero.state, 'air');
  core.tick({jump: true});
  for (let i = 0; i < 20 && core.hero.state === 'air'; i++) core.tick({});
  core.tick({});
  assert.equal(core.hero.state, 'air', 'a press just before landing jumps again');
  const late = quiet(make({modern: true}));
  late.enter(3000, 0); quiet(late);
  late.landOn(29, 225); late.hero.face = 1;
  for (let i = 0; i < 4 && late.hero.state !== 'air'; i++) late.tick({right: true});
  assert.equal(late.hero.state, 'air');
  late.tick({jump: true});
  assert.ok(late.hero.arc, 'a press just after leaving a ledge still jumps');
});

test('modern controls steer a jump, and classic controls cannot', () => {
  const path = modern => {
    const core = quiet(make({modern}));
    core.enter(3000, 0); quiet(core);
    core.hero.x = 200; core.hero.face = 1;
    core.tick({}); core.tick({jump: true});
    for (let i = 0; i < 40 && core.hero.state === 'air'; i++) core.tick({left: true});
    return core.hero.x;
  };
  assert.ok(Math.abs(path(false) - 266) < 8);
  assert.ok(path(true) < 245);
});

test('modern controls collect by walking over, and ladders reach', () => {
  const core = quiet(make({modern: true}));
  core.enter(1020, 1); quiet(core);
  const rocks = core.rocks;
  core.entities = [{type: 'item', item: 'bag', x: core.hero.x, y: core.hero.y + 10, w: 18, h: 18, frame: 0}];
  core.tick({});
  assert.equal(core.rocks, rocks + 20);
  core.enter(3000, 0); quiet(core);
  const foot = core.room.floors.find(f => f.y === 264).segments.flatMap(s => s.spans).find(s => s.kind === 3);
  core.hero.x = foot.x0 - 10;
  core.tick({up: true});
  assert.equal(core.hero.state, 'ladder');
});

test('each key keeps one job: Space alone leaves a rope, and Down ducks on open floor', () => {
  const core = quiet(make({modern: true}));
  core.enter(1000, 0); quiet(core);
  const rope = core.room.ropes[0];
  Object.assign(core.hero, {state: 'rope', rope, floor: null, y: rope.bottom - 20, x: (rope.x0 + rope.x1) / 2});
  core.tick({}); core.tick({right: true});
  assert.equal(core.hero.state, 'rope', 'a direction alone does not leap');
  core.tick({right: true, jump: true});
  assert.equal(core.hero.state, 'air');
  core.enter(3000, 0); quiet(core);
  core.hero.x = 200;
  core.tick({down: true});
  assert.equal(core.hero.state, 'duck');
  const classic = quiet(make());
  classic.enter(3000, 0); quiet(classic);
  classic.hero.x = 200;
  classic.tick({down: true});
  assert.notEqual(classic.hero.state, 'duck');
});

test('a joining ladder carries Duncan in, and climbing down it leaves the room', () => {
  const core = quiet(make({ward: true}));
  core.enter(3030, 0); quiet(core);
  assert.equal(core.hero.state, 'ladder');
  for (let i = 0; i < 60 && core.hero.state === 'ladder'; i++) core.tick({});
  assert.equal(core.hero.y, 253);
  assert.equal(core.hero.state, 'stand');
  core.hero.x = 383;
  core.tick({down: true});
  assert.equal(core.hero.state, 'ladder');
  for (let i = 0; i < 60 && core.room?.id === 3030; i++) core.tick({down: true});
  assert.equal(core.room.id, 3020);
  const above = quiet(make({ward: true}));
  above.enter(3020, 1); quiet(above);
  assert.equal(above.hero.state, 'ladder');
  for (let i = 0; i < 200 && above.hero.state === 'ladder'; i++) above.tick({});
  assert.equal(above.hero.state, 'stand');
  assert.ok(above.hero.y > 0);
});

test('the arm splits a rock\'s speed as the disk does', () => {
  const shot = arm => {
    const core = quiet(make({ward: true}));
    core.enter(3000, 0); quiet(core);
    core.hero.x = 200; core.hero.face = 1; core.entities = [];
    core.tick({arm, fire: true});
    const s = core.shots[0];
    return [+(s.vx * 2.5).toFixed(2), +(s.vy * 2.5).toFixed(2)];
  };
  assert.deepEqual(shot(300).map(v => +v.toFixed(1)), [37.5, .3]);
  assert.deepEqual(shot(0).map(v => +v.toFixed(1)), [0, -37.2]);
  assert.deepEqual(shot(150).map(v => +v.toFixed(1)), [18.8, -18.4]);
  assert.deepEqual(shot(511).map(v => +v.toFixed(1)), [11.1, 26.7]);
});

test('classic throws only when standing, holding repeats on six updates, and modern aims at the pointer', () => {
  const classic = quiet(make());
  classic.enter(3000, 0); quiet(classic);
  classic.hero.x = 200; classic.entities = [];
  const rocks = classic.rocks;
  classic.tick({right: true});
  classic.tick({right: true, fire: true});
  assert.equal(classic.rocks, rocks, 'walking does not throw');
  classic.tick({});
  for (let i = 0; i < 30; i++) classic.tick({fire: true});
  assert.equal(rocks - classic.rocks, 2, 'a held button throws every six updates');
  const modern = quiet(make({modern: true}));
  modern.enter(3000, 0); quiet(modern);
  modern.hero.x = 200; modern.hero.face = 1; modern.entities = [];
  modern.tick({fire: true, aimAt: {x: 100, y: modern.hero.y + 12}});
  assert.equal(modern.hero.face, -1);
  assert.ok(modern.shots[0].vx < -10);
  assert.ok(Math.abs(modern.shots[0].vy) < .5);
});

test('every prompt on screen names something the key really does', () => {
  const core = quiet(make({modern: true}));
  core.enter(1020, 0); quiet(core);
  for (const pull of core.room.pulls) {
    core.landOn(pull.y, pull.x0 - 12);
    assert.equal(core.prompt()[0], 'action');
    assert.equal(core.tryAction(), true);
    core.pullsDone.clear();
  }
  core.enterHall();
  assert.equal(core.prompt()[0], 'hall');
});
