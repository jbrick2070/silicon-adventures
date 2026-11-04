const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = readFileSync(path.join(__dirname, '..', 'hints.js'), 'utf8');
const context = { window: {} };
vm.runInNewContext(source, context, { filename: 'game/hints.js' });
const { current } = context.window.ScepterHints;

const carriedToSub = [
  { id: 1420, name: 'sword' }, { id: 1, name: 'freeze spell' }, { id: 17298, name: 'lantern' },
  { id: 6496, name: 'flute' }, { id: 17963, name: 'wand' }, { id: 608, name: 'earth scepter' },
  { id: 23213, name: 'air scepter' }, { id: 14702, name: 'diving suit' }, { id: 13010, name: 'chip' },
  { id: 19491, name: 'pearl' }, { id: 25961, name: 'trident' }, { id: 4091, name: 'iron key' },
  { id: 19566, name: 'water scepter' }
];
const state = (scene, objects = [], inventory = carriedToSub) => ({ scene, objects: objects.map(id => ({ id })), inventory });
const unseen = () => false;
const select = value => current(value, unseen);

test('boarding the sub deck does not complete the submarine chapter', () => {
  const hint = current(state(28593), id => id === 28593);
  assert.equal(hint.key, 'chapter/14');
  assert.equal(hint.milestone.title, 'The submarine');
});

test('computer-room states take precedence with safe, descriptive guidance', () => {
  assert.equal(select(state(9709, [2718, 13010])).key, 'local/9709/installed');
  assert.equal(select(state(9709, [], [...carriedToSub, { id: 13010, name: 'chip' }])).key, 'local/9709/pack-chip');
  assert.equal(select(state(9709, [13010], carriedToSub.filter(o => o.id !== 13010))).key, 'local/9709/floor-chip');
  assert.equal(select(state(9709, [], carriedToSub.filter(o => o.id !== 13010))).key, 'local/9709/missing-chip');
});

test('control room reads exact viewplate states and requires the named control', () => {
  assert.equal(select(state(23272, [])).key, 'local/23272/blank');
  assert.equal(select(state(23272, [16192, 13165])).key, 'local/23272/centre');
  assert.equal(select(state(23272, [16192, 11543, 4876])).key, 'local/23272/cliff');
  assert.equal(select(state(23272, [16192, 11543, 3992, 20759])).key, 'local/23272/reef');
  assert.equal(select(state(23272, [16192, 4051])).key, 'local/23272/grounded');
  assert.equal(select(state(23272, [16192, 11543])).key, 'local/23272/unclear');
});

test('later campaign evidence keeps the ordinary campaign objective on a revisit', () => {
  const inventory = [...carriedToSub, { id: 24183, name: 'rope' }];
  const hint = current(state(23272, [16192, 11543, 4876], inventory), unseen);
  assert.equal(hint.key, 'chapter/16');
  assert.equal(hint.milestone.title, 'The Fire Scepter');
});

test('giving the pearl to the oyster advances to Neptune’s Throne instead of repeating the wreck', () => {
  const preWater = carriedToSub.filter(o => ![19491, 25961, 4091, 19566].includes(o.id));
  // Oyster (32057) still blocking shell (29361) without pearl: need the wreck's pearl.
  assert.equal(current(state(29361, [32057], preWater), unseen).milestone.title, 'The wreck’s pearl');
  // Oyster gone from shell after GIVE PEARL: advance to The oyster and the trident.
  assert.equal(current(state(29361, [], preWater), unseen).milestone.title, 'The oyster and the trident');
  // Visiting murals (22001) also proves the oyster was passed.
  assert.equal(current(state(2352, [], preWater), id => id === 22001).milestone.title, 'The oyster and the trident');
});

test('landing on silicon beach or main road with the Water Scepter completes the submarine chapter', () => {
  const beforeWater = carriedToSub.filter(o => o.id !== 19566);
  // Earlier silicon beach visit before Water Scepter must NOT complete the submarine chapter.
  assert.equal(current(state(20301, [], beforeWater), id => id === 20301).milestone.title, 'The Water Scepter');
  // Still in Queen's Chamber (18458) or sub deck (28593) with Water Scepter: submarine still ahead.
  assert.equal(current(state(18458, [], carriedToSub), id => id === 20301).milestone.title, 'The submarine');
  assert.equal(current(state(28593, [], carriedToSub), id => id === 20301).milestone.title, 'The submarine');
  // Landed on silicon beach (20301) or main road bookmark (27492) carrying Water Scepter: advance to Hurk office.
  assert.equal(current(state(20301, [], carriedToSub), id => id === 20301).milestone.title, 'The Hurk office');
  assert.equal(current(state(27492, [], carriedToSub), id => id === 27492).milestone.title, 'The Hurk office');
});

test('tying the rope at volcano top or entering devil’s sanctum keeps the Fire Scepter objective', () => {
  // Rope (24183) consumed by TIE ROPE, replaced by TOP.1 (30444) at volcano top (3099).
  assert.equal(current(state(3099, [30444], carriedToSub), id => id === 3099).milestone.title, 'The Fire Scepter');
  assert.equal(current(state(14750, [], carriedToSub), id => id === 3099).milestone.title, 'The Fire Scepter');
});

test('sparse disk bookmarks in Queen’s Chamber, mirror room, and sealed temple rooms give local guidance', () => {
  const preWater = carriedToSub.filter(o => o.id !== 19566);
  assert.equal(select(state(18458, [19566], preWater)).key, 'local/18458/scepter');
  assert.equal(select(state(20791, [23941], [{ id: 1, name: 'freeze spell' }])).key, 'local/20791/mirror');
  assert.equal(select(state(20791, [], [{ id: 1, name: 'freeze spell' }])).key, 'local/20791/open');
  assert.equal(select(state(3122, [25171], [{ id: 6496, name: 'flute' }])).key, 'local/temple/3122');
});

test('courtyard warns when a scepter was dropped before entering the Finale', () => {
  const allFour = [...carriedToSub, { id: 4500, name: 'fire scepter' }];
  assert.equal(current(state(10021, [], allFour), id => id === 29408).key, 'chapter/17');
  const droppedEarth = allFour.filter(o => o.id !== 608);
  assert.equal(current(state(10021, [], droppedEarth), unseen).key, 'local/return/missing');
  assert.equal(current(state(10021, [], droppedEarth), id => id === 29408).key, 'local/return/missing');
});

const designs = JSON.parse(readFileSync(path.join(__dirname, '..', '..', 'archive', 'es', 'designs.json'), 'utf8'));
const trace = readFileSync(path.join(__dirname, '..', '..', 'archive', 'es', 'campaign-trace.tsv'), 'utf8')
  .trim().split(/\r?\n/).slice(1).map(line => line.split('\t'));
const templeState = (scene, objects = []) => state(scene, objects, [{ id: 6496, name: 'flute' }]);
const deepest = value => select(value).milestone.tiers[2];

test('first-entry timed-trap escapes agree with the original map and winning room transitions', () => {
  for (const [id, direction, destination] of [[21162, 'east', 'jumping door'], [25655, 'south', 'spikes']]) {
    const room = designs.find(d => d.type === 'ASCN' && d.id === id);
    assert.equal(room.blocked[direction], false, `${room.name}: exit blocked on source map`);
    const arrival = trace.findIndex(([_kind, _command, scene]) => scene === room.name);
    assert.deepEqual(trace[arrival + 1], ['turn', direction, destination]);
    const clue = deepest(templeState(id));
    assert.match(clue, new RegExp('^Go ' + direction + ' immediately\\b'));
    assert.doesNotMatch(clue, /go (east|west) \(or west/i);
  }
  assert.match(deepest(templeState(3122, [25171])), /slide floor, then immediately go east again/);
});

// Read the preserved resource bytes rather than duplicating a second trap model.
// Only the script tokens needed by these assertions are decoded here.
function sourceScript(id) {
  const bytes = readFileSync(path.join(__dirname, '..', '..', 'archive', 'es', 'Scepters.rsrc'));
  const data = bytes.readUInt32BE(0), map = bytes.readUInt32BE(4);
  const types = map + bytes.readUInt16BE(map + 24);
  for (let t = 0; t <= bytes.readUInt16BE(types); t++) {
    const entry = types + 2 + t * 8;
    if (bytes.toString('ascii', entry, entry + 4) !== 'ACOD') continue;
    const refs = types + bytes.readUInt16BE(entry + 6);
    for (let n = 0; n <= bytes.readUInt16BE(entry + 4); n++) {
      const ref = refs + n * 12;
      if (bytes.readInt16BE(ref) !== id) continue;
      const offset = data + bytes.readUIntBE(ref + 5, 3);
      const body = bytes.subarray(offset + 4 + 12, offset + 4 + bytes.readUInt32BE(offset));
      const tokens = {128:'IF{',129:'=',131:'>',132:'}AND{',133:'}OR{',135:'EXIT\n',136:'END\n',
        137:'MOVE{',138:'}TO{',139:'PRINT{',160:'TEXT$',161:'CLICK$',178:'LOOP#',
        192:'STORAGE@',193:'SCENE@',194:'PLAYER@',253:'}\n',254:'}THEN\n'};
      return Array.from(body, b => tokens[b] || String.fromCharCode(b)).join('');
    }
  }
  throw new Error('Missing source ACOD ' + id);
}

test('advanced floor and ball states give recovery advice before the source-script death turn', () => {
  const floor = sourceScript(21162), ball = sourceScript(25655);
  assert.match(floor, /IF\{LOOP#=1\}[\s\S]*MOVE\{FLOOR\.2\}TO\{SCENE@\}/);
  assert.match(floor, /IF\{LOOP#=2\}THEN\n[\s\S]*MOVE\{PLAYER@\}TO\{STORAGE@\}/);
  assert.ok(floor.indexOf('IF{TEXT$=WEST}') < floor.indexOf('IF{LOOP#=2}'));
  assert.match(deepest(templeState(21162, [1148])), /^Go west immediately/);
  assert.equal(select(templeState(21162, [1148])).key, 'local/temple/21162/retreat');

  assert.match(ball, /IF\{LOOP#=1\}THEN\n[\s\S]*MOVE\{BALL\.1\}TO\{SCENE@\}/);
  assert.match(ball, /IF\{TEXT\$=SOUTH\}AND\{BALL\.2=SCENE@\}/);
  assert.match(ball, /IF\{LOOP#=3\}THEN\n[\s\S]*MOVE\{PLAYER@\}TO\{STORAGE@\}/);
  assert.match(deepest(templeState(25655, [18900])), /^Go north now/);
  assert.match(deepest(templeState(25655, [18900, 30073])), /^Restore a save/);
});

test('completed trap actions are not prescribed again on sparse or restored snapshots', () => {
  assert.match(deepest(templeState(32726, [23017, 2618])), /^PUSH until the disk says the sand stops/);
  assert.match(deepest(templeState(32726)), /^Go north now/);
  assert.match(deepest(templeState(3122)), /^Go east to the slide floor/);
  assert.match(deepest(templeState(7039, [13727])), /^Go west/);
  assert.doesNotMatch(deepest(templeState(7039, [13727])), /click/i);
  assert.match(deepest(templeState(22733)), /^Go west/);
  assert.doesNotMatch(deepest(templeState(22733)), /type cut/i);
  assert.match(deepest(templeState(20189)), /^Go west immediately/);
});
