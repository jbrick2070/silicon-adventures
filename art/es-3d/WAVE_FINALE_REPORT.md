# Wave Finale Report

| File | Room | Dimensions | Opacity | Largest Shift | Pass / Fail |
| --- | --- | --- | --- | ---: | --- |
| `ASCN-18366.png` | Finale (1x native) | `338 x 314` | Fully opaque (`RGB`) | 0.24 px | PASS |
| `4x/ASCN-18366.png` | Finale (4x master) | `1352 x 1256` | Fully opaque (`RGB`) | 0.24 px (native) | PASS |

## Verification Summary

- **Dither removal**: Built a clean, dither-free `4x` architectural guide from `archive/es/plates/ASCN-18366.png` and repainted the chamber with weathered cut limestone ashlar blocks, aged stone plaster relief, carved window archivolts/jambs/sill, and dark chiseled slate floor courses matching `art/castle-3d/B-PSCR-4020.png`, `B-PSCR-2030.png`, and `B-PSCR-2010.png` (`8x4` QuickDraw dither harmonic power reduced from `97.3%` in the prior painting to `0.26%` broadband stone grain).
- **Lighting & palette**: Triumphant muted dark-yellow daylight shafts across the upper stone and arched window sky balanced with cool slate ambient fill (`43.8%` cool `B > R` pixels, `0.000%` orange-glow pixels, `0` flat-colour blocks, and no baked dark wall vignette).
- **Box-average & landmark parity**: `art/es-3d/ASCN-18366.png` is the exact `4x4` box average of `art/es-3d/4x/ASCN-18366.png` (`max channel diff = 0` under both half-to-even and half-up rounding), visually inspected side-by-side at native `1x` (`338 x 314`) and `4x` (`1352 x 1256`) beside `archive/es/plates/ASCN-18366.png`. All 12 structural landmarks align within `0.01 – 0.24 px` native (`<= 1.0 px`):
  - Floor plinth edge: `0.01 px`
  - Left jamb outer / Right jamb inner: `0.05 px` / `0.05 px`
  - Window sill left / Right jamb outer: `0.10 px` / `0.11 px`
  - Inner arch apex / Outer arch apex / Left jamb inner: `0.13 px` / `0.14 px` / `0.14 px`
  - Window sill top / Window sill right: `0.21 px` / `0.21 px`
  - Ceiling cornice edge / Window sill bottom: `0.22 px` / `0.24 px`

## Left Out

None.

## Time Taken

25 minutes (`2026-11-05T16:53:33-08:00` to `2026-11-05T17:18:50-08:00`).
