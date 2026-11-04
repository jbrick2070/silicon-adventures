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
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'vault-audio.js'), 'utf8'), sandbox);
sandbox.VaultAudio = sandbox.window.VaultAudio;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../game/spatial.js'), 'utf8'), sandbox);
const {SceneSound} = sandbox.window;
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
        starts: 0, offset: null, stopAt: null, loop: false,
        start(when = 0, offset = 0) { this.starts++; this.offset = offset; },
        stop(when = ctx.currentTime) { this.stopAt = when; }
      });
      voices.push(source);
      return source;
    }
  };
  const vault = {ctx, master: node(), buses: {music: node()}, muted: false, paused: false};
  vault.buses.music.connect(vault.master);
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

test('score defaults on; switching it off is silent and on plays through the music bus', async () => {
  const {music, vault, ctx, voices, reads} = fixture();
  assert.equal(music.enabled, true);
  music.setEnabled(false);
  assert.equal(music.nowPlaying, null);
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
  assert.match(reads[0].buffer.resource.path, /\/heros-quest\.wav$/);
  assert.equal(music.nowPlaying, null, 'pending decode is not now playing');
  reads[0].complete();
  await settle();
  assert.equal(voices.length, 1);
  const voice = voices[0];
  assert.equal(voice.buffer, reads[0].buffer);
  assert.equal(voice.starts, 1);
  assert.equal(voice.loop, false);
  assert.equal(music.nowPlaying, reads[0].buffer.resource);
  const gain = voice.output;
  assert.ok(gain.gain.value > 0 && gain.gain.value < 1);
  assert.equal(gain.output, vault.buses.music);
  assert.equal(vault.buses.music.output, vault.master);

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
  assert.equal(music.nowPlaying, null);
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
  assert.match(reads[1].buffer.resource.path, /\/submerged-bell\.wav$/);
  reads[1].complete();
  await settle();
  reads[0].complete();
  await settle();
  assert.equal(voices.length, 1);
  assert.equal(voices[0].buffer, reads[1].buffer);
  assert.equal(music.nowPlaying, reads[1].buffer.resource);
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
  assert.equal(music.nowPlaying, null);
  music.setEnabled(true);
  await settle();
  assert.equal(reads.length, 1);
  assert.equal(voices.length, 1);
  music.setEnabled(false);
  assert.notEqual(voices[0].stopAt, null);
  assert.equal(music.nowPlaying, null);
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
  voices[0].onended?.();
  voices[1].onended?.();
  music.sync();
  await settle();
  assert.equal(voices.length, 3);
  assert.equal(reads.length, 2, 'stopped tracks must not advance their playlists');
  assert.equal(music.nowPlaying, reads[0].buffer.resource);
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
    assert.equal(music.nowPlaying, null);
    vault[reason] = false;
    ctx.state = 'running';
    music.sync();
    await settle();
    assert.equal(voices.length, 1);
    assert.equal(reads.length, 1);
    assert.equal(music.nowPlaying, reads[0].buffer.resource);
    vault[reason] = true;
    if (reason === 'paused') ctx.state = 'suspended';
    music.sync();
    assert.equal(music.nowPlaying, null);
    if (reason === 'paused') {
      assert.equal(voices[0].stopAt, null, 'context suspension preserves the playhead');
      vault.paused = false;
      ctx.state = 'running';
      music.sync();
      await settle();
      assert.equal(music.nowPlaying, reads[0].buffer.resource);
      assert.equal(voices.length, 1);
    } else {
      assert.notEqual(voices[0].stopAt, null);
    }
  }
});

test('a failed track falls back to its regional companion', async () => {
  const {music, voices, reads} = fixture();
  music.setRoom(hall);
  music.setEnabled(true);
  await settle();
  reads[0].fail();
  await settle();
  assert.equal(voices.length, 0);
  assert.equal(reads.length, 2);
  assert.match(reads[1].buffer.resource.path, /\/violet-stone\.wav$/);
  reads[1].complete();
  await settle();
  assert.equal(voices.length, 1);
  assert.equal(music.nowPlaying, reads[1].buffer.resource);
});

test('two failed decodes terminate the rotation and a later opt-in retries', async () => {
  const {music, voices, reads} = fixture();
  music.setRoom(hall);
  music.setEnabled(true);
  await settle();
  reads[0].fail();
  await settle();
  reads[1].fail();
  await settle();
  assert.equal(voices.length, 0);
  assert.equal(music.nowPlaying, null);
  assert.equal(reads.length, 2, 'do not loop through failed tracks indefinitely');
  music.setEnabled(false);
  music.setEnabled(true);
  await settle();
  assert.equal(reads.length, 3);
  reads[2].complete();
  await settle();
  assert.equal(voices.length, 1);
  assert.equal(music.nowPlaying, reads[2].buffer.resource);
});

test('a natural ending advances and wraps each regional pair', async () => {
  for (const [room, names] of [[hall, ["Hero's Quest", 'Violet Stone']], [sea, ['Submerged Bell', 'Soundings']]]) {
    const {music, ctx, voices, reads} = fixture();
    music.setRoom(room);
    music.setEnabled(true);
    await settle();
    for (let i = 0; i < 3; i++) {
      if (i < 2) reads[i].complete();
      await settle();
      const track = music.nowPlaying;
      assert.equal(track.title.replace(/’/g, "'"), names[i % 2]);
      assert.ok(track.credit);
      assert.equal(voices[i].buffer.resource, track);
      assert.equal(voices[i].loop, false);
      assert.equal(voices[i].offset, 0, 'each new song starts at the beginning');
      if (i < 2) {
        ctx.currentTime += voices[i].buffer.duration;
        voices[i].onended();
        await settle();
      }
    }
    assert.equal(reads.length, 2, 'wrapping reuses the decoded resource');
  }
});

test('each region saves its own track and playhead until a fresh journey', async () => {
  const {music, ctx, voices, reads} = fixture();
  music.setEnabled(true);
  music.setRoom(hall);
  await settle();
  reads[0].complete();
  await settle();
  ctx.currentTime += voices[0].buffer.duration;
  voices[0].onended();
  await settle();
  reads[1].complete();
  await settle();
  ctx.currentTime += 12;
  music.setRoom(sea);
  await settle();
  reads[2].complete();
  await settle();
  ctx.currentTime += 7;
  music.setRoom(throne);
  await settle();
  assert.equal(music.nowPlaying, reads[1].buffer.resource, 'return to the second hall track');
  assert.equal(voices[3].offset, 12);
  ctx.currentTime += 2;
  music.setRoom(sea);
  await settle();
  assert.equal(music.nowPlaying, reads[2].buffer.resource);
  assert.equal(voices[4].offset, 7);
  music.setRoom(hall);
  await settle();
  assert.equal(voices[5].offset, 14, 'accumulate time across separate visits');

  music.setRoom(null);
  assert.equal(music.nowPlaying, null);
  music.setRoom(sea);
  await settle();
  assert.equal(voices[6].offset, 0);
  music.setRoom(hall);
  await settle();
  assert.equal(music.nowPlaying, reads[0].buffer.resource, 'new journey starts with the first track');
  assert.equal(voices[7].offset, 0);
});

test('independent levels trim dry, spatial and Vault effects separately from the regional score', async () => {
  const {ctx, voices} = fixture();
  const param = () => ({value: 0});
  Object.assign(ctx, {
    destination: node(),
    createBuffer(channels, length) { return {getChannelData: () => new Float32Array(length)}; },
    createPanner() { return node({positionX: param(), positionZ: param()}); },
    createWaveShaper() { return node(); }
  });
  sandbox.window.AudioContext = function () { return ctx; };
  const sound = new SceneSound(), vault = sound.vault;
  assert.equal(vault.muted, false);
  assert.equal(vault.volumes.effects, 60);
  assert.equal(vault.volumes.music, 60);
  sound.mute(true);
  await sound.start();
  const {effects, music} = vault.buses;
  assert.equal(effects.gain.value, 1.2);
  assert.equal(music.gain.value, 1.2);
  assert.equal(vault.master.gain.value, 0, 'a previously muted tab starts its graph silently');
  assert.equal(effects.output, vault.master);
  assert.equal(music.output, vault.master);
  assert.equal(vault.master.output.output, ctx.destination);
  const peaks = vault.master.output.curve;
  assert.equal(peaks[1024 + 256], 0.25, 'ordinary signals receive no peak makeup gain');
  assert.ok(Math.abs(peaks.at(-1) - 0.95) < 1e-6, 'overlapping peaks leave output headroom');

  sound.mute(false);
  assert.equal(vault.master.gain.value, 0.88);
  const buffer = {duration: 48};
  const dry = sound.emitDry(buffer, 0, 0.62), spatial = sound.emit(buffer, {x:1,z:3}, 0, 0.82);
  assert.equal(dry.output.output, effects, 'non-spatial disk cue');
  assert.equal(spatial.output.output.output, effects, 'spatial disk cue');
  sound.effect('bell');
  assert.equal(voices.at(-1).output, effects, 'Vault cue at the listener');

  sound.buffer = async () => buffer;
  sound.music.setRoom(hall);
  await settle();
  const song = voices.at(-1);
  assert.equal(song.output.output, music);
  assert.equal(song.output.gain.value, 0.10);
  sound.setVolume('effects', -1);
  assert.equal(effects.gain.value, 0);
  assert.equal(music.gain.value, 1.2);
  sound.setVolume('music', 500);
  assert.equal(music.gain.value, 2);
  assert.equal(effects.gain.value, 0);
  sound.music.setRoom(altar);
  assert.equal(song.output.gain.value, 0.035, 'Altar ducking stays upstream of the slider');
  sound.setVolume('music', 0);
  sound.setVolume('effects', 50);
  assert.equal(music.gain.value, 0);
  assert.equal(effects.gain.value, 1);
  assert.equal(song.stopAt, null, 'volume changes preserve the playhead');
  sound.mute(true);
  assert.equal(vault.master.gain.value, 0);
  assert.equal(effects.gain.value, 1);
  assert.equal(music.gain.value, 0);
});

test('a new gesture can unlock a pending resume without replaying an old room', async () => {
  const sound = new SceneSound();
  let unlock;
  const blocked = new Promise(resolve => { unlock = resolve; });
  sound.vault.ctx = {state:'suspended', resume() { this.state = 'running'; unlock(true); return blocked; }};
  sound.vault.start = () => blocked;
  sound.library.set('bell', {name:'Bell'});
  sound.scene(hall);
  const first = sound.start();
  sound.events(['Bell'], {x:0,z:0});
  assert.equal(sound.pending.length, 1);
  sound.scene(sea);
  assert.equal(sound.pending.length, 0);
  const second = sound.start();
  assert.equal(first, second);
  assert.equal(await second, true);
});
