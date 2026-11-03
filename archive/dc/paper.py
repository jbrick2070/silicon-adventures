"""Render the monochrome PICT, icon and bitmap font resources from the disk.

Run with Pillow, machfs and macresources installed. This reader implements
the QuickDraw v1 opcodes present on this image and rejects unknown commands.
"""
import io
import json
import struct
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw
import machfs
from macresources import parse_file
from extract import DISK, HERE, ROOT, digest


def bitmap(data, rowbytes, height):
    raw = bytes(v ^ 255 for v in data)
    return Image.frombytes('1', (rowbytes*8, height), raw)


def packline(packed, width):
    src = io.BytesIO(packed)
    out = bytearray()
    while src.tell() < len(packed):
        n = src.read(1)[0]
        if n < 128:
            out.extend(src.read(n+1))
        elif n > 128:
            out.extend(src.read(1)*(257-n))
    if len(out) != width:
        raise ValueError('Incorrect PackBits row length')
    return out


class Strike:
    def __init__(self, data):
        (_, self.first, self.last, _, self.kern, _, _, h, ow, self.ascent,
         self.descent, _, words) = struct.unpack_from('>13h', data)
        table = 26 + h*words*2
        self.sheet = bitmap(data[26:table], words*2, h)
        self.locations = struct.unpack_from('>'+'H'*(self.last-self.first+3), data, table)
        self.widths = data[16+2*ow:]

    def draw(self, image, x, baseline, text):
        for c in text:
            if c < 32:
                continue
            if c == 202:  # nonbreaking space
                c = 32
            ix = c-self.first
            if not 0 <= ix <= self.last-self.first or self.widths[2*ix:2*ix+2] == b'\xff\xff':
                ix = self.last-self.first+1
            side, advance = self.widths[2*ix:2*ix+2]
            left,right = self.locations[ix:ix+2]
            glyph = self.sheet.crop((left,0,right,self.sheet.height))
            image.paste(0,(x+self.kern+side,baseline-self.ascent,x+self.kern+side+glyph.width,
                           baseline-self.ascent+glyph.height),ImageChops.invert(glyph))
            x += advance


def pict(data, fonts):
    src = io.BytesIO(data)
    def read(fmt):
        values = struct.unpack('>'+fmt, src.read(struct.calcsize('>'+fmt)))
        return values[0] if len(values)==1 else values
    read('H')
    top,left,bottom,right = read('hhhh')
    image = Image.new('1',(right-left,bottom-top),1)
    composite = image.copy()
    clip = (0,0,image.width,image.height)
    def flush():
        if clip[2] > clip[0] and clip[3] > clip[1]:
            composite.paste(image.crop(clip),clip)
    pen = (1,1)
    font = 3
    size = 12
    tx = ty = 0
    while True:
        op = read('B')
        if op == 255:
            break
        if op == 17:
            assert read('B') == 1
        elif op == 1:
            # All clip regions in these 23 PICTs are rectangles.
            assert read('H') == 10
            flush()
            image = composite.copy()
            y,x,ey,ex = read('hhhh')
            clip = (max(0,x-left),max(0,y-top),min(image.width,ex-left),min(image.height,ey-top))
        elif op == 160:
            read('H')
        elif op == 161:
            read('H'); src.read(read('H'))
        elif op == 3:
            font = read('H')
        elif op == 13:
            size = read('H')
        elif op == 7:
            pen = read('hh')
        elif op in (32,34):
            y,x = read('hh')
            if op == 32:
                ey,ex = read('hh')
            else:
                dx,dy = read('bb'); ex,ey=x+dx,y+dy
            ImageDraw.Draw(image).line((x-left,y-top,ex-left,ey-top), fill=0,width=max(pen))
        elif op in (40,41,42,43):
            if op == 40:
                ty,tx = read('hh')
            else:
                if op in (41,43): tx += read('b')
                if op in (42,43): ty += read('b')
            text = src.read(read('B'))
            fonts[font*128+size].draw(image,tx-left,ty-top,text)
        elif op == 96:
            y,x,ey,ex = read('hhhh')
            start, sweep = read('hh')
            # QuickDraw uses angles clockwise from twelve o'clock.
            endpoints = sorted([start-90,start+sweep-90])
            ImageDraw.Draw(image).arc((x-left,y-top,ex-left-1,ey-top-1),*endpoints,fill=0,width=max(pen))
        elif op in (144,152):
            rb = read('H')
            by,bx,end_y,_ = read('hhhh')
            sy,sx,sy2,sx2 = read('hhhh')
            dy,dx,dy2,dx2 = read('hhhh')
            mode = read('H')
            rows = []
            for _ in range(end_y-by):
                if op == 144 or rb < 8:
                    rows.append(src.read(rb))
                else:
                    rows.append(packline(src.read(read('H' if rb>250 else 'B')),rb))
            tile = bitmap(b''.join(rows),rb,end_y-by).crop((sx-bx,sy-by,sx2-bx,sy2-by))
            tile = tile.resize((dx2-dx,dy2-dy),Image.Resampling.NEAREST)
            # All noncopy bitmap draws use srcOr (black ink on existing paper).
            assert mode in (0,1)
            image.paste(tile,(dx-left,dy-top),ImageChops.invert(tile) if mode else None)
        else:
            raise ValueError(f'Unsupported PICT opcode {op:#04x} at byte {src.tell()-1}')
    flush()
    return composite


def export():
    volume = machfs.Volume()
    volume.read(DISK.read_bytes())
    resources = {name:list(parse_file(f.rsrc)) for name,f in volume.items()}
    fonts = {r.id:Strike(r.data) for res in resources.values() for r in res if r.type == b'FONT' and r.data}
    records = []
    folder = HERE/'paper'
    folder.mkdir(exist_ok=True)
    for name,res in resources.items():
        for r in res:
            kind = r.type.decode('mac_roman')
            if kind == 'PICT':
                im = pict(r.data,fonts)
            elif kind in ('ICON','ICN#') and len(r.data) in (128,256):
                im = bitmap(r.data[:128],4,32)
                if kind == 'ICN#':
                    im = im.convert('RGBA')
                    im.putalpha(ImageChops.invert(bitmap(r.data[128:],4,32)).convert('L'))
            elif kind == 'FONT' and r.data:
                font = fonts[r.id]
                im = Image.new('1',(368,104),1)
                for row in range(6):
                    font.draw(im,5,14+row*16,bytes(range(32+16*row,48+16*row)))
            else:
                continue
            f = folder/(name.replace(' ','-')+'-'+kind.replace('#','N')+'-'+str(r.id)+'.png')
            im.save(f)
            records.append({'fork':name,'type':kind,'id':r.id,'width':im.width,'height':im.height,
                            'frames':1,'path':f.relative_to(ROOT).as_posix(),'sha256':digest(r.data)})
    (HERE/'paper.js').write_text('window.CastlePaper='+json.dumps(records,separators=(',',':'))+';\n',encoding='ascii')
    print(len(records),'paper and interface specimens')


if __name__ == '__main__':
    export()
