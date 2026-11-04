// Run with node --test audio/test_music.js. No browser, fetch, or audio device.
'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sandbox = {window: {}, console: {warn() {}, error() {}}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'region-music.js'), 'utf8'), sandbox);
const {RegionMusic} = sandbox.window;
const hall = {id: 22844, name: 'marble hall'};
const throne = {id: 17888, name: 'throne room'};
const altar = {id: 7990, name: 'high altar'};
const sea = {id: 20431, name: 'deck', sound: 'bubbles'};
const finale = {id: 18366, name: 'Finale'};
const settle = () => new Promise(resolve => setImmediate(resolve));

function node(properties = {}) {
  return {
    connect(next) { this.output = next; return next; },
    disconnect() { this.output = null; },
    ...properties
  };
}

function fixture() {
  const voices = [], reads = [];
  const ctx = {
    currentTime: 5,
    state: 'running',
    createGain() {
      const events = [];
      function automate(value, time) {
        events.push({value, time});
        this.value = value;
      }
      return node({gain: {
        value: 1, events,
        cancelScheduledValues() {}, cancelAndHoldAtTime() {},
        setValueAtTime: automate, linearRampToValueAtTime: automate, setTargetAtTime: automate
      }});
    },
    createBufferSource() {
      const source = node({
        starts: 0, stopAt: null,
        start() { this.starts++; },
        stop(when = ctx.currentTime) { this.stopAt = when; }
      });
      voices.push(source);
      return source;
    }
  };
  const vault = {ctx, master: node(), muted: false, paused: false};
  // SceneSound.buffer() owns the decoded/pending cache and evicts failed reads.
  const cache = new Map();
  const load = resource => {
    if (!cache.has(resource.path)) {
      const pending = new Promise((resolve, reject) => {
        const buffer = {duration: 48, resource};
        reads.push({buffer, complete: () => resolve(buffer), fail: () => {
          cache.delete(resource.path);
          reject(Error('decode failed'));
        }});
      });
      cache.set(resource.path, pending);
    }
    return cache.get(resource.path);
  };
  const music = new RegionMusic(vault, load);
  return {music, vault, ctx, voices, reads};
}

test('off is silent; an opted-in region plays one quiet looping source through master', async () => {
  const {music, vault, ctx, voices, reads} = fixture();
  assert.equal(music.enabled, false);
  music.setRoom(hall);
  music.sync();
  await settle();
  assert.equal(reads.length, 0);

  // Setting a preference on the cover cannot create an AudioContext or fetch a bed.
  vault.ctx = null;
  music.setEnabled(true);
  await settle();
  assert.equal(reads.length, 0);
  vault.ctx = ctx;
  music.sync();
  music.setRoom(throne);
  music.sync();
  await settle();
  assert.equal(reads.length, 1);
  assert.match(reads[0].buffer.resource.path, /\/violet-stone\.wav$/);
  reads[0].complete();
  await settle();
  assert.equal(voices.length, 1);
  const voice = voices[0];
  assert.equal(voice.buffer, reads[0].buffer);
  assert.equal(voice.starts, 1);
  assert.equal(voice.loop, true);
  const gain = voice.output;
  assert.ok(gain.gain.value > 0 && gain.gain.value < 1);
  assert.equal(gain.output, vault.master);

  const normalVolume = gain.gain.value;
  music.setRoom(altar);
  await settle();
  assert.ok(gain.gain.value < normalVolume && gain.gain.value > 0, 'the Altar voice takes priority');
  assert.equal(voice.stopAt, null);
  music.setRoom(hall);
  music.setRoom(hall);
  await settle();
  assert.equal(voice.stopAt, null);
  assert.equal(voices.length, 1);
  music.setRoom(finale);
  await settle();
  assert.ok(voice.stopAt > ctx.currentTime, 'leaving a scored region fades before stopping');
  assert.ok(gain.gain.events.some(e => e.value === 0 && e.time >= ctx.currentTime));
  music.setRoom(throne);
  await settle();
  assert.equal(reads.length, 1, 'decoded track reused');
  assert.equal(voices.length, 2);
  voice.onended?.();
  music.sync();
  assert.equal(voices.length, 2);
  assert.equal(voices[1].stopAt, null, 'old source cleanup cannot silence the new source');
});

test('an old decode completing after the new region cannot take over', async () => {
  const {music, voices, reads} = fixture();
  music.setEnabled(true);
  await settle();
  assert.equal(reads.length, 0, 'the cover has no playback room');
  music.setRoom(hall);
  await settle();
  music.setRoom(sea);
  await settle();
  assert.equal(reads.length, 2);
  assert.match(reads[1].buffer.resource.path, /\/soundings\.wav$/);
  reads[1].complete();
  await settle();
  reads[0].complete();
  await settle();
  assert.equal(voices.length, 1);
  assert.equal(voices[0].buffer, reads[1].buffer);
  assert.equal(voices[0].stopAt, null);
  music.setRoom(null);
  assert.notEqual(voices[0].stopAt, null);
});

test('switching off mid-load cannot start music after opt-out', async () => {
  const {music, voices, reads} = fixture();
  music.setRoom(hall);
  music.setEnabled(true);
  await settle();
  music.setEnabled(false);
  reads[0].complete();
  await settle();
  assert.equal(voices.length, 0);
  music.setEnabled(true);
  await settle();
  assert.equal(reads.length, 1);
  assert.equal(voices.length, 1);
  music.setEnabled(false);
  assert.notEqual(voices[0].stopAt, null);
});

test('fast return across the hall/sea boundary retires the older fade', async () => {
  const {music, voices, reads, ctx} = fixture();
  music.setEnabled(true);
  music.setRoom(hall);
  await settle();
  reads[0].complete();
  await settle();
  music.setRoom(sea);
  await settle();
  reads[1].complete();
  await settle();
  assert.ok(voices[0].stopAt > ctx.currentTime);
  music.setRoom(throne);
  await settle();
  assert.equal(voices[0].stopAt, ctx.currentTime);
  assert.ok(voices[1].stopAt > ctx.currentTime);
  assert.equal(voices[2].buffer, reads[0].buffer);
  voices[0].onended();
  voices[1].onended();
  music.sync();
  assert.equal(voices.length, 3);
  assert.equal(voices[2].stopAt, null);
});

test('master mute and a suspended dialog suppress a pending start', async () => {
  for (const reason of ['muted', 'paused']) {
    const {music, vault, ctx, voices, reads} = fixture();
    vault[reason] = true;
    if (reason === 'paused') ctx.state = 'suspended';
    music.setRoom(hall);
    music.setEnabled(true);
    await settle();
    assert.equal(reads.length, 0);
    vault[reason] = false;
    ctx.state = 'running';
    music.sync();
    await settle();
    vault[reason] = true;
    if (reason === 'paused') ctx.state = 'suspended';
    music.sync();
    reads[0].complete();
    await settle();
    assert.equal(voices.length, 0);
    vault[reason] = false;
    ctx.state = 'running';
    music.sync();
    await settle();
    assert.equal(voices.length, 1);
    assert.equal(reads.length, 1);
    vault[reason] = true;
    if (reason === 'paused') ctx.state = 'suspended';
    music.sync();
    if (reason === 'paused') {
      assert.equal(voices[0].stopAt, null, 'context suspension preserves the loop position');
    } else {
      assert.notEqual(voices[0].stopAt, null);
    }
  }
});

test('failed loading recovers on a later opt-in', async () => {
  const {music, voices, reads} = fixture();
  music.setRoom(hall);
  music.setEnabled(true);
  await settle();
  reads[0].fail();
  await settle();
  assert.equal(voices.length, 0);
  music.setEnabled(false);
  music.setEnabled(true);
  await settle();
  assert.equal(reads.length, 2);
  reads[1].complete();
  await settle();
  assert.equal(voices.length, 1);
});
