# Wave Throne Report

Delivered **30 / 30** sprite reels (**99 / 99** frames) in `art/castle-3d/` and `art/castle-3d/4x/`. Every delivered native sprite is the exact straight RGBA 4x4 box average of its `4x` master (`max channel diff = 0`), has `0` spill pixels outside the original 1986 sprite mask at both `1x` and `4x`, preserves a thin soft warm-light interior rim inside original rim pixels for dark-brick legibility, maintains consistent materials and colours across every frame of every reel (matching `B-PPCT-908.png`, `B-PPCT-906.png`, `B-PPCT-902.png`, `B-PSCR-4020.png`, and `B-PSCR-2020.png`), and was visually inspected frame-by-frame at native size on dark castle brick and `#0e0e0e`.

## Per-File Results

| File | Dimensions | Spill pixels | Largest shift | Pass / Fail |
| --- | --- | ---: | ---: | --- |
| `B-PPCT-904.png` | 128 x 15 (8f 16x15; 4x: 512 x 60) | 0 | 1.62 px | PASS |
| `B-PPCT-905.png` | 64 x 16 (2f 32x16; 4x: 256 x 64) | 0 | 2.50 px | PASS |
| `B-PPCT-910.png` | 128 x 50 (2f 64x50; 4x: 512 x 200) | 0 | 1.60 px | PASS |
| `B-PPCT-911.png` | 144 x 51 (3f 48x51; 4x: 576 x 204) | 0 | 3.40 px | PASS |
| `B-PPCT-912.png` | 144 x 51 (3f 48x51; 4x: 576 x 204) | 0 | 4.48 px | PASS |
| `B-PPCT-913.png` | 256 x 61 (4f 64x61; 4x: 1024 x 244) | 0 | 3.75 px | PASS |
| `B-PPCT-914.png` | 64 x 76 (1f 64x76; 4x: 256 x 304) | 0 | 8.65 px | PASS |
| `B-PPCT-915.png` | 240 x 50 (5f 48x50; 4x: 960 x 200) | 0 | 1.77 px | PASS |
| `B-PPCT-916.png` | 128 x 59 (2f 64x59; 4x: 512 x 236) | 0 | 1.50 px | PASS |
| `B-PPCT-917.png` | 128 x 14 (8f 16x14; 4x: 512 x 56) | 0 | 1.00 px | PASS |
| `B-PPCT-920.png` | 16 x 36 (1f 16x36; 4x: 64 x 144) | 0 | 1.00 px | PASS |
| `B-PPCT-921.png` | 64 x 9 (4f 16x9; 4x: 256 x 36) | 0 | 3.00 px | PASS |
| `B-PPCT-712.png` | 160 x 34 (5f 32x34; 4x: 640 x 136) | 0 | 6.25 px | PASS |
| `B-PPCT-918.png` | 160 x 34 (5f 32x34; 4x: 640 x 136) | 0 | 4.00 px | PASS |
| `B-PPCT-919.png` | 96 x 26 (6f 16x26; 4x: 384 x 104) | 0 | 0.00 px | PASS |
| `B-PPCT-907.png` | 144 x 32 (3f 48x32; 4x: 576 x 128) | 0 | 4.07 px | PASS |
| `B-PPCT-922.png` | 336 x 44 (7f 48x44; 4x: 1344 x 176) | 0 | 6.73 px | PASS |
| `B-PPCT-715.png` | 192 x 31 (4f 48x31; 4x: 768 x 124) | 0 | 3.25 px | PASS |
| `B-PPCT-716.png` | 64 x 14 (2f 32x14; 4x: 256 x 56) | 0 | 1.75 px | PASS |
| `B-PPCT-717.png` | 128 x 13 (2f 64x13; 4x: 512 x 52) | 0 | 1.82 px | PASS |
| `B-PPCT-200.png` | 192 x 83 (3f 64x83; 4x: 768 x 332) | 0 | 1.00 px | PASS |
| `B-PPCT-400.png` | 64 x 48 (2f 32x48; 4x: 256 x 192) | 0 | 0.25 px | PASS |
| `B-PPCT-401.png` | 64 x 48 (2f 32x48; 4x: 256 x 192) | 0 | 0.25 px | PASS |
| `B-PPCT-438.png` | 32 x 71 (2f 16x71; 4x: 128 x 284) | 0 | 0.00 px | PASS |
| `B-PPCT-410.png` | 96 x 9 (2f 48x9; 4x: 384 x 36) | 0 | 1.00 px | PASS |
| `B-PPCT-411.png` | 64 x 24 (1f 64x24; 4x: 256 x 96) | 0 | 0.00 px | PASS |
| `B-PPCT-413.png` | 288 x 56 (6f 48x56; 4x: 1152 x 224) | 0 | 3.50 px | PASS |
| `B-PPCT-700.png` | 32 x 6 (1f 32x6; 4x: 128 x 24) | 0 | 0.00 px | PASS |
| `B-PPCT-900.png` | 64 x 7 (1f 64x7; 4x: 256 x 28) | 0 | 0.50 px | PASS |
| `B-PPCT-901.png` | 128 x 9 (2f 64x9; 4x: 512 x 36) | 0 | 2.47 px | PASS |

## Left Out

None — all 30 reels (99 frames) passed visual QA at native size on dark castle brick and `#0e0e0e` as well as all mathematical checks.

## Time Taken

- **59m 11s** (started `2026-11-05T07:32:04-08:00`, finished `2026-11-05T08:31:15-08:00`).
