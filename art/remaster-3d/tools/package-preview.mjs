import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'preview');await fs.mkdir(out,{recursive:true});
for(const [name,n,fw,fh] of [['A-PPCT-101',6,32,40],['B-PPCT-906',3,48,32]]){
 const {data,info}=await sharp(path.join(root,'4x',name+'.png')).raw().ensureAlpha().toBuffer({resolveWithObject:true});
 const W=fw*4,H=fh*4,pad=16,PW=W+pad*2,PH=H+pad*2;
 for(const [theme,bg] of [['dark',[26,34,43]],['light',[232,228,218]]]){
  const pages=Buffer.alloc(PW*PH*n*3);
  for(let frame=0;frame<n;frame++)for(let y=0;y<PH;y++)for(let x=0;x<PW;x++){
   const dst=((frame*PH+y)*PW+x)*3;let rgb=bg;
   if(x>=pad&&x<W+pad&&y>=pad&&y<H+pad){const i=((y-pad)*info.width+frame*W+x-pad)*4;if(data[i+3])rgb=[data[i],data[i+1],data[i+2]];}
   for(let c=0;c<3;c++)pages[dst+c]=rgb[c];
  }
  await sharp(pages,{raw:{width:PW,height:PH*n,channels:3,pageHeight:PH}}).gif({loop:0,delay:Array(n).fill(140),colours:256}).toFile(path.join(out,name+'-'+theme+'.gif'));
 }
}
const heading=Buffer.from(`<svg width="1200" height="1120" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="1120" fill="#19232c"/><g font-family="Segoe UI,Arial,sans-serif"><text x="88" y="48" font-size="26" font-weight="600" fill="#f2e0b9">CASTLE • SOURCE-CONSTRAINED RELIEF</text><text x="88" y="76" font-size="16" fill="#aebec9">Final artwork · exact original pixel contours · 4× masters and native exports</text><text x="88" y="826" font-size="19" fill="#f2e0b9">HERO — SIX ORIGINAL POSES</text><text x="88" y="1050" font-size="19" fill="#f2e0b9">GARGOYLE — THREE ORIGINAL POSES</text><text x="860" y="860" font-size="16" fill="#aebec9">Original frame sizes:</text><text x="860" y="888" font-size="16" fill="#aebec9">hero 32 × 40</text><text x="860" y="916" font-size="16" fill="#aebec9">gargoyle 48 × 32</text><text x="860" y="958" font-size="16" fill="#aebec9">No crop, repacking</text><text x="860" y="984" font-size="16" fill="#aebec9">or silhouette changes.</text></g></svg>`);
const room=await sharp(path.join(root,'4x','B-PSCR-4020.png')).resize(1024,684,{kernel:'nearest'}).toBuffer();
const hero=await sharp(path.join(root,'4x','A-PPCT-101.png')).toBuffer();
const gargoyle=await sharp(path.join(root,'4x','B-PPCT-906.png')).resize(432,96,{kernel:'nearest'}).toBuffer();
await sharp(heading).composite([{input:room,left:88,top:100},{input:hero,left:76,top:846},{input:gargoyle,left:500,top:1014}]).png().toFile(path.join(root,'preview.png'));
console.log('Created preview.png and four animation previews. GIF timing is illustrative, not extracted game timing.');
