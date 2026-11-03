/* First-person audio for the local game server. Original ES room timing is
   interpreted from ASCN. Emitter coordinates are assigned in this adaptation. */
class SceneSound {
  constructor() {
    this.vault = new VaultAudio();
    this.vault.onCue = (id, point) => {
      const names = {keeper: 'A voice', keeperStep: 'A footfall', bird: 'Two high notes',
        bell: 'A bell', gate: 'A mechanism', call: 'A call', answer: 'An answer'};
      if (this.onCaption && id !== 'step') this.onCaption(names[id] || id, point);
    };
    this.onCaption = null;
    this.library = new Map((window.ES_SOUNDS || []).map(r => [r.name.trim().toLowerCase(), r]));
    this.decoded = new Map();
    this.order = Promise.resolve();
    this.pending = [];
    this.captions = [];
    this.ambientSources = new Set();
    this.room = null;
    this.generation = 0;
    this.listener = {x:0,z:0,yaw:0};
    this.paused = false;
    this.started = false;
    this.starting = null;
    this.queueEnd = 0;
  }

  start() {
    if (this.starting) return this.starting;
    this.starting = this.vault.start().then(async ready => {
      this.started = ready;
      if (!ready) return false;
      if (this.paused) await this.vault.ctx.suspend();
      for (const [names,point] of this.pending.splice(0)) this.events(names,point);
      return true;
    }).finally(() => { this.starting = null; });
    return this.starting;
  }

  mute(value) { this.vault.mute(value); }

  pause(value) {
    const paused = Boolean(value);
    if (this.paused === paused) return;
    this.paused = paused;
    this.vault.pause(paused);
    if (this.started) {
      const ctx = this.vault.ctx;
      if (paused) ctx.suspend().catch(() => {});
      else ctx.resume().catch(() => {});
    }
  }

  scene(meta) {
    if (this.room && this.room.id === meta?.id) return;
    this.generation++;
    for (const source of this.ambientSources) source.stop();
    this.ambientSources.clear();
    this.vault.leaveRoom();
    this.room = meta || null;
    this.minute = null;
    this.ticks = [];
  }

  point(point) {
    if (point && Number.isFinite(point.x) && Number.isFinite(point.z)) return {x:point.x,z:point.z};
    return {x:this.listener.x,z:this.listener.z};
  }

  frame(listener, actors = {}) {
    this.listener = listener;
    if (!this.started || this.paused) return;
    this.vault.update(listener, actors);
    const now = this.vault.ctx.currentTime;
    while (this.captions.length && this.captions[0].when <= now) {
      const cue = this.captions.shift();
      if (this.onCaption) this.onCaption(cue.name,cue.point);
    }
    this.ambientFrame(now);
  }

  ambientFrame(now) {
    const room = this.room;
    if (!room || !room.sound || !(room.soundFrequency > 0)) return;
    const resource = this.library.get(room.sound.trim().toLowerCase());
    if (!resource) return;
    if (this.minute === null || now >= this.minute + 60) {
      // WAGE schedules random events anywhere in a minute, and periodic
      // events immediately on arrival then at 60/frequency second intervals.
      this.minute = now;
      this.ticks = Array.from({length:room.soundFrequency},(_,i) =>
        now + (room.soundType === 1 ? Math.random()*60 : i*60/room.soundFrequency)
      ).sort((a,b) => a-b);
    }
    if (!this.ticks.length || this.ticks[0] > now) return;
    // Resuming a background tab must not replay a minute's missed events.
    while (this.ticks.length && this.ticks[0] <= now) this.ticks.shift();
    const exits = {north:{x:0,z:4.7}, east:{x:2.6,z:2.6}, west:{x:-2.6,z:2.6}, south:{x:0,z:-1.7}};
    const dirs = Object.keys(exits).filter(dir => room.blocked?.[dir] === false);
    const side = dirs[Math.abs(room.id) % Math.max(1,dirs.length)];
    const point = this.point(room.soundPosition || exits[side] || {x:1.5,z:3.5});
    const generation = this.generation;
    this.buffer(resource).then(b => {
      if (!b || generation !== this.generation || this.paused) return;
      const voice = this.emit(b, point, this.vault.ctx.currentTime, 0.48);
      this.ambientSources.add(voice);
      voice.addEventListener('ended',() => this.ambientSources.delete(voice),{once:true});
      if (this.onCaption) this.onCaption(resource.name,point);
    });
  }

  buffer(resource) {
    if (!this.decoded.has(resource.id)) {
      const pending = fetch(resource.path).then(r => {
        if (!r.ok) throw Error('Unable to read ' + resource.path);
        return r.arrayBuffer();
      }).then(b => this.vault.ctx.decodeAudioData(b)).catch(error => {
        this.decoded.delete(resource.id);
        console.error(error);
        return null;
      });
      this.decoded.set(resource.id,pending);
    }
    return this.decoded.get(resource.id);
  }

  emit(buffer, point, when, volume) {
    const ctx = this.vault.ctx, source = ctx.createBufferSource();
    const panner = this.vault.panner(), gain = ctx.createGain();
    panner.positionX.value = point.x;
    panner.positionZ.value = -point.z;
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(panner);
    source.onended = () => { source.disconnect(); gain.disconnect(); panner.disconnect(); };
    source.start(when);
    return source;
  }

  events(names, worldPoint) {
    const list = (Array.isArray(names) ? names : [names])
      .map(s => this.library.get(String(s || '').trim().toLowerCase())).filter(Boolean);
    if (!list.length) return;
    const point = this.point(worldPoint);
    if (!this.started) {
      this.pending.push([list.map(r => r.name),point]);
      return;
    }
    // Request all sound bytes now, then schedule complete groups in the
    // original callback order. A slower decode cannot reorder Finale cues.
    const loading = Promise.all(list.map(r => this.buffer(r)));
    this.order = this.order.then(async () => {
      const buffers = await loading;
      let when = Math.max(this.vault.ctx.currentTime+0.005,this.queueEnd);
      buffers.forEach((buffer,i) => {
        if (!buffer) return;
        this.emit(buffer,point,when,0.82);
        this.captions.push({when,name:list[i].name,point});
        when += buffer.duration;
      });
      this.queueEnd = when;
    }).catch(error => console.error(error));
  }

  effect(id, point) {
    if (this.started && !this.paused) this.vault.play(id,point);
  }
}
window.SceneSound = SceneSound;
