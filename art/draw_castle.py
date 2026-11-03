"""Extract original Dark Castle PPCTs from the local Data A/B resource forks.

Format references: resource_dasm/src/SpriteDecoders/DarkCastle-PPCT-PSCR.cc
by phosg and Apple Inside Macintosh, Resource Manager.
"""
from pathlib import Path
import argparse
import json
import hashlib
import struct
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent


def graphics_resources(fork):
    data_start, index = struct.unpack_from(">II",fork)
    types = index + struct.unpack_from(">H",fork,index + 24)[0]
    count = struct.unpack_from(">H",fork,types)[0] + 1
    for i in range(count):
        kind, n, offset = struct.unpack_from(">4sHH",fork,types + 2 + 8*i)
        if kind not in (b"PPCT",b"PSCR"):
            continue
        for j in range(n+1):
            ref = types + offset + 12*j
            ident = struct.unpack_from(">h",fork,ref)[0]
            start = data_start + int.from_bytes(fork[ref+5:ref+8],"big")
            length = struct.unpack_from(">I",fork,start)[0]
            yield kind.decode(), ident, fork[start+4:start+4+length]


def decode(data):
    kind, count, words, height = struct.unpack_from(">4H",data)
    width = words * 16
    if kind >= 1000:
        raise ValueError("Version 2 encoding is not on these disks")
    mask = kind in (0,3,9)
    bitstream = bytearray()
    for code in data[14:]:
        if code == 128:
            break
        if code > 128:
            bitstream.extend(bytes([bool(code & 64)]) * ((code & 63) + 7))
        else:
            bitstream.extend((code >> shift) & 1 for shift in range(6,-1,-1))
    frame_size = width*height
    stride = frame_size*(2 if mask else 1)
    if len(bitstream) < count*stride:
        bitstream.extend(bytes(count*stride-len(bitstream)))
    frames = []
    for i in range(count):
        start = i*stride
        source = bitstream[start:start+frame_size]
        luminance = bytes(source).translate(bytes.maketrans(b"\x00\x01",b"\xff\x00"))
        img = Image.frombytes("L",(width,height),luminance).convert("RGBA")
        if mask:
            ink = bitstream[start+frame_size:start+stride]
            alpha = bytes(ink).translate(bytes.maketrans(b"\x00\x01",b"\x00\xff"))
            img.putalpha(Image.frombytes("L",(width,height),alpha))
        frames.append(img)
    return frames


def inspect(sources, directory):
    directory.mkdir(parents=True, exist_ok=True)
    for source in sources:
        rr = sorted((rid,data) for kind,rid,data in graphics_resources(source.read_bytes()) if kind=="PPCT")
        for page in range(0,len(rr),40):
            batch = rr[page:page+40]
            sheet = Image.new("RGB",(600,((len(batch)+5)//6)*92),"#999999")
            labels = ImageDraw.Draw(sheet)
            for j,(rid, data) in enumerate(batch):
                frames = decode(data)
                x,y = j%6*100,j//6*92
                im = frames[len(frames)//2]
                area = im.getbbox()
                if area:
                    im = im.crop(area)
                scale = min(3,95/im.width,67/im.height)
                im = im.resize((max(1,round(scale*im.width)),max(1,round(scale*im.height))),0)
                sheet.paste(im,(x+(100-im.width)//2,y),im)
                labels.text((x+4,y+67),f"{rid}: {len(frames)}f", fill="black")
            sheet.save(directory/f"{source.stem}_{page//40}.png")


def screen(data):
    short_dict = data[2:10]
    long_dict = data[10:138]
    result = bytearray()
    commands = iter(data[138:])
    for code in commands:
        if code == 0:
            result.append(next(commands))
        elif code & 128:
            result.extend(bytes([short_dict[code >> 4 & 7]]) * ((code & 15) + 1))
        else:
            result.append(long_dict[code-1])
    if len(result) < 512*342//8:
        raise ValueError(f"Short PSCR length {len(result)}")
    return Image.frombytes("1",(512,342),bytes(result)).point(lambda p:255-p)


def export(sources):
    target = ROOT / "castle"
    target.mkdir(exist_ok=True)
    index = []
    wizard = Image.new("RGBA",(48*8,46*3))
    for path in sources:
        code = path.stem[-1]
        for kind,rid,data in sorted(graphics_resources(path.read_bytes())):
            if kind == "PPCT":
                frames = decode(data)
                w,h = frames[0].size
                img = Image.new("RGBA",(len(frames)*w,h))
                for i,frame in enumerate(frames):
                    img.paste(frame,(i*w,0))
                    if code=="B" and rid in (430,431,432):
                        wizard.paste(frame,(i*48,(rid-430)*46+46-h))
            else:
                img = screen(data)
                w,h = img.size
                frames = [img]
            filename = f"{code}-{kind}-{rid}.png"
            img.save(target/filename,optimize=True)
            index.append({
                "fork":path.stem, "type":kind, "id":rid, "frames":len(frames),
                "width":w,"height":h,"path":"art/castle/"+filename,
                "sha256":hashlib.sha256(data).hexdigest(),
            })
    wizard.save(ROOT/"castle-wizard.png",optimize=True)
    (ROOT/"castle-index.js").write_text("window.CastleGraphics = "+json.dumps(index,separators=(",",":"))+";\n",encoding="utf-8")
    return index


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--inspect",type=Path)
    args=parser.parse_args()
    forks = [ROOT.parent / "archive" / "dc" / f"Data {c}.rsrc" for c in "AB"]
    if args.inspect:
        inspect(forks,args.inspect)
    else:
        entries = export(forks)
        print(f"Decoded {len(entries)} graphics resources")
