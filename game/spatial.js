/* First-person audio for the local game server. Original ES room timing is
   interpreted from ASCN. Emitter coordinates are assigned in this adaptation. */
class SceneSound {
  constructor() {
    this.vault = new VaultAudio();
    this.music = new RegionMusic(this.vault, resource => this.buffer(resource));
    this.vault.onCue = (id, point) => {
      const text = SceneSound.caption(id);
      if (this.onCaption && text) this.onCaption(text, point);
    };
    // Room geometry for ambient placement, supplied by the view so it follows the L toggle.
    this.geometry = null;
    this.ambientOverride = null;
    this.ambientTurn = 0;
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

  // The one caption dictionary for every cue: disk recordings by role, drawn effects, and a plain
  // fallback naming the Dark Castle resource for listening-stone picks. Footfalls are not captioned.
  static caption(id) {
    const names = {
      keeper: 'A voice', bird: 'Two short notes', knight: 'A shield blow', bell: 'A bell', gate: 'A mechanism',
      call: 'A call', answer: 'An answer', pickup: 'A chime',
      'dc:0': 'A shield blow', 'dc:1': 'A voice', 'dc:32': 'A vulture cry', 'dc:39': 'Shattering armour',
      'dc:46': 'Stone wings', 'dc:52': 'An electric arc', 'dc:60': 'A whirling broom',
      'dc:64': 'A burning eye', 'dc:66': 'Claws on stone', 'dc:69': 'A knock from the doorway',
      'dc:70': 'Two short notes', 'dc:73': 'A whip crack', 'dc:88': 'Marching boots',
      'dc:91': 'A rolling boulder', 'dc:94': 'Pipe organ fanfare', 'dc:95': 'A dragon’s roar'
    };
    if (id === 'step' || id === 'keeperStep' || id === 'dc:84') return '';
    if (names[id]) return names[id];
    const m = /^dc:(\d+)$/.exec(id);
    return m ? 'Dark Castle SOUN ' + m[1] : id;
  }

  start() {
    if (this.starting) {
      // A blocked resume can remain pending until another user gesture.
      const ctx = this.vault.ctx;
      if (ctx && ctx.state !== 'running' && !this.paused) ctx.resume().catch(() => {});
      return this.starting;
    }
    this.starting = this.vault.start().then(async ready => {
      this.started = ready;
      if (!ready) return false;
      if (this.paused) await this.vault.ctx.suspend();
      this.music.sync();
      for (const [names,point,opts] of this.pending.splice(0)) this.events(names,point,opts);
      return true;
    }).finally(() => { this.starting = null; });
    return this.starting;
  }

  mute(value) {
    if (value) this.pending.length = 0;
    this.vault.mute(value);
    this.music.sync();
  }

  setVolume(channel, value) {
    this.vault.setVolume(channel, value);
  }

  pause(value) {
    const paused = Boolean(value);
    if (this.paused === paused) return;
    this.paused = paused;
    this.vault.pause(paused);
    this.music.sync();
    if (this.started) {
      const ctx = this.vault.ctx;
      if (paused) ctx.suspend().catch(() => {});
      else ctx.resume().catch(() => {});
    }
  }

  scene(meta) {
    this.music.setRoom(meta);
    if (this.room && this.room.id === meta?.id) return;
    this.pending.length = 0;
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
    if (!this.room) return;
    // Rooms whose own disk prose names a continuous sound source, plus live machinery overrides.
    const proseAmbient = {
      1193: {sound: 'ocean', soundFrequency: 3, soundType: 0, soundPosition: {x: 0, z: -2.2}},
      28106: {sound: 'drip', soundFrequency: 4, soundType: 0, soundPosition: {x: 0, z: 2.6}}
    };
    const extra = (proseAmbient[this.room.id] && !this.room.sound ? proseAmbient[this.room.id] : null);
    const dyn = this.ambientOverride ? this.ambientOverride(this.room) : null;
    const room = (extra || dyn) ? Object.assign({}, this.room, extra, dyn) : this.room;
    if (!room || !room.sound || !(room.soundFrequency > 0)) return;
    // The disk names an ambient the ASND list lacks: 'song bird' in the jungle corner (27293).
    // It borrows the Dark Castle cave bat's two notes rather than inventing a recording.
    const alias = {'song bird': 'dc:70'};
    const resource = this.library.get(room.sound.trim().toLowerCase()) ||
      (alias[room.sound.trim().toLowerCase()] ? {id: alias[room.sound.trim().toLowerCase()], name: room.sound.trim(), vault: true} : null);
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
    // Emit just past an open wall of the room as it is currently rigged: periodic sounds take
    // the openings in turn, random ones pick one, so every doorway is heard over a minute.
    const g = this.geometry ? this.geometry() : null;
    const rig = g?.rig || {back: 5, left: -2.75, right: 2.75}, rear = g?.rear ?? -1.75, doorZ = g?.sideDoorZ ?? 1.15;
    const exits = {north:{x:0,z:rig.back+0.4}, east:{x:rig.right+0.4,z:doorZ}, west:{x:rig.left-0.4,z:doorZ}, south:{x:0,z:rear-0.4}};
    const open = g?.exits || room.blocked || {};
    const dirs = Object.keys(exits).filter(dir => g?.exits ? open[dir] : room.blocked?.[dir] === false);
    const pick = dirs.length ? (room.soundType === 1 ? Math.floor(Math.random()*dirs.length) : (this.ambientTurn++) % dirs.length) : -1;
    const point = this.point(room.soundPosition || (pick >= 0 ? exits[dirs[pick]] : {x:1.5,z:Math.max(2, rig.back-1.5)}));
    const generation = this.generation;
    if (resource.vault) { this.effect(resource.id, point); return; }
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

  // A sound that happens to the listener goes directly to the effects bus.
  emitDry(buffer, when, volume) {
    const ctx = this.vault.ctx, source = ctx.createBufferSource(), gain = ctx.createGain();
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.vault.buses.effects);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    source.start(when);
    return source;
  }

  events(names, worldPoint, opts = {}) {
    const list = (Array.isArray(names) ? names : [names])
      .map(s => this.library.get(String(s || '').trim().toLowerCase())).filter(Boolean);
    if (!list.length) return;
    const point = this.point(worldPoint);
    if (!this.started) {
      if (this.vault.muted) {
        for (const r of list) this.onCaption?.(r.name,point);
      } else {
        this.pending.push([list.map(r => r.name),point,opts]);
      }
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
        if (opts.dry) this.emitDry(buffer,when,0.62); else this.emit(buffer,point,when,0.82);
        this.captions.push({when,name:list[i].name,point});
        when += buffer.duration;
      });
      this.queueEnd = when;
    }).catch(error => console.error(error));
  }

  effect(id, point) {
    if (this.started && !this.paused) this.vault.play(id,point);
    else if (this.vault.muted && !this.paused && this.onCaption) {
      const text = SceneSound.caption(id);
      if (text) this.onCaption(text, this.point(point));
    }
  }
}
window.SceneSound = SceneSound;
