"""Disassemble the Dark Castle CODE segments and resolve the A5 jump table.

    python -m pip install --target <somewhere> capstone macresources
    PYTHONPATH=<somewhere> python archive/dc/tools/disassemble.py

Output goes to archive/dc/rooms/work/ (not committed): seg1.asm .. seg7.asm and
jump-table.json. A `jsr $xxx(a5)` lands on the jump-table entry at A5+xxx, and
jump-table.json maps that offset to [segment, offset in segment body].
Offsets in the .asm files are relative to the segment body, after its 4-byte header.
"""
import json
import struct
from pathlib import Path

from capstone import CS_ARCH_M68K, CS_MODE_BIG_ENDIAN, CS_MODE_M68K_000, Cs
from macresources import parse_file

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'archive/dc/rooms/work'


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    fork = {(r.type.decode('mac_roman'), r.id): bytes(r)
            for r in parse_file((ROOT / 'archive/dc/Data A.rsrc').read_bytes())}
    md = Cs(CS_ARCH_M68K, CS_MODE_BIG_ENDIAN | CS_MODE_M68K_000)
    md.skipdata = True
    for seg in range(1, 8):
        with (OUT / f'seg{seg}.asm').open('w', encoding='utf8') as f:
            for i in md.disasm(fork[('CODE', seg)][4:], 0):
                f.write(f'{i.address:06x}  {i.bytes.hex():<16} {i.mnemonic} {i.op_str}\n')
    head = fork[('CODE', 0)]
    _, _, size, base = struct.unpack_from('>IIII', head, 0)
    table = {}
    for k in range(0, size, 8):
        entry = head[16 + k:16 + k + 8]
        table[str(base + k + 2)] = [struct.unpack_from('>H', entry, 4)[0], struct.unpack_from('>H', entry, 0)[0]]
    (OUT / 'jump-table.json').write_text(json.dumps(table), encoding='utf8')


if __name__ == '__main__':
    main()
