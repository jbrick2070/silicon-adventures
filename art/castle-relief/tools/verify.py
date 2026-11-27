"""Check that the relief renders keep the original geometry exactly.

Writes validation.json next to the finished files.
"""
import hashlib, json, os, subprocess
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')).replace('\\', '/')
SRC = f'{ROOT}/art/castle'
OUT = f'{ROOT}/art/castle-relief'
S = 4
ASSETS = [('B-PSCR-4020', 512, 342, 1), ('A-PPCT-101', 32, 40, 6), ('B-PPCT-906', 48, 32, 3)]


def lum(rgb):
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]


report = {'assets': []}
ok_all = True
for name, fw, fh, n in ASSETS:
    src = np.array(Image.open(f'{SRC}/{name}.png').convert('RGBA'))
    nat = np.array(Image.open(f'{OUT}/native/{name}.png').convert('RGBA'))
    big = np.array(Image.open(f'{OUT}/4x/{name}.png').convert('RGBA'))
    a_src = src[..., 3] > 127
    ink = (src[..., 0] < 128) & a_src
    r = {'name': name, 'frames': n, 'frame_size': [fw, fh]}
    r['native_size'] = list(nat.shape[1::-1])
    r['4x_size'] = list(big.shape[1::-1])
    r['native_size_ok'] = nat.shape[:2] == src.shape[:2] == (fh, fw * n)
    r['4x_size_ok'] = big.shape[:2] == (fh * S, fw * n * S)
    r['alpha_identical_native'] = bool(np.array_equal(src[..., 3], nat[..., 3]))
    a4 = np.repeat(np.repeat(src[..., 3], S, 0), S, 1)
    r['alpha_identical_4x'] = bool(np.array_equal(a4, big[..., 3]))
    r['alpha_binary'] = bool(np.isin(np.unique(nat[..., 3]), [0, 255]).all())
    # native is the box mean of the 4x master
    box = big[..., :3].reshape(fh, S, fw * n, S, 3).mean(axis=(1, 3))
    r['native_is_box_mean_of_4x_max_err'] = float(np.abs(box - nat[..., :3]).max())
    # ink line position: every original ink pixel that touches an original white
    # pixel must still be darker than that neighbour in the new native image
    L = lum(nat[..., :3].astype(np.float32))
    H, W = ink.shape
    pairs = kept = 0
    for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)):
        sh_ink = np.roll(ink, (dy, dx), (0, 1))
        sh_L = np.roll(L, (dy, dx), (0, 1))
        valid = np.ones_like(ink)
        if dy == 1: valid[0, :] = False
        if dy == -1: valid[-1, :] = False
        if dx == 1: valid[:, 0] = False
        if dx == -1: valid[:, -1] = False
        white_here = a_src & ~ink & valid
        p = white_here & sh_ink
        pairs += int(p.sum())
        kept += int((p & (sh_L < L)).sum())
    r['ink_edge_pairs'] = pairs
    r['ink_edge_pairs_still_darker'] = kept
    r['ink_edge_contrast_kept_pct'] = round(100 * kept / max(pairs, 1), 2)
    if name == 'B-PSCR-4020':
        hud = nat[310:, :, :3]
        r['hud_band_pure_white'] = bool((hud == 255).all())
    # originals untouched compared with the committed copy
    head = subprocess.run(['git', 'show', f'HEAD:art/castle/{name}.png'], capture_output=True,
                          cwd=ROOT).stdout
    disk = open(f'{SRC}/{name}.png', 'rb').read()
    r['original_sha256'] = hashlib.sha256(disk).hexdigest()
    r['original_matches_git_head'] = hashlib.sha256(head).hexdigest() == r['original_sha256']
    r['pass'] = all([r['native_size_ok'], r['4x_size_ok'], r['alpha_identical_native'],
                     r['alpha_identical_4x'], r['alpha_binary'],
                     r['native_is_box_mean_of_4x_max_err'] <= 0.5 + 1e-6,
                     r['original_matches_git_head'],
                     r.get('hud_band_pure_white', True)])
    ok_all &= r['pass']
    report['assets'].append(r)
    print(json.dumps(r, indent=1))
report['all_pass'] = bool(ok_all)
json.dump(report, open(f'{OUT}/validation.json', 'w'), indent=1)
print('ALL PASS' if ok_all else 'FAILURES')
