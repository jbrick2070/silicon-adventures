"""Decode Default's DEMO stream using the original CODE 2 playback dispatch.

Requires machfs and macresources on PYTHONPATH. Writes only demo.json alongside
this script. CODE offsets are relative to the segment body.
"""
import hashlib
import json
from pathlib import Path

import machfs
from macresources import parse_file

ROOT = Path(__file__).resolve().parents[4]
volume = machfs.Volume()
volume.read((ROOT / 'sources/dark-castle/DarkCastle_1_2.dsk').read_bytes())
resources = list(parse_file(volume['Castle Preferences'].rsrc))
demo = next(r for r in resources if r.type == b'DEMO' and r.id == 8127)
data = bytes(demo)
bound = int.from_bytes(data[:2], 'big')
stream = data[4:4 + bound - 1]
out = []
i = 0
while i < len(stream):
    pos = i
    op = stream[i]
    i += 1
    row = {'delay': 0, 'command': None, 'value': None,
           'resource_offset': 4 + pos, 'bytes': [op], 'confidence': 'PROVEN'}
    if op & 0x80:
        row['delay'] = op & 0x7f
        row['evidence'] = 'CODE 2 $3108-$310a, $3226-$322e'
    else:
        group = op & 0xfc
        active = bool(op & 2)
        if group in (4, 8, 12, 16):
            field = '$a' if group in (4, 8) else '$8'
            val = (-8 if group in (4, 12) else 8) if active else 0
            row.update(command='set input field ' + field, value=val,
                       evidence='CODE 2 $312c-$3136, $315a-$31aa')
        elif group in (20, 24, 28, 32):
            bit = {20: 1, 24: 0, 28: 2, 32: 3}[group]
            row.update(command=('set' if active else 'clear') + ' input bit ' + str(bit),
                       value=active, evidence='CODE 2 $312c-$3136, $31ae-$3222')
            if group == 20 and active:
                if i >= len(stream):
                    raise ValueError('argument crosses the documented stream bound')
                arg = stream[i]
                i += 1
                row['bytes'].append(arg)
                row['value'] = ((op & 1) << 8) | arg
        else:
            raise ValueError(f'unknown opcode {op:#x} at resource offset {4 + pos:#x}')
    out.append(row)
assert sum(len(row['bytes']) for row in out) == len(stream) == bound - 1
assert hashlib.sha256(data).hexdigest() == '69e0e2212478cb0f6cc2e8d00735e576c5f81b85ff1fbb890ec57e448814a2a4'
(Path(__file__).parent / 'demo.json').write_text(json.dumps(out, indent=2) + '\n', encoding='utf8')
print(f'{len(out)} events, {len(stream)} stream bytes accounted for')
