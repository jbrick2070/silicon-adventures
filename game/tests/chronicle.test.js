const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..', '..');
function boot() {
  const store = new Map();
  const context = {
    localStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
    btoa: s => Buffer.from(s, 'latin1').toString('base64'),
    atob: s => {
      if (!/^[A-Za-z0-9+/=]*$/.test(s)) throw new Error('InvalidCharacterError');
      return Buffer.from(s, 'base64').toString('latin1');
    }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(path.join(root, 'archive/es/chronicle.js'), 'utf8'), context);
  vm.runInContext(readFileSync(path.join(root, 'game/chronicle.js'), 'utf8'), context);
  return context;
}

test('every proof of a side quest and oddity is a real disk line', () => {
  const { SiliconChronicle: C } = boot();
  const texts = new Set(C.lines.map(l => l.t.replace(/\s+/g, ' ').trim()));
  const clean = s => s.replace(/\s+/g, ' ').trim();
  for (const deed of C.DEEDS) for (const proof of deed.proof) assert.ok(texts.has(clean(proof)), proof);
  for (const odd of C.ODDITIES) assert.ok(texts.has(clean(odd.line)), odd.line);
});

test('disk spellings and dialogue survive verbatim', () => {
  const { SiliconChronicle: C } = boot();
  const texts = C.lines.map(l => l.t);
  for (const line of ['The Alchemist disapears with a wail.', 'Your cannoe drifts towards the whirlpool...',
    'You here someone cry "Help me!" to the east.', 'The Demom cackles with laughter.', 'The inscect rolls over and collapses!',
    "Bartender: Ho, there, buckaroo, what can I do for ya?", "Elron: Bravo! You have saved Callion!"])
    assert.ok(texts.includes(line), line);
});

test('a turn records lines and completes the quest it proves', () => {
  const { SiliconChronicle: C } = boot();
  const fresh = C.note('The cannon tumbles into the ravine!', 26096);
  assert.deepEqual([...fresh.deeds].map(d => d.id), ['cannon']);
  assert.equal(C.counts().deeds, 1);
  assert.equal(C.note('The cannon tumbles into the ravine!', 26096).deeds.length, 0);
});

test('the disk bug that prints the ram line at the catapult credits the catapult', () => {
  const { SiliconChronicle: C } = boot();
  const ids = C.note('The ram is blown to pieces!', 23064).deeds.map(d => d.id);
  assert.deepEqual([...ids], ['catapult']);
  assert.deepEqual([...C.note('The ram is blown to pieces!', 23935).deeds.map(d => d.id)], ['ram']);
});

test('progress round-trips through the save note and stays small', () => {
  const one = boot().SiliconChronicle;
  one.note('You feel different...', 2818);
  one.note("Aren't you glad your name isn't Indiana Cousteau?", 1776);
  const packed = one.pack();
  assert.ok(packed.length < 260, 'save trailer budget');
  const two = boot().SiliconChronicle;
  two.merge(packed);
  assert.equal(two.counts().read, one.counts().read);
  assert.equal(two.counts().deeds, 1);
  assert.equal(two.counts().oddities, 1);
  two.merge('%%% not base64 %%%');
  assert.equal(two.counts().read, one.counts().read);
});

test('rooms that listen for words beyond the buttons list them', () => {
  const { SiliconChronicle: C } = boot();
  assert.ok(C.verbsFor(5196).includes('BEAT DRUM'));
  assert.ok(C.verbsFor(20177).includes('SWING VINES'));
  assert.ok(C.verbsFor(21025).includes('OPEN BAR'));
  assert.deepEqual([...C.verbsFor(1)], []);
});
