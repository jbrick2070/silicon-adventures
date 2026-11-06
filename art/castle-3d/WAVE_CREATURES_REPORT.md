# Wave Creatures Report

Delivered **33 / 33** sprite reels (**149 / 149** frames) in `art/castle-3d/` and `art/castle-3d/4x/`. Every native (`1x`) PNG is the exact straight-RGBA `4x4` box average of its `4x` master (`max channel diff = 0`), has `0` spill pixels outside the original 1986 `art/castle/` sprite mask at both `1x` and `4x`, preserves a soft warm-upper-left / cool-lower-right interior rim inside the original rim pixels for legibility on dark castle brick, contains 100% painted 3D material inside the body mask (zero flat-colour gap fills), and was visually verified frame-by-frame at native size on both `#0c0c0e` and `B-PSCR-4020.png` dark castle brick.

## Per-File Results

| File | Dimensions | Spill pixels | Largest shift | Pass / Fail |
| --- | --- | ---: | ---: | --- |
| `B-PPCT-311.png` | 128 x 12 (4f 32x12; 4x: 512 x 48) | 0 | 1.00 px | PASS |
| `B-PPCT-351.png` | 64 x 42 (2f 32x42; 4x: 256 x 168) | 0 | 1.00 px | PASS |
| `B-PPCT-352.png` | 64 x 42 (2f 32x42; 4x: 256 x 168) | 0 | 1.00 px | PASS |
| `B-PPCT-353.png` | 64 x 42 (2f 32x42; 4x: 256 x 168) | 0 | 1.00 px | PASS |
| `B-PPCT-354.png` | 144 x 42 (3f 48x42; 4x: 576 x 168) | 0 | 1.00 px | PASS |
| `B-PPCT-355.png` | 144 x 42 (3f 48x42; 4x: 576 x 168) | 0 | 1.00 px | PASS |
| `B-PPCT-356.png` | 16 x 6 (1f 16x6; 4x: 64 x 24) | 0 | 1.00 px | PASS |
| `B-PPCT-357.png` | 16 x 6 (1f 16x6; 4x: 64 x 24) | 0 | 1.00 px | PASS |
| `B-PPCT-405.png` | 400 x 64 (5f 80x64; 4x: 1600 x 256) | 0 | 1.00 px | PASS |
| `B-PPCT-406.png` | 400 x 64 (5f 80x64; 4x: 1600 x 256) | 0 | 1.00 px | PASS |
| `B-PPCT-407.png` | 64 x 48 (1f 64x48; 4x: 256 x 192) | 0 | 1.00 px | PASS |
| `B-PPCT-408.png` | 384 x 48 (6f 64x48; 4x: 1536 x 192) | 0 | 1.00 px | PASS |
| `B-PPCT-414.png` | 48 x 28 (3f 16x28; 4x: 192 x 112) | 0 | 1.00 px | PASS |
| `B-PPCT-415.png` | 32 x 15 (1f 32x15; 4x: 128 x 60) | 0 | 0.00 px | PASS |
| `B-PPCT-416.png` | 160 x 24 (5f 32x24; 4x: 640 x 96) | 0 | 1.00 px | PASS |
| `B-PPCT-417.png` | 192 x 20 (4f 48x20; 4x: 768 x 80) | 0 | 1.00 px | PASS |
| `B-PPCT-418.png` | 144 x 23 (3f 48x23; 4x: 576 x 92) | 0 | 1.00 px | PASS |
| `B-PPCT-420.png` | 192 x 65 (3f 64x65; 4x: 768 x 260) | 0 | 1.00 px | PASS |
| `B-PPCT-421.png` | 256 x 40 (8f 32x40; 4x: 1024 x 160) | 0 | 1.00 px | PASS |
| `B-PPCT-422.png` | 224 x 29 (7f 32x29; 4x: 896 x 116) | 0 | 1.00 px | PASS |
| `B-PPCT-423.png` | 112 x 22 (7f 16x22; 4x: 448 x 88) | 0 | 1.00 px | PASS |
| `B-PPCT-424.png` | 64 x 40 (2f 32x40; 4x: 256 x 160) | 0 | 1.00 px | PASS |
| `B-PPCT-425.png` | 416 x 24 (13f 32x24; 4x: 1664 x 96) | 0 | 1.00 px | PASS |
| `B-PPCT-426.png` | 224 x 24 (7f 32x24; 4x: 896 x 96) | 0 | 1.00 px | PASS |
| `B-PPCT-428.png` | 64 x 16 (4f 16x16; 4x: 256 x 64) | 0 | 1.00 px | PASS |
| `B-PPCT-429.png` | 320 x 20 (5f 64x20; 4x: 1280 x 80) | 0 | 1.00 px | PASS |
| `B-PPCT-430.png` | 384 x 39 (8f 48x39; 4x: 1536 x 156) | 0 | 1.00 px | PASS |
| `B-PPCT-431.png` | 336 x 46 (7f 48x46; 4x: 1344 x 184) | 0 | 1.00 px | PASS |
| `B-PPCT-432.png` | 288 x 46 (6f 48x46; 4x: 1152 x 184) | 0 | 1.00 px | PASS |
| `B-PPCT-433.png` | 96 x 22 (3f 32x22; 4x: 384 x 88) | 0 | 1.00 px | PASS |
| `B-PPCT-434.png` | 320 x 23 (10f 32x23; 4x: 1280 x 92) | 0 | 1.00 px | PASS |
| `B-PPCT-436.png` | 224 x 29 (7f 32x29; 4x: 896 x 116) | 0 | 1.00 px | PASS |
| `B-PPCT-437.png` | 48 x 14 (1f 48x14; 4x: 192 x 56) | 0 | 1.00 px | PASS |

## Left Out

- None (all 33 target reels / 149 frames delivered and verified).

## Time Taken

- **57m 39s** (started `2026-11-05T09:20:36-08:00`, finished `2026-11-05T10:18:15-08:00`).
