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


FONTS = {'score': ('score-font', 'Data-A-FONT-25737-strip.png'), 'dialog': ('dialog-font', 'Data-A-FONT-29452-strip.png'),
         'scepters': ('scepters-font', 'Scepters-FONT-394-strip.png')}


def fonts():
    """Copy each font strip beside the disk's other pictures and keep its metrics for the game."""
    out = {}
    source = ROOT / 'archive/dc/rooms/assets'
    for key, (name, strip) in FONTS.items():
        meta = json.loads((source / f'{name}.json').read_text(encoding='utf8'))
        (ROOT / 'archive/dc/paper' / strip).write_bytes((source / f'{name}.png').read_bytes())
        out[key] = {'path': 'archive/dc/paper/' + strip, 'ascent': meta['ascent'], 'descent': meta['descent'],
                    'glyphs': {code: [g['x'], g['width'], g['offset'], g['advance']] for code, g in meta['glyphs'].items()}}
    return out


def demo():
    """The recorded demo as [updates to wait, control, value]. Controls: 0 x, 1 y, 2 jump, 3 throw, 4 action, 5 duck.

    CODE 2 $2bcc-$2d50 sets the fields and bits from the keys: W S on $a, A D on $8, Space bit 0,
    the mouse button bit 1, Q bit 2 and E bit 3.
    """
    rows = json.loads((ROOT / 'archive/dc/rooms/assets/demo.json').read_text(encoding='utf8'))
    bits = {0: 2, 1: 3, 2: 4, 3: 5}
    out, wait = [], 0
    for row in rows:
        wait += row['delay'] or 0
        command = row['command']
        if not command:
            continue
        if command.startswith('set input field'):
            control, value = (0 if command.endswith('$8') else 1), (row['value'] > 0) - (row['value'] < 0)
        else:
            control = bits[int(command[-1])]
            value = 0 if command.startswith('clear') else row['value'] if control == 3 else 1
        out.append([wait, control, value])
        wait = 0
    return out


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


def hidden_steps(code):
    """The Shield room's hidden ledges (CODE 5 $15f4-$160e, $1d68-$1dac). Each difficulty has a
    table of patterns. A visit picks one at random. A set bit gives that ledge its width, and a
    clear bit takes the ledge away."""
    tables = []
    for start in (0x4fd2, 0x4ff4, 0x5016):
        count = struct.unpack_from('>H', code, start)[0]
        tables.append(list(struct.unpack_from(f'>{count}I', code, start + 2)))
    return {'width': signed(code, 0x5038), 'spans': [signed(code, 0x503a + 2 * i) for i in range(20)], 'masks': tables}


def level_formula(formula, level):
    """Evaluates a spawn guard from the trace at one difficulty. Entry guards count as true."""
    if formula == 'true' or '-$18c' in formula or '-$280' in formula:
        return True
    return eval(formula.replace('-$18e(a5)', str(level)).replace('&&', ' and ').replace('||', ' or '))


def number(text):
    return int(str(text).split(' ')[0])


def spawn_table():
    """Door guards, bats and rats, one entry per level group, from the CODE 5 calls in
    archive/dc/rooms/trace/conditions.json."""
    calls = json.loads((ROOT / 'archive/dc/rooms/trace/conditions.json').read_text(encoding='utf8'))['all_room_calls_complete']
    table = {}
    for room, listing in calls.items():
        rows = table.setdefault(room, [])
        for call in listing['calls']:
            if call['routine'] not in ('$272', '$282', '$28a'):
                continue
            guard = call['execution_condition']['formula']
            for variant in call['conditional_arguments']['variants']:
                levels = [n for n in range(4) if level_formula(guard, n) and level_formula(variant['formula'], n)]
                if not levels:
                    continue
                a = variant['args']
                if call['routine'] == '$272':
                    row = {'type': 'doorGuard', 'x': number(a['d0']), 'y': number(a['d1']), 'left': number(a['d2']), 'right': number(a['d3']), 'speed': number(a['d4']), 'hits': number(a['d5'])}
                elif call['routine'] == '$282':
                    row = {'type': 'bat', 'x': number(a['d0']), 'y': number(a['d1']), 'floor': number(a['d6'])}
                else:
                    row = {'type': 'rat', 'x': number(a['d0']), 'y': number(a['d1']), 'left': number(a['d2']), 'right': number(a['d3']), 'speed': number(a['d6'])}
                rows.append({**row, 'levels': levels})
    return table


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
        'steps': hidden_steps(code),
        'spawns': spawn_table(),
        # Duncan's three jumps from the hero code, CODE 2. The manual card draws the same three arcs.
        'jumps': {name: jump_rows(fork_a[('CODE', 2)][4:], at)
                  for name, at in (('running', 0x13a4), ('standing', 0x13e4), ('downward', 0x1434))},
        'scores': [bcd(fork_a[('Stbl', i)]) for i in range(4)],
        'fonts': fonts(),
        'demo': demo(),
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
