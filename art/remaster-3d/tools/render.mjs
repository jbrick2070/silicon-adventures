// Source-constrained relief shading. Never resamples, trims or warps source geometry.
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const S=4;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a.map((v,c)=>v*(1-t)+b[c]*t);
const lum=c=>.2126*c[0]+.7152*c[1]+.0722*c[2];
function lockTone(c,white){
 // A deliberately reversible tonal partition: thresholding recovers source ink.
 const l=lum(c);
 if(white&&l<132){
  // Preserve the material hue in deep shade where the light-class floor permits it.
  const gain=l>0?132/l:Infinity;
  c=Math.max(...c)*gain<=255?c.map(v=>v*gain):mix(c,[255,255,255],(132-l)/(255-l));
 }
 if(!white&&l>122)c=c.map(v=>v*122/l);
 return c.map(v=>Math.round(clamp(v,0,255)));
}
function distance(mask,w,h){
 const d=new Float32Array(w*h),diag=Math.SQRT2;
 for(let i=0;i<d.length;i++)d[i]=mask[i]?1e6:0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!mask[i])continue;let v=d[i];if(!x||!y)v=.5;if(x)v=Math.min(v,d[i-1]+1);if(y)v=Math.min(v,d[i-w]+1);if(x&&y)v=Math.min(v,d[i-w-1]+diag);if(x<w-1&&y)v=Math.min(v,d[i-w+1]+diag);d[i]=v;}
 for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;if(!mask[i])continue;let v=d[i];if(x===w-1||y===h-1)v=Math.min(v,.5);if(x<w-1)v=Math.min(v,d[i+1]+1);if(y<h-1)v=Math.min(v,d[i+w]+1);if(x<w-1&&y<h-1)v=Math.min(v,d[i+w+1]+diag);if(x&&y<h-1)v=Math.min(v,d[i+w-1]+diag);d[i]=v;}
 return d;
}
function blurField(src,w,h){
 const tmp=new Float32Array(src.length),dst=new Float32Array(src.length),k=[.0625,.25,.375,.25,.0625];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v=0;for(let j=-2;j<=2;j++)v+=src[y*w+clamp(x+j,0,w-1)]*k[j+2];tmp[y*w+x]=v;}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v=0;for(let j=-2;j<=2;j++)v+=tmp[clamp(y+j,0,h-1)*w+x]*k[j+2];dst[y*w+x]=v;}
 return dst;
}
function closestLabels(labels,w,h){
 const near=Int32Array.from(labels),dist=new Int16Array(labels.length);dist.fill(30000);const queue=[];
 for(let i=0;i<labels.length;i++)if(labels[i]>=0){dist[i]=0;queue.push(i);}
 for(let k=0;k<queue.length;k++){const i=queue[k],x=i%w,y=Math.floor(i/w);for(const n of [x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1])if(n>=0&&dist[n]>dist[i]+1){dist[n]=dist[i]+1;near[n]=near[i];queue.push(n);}}
 return near;
}
const inRect=(x,y,x0,y0,x1,y1)=>x>=x0&&x<x1&&y>=y0&&y<y1;
const stoneTrim={color:[235,209,163],type:'trim',height:4};
function roomMaterial(x,y,reg){
 const id=reg?.id, b=reg?.bounds||[0,0,0,0], bw=b[2]-b[0], bh=b[3]-b[1];
 if(y>=310)return {color:[255,255,255],type:'hud',height:0};
 // The left ledge's pale face connects to the wall in the source flood fill.
 // Give both existing faces the same material, within their original ink bounds.
 if(inRect(x,y,24,85,94,90)||inRect(x,y,417,85,487,90))return stoneTrim;
 // Large connected background regions must never inherit a rectangular material swatch.
 if(id===0)return {color:[169,181,186],type:'wall',height:.7};
 if(id===729||id===2718){
  if((x>=84&&x<213||x>=298&&x<428)&&y>=265&&y<309)return {color:[218,196,157],type:'panel',height:3};
  return {color:[140,167,191],type:'recess',height:.1};
 }
 // Each hard detail is clipped by the original region/ink, never a new polygon.
 const ladder=inRect(x,y,5,74,24,241)||inRect(x,y,487,74,506,241)||inRect(x,y,163,190,182,257)||inRect(x,y,329,190,348,257);
 if(ladder){
  const hole=bw>=10&&bw<=13&&bh<=7&&reg?.count>20;
  return hole?{color:[145,161,172],type:'recess',height:.1}:{color:[224,188,121],type:'brass',height:4.5};
 }
 if(inRect(x,y,40,4,63,44)||inRect(x,y,447,4,470,44)||inRect(x,y,247,99,263,134)||inRect(x,y,112,184,128,218)||inRect(x,y,384,184,400,218))return {color:[231,192,119],type:'brass',height:3.5};
 if(inRect(x,y,103,16,111,135)||inRect(x,y,400,16,406,135))return {color:[222,184,113],type:'brass',height:2.4};
 if(y>=230&&x>=237&&x<272)return {color:[185,161,120],type:'brass',height:3.2};
 if(inRect(x,y,208,31,238,59))return {color:[170,167,154],type:'arch',height:2.4};
 if((x>=80&&x<96||x>=415&&x<431)&&y>=116&&y<230)return {color:[224,203,170],type:'pillar',height:4};
 const isTrim=reg&&bw>=18&&bh<=8&&reg.count>=45;
 if(isTrim)return stoneTrim;
 if((x>83&&x<213||x>=298&&x<428)&&y>=265&&y<303)return {color:[218,196,157],type:'panel',height:3};
 if(x>=228&&x<283&&y>=222&&y<309)return {color:[220,202,166],type:'arch',height:3.7};
 if(y>=303)return {color:[210,191,158],type:'trim',height:2.2};
 return {color:[169,181,186],type:'wall',height:.7};
}
const jacketPanels=new Set([29,51,21,24,52,26,53,58,27,32,54,19,23,55,28,31,57,61]);
const jacket={color:[222,125,106],type:'cloth'};
function heroMaterial(x,y,frame,regionId){
 if(jacketPanels.has(regionId))return jacket;
 const centers=[19,14,12,14,18,15];const cx=centers[frame],yy=y+(frame===4?2:frame===1?1:0);
 if(yy<6)return {color:[139,91,58],type:'hair'};
 if(yy<11)return {color:[242,192,139],type:'skin'};
 if(yy<21){
  if(x<cx-3||x>cx+3)return {color:[239,182,126],type:'skin'};
  return jacket;
 }
 if(yy<26)return jacket;
 if(yy<31)return {color:[207,164,114],type:'leather'};
 return {color:[178,138,87],type:'leather'};
}
// Sample toward the upper-left light. Tall nearby relief shades lower surfaces.
const shadowRays=[1,2,3.5,5.5,8,11].map(reach=>({
 dx:Math.round(reach*S*.64),dy:Math.round(reach*S),rise:reach*.40,
}));
function contactShadow(heightField,x,y,width){
 const surface=heightField[y*width+x];
 let shadow=0;
 for(const {dx,dy,rise} of shadowRays){
  if(x<dx||y<dy)break;
  const blocker=heightField[(y-dy)*width+x-dx];
  shadow=Math.max(shadow,clamp((blocker-surface-rise)/1.8,0,1));
 }
 return shadow;
}
for(const [name,fw,kind] of [['B-PSCR-4020',512,'room'],['A-PPCT-101',32,'hero'],['B-PPCT-906',48,'gargoyle']]){
 const {data:src,info}=await sharp(path.resolve(root,'../castle',name+'.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h}=info,W=w*S,H=h*S;
 const regions=JSON.parse(await fs.readFile(path.join(root,'work',name+'-regions.json'),'utf8'));
 const labels=new Int32Array(w*h);labels.fill(-1);for(const r of regions)for(const p of r.pixels)labels[p]=r.id;
 const near=closestLabels(labels,w,h);
 const structural=new Uint8Array(w*h);
 // Thin isolated stipple is surface patina, not a forest of raised cubes.
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const p=y*w+x;if(src[p*4]>127)continue;
  let hr=1,vr=1;
  for(const sign of [-1,1])for(let k=1;k<=4;k++){const xx=x+k*sign;if(xx<0||xx>=w||src[(y*w+xx)*4]>127)break;hr++;}
  for(const sign of [-1,1])for(let k=1;k<=4;k++){const yy=y+k*sign;if(yy<0||yy>=h||src[(yy*w+x)*4]>127)break;vr++;}
  structural[p]=(hr>=3||vr>=3)?1:0;
 }
 const a=new Uint8Array(W*H),white=new Uint8Array(W*H);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,p=Math.floor(y/S)*w+Math.floor(x/S);a[i]=src[p*4+3]>0?1:0;white[i]=a[i]&&src[p*4]>127?1:0;}
 const dw=distance(white,W,H),da=kind==='room'?null:distance(a,W,H);
 const materials=[];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=y*w+x;materials[p]=kind==='room'?roomMaterial(x,y,regions[near[p]]):kind==='hero'?heroMaterial(x%fw,y,Math.floor(x/fw),near[p]):{color:[161,190,173],type:'stone'};}
 let z=new Float32Array(W*H);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const i=y*W+x,p=Math.floor(y/S)*w+Math.floor(x/S),m=materials[p];if(!a[i])continue;
  if(kind==='room'){
   const d=dw[i]/S;
   if(m.type==='recess'||m.type==='hud')z[i]=m.height;
   else if(m.type==='wall')z[i]=m.height+(white[i]?.12+.22*Math.min(d,1.1):(structural[p]?-.12:.1));
   else z[i]=m.height+(white[i]?Math.sqrt(Math.max(0,1-Math.pow(1-Math.min(d,1.35)/1.35,2)))*1.2:-.35);
  }else{
   const d=da[i]/S,r=kind==='hero'?3.3:4;
   z[i]=r*Math.sqrt(Math.max(0,1-Math.pow(1-Math.min(d,r)/r,2)))+(white[i]?.15:-.18);
  }
 }
 z=blurField(z,W,H);
 let guide=null;
 if(kind==='room')guide=await sharp(path.join(root,'studies','room-material-study.png')).resize(w,h,{fit:'fill'}).blur(10).removeAlpha().raw().toBuffer();
 const out=Buffer.alloc(W*H*4);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const i=y*W+x,p=Math.floor(y/S)*w+Math.floor(x/S),m=materials[p];out[4*i+3]=src[4*p+3];if(!a[i])continue;
  if(kind==='room'&&Math.floor(y/S)>=310){out[4*i]=255;out[4*i+1]=255;out[4*i+2]=255;continue;}
  const dx=(z[y*W+Math.min(W-1,x+1)]-z[y*W+Math.max(0,x-1)])*S*.42;
  const dy=(z[Math.min(H-1,y+1)*W+x]-z[Math.max(0,y-1)*W+x])*S*.42;
  const inv=1/Math.hypot(dx,dy,1),nx=-dx*inv,ny=-dy*inv,nz=inv;
  const diffuse=Math.max(0,nx*-.43+ny*-.58+nz*.69);
  const spec=Math.pow(Math.max(0,nx*-.23+ny*-.31+nz*.923),m.type==='brass'?38:22);
  let light=.47+.70*diffuse;
  let shadow=0;
  if(kind!=='room')light*=.72+.28*clamp(da[i]/S/1.8,0,1);
  else{
   const gl=lum([guide[p*3],guide[p*3+1],guide[p*3+2]])/255;
   if(m.type==='wall'||m.type==='recess')shadow=contactShadow(z,x,y,W);
   light*=(.84+.26*gl)*(1-.23*shadow);
  }
  const grain=kind==='room'?1+.012*Math.sin(x*1.31+y*.79)+.008*Math.sin(x*.37-y*1.79):1+.007*Math.sin(x*1.21+y*.41);
  const sheen=m.type==='brass'?40:m.type==='stone'||m.type==='leather'?26:18;
  let c=m.color.map((v,k)=>v*light*grain+(white[i]?spec*sheen:0)+(1-diffuse+shadow)*[0,3,9][k]);
  if(!white[i]){
   const ink=kind==='room'?(m.type==='wall'?.70:m.type==='recess'?.67:.44):.45+.17*diffuse;
   c=c.map(v=>v*ink+spec*(kind==='room'?4:14));
   if(kind==='room'&&!structural[p]&&(m.type==='wall'||m.type==='recess'))c=[119,123,127];
  }
  c=lockTone(c,white[i]);for(let k=0;k<3;k++)out[4*i+k]=c[k];
 }
 await sharp(out,{raw:{width:W,height:H,channels:4}}).png().toFile(path.join(root,'4x',name+'.png'));
 // Average only the interior of each exact source-pixel block. No edge filtering.
 const native=Buffer.alloc(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const p=y*w+x;native[p*4+3]=src[p*4+3];if(!src[p*4+3])continue;
  for(let c=0;c<3;c++){let sum=0;for(let yy=0;yy<S;yy++)for(let xx=0;xx<S;xx++)sum+=out[((y*S+yy)*W+x*S+xx)*4+c];native[p*4+c]=Math.round(sum/(S*S));}
 }
 await sharp(native,{raw:{width:w,height:h,channels:4}}).png().toFile(path.join(root,'native',name+'.png'));
 console.log(`Rendered ${name}: ${w}x${h} and ${W}x${H}`);
}
