const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = readFileSync(path.join(__dirname, '..', 'play.js'), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));

// Exercise the host's actual Folio callbacks without constructing an AudioContext.
// Deliberately hold start() pending to model a browser's blocked resume/load.
function section(start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, 'Missing host section: ' + start);
  return source.slice(from, to);
}

function harness() {
  class Element {
    constructor() { this.listeners = new Map(); this.children = []; this.value = ''; }
    addEventListener(name, fn) {
      if (!this.listeners.has(name)) this.listeners.set(name, []);
      this.listeners.get(name).push(fn);
    }
    dispatch(name) { for (const fn of this.listeners.get(name) || []) fn({ target: this }); }
    replaceChildren(...children) { this.children = children; }
    querySelector(selector) {
      return selector === '.folio' ? this.children.find(node => node.classList?.contains('folio')) || null : null;
    }
    setAttribute() {}
    focus() {}
    showModal() { this.open = true; }
    close() { this.open = false; this.dispatch('close'); }
    get valueAsNumber() { return Number(this.value); }
  }
  const nodes = new Map();
  const get = id => {
    if (!nodes.has(id)) nodes.set(id, new Element());
    return nodes.get(id);
  };
  const document = new Element();
  document.hidden = false;
  const vaults = [];
  class FakeVault {
    constructor() {
      this.pending = []; this.played = []; this.volumes = {}; this.voices = new Set();
      this.paused = false; this.muted = false; this.stopped = 0;
      vaults.push(this);
    }
    start() { return new Promise(resolve => this.pending.push(resolve)); }
    mute(value) { this.muted = value; }
    pause(value) { this.paused = value; }
    leaveRoom() { this.stopped += this.voices.size; this.voices.clear(); }
    setVolume(channel, value) { this.volumes[channel] = Number(value); }
    play(id) { this.played.push(id); this.voices.add(id); }
  }
  const sound = {
    vault: { volumes: { effects: 60, music: 60 } },
    music: { setEnabled() {} },
    mute() {}, pause() {},
    setVolume(channel, value) { this.vault.volumes[channel] = Number(value); }
  };
  let callbacks;
  const SiliconFolio = {
    clearLoop() {},
    open(options) {
      callbacks = options;
      options.onStopCue?.();
      options.openDialog('Archive folio', { classList: { contains: name => name === 'folio' } });
    }
  };
  const context = {
    document, VaultAudio: FakeVault, sound, SiliconFolio,
    window: { SiliconFolio }, $: get, keys: new Set(),
    audioSetting: () => null, saveAudioSetting() {}, playing: true, muted: false
  };
  context.castleOpen = false; // The close handler also knows about The Enchanted Castle.
  vm.createContext(context);
  const actual = [
    section('  let folioVault=', '  async function api('),
    section('  function openFolio(', '  function soundtrackCredits('),
    section('  function setMasterMute(', '  function activateAudio('),
    section('  function initAudio(', "  $('homeView').onclick="),
    section("  document.addEventListener('visibilitychange',", '  function direction(')
  ].join('\n');
  vm.runInContext(actual, context, { filename: 'game/play.js (Folio audio integration)' });
  vm.runInContext('initAudio(); openFolio();', context);
  return {
    document, node: get, vaults,
    cue: id => callbacks.onCue(id),
    stop: () => callbacks.onStopCue(),
    setMuted: value => context.setMasterMute(value),
    hide() { document.hidden = true; document.dispatch('visibilitychange'); },
    close() { get('dialog').close(); },
    reopen() { context.openFolio(); },
    replace() { context.openDialog('Field guide', {}); },
    resolve(index = 0) { vaults[0].pending[index](true); }
  };
}

test('a pending Archive cue cannot start after the tab hides', async () => {
  for (const visibilityEvent of [false, true]) {
    const h = harness();
    h.cue('dc:94');
    if (visibilityEvent) h.hide(); else h.document.hidden = true;
    h.resolve(); await flush();
    assert.deepEqual(h.vaults[0].played, []);
  }
});

test('mute, dialog close/reopen, replacement and tab changes invalidate an old pending cue', async () => {
  for (const cancel of [
    h => { h.setMuted(true); h.setMuted(false); },
    h => { h.close(); h.reopen(); },
    h => h.replace(),
    h => h.stop()
  ]) {
    const h = harness();
    h.cue('dc:94'); cancel(h);
    h.resolve(); await flush();
    assert.deepEqual(h.vaults[0].played, []);
  }
});

test('only the latest requested specimen plays and leaving stops active voices', async () => {
  const h = harness();
  h.cue('dc:94'); h.cue('dc:70');
  h.resolve(1); await flush();
  h.resolve(0); await flush();
  assert.deepEqual(h.vaults[0].played, ['dc:70']);
  assert.equal(h.vaults[0].voices.size, 1);
  h.stop();
  assert.equal(h.vaults[0].voices.size, 0);
  assert.equal(h.vaults[0].paused, true);
  assert.equal(h.vaults[0].stopped, 1);
});

test('hiding the tab stops an already playing Archive voice without restarting it', async () => {
  const h = harness();
  h.cue('dc:94'); h.resolve(); await flush();
  h.hide();
  assert.equal(h.vaults[0].voices.size, 0);
  assert.equal(h.vaults[0].stopped, 1);
  h.document.hidden = false; h.document.dispatch('visibilitychange');
  assert.deepEqual(h.vaults[0].played, ['dc:94']);
  assert.equal(h.vaults[0].paused, true);
});

test('the live Effects slider also adjusts the independent Archive renderer', async () => {
  const h = harness();
  h.cue('dc:94');
  assert.equal(h.vaults[0].volumes.effects, 60);
  const effects = h.node('effectsVolume');
  effects.value = '0'; effects.oninput();
  assert.equal(h.vaults[0].volumes.effects, 0);
  effects.value = '85'; effects.oninput();
  assert.equal(h.vaults[0].volumes.effects, 85);
  const music = h.node('musicVolume');
  music.value = '10'; music.oninput();
  assert.equal(h.vaults[0].volumes.effects, 85);
  h.resolve(); await flush();
  assert.deepEqual(h.vaults[0].played, ['dc:94']);
});

test('muted or hidden Archive clicks do not start a second audio renderer', () => {
  const h = harness();
  h.setMuted(true); h.cue('dc:94');
  h.setMuted(false); h.document.hidden = true; h.cue('dc:70');
  assert.equal(h.vaults.length, 0);
});
