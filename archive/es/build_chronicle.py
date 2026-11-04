"""Build archive/es/chronicle.js: every line of text on the Enchanted Scepters disk, verbatim.

    python archive/es/build_chronicle.py

Sources, all read from archive/es/Scepters.rsrc:
  ATXT and the blocked-direction messages of each ASCN scene,
  every PRINT in the 200 ACOD scene scripts and GCOD,
  every message of the 152 AOBJ objects and 28 ACHR characters,
  and the application's own MENU, DITL and VERS text.
Dark Castle's dialog text comes from archive/dc/Data A.rsrc.

Nothing is corrected. Disk spellings such as "disapears", "cannoe" and
"You here someone cry" are the record and stay as they are. Lines that the
engine can never print on a good copy, such as the BADCOPY branch, are marked.
"""
import json
import re
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OPS = {0x80: 'IF{', 0x81: '=', 0x82: '<', 0x83: '>', 0x84: '}AND{', 0x85: '}OR{', 0x87: 'EXIT\n', 0x88: 'END\n',
       0x89: 'MOVE{', 0x8A: '}TO{', 0x8B: 'PRINT{', 0x8C: 'SOUND{', 0x8E: 'LET{', 0x8F: '+', 0x90: '-', 0x91: '*',
       0x92: '/', 0x93: '==', 0x94: '>>', 0x95: 'MENU{', 0xA0: 'TEXT$', 0xA1: 'CLICK$', 0xB0: 'VISITS#',
       0xB1: 'RANDOM#', 0xB2: 'LOOP#', 0xB3: 'VICTORY#', 0xB4: 'BADCOPY#', 0xB5: 'RANDOM#', 0xC0: 'STORAGE@',
       0xC1: 'SCENE@', 0xC2: 'PLAYER@', 0xC3: 'MONSTER@', 0xFD: '}\n', 0xFE: '}THEN\n'}
# Words a scene script listens for that any room offers anyway.
PLAIN_VERBS = {'NORTH', 'SOUTH', 'EAST', 'WEST', 'UP', 'DOWN', 'LOOK', 'SEARCH', 'OPEN', 'CLOSE', 'REST', 'STATUS',
               'GET', 'DROP', 'THROW', 'SWING', 'CAST', 'FIRE', 'ENTER', 'EXIT', 'MOVE', 'YES', 'NO'}


def fork(path):
    data = Path(path).read_bytes()
    data_off, map_off = struct.unpack_from('>II', data)
    types = map_off + struct.unpack_from('>H', data, map_off + 24)[0]
    names = map_off + struct.unpack_from('>H', data, map_off + 26)[0]
    out = {}
    for i in range(struct.unpack_from('>H', data, types)[0] + 1):
        kind, count, off = struct.unpack_from('>4sHH', data, types + 2 + 8 * i)
        for j in range(count + 1):
            ref = types + off + 12 * j
            rid, name_off = struct.unpack_from('>hH', data, ref)
            start = data_off + int.from_bytes(data[ref + 5:ref + 8], 'big')
            size = struct.unpack_from('>I', data, start)[0]
            name = None
            if name_off != 0xFFFF:
                at = names + name_off
                name = data[at + 1:at + 1 + data[at]].decode('mac_roman')
            out.setdefault(kind.decode('mac_roman'), {})[rid] = (name, data[start + 4:start + 4 + size])
    return out


class Reader:
    def __init__(self, data, at):
        self.data, self.at = data, at

    def skip(self, n):
        self.at += n

    def u8(self):
        self.at += 1
        return self.data[self.at - 1]

    def i16(self):
        self.at += 2
        return struct.unpack_from('>h', self.data, self.at - 2)[0]

    def text(self):
        if self.at >= len(self.data):
            return ''
        size = self.data[self.at]
        raw = self.data[self.at + 1:self.at + 1 + size]
        self.at += 1 + size
        return raw.decode('mac_roman').replace('\r', '\n')


def character(name, data):
    r = Reader(data, struct.unpack_from('>H', data, 0)[0])
    r.skip(8 + 11 + 1 + 4 + 2 + 4 + 8 + 2)
    fields = [r.text() for _ in range(18)]
    keys = ['scene', 'weapon1', 'verb1', 'weapon2', 'verb2', 'initial', 'scoresHit', 'receivesHit', 'makesOffer',
            'rejectsOffer', 'acceptsOffer', 'dying', 's1', 's2', 's3', 's4', 's5', 's6']
    return dict(zip(keys, fields), name=name)


def thing(name, data):
    r = Reader(data, struct.unpack_from('>H', data, 0)[0])
    r.skip(8 + 2 + 2 + 1 + 1 + 1 + 1 + 1 + 1 + 2 + 2)
    keys = ['scene', 'click', 'verb', 'fail', 'use', 'sound']
    return dict(zip(keys, [r.text() for _ in keys]), name=name)


def script(data):
    out = []
    i = 0
    while i < len(data):
        c = data[i]
        if c == 0xFF:
            i += 1
            value = data[i] - 1
            out.append(chr(65 + value // 9) + str(value % 9 + 1) + '#')
        elif c in OPS:
            out.append(OPS[c])
        elif c >= 0x80:
            out.append('\x7f')
        elif c == 13:
            out.append('\n')
        elif c >= 32:
            out.append(chr(c))
        i += 1
    return ''.join(out)


def dialog_items(data):
    """Text of a DITL: a count, then handle, rectangle, type, length and text, padded to even."""
    count = struct.unpack_from('>h', data, 0)[0] + 1
    at, out = 2, []
    for _ in range(count):
        at += 12
        kind, size = data[at], data[at + 1]
        raw = data[at + 2:at + 2 + size]
        at += 2 + size + (size & 1)
        if kind & 0x7f in (4, 5, 6, 8, 16) and raw.strip():
            out.append(raw.decode('mac_roman').replace('\r', '\n'))
    return out


def listening_words(text):
    """Commands a script waits for, joining nested and AND-ed tests: OPEN then BAR gives OPEN BAR."""
    found, stack = [], []
    for line in text.split('\n'):
        start = line.find('IF{')
        if start >= 0 and line.endswith('}THEN'):
            alternatives = []
            for branch in line[start + 3:-5].split('}OR{'):
                words = [w.strip().upper() for w in re.findall(r'TEXT\$==?\s*([^}\x7f]+?)(?:\}|$)', branch)]
                if words:
                    alternatives.append(' '.join(words))
            prefix = ' '.join(stack[-1:]) if stack else ''
            stack.append(alternatives[0] if len(alternatives) == 1 else '')
            for words in alternatives:
                word = (prefix + ' ' + words).strip()
                if word and word not in PLAIN_VERBS and word not in found and not word.endswith('#'):
                    found.append(word)
        elif line in ('END', 'EXIT') and stack:
            stack.pop()
    return found


def defeat_style(line):
    """How a character leaves, in the disk's own words."""
    line = line.lower()
    for words, style in ((('sinks',), 'sink'), (('flame',), 'burn'), (('dust',), 'dust'),
                         (('crumbles', 'dissolves', 'disapears', 'wail', 'bones'), 'dissolve'),
                         (('spirals',), 'spiral')):
        if any(word in line for word in words):
            return style
    return 'fall'


def speaker(text):
    match = re.match(r"^(?:[A-Z][\w'&]*)(?: [A-Z]?[\w'&]+){0,2}:\s", text)
    return bool(match) or ' says:' in text or text.startswith(('A voice', 'A loudspeaker', 'A little birdy', 'The ocean'))


def build():
    es = fork(ROOT / 'archive/es/Scepters.rsrc')
    designs = json.loads((ROOT / 'archive/es/designs.json').read_text(encoding='utf8'))
    rooms = {d['id']: d for d in designs if d['type'] == 'ASCN'}
    lines, index = [], {}

    def add(kind, owner, text, note=None):
        text = text.strip()
        if not text:
            return
        key = re.sub(r'\s+', ' ', text)
        if key in index:
            entry = lines[index[key]]
            if owner and owner not in entry['o'] and len(entry['o']) < 4:
                entry['o'].append(owner)
            return
        index[key] = len(lines)
        entry = {'k': kind, 'o': [owner] if owner else [], 't': text}
        if note:
            entry['n'] = note
        lines.append(entry)

    for rid in sorted(rooms, key=lambda i: rooms[i]['name'].lower()):
        room = rooms[rid]
        add('room', room['name'], room['text'].replace('\r', '\n'))
        for direction in ('north', 'south', 'east', 'west'):
            add('edge', room['name'], room['messages'].get(direction, ''))
    verbs = {}
    names = {i: v[0] for i, v in es['ASCN'].items()}
    codes = [(0, 'every room', es['GCOD'][0][1])]
    codes += sorted(((i, names.get(i) or '', v[1]) for i, v in es['ACOD'].items()), key=lambda r: r[1].lower())
    for rid, owner, data in codes:
        text = script(data)
        for match in re.finditer(r'PRINT\{(.*?)\}', text, re.S):
            body = match.group(1).replace('\x7f', '')
            before = text[max(0, match.start() - 24):match.start()]
            add('speech' if speaker(body.strip()) else 'event', owner, body,
                'Printed only on a bad copy. The disk checks BADCOPY#.' if 'BADCOPY#' in before else None)
        if rid:
            found = listening_words(text)
            if found:
                verbs[rid] = found
    defeats = {}
    for rid, (name, data) in sorted(es['ACHR'].items(), key=lambda kv: (kv[1][0] or '').lower()):
        c = character(name, data)
        if c['dying']:
            defeats[rid] = {'line': c['dying'].strip(), 'style': defeat_style(c['dying'])}
        for key in ('initial', 'scoresHit', 'receivesHit', 'makesOffer', 'rejectsOffer', 'acceptsOffer', 'dying'):
            add('voice', c['name'], c[key])
    for rid, (name, data) in sorted(es['AOBJ'].items(), key=lambda kv: (kv[1][0] or '').lower()):
        o = thing(name, data)
        for key in ('click', 'fail', 'use'):
            add('thing', o['name'], o[key])
    for rid, (_, data) in sorted(es['DITL'].items()):
        for item in dialog_items(data):
            add('shell', 'Enchanted Scepters application', item)
    dc = fork(ROOT / 'archive/dc/Data A.rsrc')
    for rid, (_, data) in sorted(dc['DITL'].items()):
        for item in dialog_items(data):
            add('castle', 'Dark Castle application', item)
    for label, resource in (('Enchanted Scepters', es['VERS'][0][1]),):
        for run in re.findall(rb'[\x20-\x7e\xa9\xaa]{8,}', resource):
            add('shell', label + ' credits', run.decode('mac_roman'))
    return {'lines': lines, 'verbs': verbs, 'defeats': defeats}


def main():
    chronicle = build()
    text = 'window.ES_CHRONICLE = ' + json.dumps(chronicle, ensure_ascii=False, separators=(',', ':')) + ';\n'
    (ROOT / 'archive/es/chronicle.js').write_text(text, encoding='utf8')
    kinds = {}
    for line in chronicle['lines']:
        kinds[line['k']] = kinds.get(line['k'], 0) + 1
    print(len(chronicle['lines']), kinds, 'rooms with odd verbs', len(chronicle['verbs']), len(text))


if __name__ == '__main__':
    main()
