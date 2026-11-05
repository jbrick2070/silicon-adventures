import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
await fs.mkdir(path.join(root,'work'),{recursive:true});
for(const [name,fw] of [['B-PSCR-4020',512],['A-PPCT-101',32],['B-PPCT-906',48]]){
 const src=path.resolve(root,'../castle',name+'.png');
 const {data,info}=await sharp(src).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h}=info;
 await sharp(src).resize(w*4,h*4,{kernel:'nearest'}).png().toFile(path.join(root,'work',name+'-original-4x.png'));
 const comps=[]; const labels=new Int32Array(w*h);labels.fill(-1);
 const white=(i)=>data[4*i+3]>0&&data[4*i]>127;
 for(let i=0;i<w*h;i++)if(white(i)&&labels[i]<0){
  const id=comps.length, pixels=[i];labels[i]=id;
  let minx=w,miny=h,maxx=-1,maxy=-1,sx=0,sy=0;
  for(let q=0;q<pixels.length;q++){
   const p=pixels[q],x=p%w,y=Math.floor(p/w);minx=Math.min(x,minx);maxx=Math.max(x,maxx);miny=Math.min(y,miny);maxy=Math.max(y,maxy);sx+=x;sy+=y;
   for(const n of [x%fw>0?p-1:-1,x%fw<fw-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1])if(n>=0&&labels[n]<0&&white(n)){labels[n]=id;pixels.push(n);}
  }
  comps.push({id,count:pixels.length,bounds:[minx,miny,maxx+1,maxy+1],center:[sx/pixels.length,sy/pixels.length],frame:Math.floor(minx/fw),pixels});
 }
 await fs.writeFile(path.join(root,'work',name+'-regions.json'),JSON.stringify(comps));
 console.log(name,comps.filter(c=>c.count>(fw===512?50:2)).map(({pixels,...c})=>c));
 const out=Buffer.from(data);
 for(let i=0;i<w*h;i++)if(labels[i]>=0){const id=labels[i];out[4*i]=80+(id*113)%175;out[4*i+1]=80+(id*53)%175;out[4*i+2]=80+(id*79)%175;}
 await sharp(out,{raw:{width:w,height:h,channels:4}}).resize(w*6,h*6,{kernel:'nearest'}).png().toFile(path.join(root,'work',name+'-regions.png'));
}
