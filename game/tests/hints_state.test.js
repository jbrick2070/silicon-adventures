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
