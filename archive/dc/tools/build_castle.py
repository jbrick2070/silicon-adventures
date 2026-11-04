"""Build archive/dc/castle-data.js for The Enchanted Castle from the Dark Castle disk.

    PYTHONPATH=<macresources, machfs> python archive/dc/tools/build_castle.py

Reads only the disk's own data: the room floor tables in CODE 5, the entry points
each room routine selects, the door-run paths (GPTH), per-room sound tables (SFTR),
score tables (Stbl), the shipped high scores (HISC) and key setup (KDEF).
"""
import json
import re
import struct
from pathlib import Path

import machfs
from macresources import parse_file

ROOT = Path(__file__).resolve().parents[3]
ROOMS = [(1000, 0x1fd6), (1010, 0x2450), (1020, 0x2974), (2000, 0x2efe), (2010, 0x31ee),
         (2020, 0x3670), (2030, 0x3a42), (3000, 0x3f3c), (3010, 0x437a), (3020, 0x46fe),
         (3030, 0x4b90), (4000, 0x50b4), (4010, 0x59e0), (4020, 0x5f6c)]
# The instruction pairs that load each room's two start points: floor table entry, then span.
ENTRIES = {1000: [(0x1ff4, 0x211a), (0x1ff0, 0x20ae)], 1010: [(0x2472, 0x2582), (0x2482, 0x2768)],
           1020: [(0x2992, 0x2d0a), (0x2982, 0x2a5e)], 2000: [(0x2f5c, 0x30f6), (0x2f24, 0x2fd6)],
           2010: [(0x31fc, 0x327e), (0x3218, 0x33c2)], 2020: [(0x3682, 0x3748), (0x3696, 0x38d4)],
           2030: [(0x3aa8, 0x3e56), (0x3a64, 0x3c16)], 3000: [(0x3f5a, 0x429c), (0x3f4a, 0x404a)],
           3010: [(0x4398, 0x4614), (0x4390, 0x453c)], 3020: [(0x4780, 0x4a94), (0x470c, 0x492c)],
           3030: [(0x4bbe, 0x4f92), (0x4b9e, 0x4c44)], 4000: [(0x522a, 0x596c), (0x50c2, 0x558e)],
           4010: [(0x5a06, 0x5de2), (0x59ee, 0x5a94)], 4020: [(0x6012, 0x66aa), (0x5f7a, 0x6140)]}


# The tables each room routine hands to its moving-platform call.
MOVERS = {2010: 0x32b4, 4010: 0x5bea}


def signed(data, offset):
    return struct.unpack_from('>h', data, offset)[0]


def floors(code, base, limit):
    table = base
    while signed(code, table) != -500:
        table += 2
    pairs = []
    while True:
        pair = signed(code, table), signed(code, table + 2)
        if pairs and pair == (0, 0):
            break
        pairs.append(pair)
        table += 4
    starts = sorted({offset for _, offset in pairs})
    out = []
    for y, offset in pairs:
        if y < -100:
            continue
        end = next((s for s in starts if s > offset), None)
        stop = base + end if end else min(limit, base + offset + 18 * 48)
        at, spans, begun = base + offset, [], False
        while at + 18 <= stop:
            record = [signed(code, at + 2 * i) for i in range(9)]
            here = at - base
            at += 18
            valid = record[0] <= record[1] and 0 <= record[2] <= 600 and abs(record[0]) < 900
            if any(record) and valid:
                spans.append([here] + record)
                begun = True
            elif begun and end is None:
                break
        if spans:
            out.append({'y': y, 'spans': spans})
    return out


def movers(code, at):
    """Moving platforms: x0, x1, 14, left, right, y, speed, offset to the next record, sprite frame."""
    out = []
    while True:
        record = [signed(code, at + 2 * i) for i in range(9)]
        if record[2] != 14:
            return out
        out.append({'x0': record[0], 'x1': record[1], 'left': record[3], 'right': record[4], 'y': record[5],
                    'speed': record[6], 'frame': record[8]})
        if not record[7]:
            return out
        at += record[7]


def entry(code, base, pointers):
    floor_at, span_at = pointers
    return {'y': signed(code, floor_at), 'x0': signed(code, span_at), 'x1': signed(code, span_at + 2)}


def path(data):
    words = struct.unpack(f'>{len(data) // 2}h', data[:len(data) // 2 * 2])
    door, door_x, door_y, count = words[1:5]
    reels = [words[i] for i in range(6, 16, 2) if words[i]]
    steps = []
    at = 15
    for _ in range(count):
        chunk = words[at:at + 5]
        if len(chunk) < 5:
            break
        steps.append({'reel': chunk[0], 'mask': chunk[1], 'x': chunk[2], 'y': chunk[3], 'frame': chunk[4]})
        at += 5
    return {'door': door, 'doorX': door_x, 'doorY': door_y, 'reels': reels, 'steps': steps}


def jump_rows(code, at):
    """One jump table: x step, y step, reel frame, y draw offset per update, ending at a negative x step."""
    rows = []
    while True:
        row = list(struct.unpack_from('>4h', code, at))
        if row[0] < 0:
            return rows
        rows.append(row)
        at += 8


def bcd(data):
    return [int(f'{value:04x}') for value in struct.unpack(f'>{len(data) // 2}H', data)]


def preferences():
    volume = machfs.Volume()
    volume.read((ROOT / 'sources/dark-castle/DarkCastle_1_2.dsk').read_bytes())
    fork = {(r.type, r.id): bytes(r) for r in parse_file(volume['Castle Preferences'].rsrc)}
    scores = []
    raw = fork[(b'HISC', 0)]
    # Ten records of 54 bytes: a name field, then the shown score as text at the record's end.
    for start in range(0, len(raw) - 53, 54):
        record = raw[start:start + 54]
        name = re.search(rb'[A-Za-z]{3,}', record[:14])
        points = re.findall(rb'[0-9][0-9,]*', record[40:])
        scores.append({'name': name.group().decode() if name else '', 'points': points[-1].decode() if points else ''})
    return {'scores': scores, 'keys': [c for c in struct.unpack('>10H', fork[(b'KDEF', 0)])]}


def main():
    fork_a = {(r.type.decode('mac_roman'), r.id): bytes(r)
              for r in parse_file((ROOT / 'archive/dc/Data A.rsrc').read_bytes())}
    fork_b = {(r.type.decode('mac_roman'), r.id): bytes(r)
              for r in parse_file((ROOT / 'archive/dc/Data B.rsrc').read_bytes())}
    code = fork_a[('CODE', 5)][4:]
    bases = [base for _, base in ROOMS] + [len(code)]
    rooms = {}
    for index, (room, base) in enumerate(ROOMS):
        rooms[room] = {'index': index, 'floors': floors(code, base, bases[index + 1]),
                       'movers': movers(code, MOVERS[room]) if room in MOVERS else [],
                       'entries': [entry(code, base, pair) for pair in ENTRIES[room]],
                       'sounds': list(struct.unpack_from(f'>{signed(fork_b[("SFTR", index)], 0)}H', fork_b[('SFTR', index)], 2))}
    data = {
        'rooms': rooms,
        'order': [room for room, _ in ROOMS],
        'paths': {rid: path(fork_a[('GPTH', rid)]) for rid in (10010, 10020, 10030, 10040)},
        # Duncan's three jumps from the hero code, CODE 2. The manual card draws the same three arcs.
        'jumps': {name: jump_rows(fork_a[('CODE', 2)][4:], at)
                  for name, at in (('running', 0x13a4), ('standing', 0x13e4), ('downward', 0x1434))},
        'scores': [bcd(fork_a[('Stbl', i)]) for i in range(4)],
        'sharedSounds': {i: list(struct.unpack_from(f'>{signed(fork_a[("SFTR", i)], 0)}H', fork_a[('SFTR', i)], 2)) for i in (20, 21, 22)},
        'preferences': preferences(),
        'demoVersion': fork_a[('DCAS', 0)][1:].decode('mac_roman').replace('\r', ' ')
    }
    text = 'window.CASTLE_DATA = ' + json.dumps(data, separators=(',', ':')) + ';\n'
    (ROOT / 'archive/dc/castle-data.js').write_text(text, encoding='utf8')
    print(len(text), data['preferences'], data['demoVersion'])
    print({k: v['entries'] for k, v in rooms.items()})
    print({k: (v['door'], v['doorX'], v['doorY'], v['reels'], len(v['steps']), v['steps'][:2], v['steps'][-1]) for k, v in data['paths'].items()})


if __name__ == '__main__':
    main()
