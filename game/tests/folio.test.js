const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = readFileSync(path.join(__dirname, '..', 'folio.js'), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));

// Resolve individual disk images in any order, as on a slow first visit.
function harness(initialTab) {
  const images = [];
  class Element {
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.listeners = new Map();
      this.attributes = new Map();
      this.textContent = '';
      this.draws = [];
    }
    append(...children) {
      for (const child of children) { child.parent = this; this.children.push(child); }
    }
    replaceChildren(...children) {
      for (const child of this.children) child.parent = null;
      this.children = [];
      this.append(...children);
    }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name); }
    addEventListener(name, callback) {
      if (!this.listeners.has(name)) this.listeners.set(name, []);
      this.listeners.get(name).push(callback);
    }
    dispatch(name) { for (const callback of this.listeners.get(name) || []) callback({}); }
    click() { this.dispatch('click'); }
    focus() {}
    get isConnected() { return this.mounted === true || Boolean(this.parent?.isConnected); }
    getContext() {
      return { clearRect() {}, fillRect() {}, drawImage: image => this.draws.push(image.src) };
    }
  }
  class DeferredImage extends Element {
    constructor() { super('img'); images.push(this); }
  }
  const mount = new Element('main');
  mount.mounted = true;
  const dialog = new Element('dialog');
  const context = {
    window: { matchMedia: () => ({ matches: true }) },
    document: { createElement: tag => new Element(tag) },
    Image: DeferredImage,
    Date: class extends Date { constructor() { super('2026-11-04T12:00:00Z'); } },
    requestAnimationFrame() { throw new Error('Reduced-motion tests should not animate.'); },
    cancelAnimationFrame() {}
  };
  vm.runInNewContext(source, context, { filename: 'game/folio.js' });
  context.window.SiliconFolio.open({
    initialTab, dialogEl: dialog,
    openDialog(_title, root) { mount.replaceChildren(root); dialog.open = true; }
  });
  const all = node => [node, ...node.children.flatMap(all)];
  const find = predicate => all(mount).find(predicate);
  return {
    button: text => find(node => node.tagName === 'BUTTON' && (typeof text === 'string' ? node.textContent === text : text.test(node.textContent))),
    canvas: () => find(node => node.tagName === 'CANVAS'),
    load(src) {
      const pending = images.filter(image => image.src === src && image.onload && !image.loaded);
      assert.ok(pending.length, 'Expected pending image: ' + src);
      for (const image of pending) { image.loaded = true; image.onload(); }
    },
    close() { dialog.open = false; dialog.dispatch('close'); },
    replaceDialog() { mount.replaceChildren(new Element('section')); }
  };
}

for (const scene of [
  {
    name: 'Great Hall tree', tab: 'hall', toggle: /Holiday tree/,
    base: 'archive/dc/paper/Data-A-PICT-10000.png',
    overlay: 'archive/dc/paper/Data-A-PICT-10004.png'
  },
  {
    name: 'stored night sky', tab: 'notes', toggle: /Overlay stored night sky/,
    base: 'archive/es/plates/ASCN-24035.png',
    overlay: 'archive/es/plates/AOBJ-29156.png'
  }
]) {
  test(scene.name + ': a late overlay cannot undo a newer off selection', async () => {
    const h = harness(scene.tab), canvas = h.canvas(), toggle = h.button(scene.toggle);
    h.load(scene.base);
    await flush();
    toggle.click();
    toggle.click();
    await flush();
    assert.equal(toggle.getAttribute('aria-pressed'), 'false');
    assert.equal(canvas.draws.at(-1), scene.base);
    const paints = canvas.draws.length;
    h.load(scene.overlay);
    await flush();
    assert.equal(canvas.draws.length, paints, 'Discard the obsolete image completion.');
    toggle.click();
    await flush();
    assert.equal(toggle.getAttribute('aria-pressed'), 'true');
    assert.equal(canvas.draws.at(-1), scene.overlay, 'The cached image still works for the current on selection.');
  });
}

test('switching tabs or closing the folio invalidates pending picture loads', async () => {
  for (const leave of [h => h.button('Manual cards').click(), h => h.close(), h => h.replaceDialog()]) {
    const h = harness('notes'), canvas = h.canvas();
    h.button(/Overlay stored night sky/).click();
    leave(h);
    h.load('archive/es/plates/ASCN-24035.png');
    h.load('archive/es/plates/AOBJ-29156.png');
    await flush();
    assert.deepEqual(canvas.draws, []);
  }
});
