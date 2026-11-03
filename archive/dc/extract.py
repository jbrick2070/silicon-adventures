"""Rebuild the Dark Castle inventory and the game's file:// audio bank.

    python -m pip install machfs==1.3 macresources==1.2
    python archive/dc/extract.py [--forks]
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path

import machfs
from macresources import parse_file

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
DISK = ROOT / 'sources/dark-castle/DarkCastle_1_2.dsk'
KNOWN_SHA1 = 'e6633eaf1ea8601dfd9cd3957cfea61c70fc791c'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def unpack_soun(data):
    """SOUN stores unsigned mono samples as two successive delta indices per byte."""
    if len(data) < 22:
        raise ValueError('missing SOUN delta table')
    delta = data[6:22]
    previous = 128
    samples = bytearray()
    for two in data[22:]:
        for index in (two >> 4, two & 15):
            previous = (previous + delta[index]) & 255
            samples.append(previous)
    return bytes(samples)


def extract(write_forks=False):
    image = DISK.read_bytes()
    if hashlib.sha1(image).hexdigest() != KNOWN_SHA1:
        raise ValueError('Unexpected source image. Verify media before assigning resource IDs.')
    volume = machfs.Volume()
    volume.read(image)
    catalog = {
        'source_url': 'https://archive.org/download/mac_DarkCastle_1_2/DarkCastle_1_2.dsk',
        'source_sha256': digest(image),
        'source_sha1': KNOWN_SHA1,
        'volume': volume.name,
        'files': [],
        'resources': [],
    }
    bank = {}
    paper_path = HERE/'paper.js'
    paper = json.loads(paper_path.read_text().split('=',1)[1].strip(';\n ')) if paper_path.exists() else []
    papers = {(p['fork'],p['type'],p['id']):p['path'] for p in paper}
    for name, file in volume.items():
        catalog['files'].append({
            'name': name, 'type': file.type.decode('mac_roman'),
            'creator': file.creator.decode('mac_roman'), 'data_bytes': len(file.data),
            'data_sha256': digest(file.data), 'rsrc_bytes': len(file.rsrc),
            'rsrc_sha256': digest(file.rsrc),
        })
        if write_forks and name in ('Data A', 'Data B'):
            (HERE / (name + '.rsrc')).write_bytes(file.rsrc)
        for r in parse_file(file.rsrc):
            rt = r.type.decode('mac_roman')
            entry = {
                'file': name, 'type': rt, 'id': r.id, 'name': r.name,
                'bytes': len(r.data), 'sha256': digest(r.data),
                'disposition': 'catalogued on disk',
            }
            if (name,rt,r.id) in papers:
                entry['disposition'] = papers[(name,rt,r.id)]
            if rt in ('PPCT', 'PSCR') and name in ('Data A', 'Data B'):
                graphic = Path('art/castle') / f'{name[-1]}-{rt}-{r.id}.png'
                if (ROOT / graphic).is_file():
                    entry['disposition'] = graphic.as_posix()
            if rt == 'PPCT' and name == 'Data B' and r.id in (430, 431, 432):
                entry['world_role'] = 'High Altar wizard encounter in the adaptation'
            if rt == 'PPCT' and name == 'Data B' and r.id in (300,908):
                entry['world_role'] = {300:'cave bat in three cave rooms',908:'Black Knight in the armory'}[r.id]
            if rt == 'SOUN':
                pcm = unpack_soun(r.data)
                entry['samples'] = len(pcm)
                entry['pcm_sha256'] = digest(pcm)
                if pcm:
                    assert r.id not in bank
                    bank[r.id] = base64.b64encode(pcm).decode('ascii')
                    entry['disposition'] = 'audio/dark-castle-bank.js#' + str(r.id)
                    role = {0:'moving inhabitant footfall and armory shield strike', 1:'High Altar voice',
                            84:'player footfall', 69:'answering knock from the armory doorway',
                            70:'hidden High Altar positional cue and cave bat call'}
                    if r.id in role:
                        entry['world_role'] = role[r.id] + ' (adaptation)'
                else:
                    entry['disposition'] = 'empty SOUN, no sample payload'
            catalog['resources'].append(entry)
    catalog['resources'].sort(key=lambda r: (r['file'], r['type'], r['id']))
    (HERE / 'catalog.json').write_text(json.dumps(catalog, indent=2), encoding='utf-8')
    js = 'window.DC_CATALOG=' + json.dumps(catalog, separators=(',', ':')) + ';\n'
    (HERE / 'catalog.js').write_text(js, encoding='ascii')
    rows = [f'  "{k}":"{bank[k]}"' for k in sorted(bank)]
    script = '// Decoded Dark Castle v1.2 SOUN resources. See archive/dc/catalog.json.\n'
    script += 'window.DarkCastlePCM = {\n' + ',\n'.join(rows) + '\n};\n'
    (ROOT / 'audio/dark-castle-bank.js').write_text(script, encoding='ascii')
    print(len(catalog['files']), 'files,', len(catalog['resources']), 'resources,', len(bank), 'sounds')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--forks', action='store_true', help='also export Data A and Data B resource forks')
    extract(parser.parse_args().forks)
