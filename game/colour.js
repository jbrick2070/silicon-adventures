/* Pigments for the Macintosh drawing commands. Ink/paper coverage still comes
   from PlateView. All lighting is evaluated at the native ray hit. */
(() => {
  'use strict';
  const M = {sky:1, water:2, foliage:3, earth:4, stone:5, floor:6, wall:7, ceiling:8,
    wood:9, metal:10, gold:11, cloth:12, fire:13, ice:14, flesh:15, accent:16, ivory:17, shadow:18};
  const INK = 0xff161816, PROTECTED = 32;
  // Each triplet is the stone-in-shadow, middle and illuminated paper colour.
  const base = {
    sky:'8297ae b8d1d8 ede8d1', water:'465d81 6593a9 b1d9d3',
    foliage:'4e6661 799474 b5c99d', earth:'78645c b09a78 dfcda4',
    stone:'54546e 918b97 dfc3a7', floor:'4f6469 99a797 edd5a1',
    wall:'4c5971 749f9e e0cea7', ceiling:'666d8b 939fa6 ddd1bd',
    wood:'644c45 a87658 e0af77', metal:'59667c 9cabb4 d8e0dc',
    gold:'74454a d18450 ffd084', cloth:'725372 ad829c edbcbb',
    fire:'a45051 e58a4b ffdd86', ice:'6c839d b3d8db eaf3de',
    flesh:'916b68 c79078 f1cba3', accent:'665a83 9982ae d9b7cd',
    ivory:'86697b d5ab7d ffe7b2', shadow:'555367 747687 9a99a7'
  };
  const themes = {
    temple:{},
    castle:{wall:'58647b 8d9fa7 ded4bb', floor:'707281 b2a899 e9d9bc', cloth:'79495d ac6879 e5a99c'},
    palace:{wall:'706585 ac98ae e5d2cc', floor:'677b7b afbcb0 e6ddc4', cloth:'80446e be79a5 f1bad3',gold:'96605a dca859 fce39f'},
    machinery:{wall:'566978 89a6a5 ccd7bf', floor:'566369 879a97 c5c4a7',
      metal:'50617a 8da4a9 d1dcd6', accent:'775771 c38182 f0be8d'},
    wreck:{wood:'505c60 847c69 bea98a',wall:'536677 7f9b9a b7c6b6',
      water:'38596f 518b94 96c5bc',floor:'556e70 92a496 c4c8ab',metal:'57626d 829a98 bccbc3'},
    sea:{water:'375879 5a8ba5 a2d1ca',earth:'737984 a9b7a4 e0d6b2',
      foliage:'4e626f 688a78 a4b98a',stone:'546378 90a5a2 c8c8ae',sky:'688a9b 9bc5c3 cfe5d3'},
    coast:{sky:'8395aa b5d3d3 f2e4c4',water:'4a657f 6c9da7 b6d7cf',earth:'987e73 ccb48c f0dcb2'},
    desert:{sky:'9691ad d3c2b6 f0e1c4',earth:'9a776a d0a27b f1cd98',
      stone:'8a6a6c b78d79 dfb69a',floor:'8b7466 c5a57b f1cc93',foliage:'566f64 849879 b6bf92'},
    jungle:{sky:'7f99a4 b7d2bc e5dfbd',foliage:'495f5e 748c64 b2bd83',
      earth:'6d665e 9c9068 c8bc90',water:'4c6470 75968e aac1aa',wood:'655549 92734f c4a272'},
    highland:{sky:'8491ae bcc8d4 eae6d8',stone:'686d84 969ba8 d2c6b9',earth:'857661 b6a585 e0d3b3'},
    volcanic:{sky:'857584 b3969c e3bc9e',stone:'635363 8f7982 bfa197',floor:'695a66 96817d c7aa93',
      wall:'665463 99818b c8a599',earth:'746064 a38477 d8b295',fire:'ab4a53 f08243 ffe292'},
    crypt:{wall:'53586e 87899a c6b9b1',stone:'555c71 8a9295 c4bdb0',
      floor:'58616c 8a9992 c6c3a6',ceiling:'535d70 7e8797 b4b0b4'},
    village:{wall:'786f70 b7a798 e8d4b8',wood:'75564a b18260 e7b77f',floor:'78685c b6a082 e1c69b'},
    ruins:{wall:'58686d 8a9d96 d2c8ac',stone:'606a72 969b94 cbc6ab',
      floor:'686f67 9da58e cccaac',foliage:'516458 778868 a3ae87'}
  };

  const mix = (a,b,t) => a+(b-a)*t;
  function pack(r,g,b) {
    return (0xff000000 | (Math.round(b)<<16) | (Math.round(g)<<8) | Math.round(r)) >>> 0;
  }
  function stops(spec) {
    return spec.split(' ').map(hex=>[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)));
  }
  function ramp(colours, level) {
    const a=level<2?0:1, t=(level-2*a)*.5;
    return colours[a].map((v,i)=>mix(v,colours[a+1][i],t));
  }
  const swatches = new Map();
  function palette(name) {
    if (swatches.has(name)) return swatches.get(name);
    const papers=new Uint32Array(19*5), air=new Uint32Array(19*65);
    const walls=new Uint32Array(11*5), inks=new Uint32Array(11);
    const colours=Object.fromEntries(Object.entries({...base,...themes[name]}).map(([mat,spec])=>[mat,stops(spec)]));
    const aubergine=stops('8e829a af9cba dec9d3');
    for (const [mat,id] of Object.entries(M)) {
      for(let level=0;level<5;level++) papers[id*5+level]=pack(...ramp(colours[mat],level));
      for(let i=0;i<65;i++) air[id*65+i]=pack(...ramp(colours[mat],i/16));
    }
    for(let i=0;i<=10;i++) {
      const t=i/10, k=Math.max(0,Math.min(1,(t-.02)/.91)), s=k*k*(3-2*k);
      inks[i]=pack(mix(22,40,s),mix(24,16,s),mix(22,47,s));
      for(let level=0;level<5;level++) {
        const slate=ramp(colours.wall,level),plum=ramp(aubergine,level);
        walls[i*5+level]=pack(...slate.map((v,c)=>mix(v,plum[c],t)+[5,-2,5][c]*4*t*(1-t)));
      }
    }
    const result={papers,walls,inks,air};
    swatches.set(name,result);
    return result;
  }

  // Each PNG is a contact sheet of integer labels. Only the requested tile is
  // read back. Share concurrent image loads and keep a few decoded pages warm.
  const slots=new Map(), pages=new Map();
  for (const [page,sheet] of (window.ColourIndex?.pages || []).entries()) {
    sheet.paths.forEach((path,i)=>slots.set(path,{page,x:(i%4)*sheet.w,y:Math.floor(i/4)*sheet.h}));
  }
  async function materialMap(url,w,h) {
    const slot=slots.get(url);
    if(!slot)return null;
    let pending=pages.get(slot.page);
    if(!pending){
      const img=new Image();
      img.src='art/colour/atlas-'+slot.page+'.png';
      pending=img.decode().then(()=>img);
      pages.set(slot.page,pending);
      if(pages.size>4)pages.delete(pages.keys().next().value);
    }
    let img;
    try{img=await pending;}catch{
      if(pages.get(slot.page)===pending)pages.delete(slot.page);
      return null;
    }
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const ctx=c.getContext('2d');
    ctx.drawImage(img,slot.x,slot.y,w,h,0,0,w,h);
    const rgba=ctx.getImageData(0,0,w,h).data, result=new Uint8Array(w*h);
    for(let i=0;i<result.length;i++)result[i]=rgba[i*4];
    return result;
  }

  // A line segment entering all four inward planes intersects an altar pillar.
  function blocksLight(box,x,y,z,lx,ly,lz) {
    let lo=.002,hi=.999;
    if(Math.abs(ly)<1e-6){
      if(y<box.y0 || y>box.y1)return false;
    } else {
      const a=(box.y0-y)/ly,b=(box.y1-y)/ly;
      lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));
    }
    for(const p of box.planes){
      if(lo>=hi)return false;
      const d=p.nx*x+p.nz*z-p.offset, rate=p.nx*lx+p.nz*lz;
      if(Math.abs(rate)<1e-6){if(d<0)return false;}
      else if(rate>0)lo=Math.max(lo,-d/rate);
      else hi=Math.min(hi,-d/rate);
    }
    return lo<hi;
  }

  class Room {
    constructor(meta,rig,solids){
      this.themeName=window.ColourIndex?.rooms[meta.id] || 'castle';
      Object.assign(this,palette(this.themeName));
      this.env=window.RefreshEnvironments[meta.id];
      this.outside=this.env==='open'||this.env==='submerged';
      this.undersea=this.env==='submerged'||this.themeName==='sea';
      this.lx=Math.max(-2.,rig.left*.52);
      this.ly=Math.min(rig.ceiling-.1,rig.eye+1.);
      this.lz=Math.max(1.3,Math.min(3.2,rig.back*.42));
      this.casters=[];
      if(meta.id===7990){
        this.lx=-1.12;this.ly=2.75;this.lz=2.35;
        this.casters=solids.filter(s=>s.kind==='pillar');
      }
      this.tintScale=2.834/Math.max(2,rig.wallTop||rig.ceiling);
      this.plum=this.themeName==='machinery'?.48:this.themeName==='wreck'?.38:1;
      this.wallTop=rig.wallTop || rig.ceiling;
      const horizon=window.ColourIndex?.surround?.[meta.id] || [this.undersea?M.water:M.sky,M.stone,M.earth];
      this.surround=this.outside ? [...horizon,M.wood] : null;
    }
    fallback(face,y){
      if(this.surround)return this.surround[face===3?2:0];
      if(face===3)return M.floor;
      if(face===-3 || y>=this.wallTop)return M.ceiling;
      return this.env==='cave'?M.stone:M.wall;
    }
    pixel(isInk,tag,face,plane,solid,x,y,z,elevation,pattern){
      const mat=tag&31;
      // The clean strip around some source drawings is unprinted paper.
      if(tag&64)return isInk?INK:0xffb2bbbe;
      if(isInk && (mat!==M.wall || (tag&PROTECTED)))return INK;
      let tint=0;
      if(mat===M.wall){
        const h=y*this.tintScale+.21*Math.sin(1.16*x+.78*z)+.10*Math.cos(2.18*x-.59*z);
        const t=Math.max(0,Math.min(1,(h-.04)/2.56));
        tint=Math.round(10*this.plum*(1-t*t*(3-2*t)));
      }
      if(isInk)return mat===M.wall && !(tag&PROTECTED)?this.inks[tint]:INK;
      let level;
      if((this.outside&&!solid) || mat===M.sky || mat===M.water){
        // Grade sky and water by ray elevation so a hidden box corner cannot
        // add a false edge. Painted terrain borrows its value from the disk
        // pattern. Dark mountain faces and distant sand keep distinct washes.
        const e=Math.max(-1,Math.min(1,elevation));
        const grade=mat===M.sky ? .9-.52*Math.max(0,e) :
          mat===M.water ? .58+.26*e : .78+.26*(.5-density[pattern]);
        return this.air[mat*65+Math.round(64*grade)];
      } else {
        let nx=0,ny=0,nz=0;
        if(Math.abs(face)===3)ny=Math.sign(face);
        else if(plane){nx=-plane.nx;nz=-plane.nz;}
        else if(Math.abs(face)===1)nx=Math.sign(face);
        else nz=Math.sign(face);
        const lx=this.lx-x,ly=this.ly-y,lz=this.lz-z,dist=lx*lx+ly*ly+lz*lz;
        let light=Math.max(0,(lx*nx+ly*ny+lz*nz)/Math.sqrt(Math.max(.0001,dist)))/(1+.085*dist);
        if(light && this.casters.length && solid?.kind!=='pillar'){
          for(const caster of this.casters){
            if(blocksLight(caster,x+nx*.004,y+ny*.004,z+nz*.004,lx,ly,lz)){light*=.13;break;}
          }
        }
        level=Math.min(4,Math.round(4*(.19+.09*Math.max(0,ny)+1.3*light)));
        if(mat===M.fire || mat===M.ice)level=Math.max(2,level);
      }
      return mat===M.wall?this.walls[tint*5+level]:this.papers[mat*5+level];
    }
    spriteMaterial(key,tex){
      return tex.dominant || (key==='wizard'?M.cloth:key==='bat'?M.accent:M.metal);
    }
    spritePixel(bit,tag,fallback,level){
      if(bit===1)return INK;
      return this.papers[((tag&31)||fallback)*5+level];
    }
  }
  const density=window.ScepterPatterns.map(tile=>tile ?
    tile.reduce((count,row)=>count+row.toString(2).replace(/0/g,'').length,0)/64 : .5);
  density[0]=.5;
  const chartMaterial={castle:M.wall,temple:M.ivory,palace:M.cloth,machinery:M.metal,
    wreck:M.wood,sea:M.water,coast:M.water,desert:M.earth,jungle:M.foliage,
    highland:M.stone,volcanic:M.fire,crypt:M.accent,village:M.wood,ruins:M.floor};
  function chartPaper(id){
    const name=window.ColourIndex?.rooms[id] || 'castle';
    return palette(name).papers[(chartMaterial[name]||M.wall)*5+3];
  }
  window.RoomColour={Room,materialMap,chartPaper};
})();
