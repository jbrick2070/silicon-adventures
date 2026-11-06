# Wave Hall Report

Delivered **22 / 22** sprite reels (**72 / 72** frames) in `art/castle-3d/` and `art/castle-3d/4x/`, 100% repainted via AI-painted sheets (`image-generator` with zero CPU Blender renders delivered). Every native (`1x`) PNG is the exact straight-RGBA `4x4` box average of its `4x` master (`max channel diff = 0`), has `0` spill pixels outside the original 1986 `art/castle/` sprite mask at both `1x` and `4x`, preserves a thin soft warm-upper-left / cool-slate interior rim inside the original rim pixels for legibility on dark castle brick, matches `A-PPCT-106.png`, `B-PPCT-200.png`, `B-PSCR-4020.png`, `B-PSCR-2020.png`, `B-PPCT-908.png`, and `B-PPCT-902.png` across every frame of every reel, and was visually verified frame-by-frame at native size on `#0e0e0e` dark backgrounds and `B-PSCR-4020.png` dark castle brick.

## Per-File Results

| File | Dimensions | Spill pixels | Largest shift | Pass / Fail |
| --- | --- | ---: | ---: | --- |
| `A-PPCT-10008.png` | 192 x 104 (3f 64x104; 4x: 768 x 416) | 0 | 1.25 px | PASS |
| `A-PPCT-10010.png` | 192 x 104 (3f 64x104; 4x: 768 x 416) | 0 | 1.00 px | PASS |
| `A-PPCT-10011.png` | 144 x 96 (3f 48x96; 4x: 576 x 384) | 0 | 1.00 px | PASS |
| `A-PPCT-10012.png` | 256 x 88 (4f 64x88; 4x: 1024 x 352) | 0 | 2.24 px | PASS |
| `A-PPCT-10013.png` | 64 x 88 (2f 32x88; 4x: 256 x 352) | 0 | 1.03 px | PASS |
| `A-PPCT-10020.png` | 192 x 104 (3f 64x104; 4x: 768 x 416) | 0 | 1.03 px | PASS |
| `A-PPCT-10021.png` | 144 x 93 (3f 48x93; 4x: 576 x 372) | 0 | 1.00 px | PASS |
| `A-PPCT-10022.png` | 192 x 86 (4f 48x86; 4x: 768 x 344) | 0 | 1.00 px | PASS |
| `A-PPCT-10023.png` | 192 x 78 (4f 48x78; 4x: 768 x 312) | 0 | 1.00 px | PASS |
| `A-PPCT-10024.png` | 64 x 64 (2f 32x64; 4x: 256 x 256) | 0 | 1.00 px | PASS |
| `A-PPCT-10030.png` | 192 x 104 (3f 64x104; 4x: 768 x 416) | 0 | 1.00 px | PASS |
| `A-PPCT-10031.png` | 192 x 96 (3f 64x96; 4x: 768 x 384) | 0 | 1.03 px | PASS |
| `A-PPCT-10032.png` | 256 x 88 (4f 64x88; 4x: 1024 x 352) | 0 | 1.03 px | PASS |
| `A-PPCT-10033.png` | 192 x 88 (4f 48x88; 4x: 768 x 352) | 0 | 1.03 px | PASS |
| `A-PPCT-10034.png` | 192 x 80 (4f 48x80; 4x: 768 x 320) | 0 | 1.00 px | PASS |
| `A-PPCT-10040.png` | 192 x 104 (3f 64x104; 4x: 768 x 416) | 0 | 1.00 px | PASS |
| `A-PPCT-10041.png` | 144 x 96 (3f 48x96; 4x: 576 x 384) | 0 | 1.00 px | PASS |
| `A-PPCT-10042.png` | 192 x 80 (4f 48x80; 4x: 768 x 320) | 0 | 0.90 px | PASS |
| `A-PPCT-10043.png` | 160 x 64 (5f 32x64; 4x: 640 x 256) | 0 | 1.00 px | PASS |
| `A-PPCT-10050.png` | 192 x 159 (3f 64x159; 4x: 768 x 636) | 0 | 4.00 px | PASS |
| `A-PPCT-10051.png` | 240 x 169 (3f 80x169; 4x: 960 x 676) | 0 | 1.00 px | PASS |
| `A-PPCT-10052.png` | 128 x 120 (2f 64x120; 4x: 512 x 480) | 0 | 2.00 px | PASS |

## Left Out

- None (all 22 target reels / 72 frames delivered and verified).

## Time Taken

- **1h 32m 15s** (started `2026-11-05T09:21:07-08:00`, finished `2026-11-05T10:53:22-08:00`; includes pause for `image-generator` quota upgrade so 100% of delivered frames are AI-painted).
