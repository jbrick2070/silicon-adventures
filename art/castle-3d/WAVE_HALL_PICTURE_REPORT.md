# Wave Hall Picture Report

Repainted the Great Hall (`A-PICT-10000.png`) and holiday tree (`A-PICT-10004.png`) and repaired `A-PPCT-10034.png` (frame 3 rear leg) and `A-PPCT-10050.png` (arch and doorway alignment) in `art/castle-3d/` and `art/castle-3d/4x/`. Every native (`1x`) file is the exact `4x4` box average of its `4x` master (`round_diff = 0`, `float_diff <= 0.50`), uses a muted dark yellow upper-left key light and cool slate fill with zero orange glow and zero flat fills, and was visually verified at native `1x` size directly beside its 1986 original as well as composited together at live game coordinates.

## Per-File Results

| File | Dimensions | Largest shift | Pass / Fail |
| --- | --- | ---: | --- |
| `A-PICT-10000.png` | 512 x 342 (opaque RGB; 4x: 2048 x 1368) | 1.00 px | PASS |
| `A-PICT-10004.png` | 57 x 87 (RGBA, source alpha kept; 4x: 228 x 348) | 1.00 px | PASS |
| `A-PPCT-10034.png` | 192 x 80 (4f 48x80, RGBA, 0 spill; 4x: 768 x 320) | 1.00 px | PASS |
| `A-PPCT-10050.png` | 192 x 159 (3f 64x159, RGBA, 0 spill; 4x: 768 x 636) | 1.00 px | PASS |

## Notes

- **`A-PICT-10000.png`**: All four doorways, stone arches, central steps, floor grid lines, and wall edges sit within `<= 1.00 px` of `Data-A-PICT-10000.png` (`0.00 px` shift across all four doors, steps, and floor grid), and rows `310..341` under the status bar are filled with dark castle stone courses (`mean = 37.4`, `std = 8.8`).
- **`A-PICT-10004.png`**: Preserves source `RGBA` alpha (`IoU = 1.00`, `0` spill) and blends seamlessly at `(347, 82)` over the Great Hall wall and stone pedestal with zero border seam.
- **`A-PPCT-10034.png`**: Repainted frame 3's rear shin (`x = 96..143`) with full dimensional navy breeches, brown leather boot cuff, and boot matching frame 1 while strictly preserving the original `art/castle/A-PPCT-10034.png` alpha mask (`IoU = 1.00`, `0` spill).
- **`A-PPCT-10050.png`**: Corrected the prior `4.00 px` arch/jamb shift so all three frames' stone arches, jambs, strap hinges, ring knockers, and doorway openings sit within `<= 1.00 px` (`mean = 0.61 px`) of `art/castle/A-PPCT-10050.png` and composite onto `A-PICT-10000.png` at `(226, 13)` with zero seam.

## Left Out

- None.

## Time Taken

- **1h 06m 02s** (started `2026-11-05T11:05:08-08:00`, finished `2026-11-05T12:11:10-08:00`).
