# Wave Scepters Report

Delivered **12 / 12** files (**4 / 4** scepters across native `1x`, `4x` master, and `1024 x 1024` plain-white `hero` views) in `art/es-3d/scepters/`. Every native `AOBJ-<id>.png` is the exact `4x4` straight-RGBA box average of `4x/AOBJ-<id>.png` (`max channel diff = 0`), has `0` spill pixels outside the original 1986 `archive/es/plates/` shape at both `1x` and `4x`, contains 100% painted 3D material inside the mask with zero flat-colour fills and zero orange glow under a muted dark-yellow key light and cool slate fill, and was visually verified at native size on both `#0e0e0e` and dark castle stone (`B-PSCR-4020.png`). Each `hero/AOBJ-<id>.png` renders the complete scepter straight on over pure `#FFFFFF` (`1024 x 1024`) with generous uncropped margins on all four sides.

## Per-File Results

| File | Scepter | Dimensions | Spill pixels | Pass / Fail |
| --- | --- | --- | ---: | --- |
| `scepters/AOBJ-608.png` | Earth Scepter | 132 x 58 | 0 | PASS |
| `scepters/4x/AOBJ-608.png` | Earth Scepter (4x) | 528 x 232 | 0 | PASS |
| `scepters/hero/AOBJ-608.png` | Earth Scepter (hero) | 1024 x 1024 | 0 | PASS |
| `scepters/AOBJ-4500.png` | Fire Scepter | 95 x 46 | 0 | PASS |
| `scepters/4x/AOBJ-4500.png` | Fire Scepter (4x) | 380 x 184 | 0 | PASS |
| `scepters/hero/AOBJ-4500.png` | Fire Scepter (hero) | 1024 x 1024 | 0 | PASS |
| `scepters/AOBJ-23213.png` | Air Scepter | 107 x 33 | 0 | PASS |
| `scepters/4x/AOBJ-23213.png` | Air Scepter (4x) | 428 x 132 | 0 | PASS |
| `scepters/hero/AOBJ-23213.png` | Air Scepter (hero) | 1024 x 1024 | 0 | PASS |
| `scepters/AOBJ-19566.png` | Water Scepter | 136 x 37 | 0 | PASS |
| `scepters/4x/AOBJ-19566.png` | Water Scepter (4x) | 544 x 148 | 0 | PASS |
| `scepters/hero/AOBJ-19566.png` | Water Scepter (hero) | 1024 x 1024 | 0 | PASS |

## Left Out

- None — all four scepters (12 files total) passed mathematical verification and native-size dark-background visual QA.

## Time Taken

- **26m 45s** (started `2026-11-05T10:20:24-08:00`, finished `2026-11-05T10:47:09-08:00`).
