# Wave Beacon Lamp Report

| File | Dimensions | Largest Shift | Result |
| --- | --- | ---: | --- |
| `aircraft/lamp-north.png` | `338 x 314` | 0.46 px | PASS |
| `aircraft/lamp-north-flash.png` | `338 x 314` | 0.46 px | PASS |
| `aircraft/lamp-east.png` | `338 x 314` | 0.46 px | PASS |
| `aircraft/lamp-east-flash.png` | `338 x 314` | 0.46 px | PASS |
| `aircraft/lamp-south.png` | `338 x 314` | 0.46 px | PASS |
| `aircraft/lamp-south-flash.png` | `338 x 314` | 0.46 px | PASS |
| `aircraft/lamp-west.png` | `338 x 314` | 0.46 px | PASS |
| `aircraft/lamp-west-flash.png` | `338 x 314` | 0.46 px | PASS |

## Landmark Alignment Summary

| Landmark | Shift | Status |
| --- | ---: | --- |
| Near stone ledge lip | 0.05 px | PASS (<= 1.0 px) |
| Tripod, pedestal & crank | 0.12 px | PASS (<= 1.0 px) |
| Signal lantern & cradle (`east` / `south` / `west` / `north`) | 0.15 - 0.17 px | PASS (<= 1.0 px) |
| Brass compass bezel & shadow | 0.21 px | PASS (<= 1.0 px) |
| Signal card outer frame | 0.46 px | PASS (<= 1.0 px) |
| Signal card clue marks (`.-.` bars & rule lines) | 0.00 px | PASS (<= 1.0 px) |

## Anything Left Out

- None of the 8 requested station files or foreground station elements were left out.
- Per the prompt rules, two guide-only annotations were intentionally omitted from the foreground sprites: the wireframe `'N'` label above the compass (`Add no text`) and the four 1 px exterior ray ticks outside the `-flash` lantern (`Add no glow outside the lantern`). Everything above and behind the foreground station is fully transparent (`alpha = 0`) so `aircraft/tower.png` and the flying `courier.png` show through cleanly.

## Checks

- Every delivered PNG (`RGBA`, `338 x 314`) was composited over `art/es-3d/aircraft/tower.png` and visually inspected at native size beside its matching guide in `art/es-3d/aircraft/guides/`.
- Matched `tower.png` lighting: muted dark-yellow upper-left key light, cool slate shadows, `0` orange-glow pixels, and `0` flat-colour blocks (`0 / 971` `6x6` blocks with `std < 1.5`).
- Exact station invariance verified: `0` pixels differ outside the rotating lantern and compass dial across bearings, `0` pixels differ outside the shutter bezel between unlit and `-flash` pairs, and `south` / `south-flash` match `east` / `east-flash` identically as in the guides.

## Time Taken

49 minutes.
