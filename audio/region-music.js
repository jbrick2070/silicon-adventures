/* Optional regional score. Each region keeps its place for the current journey. */
class RegionMusic {
  constructor(vault, loadBuffer) {
    this.vault = vault;
    this.loadBuffer = loadBuffer;
    this.enabled = false;
    this.room = null;
    this.current = null;
    this.fading = null;
    this.positions = new Map();
    this.onChange = null;
  }

  get nowPlaying() {
    return this.current?.source && !this.vault.paused ? this.current.track : null;
  }

  setRoom(room) {
    this.room = room;
    this.sync();
    if (!room) this.positions.clear();
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    this.sync();
  }

  sync() {
    const {ctx, master, muted, paused} = this.vault;
    const playlist = this.enabled && !muted && ctx && master && this.room
      ? RegionMusic.playlistFor(this.room) : null;
    const level = this.room?.id === 7990 ? 0.035 : 0.10;

    if (playlist && this.current?.playlist === playlist) {
      if (level !== this.current.level) {
        this.current.level = level;
        if (this.current.gain) this.current.gain.gain.setTargetAtTime(level, ctx.currentTime, 0.2);
      }
    } else {
      this.retire();
      if (playlist && !paused) {
        const {index, offset} = this.positions.get(playlist) || {index: 0, offset: 0};
        const entry = {playlist, index, offset, level, track: null, gain: null, source: null};
        this.current = entry;
        this.play(entry);
      }
    }
    this.onChange?.();
  }

  async play(entry) {
    let buffer;
    // A damaged file needn't silence its partner. Try each track at most once.
    for (let attempt = 0; attempt < entry.playlist.length; attempt++) {
      entry.track = entry.playlist[entry.index];
      try {
        buffer = await this.loadBuffer(entry.track);
      } catch (error) {
        console.warn('Unable to load regional music', error);
      }
      if (this.current !== entry) return;
      if (this.vault.paused || this.vault.muted) break;
      if (buffer) break;
      entry.index = (entry.index + 1) % entry.playlist.length;
      entry.offset = 0;
    }
    if (!buffer || this.vault.paused || this.vault.muted) {
      this.current = null;
      return;
    }
    try {
      const {ctx, master} = this.vault;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(master);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(gain);
      Object.assign(entry, {gain, source, startedAt: ctx.currentTime});
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
        if (this.fading === entry) this.fading = null;
        if (this.current === entry) {
          this.positions.set(entry.playlist, {index: (entry.index + 1) % entry.playlist.length, offset: 0});
          this.current = null;
          this.sync();
        }
      };
      gain.gain.setTargetAtTime(entry.level, ctx.currentTime, 0.22);
      source.start(0, entry.offset);
    } catch (error) {
      entry.source?.disconnect();
      entry.gain?.disconnect();
      if (this.current === entry) this.current = null;
      console.warn('Unable to start regional music', error);
    }
    this.onChange?.();
  }

  retire() {
    const entry = this.current;
    this.current = null; // Also invalidates a decode which has not yet returned.
    const quietNow = !this.room || this.room.id === 18366;
    if (this.fading && (quietNow || entry?.source)) {
      this.fading.source.stop(this.vault.ctx.currentTime);
      this.fading = null;
    }
    if (!entry?.source) return;
    const now = this.vault.ctx.currentTime;
    const offset = entry.offset + now - entry.startedAt;
    const position = offset < entry.source.buffer.duration ? {index: entry.index, offset}
      : {index: (entry.index + 1) % entry.playlist.length, offset: 0};
    this.positions.set(entry.playlist, position);
    this.fading = entry;
    const release = quietNow ? 0.012 : 0.09;
    entry.gain.gain.setTargetAtTime(0, now, release);
    entry.source.stop(now + 5 * release);
  }

  static playlistFor(room) {
    if (RegionMusic.halls.has(room.id)) return RegionMusic.stone;
    if (room.sound?.trim().toLowerCase() === 'bubbles') return RegionMusic.water;
    return null;
  }
}

// Quarters through the King's court, the map and bridge halls on the return,
// the temple stairs and the High Altar. Leave the armory and Finale to their cues.
RegionMusic.halls = new Set([21149, 22844, 17888, 8807, 10021, 29408, 17568, 7395, 18278, 7990]);
RegionMusic.stone = [
  {id:'music/heros-quest', path:'audio/music/heros-quest.wav', title:"Hero's Quest", credit:'jeffreyabrick'},
  {id:'music/violet-stone', path:'audio/music/violet-stone.wav', title:'Violet Stone', credit:'Silicon Adventures arrangement'}
];
RegionMusic.water = [
  {id:'music/submerged-bell', path:'audio/music/submerged-bell.wav', title:'Submerged Bell', credit:'jeffreyabrick'},
  {id:'music/soundings', path:'audio/music/soundings.wav', title:'Soundings', credit:'Silicon Adventures arrangement'}
];
window.RegionMusic = RegionMusic;
