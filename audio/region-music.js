/* Optional regional score. Reuse SceneSound's buffer cache and master mute.
   A room change within one score keeps the playhead in the same loop. */
class RegionMusic {
  constructor(vault, loadBuffer) {
    this.vault = vault;
    this.loadBuffer = loadBuffer;
    this.enabled = false;
    this.room = null;
    this.current = null;
    this.fading = null;
  }

  setRoom(room) {
    this.room = room;
    this.sync();
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    this.sync();
  }

  sync() {
    const {ctx, master, muted, paused} = this.vault;
    const track = this.enabled && !muted && ctx && master && this.room
      ? RegionMusic.trackFor(this.room) : null;
    const level = this.room?.id === 7990 ? 0.035 : 0.10;

    if (track && this.current?.track === track) {
      if (level !== this.current.level) {
        this.current.level = level;
        if (this.current.gain) this.current.gain.gain.setTargetAtTime(level, ctx.currentTime, 0.2);
      }
      return;
    }
    this.retire();
    if (!track || paused) return;

    const entry = {track, level, gain: null, source: null};
    this.current = entry;
    this.startLoop(entry);
  }

  async startLoop(entry) {
    try {
      const buffer = await this.loadBuffer(entry.track);
      if (this.current !== entry) return;
      const {ctx, master, muted, paused} = this.vault;
      if (!buffer || muted || paused) {
        this.current = null;
        return;
      }
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(master);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      Object.assign(entry, {gain, source});
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
        if (this.fading === entry) this.fading = null;
        if (this.current === entry) this.current = null;
      };
      gain.gain.setTargetAtTime(entry.level, ctx.currentTime, 0.22);
      source.start();
    } catch (error) {
      entry.source?.disconnect();
      entry.gain?.disconnect();
      if (this.current === entry) this.current = null;
      console.warn('Unable to start regional music', error);
    }
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
    this.fading = entry;
    const release = quietNow ? 0.012 : 0.09;
    entry.gain.gain.setTargetAtTime(0, now, release);
    entry.source.stop(now + 5 * release);
  }

  static trackFor(room) {
    if (RegionMusic.halls.has(room.id)) return RegionMusic.stone;
    if (room.sound?.trim().toLowerCase() === 'bubbles') return RegionMusic.water;
    return null;
  }
}

// Quarters through the King's court, the map and bridge halls on the return,
// the temple stairs and the High Altar. Leave the armory and Finale to their cues.
RegionMusic.halls = new Set([21149, 22844, 17888, 8807, 10021, 29408, 17568, 7395, 18278, 7990]);
RegionMusic.stone = {id:'music/violet-stone', path:'audio/music/violet-stone.wav'};
RegionMusic.water = {id:'music/soundings', path:'audio/music/soundings.wav'};
window.RegionMusic = RegionMusic;
