"""Finish a path-traced room: grade it, put the disk's status band back, write 4x and native.

Usage: finish_room.py <workdir> [exposure]

Reads <workdir>/room_hdr.npy (linear RGBA, top row first, from render_room.py) and writes
<workdir>/<scale>x/B-PSCR-4020.png and <workdir>/native/B-PSCR-4020.png. Nothing outside
<workdir> is touched. The native file is the box mean of the large one, and the rows from
PLAY_H down are the original disk pixels in both, so the status bar's slot is unchanged.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
from grade import grade
import room_4020 as room

NAME = 'B-PSCR-4020'


def finish(workdir, exposure=1.0):
    hdr = np.load(os.path.join(workdir, 'room_hdr.npy'))
    src = np.array(Image.open(room.SRC).convert('RGB'))
    h, w = src.shape[:2]
    scale = hdr.shape[1] // w
    if scale < 1 or hdr.shape[:2] != (h * scale, w * scale):
        raise ValueError(f'render is {hdr.shape[1]}x{hdr.shape[0]}, not a whole multiple of {w}x{h}')

    big = np.clip(np.round(grade(hdr, exposure=exposure) * 255), 0, 255).astype(np.uint8)
    band = np.repeat(np.repeat(src[room.PLAY_H:], scale, 0), scale, 1)
    big[room.PLAY_H * scale:] = band

    native = big.reshape(h, scale, w, scale, 3).mean(axis=(1, 3))
    native = np.clip(np.round(native), 0, 255).astype(np.uint8)

    big_dir = os.path.join(workdir, f'{scale}x'); nat_dir = os.path.join(workdir, 'native')
    os.makedirs(big_dir, exist_ok=True); os.makedirs(nat_dir, exist_ok=True)
    big_path = os.path.join(big_dir, f'{NAME}.png'); nat_path = os.path.join(nat_dir, f'{NAME}.png')
    Image.fromarray(big, 'RGB').save(big_path)
    Image.fromarray(native, 'RGB').save(nat_path)

    band_ok = np.array_equal(native[room.PLAY_H:], src[room.PLAY_H:])
    print(f'finished {NAME}: {scale}x {w * scale}x{h * scale}, native {w}x{h}, '
          f'status band {"unchanged" if band_ok else "CHANGED"}')
    if not band_ok:
        raise RuntimeError('status band differs from the disk after finishing')
    return big_path, nat_path


if __name__ == '__main__':
    finish(sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else 1.0)
