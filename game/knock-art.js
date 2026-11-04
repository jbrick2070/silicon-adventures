/* Original plates for the armory excursion. Draw directly into the Macintosh pixel grid.
   Every textured fill uses the disk's eight-by-eight CODE 1 pattern table. */
(() => {
  'use strict';
  const W=338,H=314;
  const shields=[{x:48,y:104,w:60,h:84},{x:139,y:98,w:60,h:86},{x:230,y:104,w:60,h:84}];
  const beaconRegions={
    lamp:{x:64,y:126,w:82,h:78},
    card:{x:184,y:252,w:104,h:38},
    compass:{x:238,y:210,w:74,h:34},
    sky:{x:20,y:36,w:298,h:82}
  };
  const cache=new WeakMap();
  const pack=hex=>0xff000000|((hex&255)<<16)|(hex&0xff00)|(hex>>16);
  // Each material has an ink and a paper. In Classic, all map to the same two pens.
  const inks={
    stone:[0x352c40,0xc0ad99], light:[0x514351,0xe4cdad], shade:[0x292331,0x938598],
    floor:[0x3e3745,0xb7a69d], wood:[0x30252e,0xb09776], iron:[0x2e2936,0xb7b3aa],
    brass:[0x4d383a,0xe0be83], field:[0x393043,0xa08fa1], sky:[0x726c88,0xe8dfc9],
    far:[0x746b86,0xc5bdbe], hill:[0x525662,0xa6a99e], earth:[0x4a4652,0xbcb69e],
    water:[0x5e6874,0xd2d0ba], dark:[0x282332,0x9e92a1]
  };
  const colourPens={}, monoPens={};
  for(const [name,pair] of Object.entries(inks)){
    colourPens[name]=pair.map(pack);monoPens[name]=[pack(0),pack(0xffffff)];
  }

  function painter(pixels,colour){
    const pens=colour?colourPens:monoPens;
    const tiles=window.ScepterPatterns;
    function span(y,x1,x2,pattern,mat){
      if(y<0||y>=H)return;
      const lo=Math.max(0,Math.ceil(x1)),end=Math.min(W,Math.floor(x2)+1);
      if(lo>=end)return;
      const [ink,paper]=pens[mat],start=y*W,row=tiles[pattern][y&7];
      if(row===0||row===255){pixels.fill(row?ink:paper,start+lo,start+end);return;}
      for(let x=lo;x<end;x++)pixels[start+x]=(row&(128>>(x&7)))?ink:paper;
    }
    function rect(x,y,w,h,p=8,m='stone'){
      for(let j=Math.max(0,y);j<Math.min(H,y+h);j++)span(j,x,x+w-1,p,m);
    }
    function poly(points,p=8,m='stone'){
      const low=Math.max(0,Math.floor(Math.min(...points.map(q=>q[1]))));
      const high=Math.min(H,Math.ceil(Math.max(...points.map(q=>q[1]))));
      for(let y=low;y<high;y++){
        const hits=[],cy=y+.5;
        for(let i=0,j=points.length-1;i<points.length;j=i++){
          const [x1,y1]=points[j],[x2,y2]=points[i];
          if((y1>cy)!==(y2>cy))hits.push(x1+(cy-y1)*(x2-x1)/(y2-y1));
        }
        hits.sort((a,b)=>a-b);
        for(let k=0;k+1<hits.length;k+=2)span(y,hits[k]-.5,hits[k+1]-.5001,p,m);
      }
    }
    function line(x,y,u,v,p=8,m='stone'){
      x=Math.round(x);y=Math.round(y);u=Math.round(u);v=Math.round(v);
      const dx=Math.abs(u-x),dy=-Math.abs(v-y),sx=x<u?1:-1,sy=y<v?1:-1;
      let err=dx+dy;
      for(;;){
        span(y,x,x,p,m);
        if(x===u&&y===v)break;
        const twice=2*err;
        if(twice>=dy){err+=dy;x+=sx;}
        if(twice<=dx){err+=dx;y+=sy;}
      }
    }
    function path(points,p=8,m='stone'){
      for(let i=1;i<points.length;i++)line(...points[i-1],...points[i],p,m);
    }
    function oval(x,y,rx,ry,p=8,m='stone'){
      for(let j=-ry;j<=ry;j++){
        const half=Math.floor(rx*Math.sqrt(1-(j*j)/(ry*ry)));
        span(y+j,x-half,x+half,p,m);
      }
    }
    return {rect,poly,line,path,oval};
  }

  // An ogee crown and straight reveals. Insets share endpoints across all three bays.
  function arch(g,cx,top,bottom,rise,r,p,mat){
    const pts=[[cx,top],[cx+r*.25,top+rise*.20],[cx+r*.63,top+rise*.40],
      [cx+r*.88,top+rise*.65],[cx+r,top+rise],[cx+r,bottom],[cx-r,bottom],
      [cx-r,top+rise],[cx-r*.88,top+rise*.65],[cx-r*.63,top+rise*.40],[cx-r*.25,top+rise*.20]];
    g.poly(pts,p,mat);
  }
  function masonry(g,x,y,w,h,course,block){
    let row=0;
    for(let v=y+course;v<y+h;v+=course,row++){
      g.line(x,v,x+w-1,v,5,'shade');
      for(let u=x+(row%2?6:block/2);u<x+w;u+=block){
        g.line(u,v+1,u+1,Math.min(v+course-1,y+h-1),6,'shade');
        g.line(u+2,v+2,u+Math.min(12,block/4),v+2,1,'stone');
      }
    }
  }
  function floor(g,open){
    g.rect(0,212,W,102,4,'floor');
    g.poly([[0,212],[44,212],[0,259]],6,'shade');
    if(open)g.poly([[149,212],[176,212],[310,314],[183,314]],2,'light');
    const rows=[212,220,231,246,267,296,315],vanish=167;
    for(let r=0;r<rows.length-1;r++){
      const y=rows[r],z=rows[r+1];
      g.line(0,y,337,y,8,'floor');g.line(0,y+1,337,y+1,1,'floor');
      for(let n=-5;n<=5;n++){
        const slope=(n+(r%2)*.5)*.72;
        g.line(vanish+slope*(y-140),y+1,vanish+slope*(z-140),z-1,8,'floor');
      }
    }
    g.path([[32,278],[43,276],[50,278],[55,274]],8,'floor');
    g.path([[225,255],[237,253],[241,254]],8,'floor');
  }

  function guardroom(g,open){
    g.rect(0,0,W,H,4,'stone');masonry(g,0,0,W,214,13,39);
    // Four stone ribs cross the vaulted ceiling and land on carved corbels.
    g.poly([[0,0],[90,0],[76,15],[46,27],[26,51],[12,85],[0,96]],6,'shade');
    g.poly([[251,0],[338,0],[338,101],[326,88],[315,50],[294,28],[267,16]],6,'shade');
    const rib=[[0,8],[40,13],[81,27],[113,52],[127,74]];
    g.path(rib,8,'shade');g.path(rib.map(([x,y])=>[337-x,y]),8,'shade');
    g.path(rib.map(([x,y])=>[x,y+3]),1,'light');
    g.path(rib.map(([x,y])=>[337-x,y+3]),1,'light');
    floor(g,open);
    for(const [cx,top] of [[78,46],[169,30],[260,46]]){
      arch(g,cx,top,209,38,42,8,'shade');
      arch(g,cx,top+2,205,37,40,2,'light');
      arch(g,cx,top+9,201,34,35,8,'dark');
      arch(g,cx,top+11,200,34,33,5,'shade');
      g.rect(cx-33,195,67,4,2,'light');g.rect(cx-34,199,69,4,8,'shade');
      for(const s of [-1,1]){
        g.line(cx+s*31,top+26,cx+s*26,top+32,8,'stone');
        g.line(cx+s*16,top+12,cx+s*12,top+17,8,'stone');
      }
      const aperture=cx===169&&open;
      arch(g,cx,top+18,96,20,18,8,'dark');
      arch(g,cx,top+21,94,18,15,aperture?1:3,aperture?'sky':'wood');
      if(!aperture){
        g.rect(cx-1,top+23,3,91-top-23,8,'wood');
        for(const s of [-1,1])g.line(cx+s*8,top+31,cx+s*8,92,8,'wood');
        g.line(cx-13,85,cx+13,85,8,'wood');
      }else{
        g.poly([[154,88],[161,83],[168,84],[177,77],[184,79],[184,94],[154,94]],4,'far');
      }
    }
    for(const x of [22,121,217,316]){
      g.poly([[x-7,68],[x+8,68],[x+4,83],[x+4,203],[x-4,203],[x-4,83]],5,'shade');
      g.rect(x-3,80,3,125,2,'light');g.rect(x-8,67,18,4,2,'light');
      g.rect(x-7,71,15,3,8,'shade');g.rect(x-6,74,13,4,4,'stone');
      g.rect(x-6,202,13,4,1,'stone');g.rect(x-10,206,21,6,5,'shade');
    }
    g.poly([[0,167],[11,163],[15,182],[15,209],[0,220]],6,'dark');
    g.poly([[0,167],[11,163],[15,168],[4,173]],2,'light');
  }

  function shield(g,i,lit,elapsed){
    const b=shields[i],cx=b.x+30+(lit?(Math.floor(elapsed*18)%2?2:-2):0),y=b.y+3;
    const pts=(a,dy=0)=>a.map(([x,v])=>[cx+x,y+v+dy]);
    const shell=[[-25,0],[-13,3],[0,0],[13,3],[25,0],[24,37],[18,54],[8,66],[0,73],[-8,66],[-18,54],[-24,37]];
    const inner=[[-21,5],[-12,7],[0,4],[12,7],[21,5],[20,36],[15,51],[6,63],[0,68],[-6,63],[-15,51],[-20,36]];
    g.rect(cx-2,y-13,5,17,8,'iron');
    g.oval(cx,y-13,4,4,8,'iron');g.oval(cx-1,y-14,1,1,1,'light');
    g.poly(pts(shell).map(([x,v])=>[x+3,v+4]),8,'dark');
    g.poly(pts(shell),8,'iron');g.poly(pts(inner),1,lit?'light':'brass');
    g.poly(pts(inner.map(([x,v])=>[x*.88,5+v*.88])),i===1?4:3,'field');
    // A slim raised spine and a burnished rim remain visible in both palettes.
    g.path(pts([[-24,2],[-23,36],[-17,52],[-7,65]]),1,'light');
    if(i===0){
      g.poly(pts([[-13,35],[-10,25],[2,18],[14,10],[10,22],[4,23],[9,25],[6,29],[0,29],[4,31],[-3,35],[-7,34],[-12,41]]),8,'iron');
      g.path(pts([[-9,32],[-1,25],[9,19]]),1,'light');
    }else if(i===1){
      g.oval(cx,y+26,13,14,8,'iron');g.oval(cx+5,y+21,11,11,4,'field');
      g.path(pts([[-10,27],[-8,33],[-3,36],[2,37]]),1,'brass');
    }else{
      g.oval(cx-5,y+20,7,7,8,'iron');g.oval(cx-5,y+20,3,3,1,'brass');
      g.poly(pts([[-2,24],[1,21],[14,34],[10,38],[7,35],[5,37],[2,34],[5,31]]),8,'iron');
    }
    g.line(cx-14,y+43,cx+14,y+43,8,'iron');
    const dents=[[-12,5,12],[-12,-5,12],[-12,0,12]][i];
    for(const x of dents){
      g.oval(cx+x,y+49,2,2,8,'iron');
      g.line(cx+x-1,y+51,cx+x+1,y+51,1,'brass');
    }
    if(lit){
      g.path(pts([[-29,13],[-32,10],[-33,7]]),1,'light');
      g.path(pts([[29,13],[32,10],[33,7]]),1,'light');
    }
  }

  function threshold(g){
    g.rect(0,0,W,H,4,'stone');masonry(g,0,0,W,H,24,64);
    arch(g,165,-27,314,117,113,8,'dark');
    arch(g,165,-23,314,117,109,2,'light');
    arch(g,165,-12,314,111,98,5,'stone');
    arch(g,165,0,312,104,90,8,'shade');
    arch(g,165,4,306,101,86,4,'wood');
    for(let x=104;x<249;x+=20){
      const t=Math.abs(x-165)/86;
      const start=8+Math.floor(103*Math.pow(t,1.65));
      g.line(x,start,x,303,8,'wood');g.line(x+1,start+1,x+1,303,1,'wood');
      g.path([[x+7,start+41],[x+6,start+62],[x+8,start+86],[x+7,start+94]],13,'wood');
    }
    for(const y of [110,239]){
      g.poly([[82,y],[160,y],[176,y+5],[160,y+9],[82,y+9]],8,'iron');
      g.line(84,y+1,155,y+1,1,'iron');
      for(const x of [90,114,141])g.oval(x,y+5,2,2,1,'iron');
    }
    for(const sign of [-1,1]){
      for(let i=0;i<5;i++){
        const angle=Math.PI*(.08+i*.09);
        const u=165+sign*Math.round(102*Math.sin(angle)),v=Math.round(97-101*Math.cos(angle));
        g.line(u,v,u+sign*11,v-8,8,'stone');
      }
    }
    g.rect(70,294,191,8,5,'shade');g.rect(61,302,211,4,1,'light');g.rect(52,306,228,8,5,'floor');
  }
  function knocker(g,flash){
    const y=flash?153:157;
    g.poly([[189,128],[200,139],[200,154],[191,165],[180,154],[180,139]],8,'iron');
    g.poly([[189,131],[196,139],[196,151],[190,159],[183,151],[183,139]],3,'brass');
    g.oval(190,145,5,5,8,'iron');
    for(const s of [-1,1]){
      const profile=[[2,1],[9,5],[14,14],[14,24],[10,30],[4,33],[0,34]].map(([x,v])=>[190+s*x,y-10+v]);
      for(let d=0;d<5;d++)g.path(profile.map(([x,v])=>[x+s*d,v]),8,'iron');
      g.path(profile.map(([x,v])=>[x+s*2,v-1]),1,'brass');
    }
    g.oval(190,y+23,5,4,8,'iron');g.line(186,y+21,192,y+21,1,'brass');
  }

  function tower(g){
    g.rect(0,0,W,H,1,'sky');
    // Long broken cloud banks frame the open stretch above the far ridge.
    for(const [x,y,w] of [[-21,34,106],[27,43,73],[246,49,102],[173,80,46],[4,99,71]]){
      g.poly([[x,y],[x+w*.22,y-2],[x+w*.35,y-6],[x+w*.54,y-4],[x+w*.63,y-2],
        [x+w*.83,y-2],[x+w,y+1],[x+w*.6,y+2],[x+w*.26,y+1]],2,'far');
    }
    g.poly([[0,146],[22,137],[39,143],[61,128],[78,133],[105,113],[132,135],
      [159,122],[177,132],[196,116],[212,124],[235,107],[260,121],[283,112],
      [308,126],[338,118],[338,214],[0,214]],3,'far');
    g.path([[87,132],[105,113],[113,122],[107,121],[103,126]],1,'sky');
    g.path([[220,119],[235,107],[246,113],[237,111],[233,115]],1,'sky');
    g.poly([[0,149],[31,155],[58,144],[90,152],[113,143],[142,158],[161,152],
      [189,161],[220,143],[256,154],[279,141],[307,148],[338,141],[338,223],[0,223]],5,'hill');
    g.poly([[0,183],[38,176],[71,180],[99,167],[130,172],[164,167],[197,175],
      [230,161],[263,168],[295,160],[338,169],[338,245],[0,245]],3,'earth');
    g.poly([[181,164],[187,164],[161,179],[182,184],[145,199],[131,211],
      [107,211],[132,195],[165,185],[151,180]],1,'water');
    // A road and a hamlet give scale to the small silhouette overhead.
    for(const [x,y] of [[61,172],[70,174],[77,170],[269,176],[278,174]]){
      g.rect(x,y,6,4,1,'stone');g.poly([[x-1,y],[x+3,y-4],[x+7,y]],8,'wood');g.rect(x+2,y+1,1,3,8,'dark');
    }
    for(let x=5;x<W;x+=38){
      g.rect(x,201,22,23,4,'stone');g.rect(x,200,22,3,1,'light');g.rect(x+18,204,4,20,6,'shade');
    }
    g.rect(0,222,W,92,4,'stone');masonry(g,0,222,W,92,17,45);
    g.rect(0,222,W,4,2,'light');g.rect(0,228,W,3,8,'shade');
    // Close masonry on the two margins forms the watchtower embrasure.
    for(const mirror of [false,true]){
      const pts=a=>a.map(([x,y])=>[mirror?337-x:x,y]);
      g.poly(pts([[0,0],[33,0],[18,31],[14,75],[12,188],[26,223],[0,253]]),6,'shade');
      g.path(pts([[33,0],[18,31],[14,75],[12,188],[26,223]]),8,'stone');
      g.poly(pts([[0,244],[79,236],[114,248],[94,264],[0,277]]),2,'light');
      g.path(pts([[0,277],[94,264],[114,248]]),8,'shade');
    }
  }
  function aircraft(g,elapsed){
    const x=39+Math.floor((elapsed*8+85)%259),y=78-Math.round(4*Math.sin(elapsed*.18));
    const outline=[[-16,-1],[-10,-1],[-14,-5],[-11,-5],[-4,-1],[2,-1],[-3,-9],
      [1,-9],[10,-1],[16,0],[17,2],[8,3],[1,10],[-3,10],[1,3],[-10,2],[-14,4],[-16,4],[-14,1]];
    g.poly(outline.map(([u,v])=>[x+u,y+v]),8,'dark');
    g.line(x+9,y,x+13,y,1,'iron');
  }

  function beaconDesk(g){
    // The signalling station occupies the near ledge. The sky stays open
    // above it, so the waiting aircraft can be followed while reading the lamp.
    g.poly([[0,230],[122,214],[338,235],[338,314],[0,314]],5,'shade');
    g.poly([[0,224],[123,206],[338,228],[338,244],[122,224],[0,241]],2,'light');
    g.path([[0,241],[122,224],[338,244]],8,'stone');
    g.path([[0,244],[120,228],[338,248]],1,'light');
    g.poly([[27,236],[141,220],[196,227],[175,249],[49,263]],8,'dark');
    g.poly([[30,232],[143,216],[193,222],[171,242],[50,256]],3,'brass');
    g.path([[34,233],[141,219],[186,223]],1,'light');
    for(const [x,y] of [[43,237],[144,224],[61,248],[171,233]]){
      g.oval(x,y,2,2,8,'iron');g.line(x-1,y-1,x+1,y-1,1,'brass');
    }
    // Tripod feet and the yawing lamp's heavy pedestal.
    g.poly([[80,201],[88,200],[99,232],[91,235]],8,'iron');
    g.poly([[118,198],[125,198],[148,225],[138,228]],8,'iron');
    g.poly([[106,204],[112,204],[113,240],[105,242]],8,'iron');
    g.oval(106,213,23,7,8,'iron');g.oval(106,210,23,7,3,'brass');
    g.line(87,209,122,205,1,'light');
    g.rect(100,185,13,25,8,'iron');g.rect(102,185,4,23,1,'brass');
    // The crank is deliberately separate from the lamp's shutter lever.
    g.path([[132,196],[145,201],[153,198],[153,186]],8,'iron');
    g.path([[133,194],[145,199],[151,196],[151,185]],1,'brass');
    g.oval(152,183,6,3,8,'wood');g.line(149,181,154,181,1,'wood');
    // Three stamped code groups. These are ordinary pixel marks, like the
    // shield dents, so the card remains legible with the sound switched off.
    g.poly([[184,252],[267,256],[288,288],[193,285]],8,'wood');
    g.poly([[188,254],[264,258],[282,283],[196,282]],1,'light');
    g.line(196,260,258,263,8,'brass');
    g.line(197,264,216,265,8,'iron');g.line(226,266,252,267,8,'iron');
    g.rect(203,274,5,3,8,'iron');g.rect(222,275,19,3,8,'iron');g.rect(254,276,5,3,8,'iron');
  }

  function compass(g,bearing){
    const x=274,y=229;
    g.oval(x+2,y+4,35,14,8,'dark');
    g.oval(x,y,35,14,8,'brass');g.oval(x,y-1,31,11,1,'light');
    g.oval(x,y-1,28,9,3,'field');
    g.line(x-25,y-1,x+25,y-1,8,'iron');g.line(x,y-10,x,y+8,8,'iron');
    // Small engraved N and E. The east pointer also has a forked tail,
    // distinguishing its heading by shape in the two-colour view.
    g.path([[271,216],[271,211],[277,216],[277,211]],8,'iron');
    g.path([[307,226],[303,226],[303,232],[307,232]],8,'iron');
    g.line(303,229,306,229,8,'iron');
    const tip=bearing==='north'?[274,220]:bearing==='west'?[250,228]:[299,228];
    g.poly([[x-3,y+2],tip,[x+2,y-3],[x+8,y+4],[x,y+1],[x-8,y+5]],8,'iron');
    g.oval(x,y,2,2,1,'brass');
  }

  function shutterLamp(g,bearing,flash){
    // The housing turns in its cradle. The shutter is the only bright surface
    // during a transmission; no anti-aliased glow is painted over the view.
    const shift=bearing==='west'?-12:bearing==='north'?0:10,cx=100+shift,cy=159;
    g.poly([[74,190],[74,149],[83,136],[124,132],[139,143],[139,183],[128,194],[84,198]],8,'iron');
    g.poly([[78,187],[78,150],[86,140],[122,136],[134,145],[134,180],[125,188],[87,193]],3,'brass');
    g.path([[80,150],[89,142],[122,138],[130,145]],1,'light');
    g.poly([[111,137],[132,143],[140,154],[141,178],[132,191],[112,187]],6,'brass');
    g.oval(cx,cy,30,32,8,'iron');
    g.oval(cx,cy-1,26,28,1,'brass');
    g.oval(cx,cy-1,22,24,flash?1:8,flash?'light':'dark');
    g.oval(cx,cy-1,18,20,flash?1:5,flash?'light':'shade');
    if(!flash){
      for(const y of [143,153,163,173]){
        g.line(cx-18,y,cx+18,y,8,'iron');
        g.line(cx-17,y+1,cx+17,y+1,1,'brass');
      }
    }else{
      g.oval(cx-4,cy-6,7,10,1,'light');
      for(const [a,b,c,d] of [[-35,-9,-40,-11],[-35,9,-41,11],[31,-19,36,-23],[34,6,41,8]]){
        g.line(cx+a,cy+b,cx+c,cy+d,1,'light');
      }
    }
    g.poly([[71,165],[66,166],[66,185],[72,188],[77,183],[76,176],[72,179]],8,'iron');
    g.line(68,169,68,181,1,'brass');
  }

  function courier(g,elapsed,success){
    const cx=205+Math.round(32*Math.sin(elapsed*.24)),cy=78+Math.round(5*Math.sin(elapsed*.35));
    // A little high-wing prop aircraft, banked toward the tower. Its belly
    // and wing struts keep it distinct from the first distant silhouette.
    const pts=a=>a.map(([x,y])=>[cx+x,cy+y]);
    g.poly(pts([[-55,1],[-49,-4],[-25,-6],[-11,-9],[3,-10],[17,-6],[45,-4],[53,-1],
      [47,4],[16,8],[-5,10],[-31,7],[-47,6]]),8,'iron');
    g.poly(pts([[-24,-5],[-9,-11],[11,-10],[26,-4],[6,-2],[-12,-1]]),1,'light');
    g.poly(pts([[-3,-7],[-34,-38],[-43,-36],[-19,-2],[7,5],[38,25],[49,26],[18,0]]),8,'dark');
    g.poly(pts([[-30,-33],[-36,-34],[-13,-3],[-8,-3]]),1,'iron');
    g.poly(pts([[10,5],[38,23],[43,23],[17,5]]),3,'iron');
    g.path(pts([[-20,6],[-11,19],[-4,6]]),8,'iron');
    g.path(pts([[9,7],[15,17],[21,7]]),8,'iron');
    g.poly(pts([[36,-3],[43,-19],[49,-18],[46,-2],[57,5],[49,7],[38,3]]),8,'iron');
    g.line(cx-54,cy-15,cx-54,cy+16,8,'iron');
    g.line(cx-55,cy-12,cx-55,cy+12,3,'iron');
    g.oval(cx-53,cy+1,3,3,1,'brass');
    g.path(pts([[-47,-1],[-34,-2],[-26,0]]),1,'light');
    if(success){
      const drop=17+Math.floor((elapsed*7)%45),x=cx-7;
      g.path([[x,cy+13],[x-2,cy+drop-5],[x+1,cy+drop+3]],8,'wood');
      g.poly([[x,cy+drop-4],[x+10,cy+drop-7],[x+6,cy+drop-1],[x,cy+drop+1]],1,'brass');
      g.poly([[x-3,cy+drop+3],[x+3,cy+drop+2],[x+5,cy+drop+10],[x-1,cy+drop+11]],8,'iron');
      g.line(x,cy+drop+4,x+1,cy+drop+8,1,'brass');
    }
  }

  function draw(canvas,{stage,colour,elapsed=0,active=-1,flash=false,open=false,bearing='east',success=false}){
    const ctx=canvas.getContext('2d',{alpha:false,willReadFrequently:true});
    const key=stage+'-'+colour+'-'+open;
    let plate=cache.get(canvas);
    if(plate?.key!==key){
      const frame=ctx.createImageData(W,H),pixels=new Uint32Array(frame.data.buffer);
      const g=painter(pixels,colour);
      if(stage==='tower'||stage==='beacon'||stage==='approach')tower(g);
      else if(stage==='guardroom')guardroom(g,open);
      else threshold(g);
      plate={key,frame,pixels,base:pixels.slice(),g};
      cache.set(canvas,plate);
    }
    plate.pixels.set(plate.base);
    if(stage==='beacon'){
      aircraft(plate.g,elapsed);beaconDesk(plate.g);compass(plate.g,bearing);shutterLamp(plate.g,bearing,flash);
    }else if(stage==='approach'){
      courier(plate.g,elapsed,success);
      beaconDesk(plate.g);compass(plate.g,'east');shutterLamp(plate.g,'east',flash);
    }else if(stage==='tower')aircraft(plate.g,elapsed);
    else if(stage==='guardroom')shields.forEach((_,i)=>shield(plate.g,i,i===active&&flash,elapsed));
    else knocker(plate.g,flash);
    ctx.putImageData(plate.frame,0,0);
  }
  window.KnockArt={draw,shields,beaconRegions};
})();
