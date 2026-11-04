/* Local Web Audio renderer. Numbered dc: voices are decoded Macintosh disk
   recordings. The bell, pickup and call-and-answer tune are drawn in code. */
(function (global) {
  'use strict';

  const rate = 11025;
  const tau = Math.PI * 2;
  const lengths = {
    step: 0.25, keeperStep: 0.32, keeper: 0.78, bird: 0.86, knight: 0.32,
    bell: 2.6, gate: 2.18, pickup: 0.47, call: 1.42, answer: 1.78
  };
  const owner = {
    keeperStep: 'keeper', keeper: 'keeper', bird: 'bird', bell: 'bell', knight: 'knight'
  };
  const initialDelay = {keeper: 4.8, bird: 1.4, bell: 10.5, knight: 6};
  const period = {keeper: 12, bird: 5.6, bell: 24, knight: 15};
  // Assignments are adaptations. The disk's SOUN records have numeric IDs only.
  const casting = {step: 84, keeperStep: 0, keeper: 1, bird: 70, gate: 69, knight: 0};

  function envelope(t, attack, decay) {
    return t < 0 ? 0 : Math.min(1, t / attack) * Math.exp(-t / decay);
  }

  function sine(hz, t) {
    return Math.sin(tau * hz * t);
  }

  // A little air, an arcing pitch, then the dry tick of the winding pawl.
  function whistle(t, hz, duration) {
    if (t < 0 || t >= duration) return 0;
    const shape = Math.pow(Math.sin(Math.PI * t / duration), 0.8);
    const phase = tau * (hz * t - 5.2 * Math.exp(-t * 21) + 0.12 * sine(8, t));
    return shape * (Math.sin(phase) + 0.15 * Math.sin(2 * phase));
  }

  function chime(t, fundamental) {
    if (t < 0) return 0;
    return (0.6 * sine(fundamental, t) + 0.22 * sine(2.76 * fundamental, t) *
      Math.exp(-t * 2.3) + 0.15 * sine(4.13 * fundamental, t) * Math.exp(-t * 4.3)) *
      envelope(t, 0.004, 0.6);
  }

  function foot(t, noise, grain, heavy) {
    const toe = t - (heavy ? 0.1 : 0.074);
    const sole = sine(heavy ? 77 : 105, t) + 0.30 * sine(258, t);
    return (sole * 0.6 + grain * 1.1) * envelope(t, 0.005, 0.035) +
      (noise * 0.22 + grain * 0.6) * envelope(toe, 0.012, 0.037);
  }

  function drawSound(ctx, id) {
    const buffer = ctx.createBuffer(1, Math.ceil(lengths[id] * rate), rate);
    const samples = buffer.getChannelData(0);
    let seed = 271828 + id.charCodeAt(0);
    let low = 0, grain = 0, voicePhase = 0;
    const motif = id === 'call' ? [587.33, 698.46, 783.99, 587.33] :
      [783.99, 698.46, 587.33, 293.66];
    const noteTimes = [0.03, 0.28, 0.46, 0.93];
    for (let i = 0; i < samples.length; i++) {
      const t = i / rate;
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const noise = seed / 2147483648 - 1;
      low += (noise - low) * 0.105;
      grain += (noise - grain) * 0.34;
      let v = 0;
      switch (id) {
        case 'step':
        case 'keeperStep':
          v = 0.48 * foot(t, noise, grain, id === 'keeperStep');
          break;
        case 'keeper': {
          // A wordless, rising throat call. Three shifting vowel resonances
          // change the colour of a shared, slightly unsteady harmonic source.
          const vowel = Math.pow(Math.sin(Math.PI * t / lengths.keeper), 2);
          const pitch = 118 + 64 * t + 10 * Math.sin(t * 6) + 2 * sine(5, t);
          voicePhase += tau * pitch / rate;
          for (let k = 1; k <= 22; k++) {
            const h = k * pitch;
            const a = 0.22 * Math.exp(-Math.pow((h - (350 + 280 * vowel)) / 150, 2)) +
              0.13 * Math.exp(-Math.pow((h - (850 + 340 * vowel)) / 175, 2)) +
              0.04 * Math.exp(-Math.pow((h - 2050) / 220, 2));
            v += a * Math.sin(k * voicePhase);
          }
          v = (v + 0.12 * grain + 0.12 * Math.sin(voicePhase)) *
            Math.pow(vowel, 0.58) * (0.8 + 0.2 * sine(2, t));
          break;
        }
        case 'bird':
          v = 0.24 * whistle(t - 0.065, 1290, 0.16) +
            0.23 * whistle(t - 0.34, 1030, 0.23) +
            0.38 * noise * (envelope(t, 0.001, 0.016) + envelope(t - 0.64, 0.001, 0.014));
          break;
        case 'bell':
          v = 0.78 * chime(t, 329.63) + 0.12 * chime(t - 0.093, 329.9) +
            0.22 * grain * envelope(t, 0.001, 0.021);
          break;
        case 'gate': {
          const motion = Math.sin(Math.min(1, (t + 0.02) / 1.75) * Math.PI);
          const teeth = Math.pow(0.5 + 0.5 * sine(5.4, t + t * t * 0.09), 6);
          v = motion * ((0.4 + teeth * 0.7) * low + teeth * 0.18 * sine(79, t) +
            0.075 * Math.sin(tau * 215 * t + 2.4 * sine(9, t))) +
            envelope(t - 1.73, 0.004, 0.09) * (0.45 * sine(70, t) + 0.63 * grain);
          break;
        }
        case 'pickup':
          v = 0.44 * chime(t, 698.46) + 0.29 * chime(t - 0.13, 1046.5);
          break;
        case 'call':
        case 'answer':
          for (let n = 0; n < motif.length; n++) {
            const u = t - noteTimes[n];
            v += id === 'call' ? 0.33 * whistle(u, motif[n], n === 3 ? 0.39 : 0.17) :
              0.59 * chime(u, motif[n]);
          }
          break;
      }
      // Dry mono voices, coarse amplitude resolution, gently tapered tails.
      const edge = Math.min(1, i / 18, (samples.length - i - 1) / 150);
      samples[i] = Math.round(125 * Math.max(-1, Math.min(1, v)) * edge) / 125;
    }
    return buffer;
  }

  function validPoint(p) {
    return p && Number.isFinite(p.x) && Number.isFinite(p.z);
  }

  class VaultAudio {
    static get archiveIds() {
      return Object.keys(global.DarkCastlePCM || {}).map(Number).sort((a, b) => a - b);
    }

    constructor() {
      this.ctx = null;
      this.buffers = {};
      this.tracks = {};
      this.next = {};
      this.positions = {};
      this.listener = {x: 0, z: 0, yaw: 0};
      this.muted = false;
      this.paused = false;
      // 50 is the original mix. Both channels start 20% above that level.
      this.volumes = {effects: 60, music: 60};
      this.buses = {};
      this.onCue = null;
      this.walkPhase = 0;
      this.keeperDistance = 0;
      this.voices = new Set();
    }

    async start() {
      const Audio = global.AudioContext || global.webkitAudioContext;
      if (!Audio) return false;
      if (!this.ctx) {
        this.ctx = new Audio();
        const ctx = this.ctx;
        this.master = ctx.createGain();
        this.master.gain.value = this.muted || this.paused ? 0 : 0.88;
        // Leave the mix linear below 90% of full scale. Round the last tenth
        // to a flat slope at 95%, so overlapping peaks have a soft ceiling.
        const peaks = ctx.createWaveShaper();
        peaks.curve = Float32Array.from({length: 2049}, (_, i) => {
          const x = i / 1024 - 1, excess = Math.max(0, Math.abs(x) - 0.90);
          return x - Math.sign(x) * 5 * excess * excess;
        });
        this.master.connect(peaks);
        peaks.connect(ctx.destination);
        for (const [channel, percent] of Object.entries(this.volumes)) {
          const bus = this.buses[channel] = ctx.createGain();
          bus.gain.value = percent / 50;
          bus.connect(this.master);
        }
        for (const id of VaultAudio.archiveIds) {
          const pcm = global.atob(global.DarkCastlePCM[id]);
          const b = ctx.createBuffer(1, pcm.length, rate);
          const samples = b.getChannelData(0);
          for (let i = 0; i < pcm.length; i++) samples[i] = (pcm.charCodeAt(i) - 128) / 128;
          this.buffers['dc:' + id] = b;
        }
        for (const id of Object.keys(lengths)) {
          this.buffers[id] = this.buffers['dc:' + casting[id]] || drawSound(ctx, id);
        }
        for (const id of Object.keys(initialDelay)) this.tracks[id] = this.panner();
      }
      if (this.ctx.state !== 'running') await this.ctx.resume();
      return this.ctx.state === 'running';
    }

    panner() {
      const node = this.ctx.createPanner();
      node.panningModel = 'HRTF';
      node.distanceModel = 'inverse';
      node.refDistance = 2.5;
      node.rolloffFactor = 0.58;
      node.connect(this.buses.effects);
      return node;
    }

    place(node, point) {
      const time = this.ctx.currentTime;
      node.positionX.setTargetAtTime(point.x, time, 0.018);
      node.positionZ.setTargetAtTime(-point.z, time, 0.018);
    }

    mute(value = true) {
      this.muted = Boolean(value);
      this.level();
    }

    setVolume(channel, value) {
      const percent = Number(value);
      if (!Object.hasOwn(this.volumes, channel) || !Number.isFinite(percent)) return;
      this.volumes[channel] = Math.max(0, Math.min(100, percent));
      const gain = this.buses[channel]?.gain;
      if (gain) gain.setTargetAtTime(this.volumes[channel] / 50, this.ctx.currentTime, 0.018);
    }

    pause(value = true) {
      this.paused = Boolean(value);
      this.next = {};
      this.keeperDistance = 0;
      this.level();
    }

    level() {
      if (!this.ctx) return;
      const gain = this.master.gain;
      const time = this.ctx.currentTime;
      gain.cancelScheduledValues(time);
      gain.setTargetAtTime(this.muted || this.paused ? 0 : 0.88, time, 0.018);
    }

    leaveRoom() {
      for (const source of this.voices) source.stop();
      this.next = {};
      this.positions = {};
      this.keeperDistance = 0;
    }

    update(listener, positions = {}, active = {}) {
      if (!this.ctx || this.paused || !validPoint(listener) || !Number.isFinite(listener.yaw)) return;
      this.listener = listener;
      const ctx = this.ctx;
      const ear = ctx.listener;
      const now = ctx.currentTime;
      ear.positionX.value = listener.x;
      ear.positionZ.value = -listener.z;
      ear.forwardX.value = Math.sin(listener.yaw);
      ear.forwardZ.value = -Math.cos(listener.yaw);
      const previous = this.positions.keeper;
      // Copy source coordinates: game entities may be mutated in place.
      this.positions = {};
      for (const id of Object.keys(initialDelay)) {
        const p = positions[id];
        if (!validPoint(p)) {
          delete this.next[id];
          continue;
        }
        this.positions[id] = {x: p.x, z: p.z};
        this.place(this.tracks[id], p);
        if (active[id] === false) {
          delete this.next[id];
          continue;
        }
        if (id === 'keeper' && previous) {
          const moved = Math.hypot(p.x - previous.x, p.z - previous.z);
          if (moved < 2) this.keeperDistance += moved;
          if (this.keeperDistance > 0.88) {
            this.keeperDistance = 0;
            this.play('keeperStep');
          }
        }
        if (this.next[id] === undefined) this.next[id] = now + initialDelay[id];
        if (now >= this.next[id]) {
          this.play(id);
          this.next[id] = now + period[id] + Math.random() * (id === 'knight' ? 3 : 2);
        }
      }
    }

    play(id, point) {
      if (!this.ctx || this.paused || !this.buffers[id]) return;
      const source = this.ctx.createBufferSource();
      source.buffer = this.buffers[id];
      let destination = this.buses.effects;
      let temporary = null;
      let trim = null;
      if (validPoint(point) && Math.hypot(point.x - this.listener.x, point.z - this.listener.z) > 0.1) {
        temporary = this.panner();
        temporary.positionX.value = point.x;
        temporary.positionZ.value = -point.z;
        destination = temporary;
      } else if (!validPoint(point) && this.positions[owner[id]]) {
        destination = this.tracks[owner[id]];
      }
      if (id === 'step' || id === 'keeperStep') {
        this.walkPhase++;
        source.playbackRate.value = (this.walkPhase % 2 ? 0.94 : 1.04) + Math.random() * 0.04;
      }
      if (id === 'step') {
        trim = this.ctx.createGain();
        trim.gain.value = 0.30;
        trim.connect(destination);
        destination = trim;
      }
      source.connect(destination);
      source.onended = () => {
        this.voices.delete(source);
        source.disconnect();
        if (temporary) temporary.disconnect();
        if (trim) trim.disconnect();
      };
      this.voices.add(source);
      source.start();
      if (this.onCue) this.onCue(id, point || this.positions[owner[id]] || this.listener);
    }
  }

  global.VaultAudio = VaultAudio;
})(window);
