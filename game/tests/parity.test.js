const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..', '..');
const read = file => readFileSync(path.join(root, file), 'utf8');
const context = {};
context.window = context;
vm.createContext(context);
for (const file of ['art/castle-index.js', 'archive/dc/castle-data.js', 'archive/es/chronicle.js', 'game/castle-plan.js']) vm.runInContext(read(file), context);
const shell = read('game/enchanted-castle.js'), core = read('game/castle-core.js'), html = read('index.html'), folio = read('game/folio.js');

test('every sprite reel has a drawing path in the game', () => {
  const dynamic = new Set(['B400', 'B401', 'B705', 'B706']); // Chosen by data: door side, bolt shape.
  const hall = id => /^A100\d\d$/.test(id); // Named by the disk's GPTH run tables.
  const missing = context.CastleGraphics.filter(a => a.type === 'PPCT').map(a => a.fork.slice(-1) + a.id)
    .filter(id => !shell.includes("'" + id + "'") && !dynamic.has(id) && !hall(id));
  assert.equal(missing.join(' '), '');
});

test('every screen on the disk is shown', () => {
  const plan = context.CastlePlan.SCREENS, rooms = context.CASTLE_DATA.order;
  const shown = new Set([plan.title, plan.flash, plan.scores, ...Object.values(plan.masks), ...rooms.map(id => 'B' + id)]);
  const onDisk = context.CastleGraphics.filter(a => a.type === 'PSCR').map(a => a.fork.slice(-1) + a.id);
  assert.equal(onDisk.length, 20);
  assert.equal(onDisk.filter(id => !shown.has(id)).join(' '), '');
});

test('every picture on the disk has a home', () => {
  for (const id of [10000, 10004, 12100, 12200, 15100, 15101, 16000, 16100, 16101, 16102, 16103, 16200, 32000])
    assert.ok(shell.includes('A-PICT-' + id) || shell.includes("'A-PICT-' + (16100"), 'A ' + id);
  for (const id of [16201, 16202, 16203, 16204]) assert.ok(read('game/castle-plan.js').includes('title: ' + id), 'B ' + id);
  for (const id of [20000, 20001, 20002, 20003, 20004, 20005]) assert.ok(folio.includes('PICT-' + id) || folio.includes('id: ' + id), 'card ' + id);
});

test('every sound role is played by the game', () => {
  const said = new Set([...core.matchAll(/say\('(\w+)'\)/g)].map(m => m[1]));
  for (const pattern of [/say\(\{([^}]+)\}/g]) for (const m of core.matchAll(pattern)) for (const r of m[1].matchAll(/: '(\w+)'/g)) said.add(r[1]);
  said.add('fireball'); said.add('throwRock'); said.add('fall'); said.add('heroHit'); said.add('guardDie'); said.add('whipFall'); said.add('gainShield'); said.add('gainFire'); // Chosen by a ternary in the core.
  said.add('title'); said.add('scores'); // The shell plays these on its own screens.
  const missing = Object.keys(context.CastlePlan.SOUNDS).filter(role => !said.has(role));
  assert.equal(missing.join(' '), '');
});

test('hosted staging will carry every new file', () => {
  for (const script of ['game/boundary.js', 'game/chronicle.js', 'game/castle-plan.js', 'game/castle-core.js', 'game/enchanted-castle.js', 'archive/es/chronicle.js', 'archive/dc/castle-data.js'])
    assert.ok(html.includes('src="' + script + '"'), script);
  const stage = read('web/stage.py');
  for (const glob of ['game/*.js', 'archive/es/*.js', 'archive/dc/*.js', 'art/castle/*.png', 'archive/dc/paper/*.png', 'archive/es/plates/*.png']) assert.ok(stage.includes(glob), glob);
});

test('the scepter plates are real disk drawings', () => {
  for (const wing of Object.values(context.CastlePlan.WINGS)) assert.ok(existsSync(path.join(root, wing.scepter.plate)), wing.scepter.plate);
});

test('the opening scores are the ones shipped on the disk', () => {
  const scores = context.CASTLE_DATA.preferences.scores.filter(s => s.name);
  assert.ok(scores.some(s => s.name === 'Eric' && s.points === '26,135'));
  assert.ok(scores.some(s => s.name === 'Jon' && s.points === '6,930'));
});

test('the ledger on file matches the disks', () => {
  const ledger = read('archive/PARITY.md');
  assert.ok(!ledger.includes('UNPLACED'));
  assert.ok(ledger.includes('| PPCT sprite reels | 172 |'));
  assert.ok(ledger.includes('| SOUN recordings | 72 |'));
});
