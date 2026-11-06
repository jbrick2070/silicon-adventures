# Wave Fittings Report

Delivered **20 / 20** sprite reels (**86 / 86** frames) in `art/castle-3d/` and `art/castle-3d/4x/`, including all 17 fittings/creature/storm reels and all 3 requested repairs (`B-PPCT-121.png` / `B-PPCT-122.png`, `A-PPCT-105.png`, and `B-PPCT-914.png`). Every delivered native sprite is the exact straight RGBA 4x4 box average of its `4x` master (`max channel diff = 0`), has `0` spill pixels outside the original 1986 sprite mask at both `1x` and `4x` (and `0` spill into `openTile()`'s outer black-panel cutout zone on opaque tiles `A-PPCT-5000.png`, `B-PPCT-510.png`, and `B-PPCT-511.png`), preserves a thin soft warm-light interior rim inside original rim pixels for dark-brick legibility, maintains consistent materials and colours across every frame of every reel (matched to `B-PSCR-4020.png`, `B-PSCR-3020.png`, `B-PPCT-710.png`, `B-PPCT-908.png`, `A-PPCT-104.png`, `A-PPCT-106.png`, `B-PPCT-300.png`, `B-PPCT-405`–`408.png`, and `B-PPCT-428.png`), and was visually inspected frame-by-frame at native size on dark castle brick and `#121212`.

## Per-File Results

| File | Dimensions | Spill pixels | Largest shift | Pass / Fail |
| --- | --- | ---: | ---: | --- |
| `A-PPCT-5000.png` | 64 x 18 (2f 32x18; 4x: 256 x 72) | 0 | 0.00 px | PASS |
| `A-PPCT-5010.png` | 128 x 17 (8f 16x17; 4x: 512 x 68) | 0 | 0.35 px | PASS |
| `B-PPCT-121.png` | 288 x 56 (6f 48x56; 4x: 1152 x 224) | 0 | 0.35 px | PASS |
| `B-PPCT-122.png` | 288 x 56 (6f 48x56; 4x: 1152 x 224) | 0 | 0.35 px | PASS |
| `B-PPCT-510.png` | 576 x 96 (6f 96x96; 4x: 2304 x 384) | 0 | 0.00 px | PASS |
| `B-PPCT-511.png` | 576 x 96 (6f 96x96; 4x: 2304 x 384) | 0 | 0.00 px | PASS |
| `B-PPCT-521.png` | 32 x 27 (1f 32x27; 4x: 128 x 108) | 0 | 0.25 px | PASS |
| `B-PPCT-522.png` | 48 x 13 (3f 16x13; 4x: 192 x 52) | 0 | 0.35 px | PASS |
| `B-PPCT-701.png` | 640 x 18 (20f 32x18; 4x: 2560 x 72) | 0 | 0.35 px | PASS |
| `B-PPCT-702.png` | 128 x 16 (4f 32x16; 4x: 512 x 64) | 0 | 0.35 px | PASS |
| `B-PPCT-703.png` | 192 x 61 (4f 48x61; 4x: 768 x 244) | 0 | 0.35 px | PASS |
| `B-PPCT-704.png` | 144 x 45 (3f 48x45; 4x: 576 x 180) | 0 | 0.35 px | PASS |
| `B-PPCT-705.png` | 48 x 78 (1f 48x78; 4x: 192 x 312) | 0 | 0.00 px | PASS |
| `B-PPCT-706.png` | 32 x 42 (1f 32x42; 4x: 128 x 168) | 0 | 0.00 px | PASS |
| `B-PPCT-707.png` | 240 x 17 (3f 80x17; 4x: 960 x 68) | 0 | 0.35 px | PASS |
| `B-PPCT-708.png` | 80 x 20 (1f 80x20; 4x: 320 x 80) | 0 | 0.25 px | PASS |
| `B-PPCT-711.png` | 224 x 51 (2f 112x51; 4x: 896 x 204) | 0 | 0.00 px | PASS |
| `B-PPCT-714.png` | 160 x 40 (2f 80x40; 4x: 640 x 160) | 0 | 0.00 px | PASS |
| `A-PPCT-105.png` | 192 x 45 (6f 32x45; 4x: 768 x 180) | 0 | 0.90 px | PASS |
| `B-PPCT-914.png` | 64 x 76 (1f 64x76; 4x: 256 x 304) | 0 | 0.35 px | PASS |

## Left Out

None — all 20 reels (86 frames) passed visual QA at native size on dark castle brick and `#121212` as well as all mathematical checks.

## Time Taken

- **1h 12m 18s** (started `2026-11-05T09:21:01-08:00`, finished `2026-11-05T10:33:19-08:00`).
