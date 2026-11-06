/* One ray per screen column. Room faces sample the source drawing from its
   original eye point; optional refresh layers keep CODE 1 dither tiles steady
   and add carved reverse stone faces without altering source assets. */
// Where a clean plate has taken an object off the wall. Dither makes single pixels differ everywhere, so this reads the neighbourhood.
const liftedArea = (a, b) => {
  const {w, h} = a, grid = new Int32Array((w + 1) * (h + 1)), out = new Uint8Array(w * h), r = 4;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
    grid[(y + 1) * (w + 1) + x + 1] = (a.bits[y * w + x] !== b.bits[y * w + x]) + grid[y * (w + 1) + x + 1] + grid[(y + 1) * (w + 1) + x] - grid[y * (w + 1) + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1), y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
    const sum = grid[y1 * (w + 1) + x1] - grid[y0 * (w + 1) + x1] - grid[y1 * (w + 1) + x0] + grid[y0 * (w + 1) + x0];
    out[y * w + x] = sum > (x1 - x0) * (y1 - y0) * .3 ? 1 : 0;
  }
  return out;
};
class PlateView {
  // Rooms repainted in the castle's lit style. Others keep Lit colour.
  static paintedObjects = new Set();
  static painted = new Set([21149, 7990, 24338, 25936, 2577, 25694, 4315, 4957, 20301, 14688, 10472, 23272, 4223, 20598, 18366,
    21083, 17872, 17888, 3099, 14750, 29408, 14057, 31514, 32256,
    1092, 26474, 9514, 22673, 29467, 22733, 23229, 32726, 23147, 7747, 7820, 29361, 17639, 27025, 5196, 10021, 28593, 12615, 18391, 9567, 11672, 23935,
    22874, 25584, 26193, 28370, 30474, 30680, 15901, 14237, 15246, 17455, 25730, 29561, 31748, 8642, 24601, 26847, 31593, 21831, 12242, 640, 7083, 12464,
    28106, 25308, 26096, 290, 2352, 6048, 9841, 23679, 25538, 27201, 3122, 7039, 9691, 20189, 30856, 13371, 2933, 4684, 17983, 6364, 15266, 17595,
    10525, 10919, 1725, 17730, 1776, 20431, 27318, 27504, 2818, 29592, 31555, 63,
    20791, 21025, 25054, 26180, 27610, 29622, 327, 859, 999, 4787, 4940, 6029, 14895, 20641, 23064, 25219, 27740, 964, 4896, 4980, 7132, 9497]);
  constructor(canvas) {
    this.canvas = canvas;
    this.w = canvas.width = 338;
    this.h = canvas.height = 314;
    this.ctx = canvas.getContext('2d', {alpha:false});
    this.frame = this.ctx.createImageData(this.w,this.h);
    this.pixels = new Uint32Array(this.frame.data.buffer);
    this.depth = new Float32Array(this.w*this.h);
    this.cache = new Map();
    this.sprites = [];
    this.ink = 0xff161816;
    this.paper = 0xffe8eee9;
    this.refreshed = true;
    this.colour = false;
    this.pose = {x:0,z:0,yaw:0,pitch:0};
    this.reset();
  }
  reset() {
    this.unclippedPosition = null;
    Object.assign(this.pose,{x:0,z:0,yaw:0,pitch:0});
  }
  async decodeImage(url) {
    const img = new Image(); img.src = url; await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    // Safari needs a readable backing store for the disk's exact pixel values.
    const ctx = c.getContext('2d', {willReadFrequently:true}); ctx.drawImage(img,0,0);
    return {w:c.width, h:c.height, rgba:ctx.getImageData(0,0,c.width,c.height).data};
  }
  async texture(url) {
    if (!this.cache.has(url)) this.cache.set(url, (async () => {
      const R = window.RefreshEngine, P = window.RefreshPalette;
      const tUrl = R?.toneUrl(url), rUrl = R?.spriteRimUrl(url), sUrl = window.RefreshBananas?.[url] || null;
      const [base, toneData, rimData, swapData] = await Promise.all([
        this.decodeImage(url),
        tUrl && P ? this.decodeImage(tUrl).catch(() => null) : Promise.resolve(null),
        rUrl ? this.decodeImage(rUrl).catch(() => null) : Promise.resolve(null),
        sUrl ? this.decodeImage(sUrl).catch(() => null) : Promise.resolve(null)
      ]);
      const n = base.w * base.h;
      const bits = new Uint8Array(n);
      for (let i = 0; i < n; i++) bits[i] = base.rgba[i*4+3] < 128 ? 0 : base.rgba[i*4] < 128 ? 1 : 2;
      let tones = null, borders = null, fields = null, rimBits = null;
      if (toneData && toneData.w === base.w && toneData.h === base.h && P) {
        tones = new Uint8Array(n);
        borders = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
          if (toneData.rgba[i*4+3] >= 128) {
            const luma = toneData.rgba[i*4];
            tones[i] = P.patternByLuma[luma] || (bits[i] === 1 ? 8 : 1);
            borders[i] = P.borderByLuma[luma] || 0;
          }
        }
        if (R?.prepareToneFields) fields = R.prepareToneFields(base.w, base.h, tones, borders);
      }
      if (rimData && rimData.w === base.w && rimData.h === base.h) {
        rimBits = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
          if (rimData.rgba[i*4+3] >= 128) rimBits[i] = rimData.rgba[i*4] < 128 ? 1 : 2;
        }
      }
      // A refreshed-layer stand-in at the same native size (the banana weapons); the original bits stay.
      let swapBits = null;
      if (swapData && swapData.w === base.w && swapData.h === base.h) {
        swapBits = new Uint8Array(n);
        for (let i = 0; i < n; i++) swapBits[i] = swapData.rgba[i*4+3] < 128 ? 0 : swapData.rgba[i*4] < 128 ? 1 : 2;
      }
      const materials = window.RoomColour ? await RoomColour.materialMap(url,base.w,base.h) : null;
      const dominant = window.ColourIndex?.dominant[url] || 0;
      // Painted inhabitants share their plate's shape and frames, so they are read at the same positions.
      const figure = url.match(/ACHR-\d+\.png$/), thing = url.match(/AOBJ-(\d+)\.png$/);
      const art = figure ? await this.decodeImage('art/es-3d/inhabitants/'+figure[0]).catch(() => null)
        : thing && PlateView.paintedObjects.has(+thing[1]) ? await this.decodeImage('art/es-3d/objects/'+thing[0]).catch(() => null) : null;
      const paint = art?.w === base.w && art.h === base.h ? new Uint32Array(art.rgba.buffer.slice(0)) : null;
      return {w:base.w, h:base.h, bits, tones, borders, fields, rimBits, swapBits, materials, dominant, paint};
    })());
    return this.cache.get(url);
  }
  // A painted room shares its drawing's picture positions, so it follows every ray the plate does.
  async painting(id) {
    const art = await this.decodeImage(`art/es-3d/ASCN-${id}.png`);
    return art.w === this.w && art.h === this.h ? new Uint32Array(art.rgba.buffer.slice(0)) : null;
  }
  // The average colour of the bottom of a painting, kept to the same channel order as its pixels.
  ground(paint) {
    const sum = [0, 0, 0], from = paint.length * .78 | 0; let n = 0;
    for (let i = from; i < paint.length; i += 5, n++) for (let c = 0; c < 3; c++) sum[c] += paint[i] >>> c * 8 & 255;
    return sum.map(v => v / n);
  }
  // Painted rooms are blended between pixels, so they stay smooth up close.
  smooth(u, v) {
    const w = this.w, h = this.h, p = this.paint;
    const x = u < 0 ? 0 : u > w - 1.001 ? w - 1.001 : u, y = v < 0 ? 0 : v > h - 1.001 ? h - 1.001 : v;
    const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0 * w + x0;
    const a = p[i], b = p[i + 1], c = p[i + w], d = p[i + w + 1];
    // Weights in 1/256ths, written out because this runs for every pixel.
    const gx = fx * 256 | 0, gy = fy * 256 | 0, hx = 256 - gx, hy = 256 - gy;
    const wa = hx * hy, wb = gx * hy, wc = hx * gy, wd = gx * gy;
    const r = (a & 255) * wa + (b & 255) * wb + (c & 255) * wc + (d & 255) * wd >>> 16;
    const g = (a >>> 8 & 255) * wa + (b >>> 8 & 255) * wb + (c >>> 8 & 255) * wc + (d >>> 8 & 255) * wd >>> 16;
    const l = (a >>> 16 & 255) * wa + (b >>> 16 & 255) * wb + (c >>> 16 & 255) * wc + (d >>> 16 & 255) * wd >>> 16;
    return (0xff000000 | l << 16 | g << 8 | r) >>> 0;
  }
  // Past the drawing's edges, each unseen wall and floor is laid with the painting's own surfaces.
  beyond(face, x, y, z, r) {
    const k = r.focal / r.back, flat = Math.abs(face) === 3, band = this.h * .2;
    const fu = r.cx + (Math.abs(face) === 1 ? z : x) * k, fv = flat ? z * k * .5 : r.cy - (y - r.eye) * k;
    const tri = (a, n) => { a = ((a % (2*n)) + 2*n) % (2*n); return a < n ? a : 2*n - a; };
    const u = tri(fu, this.w - 1), v = flat ? (face > 0 ? this.h - 1 - tri(fv, band) : tri(fv, band)) : tri(fv, this.h - 1);
    const c = this.smooth(u, v);
    // Unseen ground leans to the room's own ground colour, so a pool in the drawing cannot repeat as a wedge.
    // Next to the drawing, the ground starts from the painting's own edge, so there is no hard line.
    const t = flat ? this.groundTone : null, m = flat ? .78 : 0;
    if (flat && z > .02) {
      const ex = r.cx + r.focal * x / z, ey = r.cy - r.focal * (y - r.eye) / z;
      const cx = ex < 0 ? 0 : ex > this.w - 1 ? this.w - 1 : ex, cy = ey < 0 ? 0 : ey > this.h - 1 ? this.h - 1 : ey;
      const far = Math.min(1, .55 + Math.hypot(ex - cx, ey - cy) / 90), e = this.smooth(cx, cy), blend = n => (e >> n & 255) * (1 - far) + (t ? t[n / 8] : 0) * far;
      return 0xff000000 | blend(16) << 16 | blend(8) << 8 | blend(0);
    }
    const shade = n => ((c >> n & 255) * (1 - m) + (t ? t[n / 8] : 0) * m) * .95;
    return 0xff000000 | shade(16) << 16 | shade(8) << 8 | shade(0);
  }
  async buildSolids(rig) {
    const R = window.RefreshEngine;
    return Promise.all(rig.solids.map(async spec => {
      const points = spec.footprint || [[spec.x0,spec.z0],[spec.x1,spec.z0],[spec.x1,spec.z1],[spec.x0,spec.z1]];
      const planes = R ? R.buildPlanes(points) : points.map(([x,z],i) => {
        const cx = points.reduce((v,p)=>v+p[0],0)/points.length;
        const cz = points.reduce((v,p)=>v+p[1],0)/points.length;
        const [x2,z2] = points[(i+1)%points.length];
        const len = Math.hypot(z2-z,x2-x);
        let nx = (z-z2)/len, nz = (x2-x)/len;
        if (nx*(cx-x)+nz*(cz-z) < 0) { nx = -nx; nz = -nz; }
        return {ax:x, az:z, bx:x2, bz:z2, len, ux:(x2-x)/len, uz:(z2-z)/len, nx, nz, offset:nx*x+nz*z};
      });
      const cavity = spec.cavity && R ? {...spec.cavity, planes: R.buildPlanes(spec.cavity.footprint)} : null;
      return {...spec, planes, cavity, layer: spec.texture ? await this.texture(spec.texture) : null};
    }));
  }
  syncMode() {
    if (!this.origRig) return;
    this.rig = this.refreshed ? this.refreshRig : this.origRig;
    this.solids = this.refreshed ? this.refreshSolids : this.origSolids;
    this.rear = this.rig.rear ?? -1.75;
    this.fitBoundary();
    // At a wall the other box can be smaller. Keep the requested position
    // for the return toggle until the player actually walks or resets.
    const {x, z} = this.unclippedPosition || this.pose;
    this.pose.x = Math.max(this.bounds.left + .14, Math.min(this.bounds.right - .14, x));
    this.pose.z = Math.max(this.bounds.rear + .14, Math.min(this.bounds.back - .14, z));
    this.unclippedPosition = this.pose.x === x && this.pose.z === z ? null : {x, z};
    this.env = this.rig.environment || (this.outsideByName ? 'open' : 'chamber');
    this.outside = this.env === 'open' || this.env === 'submerged';
    for (const s of this.sprites) {
      if (s.plate && !s.altarLid) Object.assign(s, this.pointFromPlate(s.plate)); // Re-seat on the active horizon
      if (s.altarLid && this.meta?.id === 7990) {
        if (this.refreshed && window.AltarRefresh?.lid) {
          Object.assign(s, window.AltarRefresh.lid);
        } else {
          const m = s.altarLid;
          Object.assign(s, {
            x:(m.x+m.width/2-169)*4.18/215, z:4.18,
            y:1.8-(m.y+m.height-123)*4.18/215, w:m.width*4.18/215, h:m.height*4.18/215
          });
        }
      }
    }
  }
  setRefreshed(enabled) {
    this.refreshed = Boolean(enabled);
    this.syncMode();
  }
  setColour(enabled) { this.colour = Boolean(enabled && window.RoomColour && window.ColourIndex); }
  async colourIcon(meta) {
    const room=this.colourRoom, tex=await this.texture(meta.path);
    if(!room)return meta.path;
    tex.icons ||= new Map();
    if(tex.icons.has(room.themeName))return tex.icons.get(room.themeName);
    const c=document.createElement('canvas');c.width=tex.w;c.height=tex.h;
    const ctx=c.getContext('2d'), im=ctx.createImageData(c.width,c.height), pixels=new Uint32Array(im.data.buffer);
    const material=room.spriteMaterial(meta.type,tex);
    for(let i=0;i<pixels.length;i++)if(tex.bits[i])pixels[i]=room.spritePixel(tex.bits[i],tex.materials?.[i],material,3);
    ctx.putImageData(im,0,0);
    const url=c.toDataURL();
    tex.icons.set(room.themeName,url);
    return url;
  }
  async load(meta) {
    const serial = this.serial = (this.serial || 0) + 1;
    const outside = /forest|swamp|marsh|mountain|desert|valley|canyon|road|clearing|grove|trail|garden|bank|shore|courtyard|lake|river|sea\b|meadow|prairie/i.test(meta.name+' '+meta.text?.slice(0,90));
    const fallbackRig = {eye:1.8, focal:215, cx:169, cy:140, back:outside?9.6:5.0, left:outside?-4.7:-2.75, right:outside?4.7:2.75, ceiling:outside?6.2:3.65, solids:[]};
    const origRig = (meta.id === 7990 && window.AltarLayout) || window.RoomLayouts?.[meta.id] || fallbackRig;
    // Refreshed landmark rigs layer over the original rig and never replace separated originals.
    // Rooms without a rig of their own take the hand-checked environment table's box in refreshed mode.
    const reviewed = origRig === fallbackRig && window.ReviewedRoomRigs?.[meta.id];
    const layout = window.RefreshRoomLayouts?.[meta.id] || reviewed ||
      (origRig === fallbackRig && window.RefreshRigs?.[meta.id]);
    const env = window.RefreshEnvironments?.[meta.id];
    const wide = env === 'open' || env === 'submerged';
    const envRig = env && origRig === fallbackRig
      ? {...fallbackRig, environment: env, back: wide ? 9.6 : 5.0, left: wide ? -4.7 : -2.75, right: wide ? 4.7 : 2.75, ceiling: wide ? 6.2 : 3.65}
      : origRig;
    const refreshRig = (meta.id === 7990 && window.AltarRefresh) ||
      (layout ? {...envRig, ...layout, solids: [...origRig.solids, ...(layout.solids || [])]} : envRig);
    // Honest navigation cues: the map's open bearings, or a doorway the room text names.
    const text = meta.text || '';
    const names = d => new RegExp('\\b(door|doorway|doors|passage|passageway|arch|archway|opening|exit|stairs?|steps|tunnel|hallway|hall|path|road|corridor|gate|gateway)\\b[^.!?]{0,40}\\b(to the |on the |)' + d + '\\b', 'i').test(text) ||
      new RegExp('\\b' + d + '(ern|erly)?\\b[^.!?]{0,30}\\b(door|doorway|passage|exit|opening|arch|archway|tunnel|hallway|path|road|gate|stairs?)\\b', 'i').test(text);
    const exits = {};
    for (const d of ['north', 'south', 'east', 'west']) exits[d] = !(meta.blocked && meta.blocked[d]) || names(d);
    const [source, origClean, refreshClean, origSolids, refreshSolids, paint] = await Promise.all([
      this.texture(meta.path),
      this.texture(origRig.clean || meta.path),
      this.texture(refreshRig.clean || meta.path),
      this.buildSolids(origRig),
      refreshRig === origRig ? null : this.buildSolids(refreshRig),
      PlateView.painted.has(meta.id) ? this.painting(meta.id).catch(() => null) : null
    ]);
    if (serial !== this.serial) return;
    Object.assign(this, {
      meta, source, paint, groundTone: paint ? this.ground(paint) : null, lifted: paint && refreshClean !== source ? liftedArea(source, refreshClean) : null, axialPlateDepth: Boolean(reviewed),
      colourRoom: window.RoomColour ? new RoomColour.Room(meta,refreshRig,refreshSolids || origSolids) : null,
      origRig, refreshRig,
      origClean, refreshClean,
      origSolids, refreshSolids: refreshSolids || origSolids,
      outsideByName: outside, exits, sideDoorZ: 1.15, shadowSpots: []
    });
    this.reset(); this.sprites = [];
    this.syncMode();
  }
  // The walkable limit and visible edge for the active rig. Bounds never hide a drawn thing.
  fitBoundary() {
    const B = window.ScepterBoundary;
    const env = this.rig.environment || (this.outsideByName ? 'open' : 'chamber');
    this.boundary = B ? B.profile(this.meta || {}, this.exits, env, {...this.rig, rear: this.rear}) :
      {bounds: {left: this.rig.left, right: this.rig.right, back: this.rig.back, rear: this.rear}, fence: null};
    if (B) B.widen(this.boundary, {...this.rig, rear: this.rear}, this.sprites);
    this.bounds = this.boundary.bounds;
    this.fence = this.boundary.fence;
  }
  solidAt(x,z,radius) {
    return this.solids.some(s=>!s.noCollision && s.y1>.62 && s.y0<1.9 &&
      s.planes.every(p=>p.nx*x+p.nz*z-p.offset>=-radius));
  }
  move(side,forward) {
    const p=this.pose,b=this.bounds,cos=Math.cos(p.yaw),sin=Math.sin(p.yaw),rad=.14;
    const clamp=()=>{
      x=Math.max(b.left+rad,Math.min(b.right-rad,x));
      z=Math.max(b.rear+rad,Math.min(b.back-rad,z));
    };
    let x=p.x+side*cos+forward*sin, z=p.z-side*sin+forward*cos;
    // Which room edge this step pressed against, for the player's feedback.
    const wantX=x,wantZ=z,over=[[wantZ-(b.back-rad),'north'],[wantX-(b.right-rad),'east'],
      [(b.rear+rad)-wantZ,'south'],[(b.left+rad)-wantX,'west']].sort((m,n)=>n[0]-m[0])[0];
    this.pressed=over[0]>1e-6?over[1]:'';
    // Slide along the nearest face of any convex footprint we would enter, so
    // walking diagonally past columns, basins and furniture never snags.
    for(let pass=0;pass<4;pass++){
      clamp();
      let pushed=false;
      for(const s of this.solids){
        if(s.noCollision || s.y1<=.62 || s.y0>=1.9)continue;
        let minD=Infinity,nearest=null,inside=true;
        for(const pl of s.planes){
          const d=pl.nx*x+pl.nz*z-pl.offset;
          if(d<-rad){inside=false;break;}
          if(d<minD){minD=d;nearest=pl;}
        }
        if(!inside)continue;
        const push=minD+rad+1e-4;
        x-=nearest.nx*push; z-=nearest.nz*push; pushed=true;
      }
      if(!pushed)break;
    }
    clamp();
    if(this.solidAt(x,z,rad)){
      // Wedged between bodies: fall back to axis-separated stepping.
      const ax=Math.max(b.left+rad,Math.min(b.right-rad,p.x+side*cos+forward*sin));
      const az=Math.max(b.rear+rad,Math.min(b.back-rad,p.z-side*sin+forward*cos));
      x=p.x;z=p.z;
      if(!this.solidAt(ax,z,rad))x=ax;
      if(!this.solidAt(x,az,rad))z=az;
    }
    if (x !== p.x || z !== p.z) this.unclippedPosition = null;
    p.x=x;p.z=z;
  }
  steps() {
    const {x,z}=this.pose;
    let h=0;
    for(const b of this.solids) if(b.y1<.62 && !b.noCollision &&
      b.planes.every(p=>p.nx*x+p.nz*z>=p.offset)) h=Math.max(h,b.y1);
    return h;
  }
  pointFromPlate(meta) {
    const r=this.rig;
    const bottom=meta.y+meta.height;
    const groundDepth=r.focal*r.eye/Math.max(1,bottom-r.cy);
    const z=Math.max(1.22,Math.min(r.back-.15,groundDepth));
    return {x:(meta.x+meta.width/2-r.cx)*z/r.focal,y:r.eye-(bottom-r.cy)*z/r.focal,z,w:meta.width*z/r.focal,h:meta.height*z/r.focal};
  }
  async add(meta,key,options={}) {
    const ticket=this.serial;
    const texture=await this.texture(meta.path);
    if(ticket!==this.serial) return;
    const sprite=Object.assign(this.pointFromPlate(meta),{key,texture,cols:1,row:0,frame:0,...options});
    if(options.x===undefined && options.z===undefined) sprite.plate=meta; // Seated by the active rig horizon
    if(key==='AOBJ/27297') sprite.front=3; // The disk draws the King over his throne, so its 3D form must not hide him.
    if(this.meta?.id===7990 && key==='AOBJ/14168') {
      sprite.altarLid = meta;
      if (this.refreshed && window.AltarRefresh?.lid) Object.assign(sprite, window.AltarRefresh.lid);
    }
    this.sprites.push(sprite);return sprite;
  }
  render(time=0) {
    if(!this.source) return;
    const {w,h,rig:r,pose:p}=this, f=r.focal, cx=r.cx, cy=r.cy;
    const R = this.refreshed ? window.RefreshEngine : null;
    const C = this.refreshed && this.colour ? this.colourRoom : null;
    const diskEye = C && p.x===0 && p.z===0 && p.yaw===0 && p.pitch===0;
    const clean = this.refreshed ? this.refreshClean : this.origClean;
    const jolt=time<(this.bumpUntil||0)?Math.round(2*Math.sin((this.bumpUntil-time)*46)):0;
    const eye=r.eye+this.steps(), horizon=cy+p.pitch+jolt;
    const fence=R?this.fence:null, B=window.ScepterBoundary;
    const panX=Math.round(p.yaw*f), panY=Math.round(-p.pitch);
    const sn=Math.sin(p.yaw),cs=Math.cos(p.yaw), pix=this.pixels,depth=this.depth,source=this.source;
    const paper=this.paper,ink=this.ink,boxHits=[];
    // Grounded contact shadows: floor-standing sprites darken the CODE 1 floor tone beneath them.
    this.shadowSpots=R?this.sprites.filter(s=>!s.hidden && !(s.refreshedOnly && !this.refreshed) &&
      Math.abs(s.y-this.steps())<.12 && s.key!=='wizard' && s.key!=='bat' && !s.decorative)
      .map(s=>({x:s.x,z:s.z+s.w*.12,rx:Math.max(.2,s.w*.42),rz:Math.max(.12,s.w*.16)})):[];
    for(let i=0;i<w;i++) {
      const sx = i + panX;
      const u=(i+.5-cx)/f,dx=sn+cs*u,dz=cs-sn*u;
      const inverseRayLength=C ? 1/Math.hypot(dx,dz) : 0;
      const tx=((dx>0?r.right:r.left)-p.x)/(dx||1e-10),tz=((dz>0?r.back:this.rear)-p.z)/(dz||1e-10);
      const wall=Math.min(tx,tz),side=tx<tz;
      // One physical edge per column: where this ray leaves the walkable ground.
      let fenceT=Infinity,fenceEdge=null,fenceAlong=0,fenceTop=0,fencePlateTop=0;
      if(fence){
        const ax=((dx>0?fence.right:fence.left)-p.x)/(dx||1e-10),az=((dz>0?fence.back:fence.rear)-p.z)/(dz||1e-10);
        fenceT=Math.min(ax,az);
        fenceEdge=fence.edges[ax<az?(dx>0?'east':'west'):(dz>0?'north':'south')];
        fenceAlong=ax<az?p.z+dz*fenceT:p.x+dx*fenceT;
        fenceTop=B.crest(fenceEdge,fenceAlong);
        fencePlateTop=fenceEdge.overPlate?fenceTop*B.plateRise(fenceT,Math.hypot(p.x,p.z)):0;
      }
      boxHits.length=0;
      for (const box of this.solids) {
        if(box.collisionOnly)continue;
        let near=-Infinity,far=Infinity,face=-2,fromCamera=false,hitPlane=null;
        for(const plane of box.planes) {
          const origin=plane.nx*p.x+plane.nz*p.z-plane.offset;
          const rate=plane.nx*dx+plane.nz*dz;
          if(Math.abs(rate)<1e-9){
            if(origin<0){far=-Infinity;break;}
          } else {
            const t=-origin/rate;
            if(rate<0)far=Math.min(far,t);
            else if(t>near){
              near=t;
              face=Math.abs(plane.nx)>Math.abs(plane.nz)?(plane.nx>0?-1:1):(plane.nz>0?-2:2);
              fromCamera=plane.offset>0;
              hitPlane=plane;
            }
          }
          if(far<=near)break;
        }
        if(far>Math.max(near,.004))boxHits.push({near,far,box,face,fromCamera,plane:hitPlane});
      }
      for(let j=0,idx=i;j<h;j++,idx+=w) {
        const sy = j + panY;
        const dy=(horizon-j-.5)/f;
        let t=wall, face=side?(dx>0?-1:1):(dz>0?-2:2),solid=null,hitUsed=null,visible=true,layerBit=0;
        const cap=((dy>0?r.ceiling:0)-eye)/(dy||1e-10);
        if(cap>0 && cap<t){t=cap;face=dy>0?-3:3;}
        for(let k=0;k<boxHits.length;k++) {
          const hit=boxHits[k];
          if(hit.near>=t)continue;
          const ay=(hit.box.y0-eye)/(dy||1e-10), by=(hit.box.y1-eye)/(dy||1e-10);
          const yn=Math.min(ay,by),n=Math.max(hit.near,yn);
          if(n<=.002 || n>=t || n>=Math.min(hit.far,Math.max(ay,by)))continue;
          const faceHere=yn>hit.near?(dy>0?-3:3):hit.face;
          if(R && hit.box.cavity && yn>hit.near && faceHere===3 && dy<-1e-9){
            const cav=R.traceCavity(hit.box.cavity,p,eye,dx,dy,dz,n,Math.max(.0035,n/f),sx,sy);
            if(cav && cav.t<t){
              t=cav.t;solid=hit.box;hitUsed=hit;face=3;visible=true;layerBit=cav.bit;
              continue;
            }
          }
          const camDist = Math.hypot(p.x,p.z);
          const use3dFace = R && (
            (faceHere===3 && (hit.box.kind==='dais'||hit.box.kind==='plinth') && camDist>.25) ||
            (hit.box.kind==='pillar' && camDist>.30 && (p.z>3.85 || !hit.plane || hit.plane.nz>-.75))
          );
          const originalFace=use3dFace ? false : (yn>hit.near?(faceHere===3?hit.box.y1<r.eye:hit.box.y0>r.eye):hit.fromCamera);
          const showOriginal=originalFace || hit.box.twoSided;
          let bit=0;
          if(hit.box.layer && showOriginal){
            const hx=p.x+dx*n, hy=eye+dy*n, hz=p.z+dz*n;
            const fx=cx+f*hx/hz, fy=cy-f*(hy-r.eye)/hz, px=Math.floor(fx), py=Math.floor(fy);
            if(hz>.02 && px>=0 && px<w && py>=0 && py<h) {
              const pIdx=py*w+px, tex=hit.box.layer;
              bit=tex.bits[pIdx];
              if(!bit && (hit.box.silhouette || originalFace))continue;
              if(bit && !originalFace && hit.box.reversePattern){
                if(R){
                  const onEdge=px===0||px===w-1||py===0||py===h-1||
                    !tex.bits[pIdx-1]||!tex.bits[pIdx+1]||!tex.bits[pIdx-w]||!tex.bits[pIdx+w];
                  const rPat=R.shiftPattern(hit.box.reversePattern,n>6.2&&!this.outside?1:0);
                  bit=onEdge?1:(R.samplePattern(rPat,sx,sy)?1:2);
                } else {
                  const tx2=Math.floor((hx+hz)*49),ty2=Math.floor(hy*49);
                  const tile=window.ScepterPatterns[hit.box.reversePattern];
                  bit=(tile[ty2&7]&(128>>(tx2&7)))?1:2;
                }
              } else if(bit && R && tex.tones && !diskEye){
                bit=R.shadePlateTone(this,hit.box,faceHere,hx,hy,hz,n,tex,pIdx,fx,fy,sx,sy);
              }
            }
          }
          t=n;solid=hit.box;hitUsed=hit;face=faceHere;visible=showOriginal;layerBit=bit;
        }
        depth[idx]=t;
        const x=p.x+dx*t, y=eye+dy*t,z=p.z+dz*t;
        const fx=cx+f*x/z, fy=cy-f*(y-r.eye)/z, px=Math.floor(fx), py=Math.floor(fy);
        let unseenMaterial=0,fenced=false,onTrail=false;
        const plateHere=z>.02 && visible && !solid && px>=0&&px<w&&py>=0&&py<h;
        if(fenceEdge && !diskEye && !layerBit && !solid && fenceT<=t+1e-4){
          const fenceY=eye+dy*fenceT;
          fenced=fenceY>=0 && fenceY<(plateHere?fencePlateTop:fenceTop);
          if(fenced){
            const sample=R.shadeBoundary(fenceEdge,fenceAlong,fenceY,plateHere?fencePlateTop:fenceTop,fenceT,f,sx,sy);
            pix[idx]=(sample&3)===1?ink:paper;
            unseenMaterial=sample>>>2;
            depth[idx]=fenceT;
          }
        }
        if(fenced){
          // Drawn above. The colour pass below reads its material.
        } else if(diskEye){
          // At registration the final ink comes directly from the drawing.
          pix[idx]=source.bits[idx]===1?ink:paper;
        } else if(!R && z>.02 && px>=0&&px<w&&py>=0&&py<h && Math.abs(p.x)+Math.abs(p.z)<.00001) {
          // Original mode: at the drawing's exact eye point use the raw disk plate.
          pix[idx]=source.bits[py*w+px]===1?ink:paper;
        } else if(layerBit){
          pix[idx]=layerBit===1?ink:paper;
        } else if(R && solid){
          pix[idx]=R.shadeSolidFace(this,hitUsed,solid,face,x,y,z,t,dx,dz,sx,sy)===1?ink:paper;
        } else if(z>.02 && visible && !solid && px>=0&&px<w&&py>=0&&py<h){
          const pIdx=py*w+px;
          const cBit=(R && clean.tones)
            ? R.shadePlateTone(this,null,face,x,y,z,t,clean,pIdx,fx,fy,sx,sy)
            : clean.bits[pIdx];
          pix[idx]=cBit===1?ink:paper;
        } else if(R){
          const trail=fence&&face===3&&B.onTrail(fence,x,z);
          onTrail=trail;
          const sample=trail?R.shadeTrail(sx,sy):R.shadeUnseenWorld(this,face,x,y,z,t,sx,sy,dx,dy,dz,C?.surround);
          pix[idx]=(sample&3)===1?ink:paper;
          unseenMaterial=sample>>>2;
        } else {
          // Original mode fallback hatch for unseen surfaces.
          const bayer=((i&1)*2+(j&1)+((i>>1 ^ j>>1)&1))%5;
          let black=false;
          if(solid?.patterns && window.ScepterPatterns){
            const tile=window.ScepterPatterns[solid.patterns[face===2?'back':face===3?'top':Math.abs(face)===1?'side':'front']];
            const tx2=Math.floor((Math.abs(face)===1?z:x)*57),ty2=Math.floor((Math.abs(face)===3?z:y)*57);
            black=!!(tile[ty2&7]&(128>>(tx2&7)));
          } else if(r.environment==='submerged' && !solid && window.ScepterPatterns){
            const angle=Math.atan2(x,z),ridge=1.65+.13*Math.sin(angle*8)+.06*Math.cos(angle*15);
            const tile=window.ScepterPatterns[face===3?4:y<ridge?5:7];
            const tx2=Math.floor((x+z)*43),ty2=Math.floor((face===3?z:y)*43);
            black=!!(tile[ty2&7]&(128>>(tx2&7)));
          } else if(this.outside && !solid){
            const a=Math.atan2(x,z), ridge=1.6+.23*Math.sin(a*13)+.30*Math.cos(a*4);
            black=face===3 ? (((Math.floor(x*22)^Math.floor(z*19))&7)<2) : y<ridge && (bayer<2 || Math.abs(y-ridge)<.035);
          } else {
            const floor=Math.abs(face)===3, along=(floor||Math.abs(face)===2)?x:z,up=floor?z:y;
            const row=Math.floor(up/(floor?.88:.56)),v=((up/(floor?.88:.56))%1+1)%1;
            const col=((along/(floor?1.18:.92)+row*.5)%1+1)%1;
            black=(col<.017||v<.027)||(bayer<(face===3?1:solid?3:2));
            if(!solid && face===2 && Math.abs(x)<.58 && y<2.32-Math.max(0,Math.abs(x)-.30)*.7) {
              const gx=Math.floor((x+1)*30),gy=Math.floor(y*32);
              black=(gx%8!==0)&&(gy%26!==0 || Math.abs(x)>.48);
            }
          }
          pix[idx]=black?ink:paper;
        }
        if(C){
          let tex=null,uv=0;
          if(diskEye){tex=source;uv=idx;}
          else if(!fenced && z>.02 && visible && px>=0 && py>=0 && px<w && py<h && (!solid || layerBit)){
            tex=solid ? solid.layer : clean;uv=py*w+px;
          }
          // Where a clean plate has lifted an object off the wall, the painting would still show it.
          if(this.paint && tex && uv<this.paint.length && !(tex===clean && this.lifted?.[uv])){
            pix[idx]=this.smooth(fx-.5,fy-.5);
            continue;
          }
          // Spikes has a 313-row plate in the 314-row viewport.
          let tag=tex && uv>=tex.bits.length ? 64 : tex?.materials?.[uv] || 0;
          if(!(tag&31))tag|=unseenMaterial || solid?.layer?.dominant || C.fallback(face,y);
          pix[idx]=C.pixel(pix[idx]===ink,tag,face,solid && hitUsed?.plane,solid,x,y,z,dy*inverseRayLength,tex?.tones?.[uv]||0);
          // A boundary across the drawn picture stays in the room data, so the painting shows through it.
          if(this.paint && fenced && z>.02 && px>=0 && py>=0 && px<w && py<h && visible && !solid){
            pix[idx]=this.smooth(fx-.5,fy-.5);
            continue;
          }
          if(this.paint){
            const seen=this.beyond(face,x,y,z,r);
            // Painted rooms carry on as painted. The worn trail still shows the way to a real exit.
            pix[idx]=onTrail?0xff000000|Math.min(255,(seen>>16&255)*1.14+12)<<16|Math.min(255,(seen>>8&255)*1.14+9)<<8|Math.min(255,(seen&255)*1.14+4):seen;
          }
        }
      }
    }
    this.targets=[];
    const actors=this.sprites.map(s=>({s,t:(s.x-p.x)*sn+(s.z-p.z)*cs})).sort((a,b)=>b.t-a.t);
    for(const {s,t} of actors) {
      if(t<=.08 || s.hidden || (s.refreshedOnly && !this.refreshed))continue;
      const tex=s.texture,fw=s.fw||Math.floor(tex.w/s.cols),fh=s.fh||tex.h;
      const swapped=this.refreshed && !C && tex.swapBits;
      const bits=swapped||tex.bits;
      const material=C && C.spriteMaterial(s.key,tex);
      // A struck inhabitant flinches: a two-pixel shudder for a few frames.
      const flinch=s.flinchUntil&&time<s.flinchUntil?((Math.floor(time*30)&1)?2:-2):0;
      const lateral=(s.x-p.x)*cs-(s.z-p.z)*sn, middle=cx+lateral*f/t;
      // A defeated inhabitant leaves the way the disk's dying line says it does.
      const parting=s.parting?Math.max(0,Math.min(1,(time-s.parting.start)/s.parting.span)):0;
      const squash=s.parting?.style==='fall'||s.parting?.style==='spiral'?1-.82*parting*parting:1;
      const sink=s.parting?.style==='sink'?parting:0;
      const wither=s.parting&&!sink&&squash===1?parting:0;
      const sw=s.w*f/t,sh=s.h*f/t*squash, top=horizon-(s.y+s.h*squash-eye)*f/t+sink*s.h*f/t;
      const clipBottom=sink?horizon-(s.y-eye)*f/t:Infinity;
      let left=middle-sw/2;
      if(left>=w||left+sw<=0||top>=h||top+sh<=0)continue;
      const offsetX=(s.frame%Math.max(1,s.cols))*fw,offsetY=s.row*fh;
      const rim=this.refreshed&&!swapped?tex.rimBits:null;
      left+=flinch;
      let plotted=0;
      for(let j=Math.max(0,Math.ceil(top-.5));j<Math.min(h,top+sh-.5);j++){
        const sy=offsetY+Math.min(fh-1,Math.floor((j+.5-top)*fh/sh));
        if(j>clipBottom)break;
        for(let i=Math.max(0,Math.ceil(left-.5));i<Math.min(w,left+sw-.5);i++){
          const idx=i+j*w;
          if(t-(s.front||0)>depth[idx]+.025)continue;
          if(wither && ((i*7919+j*104729)%97)/97<wither)continue;
          const sx=Math.min(fw-1,Math.floor((i+.5-left)*fw/sw));
          const tIdx=sy*tex.w+offsetX+(s.flip?fw-1-sx:sx);
          const bit=bits[tIdx] || (rim ? rim[tIdx] : 0);
          if(bit){
            const painted=C && tex.paint && tex.paint[tIdx]>>>24>127 ? tex.paint[tIdx] : 0;
            pix[idx]=painted || (C ? (bits[tIdx]?C.spritePixel(bit,tex.materials?.[tIdx],material,3):paper) : bit===1?ink:paper);
            plotted++;
          }
        }
      }
      if(plotted>1 && !s.decorative)this.targets.push({key:s.key,s,left,top,sw,sh,t});
    }
    this.ctx.putImageData(this.frame,0,0);
  }
  hit(px,py) {
    for(const a of (this.targets||[]).slice().reverse()){
      const {left,top,sw,sh,s,t}=a;
      if(px<left||px>=left+sw||py<top||py>=top+sh)continue;
      const fw=s.fw||s.texture.w,fh=s.fh||s.texture.h, ix=Math.floor((px-left)*fw/sw);
      const bit=((this.refreshed&&!this.colour&&s.texture.swapBits)||s.texture.bits)[(s.row*fh+Math.floor((py-top)*fh/sh))*s.texture.w+(s.frame%s.cols)*fw+(s.flip?fw-1-ix:ix)];
      if((s.solidHit||bit) && t-(s.front||0)<=this.depth[Math.floor(py)*this.w+Math.floor(px)]+.025)return a;
    }
    return null;
  }
}
