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

test('plague drinks an elixir by itself, which covers 20 updates, and then a life goes', () => {
  const core = quiet(make());
  core.enter(3000, 0); quiet(core);
  assert.equal(core.elixir, 0, 'no elixir at the start of a game');
  core.elixir = 1;
  core.harm('bite');
  assert.equal(core.elixir, 0);
  assert.equal(core.mode, 'room');
  for (let i = 0; i < 50; i++) core.harm('bite');
  assert.equal(core.mode, 'room', 'twenty updates of cover');
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

test('a pit costs no life: it drops Duncan down the chute into the Dungeon', () => {
  const core = quiet(make());
  core.enter(3000, 0); quiet(core);
  const lives = core.lives;
  core.hero.state = 'air'; core.hero.floor = null; core.hero.y = 280; core.hero.vy = 6; core.hero.x = 200;
  core.tick({});
  assert.equal(core.room.id, 1020);
  assert.equal(core.hero.state, 'chute');
  for (let i = 0; i < 40 && core.hero.state !== 'stand'; i++) core.tick({});
  assert.deepEqual([core.hero.x, core.hero.y], [35, 240]);
  assert.equal(core.lives, lives);
  core.enter(3000, 0); core.hero.state = 'air'; core.hero.floor = null; core.hero.y = 280; core.hero.vy = 6; core.hero.x = 200;
  core.tick({});
  assert.equal(core.hero.state, 'stand', 'later falls skip the slide');
});

test('water drowns, and lives run out at zero with rocks topped up on each return', () => {
  const core = quiet(make());
  assert.equal(core.lives, 5);
  assert.equal(core.rocks, 60);
  core.enter(2020, 0); quiet(core);
  Object.assign(core.hero, {state: 'air', floor: null, arc: null, x: 200, y: 90, vy: 6});
  core.tick({}); core.tick({});
  assert.equal(core.mode, 'dying');
  core.rocks = 3;
  for (let i = 0; i < 80; i++) core.tick({});
  assert.equal(core.lives, 4);
  assert.equal(core.rocks, 10);
  core.lives = 1; core.harm('fall');
  for (let i = 0; i < 80; i++) core.tick({});
  assert.equal(core.mode, 'over');
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

test('the Shield room lays one hidden ledge pattern per visit', () => {
  const data = make().data, mask = data.steps.masks[0][2];
  assert.equal(data.steps.width, 36);
  const core = quiet(make({fixedLedges: 2}));
  core.enter(3030, 0); quiet(core);
  data.steps.spans.forEach((at, i) => {
    const seg = core.room.segOf.get(at), real = mask >>> i & 1;
    assert.equal(!!seg.off, !real);
    assert.equal(seg.x1 - seg.x0, real ? 36 : 0);
  });
  assert.equal(core.realLedges().length, mask.toString(2).replace(/0/g, '').length);
  for (let i = 0; i < 60 && core.hero.state !== 'stand'; i++) core.tick({});
  core.landOn(253, 80); core.hero.face = -1;
  core.tick({action: true});
  assert.ok(core.ledgesShownUntil > core.tickCount, 'the wall switch lights the real ledges');
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
  assert.equal(core.rocks, rocks + 10);
  core.enter(3000, 0); quiet(core);
  const foot = core.room.floors.find(f => f.y === 264).segments.flatMap(s => s.spans).find(s => s.kind === 3);
  core.hero.x = foot.x0 - 10;
  core.tick({up: true});
  assert.equal(core.hero.state, 'ladder');
});

test('each key keeps one job: Left and Right change ropes, Space leaps, and Down ducks on open floor', () => {
  const core = quiet(make({modern: true}));
  core.enter(1000, 0); quiet(core);
  const [first, second] = core.room.ropes;
  const hang = (rope, y) => Object.assign(core.hero, {state: 'rope', rope, floor: null, y, x: rope.x0, face: 1});
  hang(first, 100);
  core.tick({});
  core.tick({right: true});
  assert.equal(core.hero.rope, second, 'a direction moves to the next rope');
  core.tick({});
  core.tick({right: true, jump: true});
  assert.equal(core.hero.state, 'air', 'Space leaps off');
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

test('classic ropes follow the disk: turn, then move, and a leap needs no Jump key', () => {
  const core = quiet(make());
  core.enter(1000, 0); quiet(core);
  const [first, second] = core.room.ropes;
  Object.assign(core.hero, {state: 'rope', rope: second, floor: null, y: 100, x: second.x0, face: 1});
  core.tick({});
  core.tick({left: true});
  assert.equal(core.hero.rope, second, 'the first press only turns Duncan');
  assert.equal(core.hero.face, -1);
  core.tick({});
  core.tick({left: true});
  assert.equal(core.hero.rope, first);
  core.tick({});
  core.tick({left: true});
  assert.equal(core.hero.state, 'air', 'with no rope beyond, the press leaps off');
  assert.equal(core.hero.arc.kind, 'rope');
  assert.equal(core.hero.arc.rows[0][1], 12, 'the leap is the tail of the standing jump');
  Object.assign(core.hero, {state: 'rope', rope: first, arc: null, y: 100, x: first.x0});
  const before = core.hero.y;
  core.tick({}); core.tick({jump: true});
  assert.equal(core.hero.state, 'rope', 'Jump does nothing on a classic rope');
  core.tick({up: true});
  assert.ok(Math.abs(before - core.hero.y - 3.2) < .01, 'eight pixels an update');
});

test('the river carries a rider off the upper end and back in on the lower one', () => {
  const core = quiet(make({ward: true}));
  core.enter(2020, 0); quiet(core);
  const log = core.addLog(0, 470);
  core.landOn(86, 480); core.hero.floor = log.seg;
  for (let i = 0; i < 60 && core.hero.y === 86; i++) { core.tick({}); core.entities = core.entities.filter(e => e.type === 'log'); }
  assert.equal(core.hero.y, 240);
  assert.ok(core.hero.x < 20, 'he arrives at the left of the lower river');
  const lower = core.hero.floor;
  assert.ok(lower.log);
  // Ride along, then a running jump clears the falls to the far ledge and the exit.
  for (let i = 0; i < 900 && core.hero.x < 306; i++) { core.tick({}); core.entities = core.entities.filter(e => e.type === 'log'); }
  assert.equal(core.hero.floor, lower);
  for (let i = 0; i < 30; i++) core.tick({right: true, jump: i === 1});
  assert.ok(core.hero.y === 235 || core.room.id === 2030, 'he reaches the ledge beyond the falls');
});

test('a log breaks up at the end of the lower river', () => {
  const core = quiet(make());
  core.enter(2020, 0); quiet(core);
  const log = core.addLog(1, 330);
  for (let i = 0; i < 12; i++) core.tick({});
  assert.ok(log.gone);
  assert.ok(core.entities.some(e => e.type === 'logSink'));
  assert.equal(core.room.floors.find(f => f.y === 240).segments.length, 0);
});

test('the flail comes off the wall, swings, and fells the Whip Guard only from far enough right', () => {
  const core = quiet(make({modern: true}));
  core.enter(1020, 0); quiet(core);
  for (let i = 0; i < 80 && core.hero.state !== 'stand'; i++) core.tick({});
  core.entities = [core.guard(305, 248, 305, 305, 0, true)];
  core.landOn(270, 160); core.hero.stun = 0;
  const score = core.score;
  core.tick({action: true});
  assert.equal(core.hero.state, 'flail');
  for (let i = 0; i < 20 && core.hero.flail.stage !== 'carry'; i++) core.tick({});
  assert.equal(core.score, score + 50);
  core.tick({fire: true}); core.tick({});
  for (let i = 0; i < 8 && core.hero.flail.stage === 'swing'; i++) core.tick({});
  assert.equal(core.hero.flail.stage, 'carry', 'too far left, the swing misses');
  core.hero.x = 240;
  core.tick({fire: true}); core.tick({});
  for (let i = 0; i < 12 && core.hero.state === 'flail'; i++) core.tick({});
  assert.equal(core.hero.state, 'stand');
  assert.ok(core.entities[0].dying > 0);
  assert.equal(core.score, score + 200);
  assert.ok(core.entities.some(e => e.type === 'fallenFlail'));
});

test('rocks glance off the Whip Guard, and only fire or the flail will drop him', () => {
  const core = quiet(make());
  core.enter(3000, 0); quiet(core);
  const guard = core.guard(300, 200, 300, 300, 0, true);
  core.entities = [guard];
  core.shots.push({x: 305, y: 210, vx: 0, vy: 0, w: 8, h: 8, fire: false, frame: 0, life: 9});
  core.tick({});
  assert.equal(guard.hp, 2);
  core.shots.push({x: 305, y: 210, vx: 0, vy: 0, w: 8, h: 8, fire: true, frame: 0, life: 9});
  core.tick({});
  assert.ok(guard.dying > 0);
});

test('the Knight needs both floor levers, and one alone leaves a half bridge that tips Duncan off', () => {
  const core = quiet(make({ward: true}));
  core.enter(4020, 0);
  const row = core.room.floors.find(f => f.y === 135);
  assert.equal(core.floorAt(240, 135), null, 'no bridge at first');
  core.entities = [{type: 'lever', x: -16, y: 256, chain: 0, w: 32, h: 40}, {type: 'lever', x: 464, y: 256, chain: 1, w: 32, h: 40}];
  core.landOn(263, 15);
  assert.equal(core.tryAction(), true);
  core.hero.stun = 0;
  assert.equal(core.tryAction(), false, 'a lever works once');
  assert.equal(row.segments.filter(s => !s.off).length, 1);
  core.landOn(135, 238);
  core.hero.floor = row.segments.find(s => !s.off);
  core.tick({});
  assert.equal(core.hero.state, 'teeter');
  for (let i = 0; i < 24 && core.hero.state === 'teeter'; i++) core.tick({});
  assert.equal(core.hero.state, 'air');
  core.enter(4020, 0); core.entities = [{type: 'lever', x: -16, y: 256, chain: 0, w: 32, h: 40}, {type: 'lever', x: 464, y: 256, chain: 1, w: 32, h: 40}];
  core.landOn(263, 15); core.tryAction(); core.landOn(263, 465); core.tryAction();
  assert.ok(core.floorAt(240, 135).spans.some(s => s.kind === 35), 'both levers lay the solid bridge with its chain');
  core.landOn(135, 240);
  for (let i = 0; i < 10; i++) core.tick({});
  assert.deepEqual([core.hero.state, core.hero.y], ['stand', 135], 'the finished bridge holds him');
});

test('the Wizard\u2019s three chains must go in the order set for the visit', () => {
  const core = quiet(make());
  core.enter(2030, 0);
  const gate = core.entities.find(e => e.type === 'gate');
  const chains = core.room.pulls.slice().sort((a, b) => a.a - b.a);
  assert.equal(chains.length, 3);
  const wrong = [gate.order[1], gate.order[0], gate.order[2]];
  for (const i of wrong) core.pull(chains[i]);
  assert.equal(gate.open, false);
  assert.equal(core.pullsDone.size, 0, 'a wrong order resets the chains');
  const score = core.score;
  for (const i of gate.order) core.pull(chains[i]);
  assert.equal(gate.open, true);
  assert.equal(core.score, score + 100);
});

test('the Shield is held, freezes Duncan and runs out after 30 updates', () => {
  const core = quiet(make());
  core.enter(3000, 0); quiet(core);
  core.powers.add('air'); core.hero.x = 200;
  core.tick({}); core.tick({action: true});
  assert.equal(core.hero.state, 'shield');
  const x = core.hero.x;
  core.tick({action: true, right: true});
  assert.equal(core.hero.x, x);
  core.harm('guard');
  assert.equal(core.mode, 'room', 'it stops contact');
  for (let i = 0; i < 80; i++) core.tick({action: true});
  assert.equal(core.hero.state, 'stand');
  core.tick({}); core.tick({action: true}); core.tick({});
  assert.equal(core.hero.state, 'stand', 'letting go lowers it');
  core.tick({action: true});
  core.harm('lightning');
  assert.equal(core.mode, 'dying', 'lightning goes straight through');
});

test('the big broom splits twice, and the smallest only stuns', () => {
  const core = quiet(make());
  core.enter(2030, 0); quiet(core);
  core.add_broom({x: 300, y: 268, left: 120, right: 442});
  const score = core.score;
  core.strike(core.entities[0], 1);
  assert.equal(core.entities.length, 3);
  assert.ok(core.entities.every(e => e.tier === 1));
  core.strike(core.entities[0], 1);
  assert.equal(core.entities.length, 5);
  const small = core.entities[0];
  core.strike(small, 1);
  assert.equal(core.entities.length, 5);
  assert.ok(small.stun > 0);
  assert.equal(core.score, score + 75);
});

test('creatures move at the disk\u2019s pixels an update, and guards turn at double pace', () => {
  const core = quiet(make());
  core.enter(3000, 0); quiet(core);
  const guard = core.guard(100, 200, 90, 300, 2);
  for (let i = 0; i < 5; i++) core.patrol(guard);
  assert.ok(Math.abs(guard.x - 104) < .001);
  guard.x = 299.9; core.patrol(guard);
  assert.equal(guard.speed, -4);
});
