const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = readFileSync(path.join(__dirname, '..', 'knock-quest.js'), 'utf8');

// Run the actual quest controller with a silent DOM and a deterministic clock.
// The fixture only supplies browser primitives; the real controller owns the
// signal, disabled controls, progress transitions, and timeout cancellation.
function beacon() {
  const events = new Map();
  class Node {
    constructor() {
      this.children = []; this.dataset = {}; this.style = {}; this.attrs = {};
      this.classList = { toggle() {} }; this.events = new Map();
    }
    setAttribute(key, value) { this.attrs[key] = value; }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    addEventListener(type, fn) {
      const list = this.events.get(type) || []; list.push(fn); this.events.set(type, list);
    }
    removeEventListener(type, fn) {
      this.events.set(type, (this.events.get(type) || []).filter(f => f !== fn));
    }
    focus() {}
    before() {}
    replaceWith(node) { this.replacement = node; }
    remove() {}
    getBoundingClientRect() { return { left: 0, top: 0, width: 338, height: 314 }; }
  }
  const selectors = ['canvas', 'h2', '.knock-feedback', '.knock-tools', '.knock-signal',
    '.knock-choices', '.knock-actions', '.knock-story', '.eyebrow',
    '[data-action="colour"]', '[data-action="mute"]', '[data-action="save"]'];
  const nodes = new Map(selectors.map(key => [key, new Node()]));
  const exitNodes = [new Node(), new Node()];
  const dialog = new Node();
  const descendants = () => [...nodes.values(), ...nodes.get('.knock-choices').children,
    ...nodes.get('.knock-actions').children];
  dialog.querySelector = q => q === '[data-send]'
    ? descendants().find(n => Object.hasOwn(n.dataset, 'send')) : nodes.get(q);
  dialog.querySelectorAll = q => q === '[data-compose]'
    ? descendants().filter(n => Object.hasOwn(n.dataset, 'compose')) : exitNodes;
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => {
    dialog.open = false;
    for (const fn of dialog.events.get('close') || []) fn();
  };
  let now = 0, nextTimer = 0, exitCount = 0;
  const timers = new Map(), progress = [], cues = [], draws = [];
  const document = {
    hidden: false, body: new Node(),
    createElement: tag => tag === 'dialog' ? dialog : new Node(),
    createComment: () => new Node(),
    addEventListener(type, fn) { events.set(type, fn); },
    removeEventListener(type) { events.delete(type); }
  };
  const context = {
    window: {}, document, performance: { now: () => now },
    matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }),
    requestAnimationFrame: () => 0, cancelAnimationFrame() {},
    setTimeout(fn, delay) { const id = ++nextTimer; timers.set(id, { fn, time: now + delay }); return id; },
    clearTimeout: id => timers.delete(id),
    KnockArt: {
      shields: [], beaconRegions: {
        sky: { x: 20, y: 36, w: 298, h: 82 },
        lamp: { x: 64, y: 126, w: 82, h: 78 },
        compass: { x: 238, y: 210, w: 74, h: 34 },
        card: { x: 184, y: 252, w: 104, h: 38 }
      },
      draw(_canvas, state) { draws.push(state); }
    }
  };
  vm.runInNewContext(source, context, { filename: 'game/knock-quest.js' });
  context.window.KnockQuest.open({
    progress: { stage: 'beacon', solved: true, bearing: 'east', signal: '.-.' },
    colour: true, muted: true, mixer: new Node(),
    onProgress: value => progress.push(value), onCue: id => cues.push(id),
    onSave: async () => {}, onExit: () => { exitCount++; }, onToggleSound: () => true
  });
  const button = label => descendants().find(n => n.textContent === label);
  function clickButton(label) {
    const b = button(label); assert.ok(b, label); assert.ok(!b.disabled, label + ' is disabled');
    for (const fn of b.events.get('click') || []) fn({ currentTarget: b });
  }
  function advance(ms) {
    const end = now + ms;
    for (;;) {
      const next = [...timers].filter(([, t]) => t.time <= end).sort((a, b) => a[1].time - b[1].time)[0];
      if (!next) break;
      const [id, timer] = next; now = timer.time; timers.delete(id); timer.fn();
    }
    now = end;
  }
  return { dialog, nodes, progress, cues, draws, button, clickButton, advance,
    clickCanvas(x, y) { nodes.get('canvas').onclick({ clientX: x, clientY: y }); },
    hide() { document.hidden = true; events.get('visibilitychange')(); },
    get exitCount() { return exitCount; } };
}

test('aircraft and composing canvas hits cannot cancel a correct outgoing signal', () => {
  const q = beacon();
  q.clickButton('Send signal');
  assert.equal(q.button('Watch the aircraft').disabled, true);
  q.advance(100);
  for (const [x, y] of [[40, 60], [250, 220], [80, 150]]) q.clickCanvas(x, y);
  assert.match(q.nodes.get('.knock-feedback').textContent, /^Sending/);
  q.advance(2500);
  assert.equal(q.nodes.get('h2').textContent, 'The courier’s reply');
  assert.equal(q.progress.at(-1).signalSolved, true);
  assert.equal(q.progress.at(-1).bearing, 'east');
  assert.equal(q.progress.at(-1).signal, '.-.');
  assert.equal(q.cues.length, 3);
});

test('signal card remains readable during transmission without cancelling it', () => {
  const q = beacon();
  q.clickButton('Send signal');
  q.clickCanvas(200, 270);
  assert.match(q.nodes.get('.knock-feedback').textContent, /RIVER APPROACH/);
  q.advance(2500);
  assert.equal(q.progress.at(-1).signalSolved, true);
});

test('explicit close or tab hide cancels pending signal completion and cues', () => {
  for (const cancel of [q => q.dialog.close(), q => q.hide()]) {
    const q = beacon();
    q.clickButton('Send signal');
    q.advance(100);
    cancel(q);
    const cues = q.cues.length;
    q.advance(2500);
    assert.equal(q.progress.length, 0);
    assert.equal(q.cues.length, cues);
  }
});
