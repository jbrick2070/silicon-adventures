const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..', '..');
const context = {};
context.window = context;
vm.createContext(context);
vm.runInContext(readFileSync(path.join(root, 'game/boundary.js'), 'utf8'), context);
const B = context.ScepterBoundary;
const designs = JSON.parse(readFileSync(path.join(root, 'archive/es/designs.json'), 'utf8'));
const rooms = designs.filter(d => d.type === 'ASCN');
const room = name => rooms.find(r => r.name === name);
const openExits = meta => Object.fromEntries(Object.entries(meta.blocked).map(([k, v]) => [k, !v]));

test('an open room stops well short of the old 38 by 24 box', () => {
  const rig = {left: -19, right: 19, back: 24, rear: -1.75};
  const {bounds, fence} = B.profile(room('main road'), openExits(room('main road')), 'open', rig);
  assert.ok(bounds.back <= 11);
  assert.ok(bounds.right - bounds.left <= 12.8);
  assert.ok(fence.back > bounds.back, 'the edge stands beyond where Saber stops');
});

test('indoor rooms keep their walls and gain no fence', () => {
  const rig = {left: -3, right: 3, back: 5, rear: -1.75};
  const {bounds, fence} = B.profile(room('armory'), openExits(room('armory')), 'chamber', rig);
  assert.equal(fence, null);
  assert.equal(bounds.back, 5);
});

test('edges take their style from the disk’s own words', () => {
  const style = (name, side, env = 'open') => B.styleFor(room(name), side, env);
  assert.equal(style('marsh', 'north'), 'reeds');
  assert.equal(style('bog', 'east'), 'reeds');
  assert.equal(style('seaweed', 'north', 'submerged'), 'reef');
  const mountain = rooms.find(r => Object.values(r.messages).includes('Mountains block your way.'));
  const side = Object.keys(mountain.messages).find(k => mountain.messages[k] === 'Mountains block your way.');
  assert.equal(B.styleFor(mountain, side, 'open'), 'cliff');
});

test('blocked text is the disk’s line, or the engine’s own', () => {
  const mountain = rooms.find(r => Object.values(r.messages).includes('Mountains block your way.'));
  const side = Object.keys(mountain.messages).find(k => mountain.messages[k] === 'Mountains block your way.');
  assert.equal(B.note(mountain, side), 'Mountains block your way.');
  assert.equal(B.note({messages: {}}, 'west'), "You can't go west.");
});

test('a real exit is a gap between posts, and a blocked side has none', () => {
  const rig = {left: -9, right: 9, back: 12, rear: -1.75};
  const {fence} = B.profile(room('slough'), openExits(room('slough')), 'open', rig);
  assert.equal(B.crest(fence.edges.north, 0), 0, 'open way');
  assert.ok(B.crest(fence.edges.north, fence.edges.north.half - .1) > 3, 'marker post');
  assert.ok(B.crest(fence.edges.west, 0) > 1.8, 'a blocked side stands above eye height');
  assert.equal(B.inGap(fence.edges.west, 0), false);
  assert.equal(B.inGap(fence.edges.north, 0), true);
});

test('a drawn thing beyond the limit is never walled off', () => {
  const rig = {left: -19, right: 19, back: 24, rear: -1.75};
  const profile = B.profile(room('main road'), openExits(room('main road')), 'open', rig);
  B.widen(profile, rig, [{x: 9, z: 16}]);
  assert.ok(profile.bounds.back >= 17);
  assert.ok(profile.bounds.right >= 10);
  B.widen(profile, rig, [{x: 15, z: 30, decorative: true}]);
  assert.ok(profile.bounds.right < 15, 'decoration does not widen the limit');
});

test('the edge never rises over the doorway view of the drawing', () => {
  assert.equal(B.plateRise(3, 0), 0);
  assert.ok(B.plateRise(2, 4) > .9);
  assert.equal(B.plateRise(7, 4), 0);
});

test('ways out read from where Saber faces', () => {
  const ways = B.ways({north: true, east: true, south: false, west: false}, Math.PI / 2);
  assert.equal(ways[0].direction, 'east');
  assert.equal(ways[0].relative, 'ahead');
  assert.equal(ways[1].relative, 'left');
});
