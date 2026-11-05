# Wave Inhabitants Report

Delivered **28 / 28** Enchanted Scepters inhabitants in `art/es-3d/inhabitants/` and `art/es-3d/inhabitants/4x/` (`27` visible 3D-repainted character plates plus `ACHR-8529.png`, Saber's `1 x 1` transparent first-person player placeholder). Every native (`1x`) PNG is the exact straight-RGBA `4x4` box average of its `4x` master (`max channel diff = 0` under both half-to-even and half-up rounding), has `0` spill pixels outside the original 1986 `archive/es/plates/` sprite mask at both `1x` and `4x`, preserves a thin soft directional light rim inside the original rim pixels (`muted dark yellow` upper-left key `#c4b178`, `cool slate` lower-right fill `#788da8`, zero orange glow), maintains consistent faction palettes and materials across shared characters (the four Hurks), contains 100% painted 3D material inside every opaque mask pixel (zero flat-colour gap fills), and was visually verified at `1x` native scale on `#0c0c0e` and dark mottled dungeon stone.

## Per-File Results

| File | Dimensions | Spill pixels | Largest shift | Pass / Fail |
| --- | --- | ---: | ---: | --- |
| `ACHR-9384.png` | 205 x 200 (4x: 820 x 800) — Hurk Gunner | 0 | 0.00 px | PASS |
| `ACHR-25019.png` | 158 x 184 (4x: 632 x 736) — mummy | 0 | 0.00 px | PASS |
| `ACHR-24571.png` | 255 x 228 (4x: 1020 x 912) — Hurk Trooper | 0 | 1.00 px | PASS |
| `ACHR-10366.png` | 240 x 261 (4x: 960 x 1044) — ghoul | 0 | 1.00 px | PASS |
| `ACHR-28937.png` | 293 x 254 (4x: 1172 x 1016) — Fire Demon | 0 | 0.00 px | PASS |
| `ACHR-1671.png` | 281 x 242 (4x: 1124 x 968) — giant scorpion | 0 | 0.00 px | PASS |
| `ACHR-15894.png` | 209 x 200 (4x: 836 x 800) — Hurk Soldier | 0 | 0.00 px | PASS |
| `ACHR-9069.png` | 226 x 234 (4x: 904 x 936) — robot | 0 | 0.00 px | PASS |
| `ACHR-29732.png` | 247 x 266 (4x: 988 x 1064) — skeleton | 0 | 0.00 px | PASS |
| `ACHR-29194.png` | 221 x 215 (4x: 884 x 860) — shark | 0 | 0.00 px | PASS |
| `ACHR-28427.png` | 150 x 221 (4x: 600 x 884) — eel | 0 | 0.00 px | PASS |
| `ACHR-20762.png` | 396 x 249 (4x: 1584 x 996) — octopus | 0 | 0.00 px | PASS |
| `ACHR-18927.png` | 273 x 268 (4x: 1092 x 1072) — Water Demon | 0 | 0.00 px | PASS |
| `ACHR-6991.png` | 137 x 181 (4x: 548 x 724) — river monster | 0 | 0.00 px | PASS |
| `ACHR-15976.png` | 257 x 214 (4x: 1028 x 856) — witch doctor | 0 | 0.00 px | PASS |
| `ACHR-7686.png` | 264 x 254 (4x: 1056 x 1016) — cave man | 0 | 0.00 px | PASS |
| `ACHR-30432.png` | 354 x 156 (4x: 1416 x 624) — spider | 0 | 0.00 px | PASS |
| `ACHR-27783.png` | 408 x 241 (4x: 1632 x 964) — Air Demon | 0 | 1.00 px | PASS |
| `ACHR-5605.png` | 290 x 196 (4x: 1160 x 784) — chief | 0 | 0.00 px | PASS |
| `ACHR-27230.png` | 262 x 300 (4x: 1048 x 1200) — tyrannosaurus | 0 | 0.00 px | PASS |
| `ACHR-1238.png` | 220 x 234 (4x: 880 x 936) — cyclops | 0 | 0.00 px | PASS |
| `ACHR-19177.png` | 176 x 202 (4x: 704 x 808) — Hurk Captain | 0 | 0.00 px | PASS |
| `ACHR-8529.png` | 1 x 1 (4x: 4 x 4) — Saber | 0 | 0.00 px | PASS |
| `ACHR-17175.png` | 188 x 261 (4x: 752 x 1044) — Alchemist | 0 | 0.00 px | PASS |
| `ACHR-13357.png` | 243 x 297 (4x: 972 x 1188) — Earth Demon | 0 | 0.00 px | PASS |
| `ACHR-17327.png` | 217 x 230 (4x: 868 x 920) — Priest | 0 | 0.00 px | PASS |
| `ACHR-16393.png` | 257 x 248 (4x: 1028 x 992) — Black Knight | 0 | 0.00 px | PASS |
| `ACHR-6060.png` | 186 x 260 (4x: 744 x 1040) — Troll | 0 | 0.00 px | PASS |

## Left Out

- None (all 28 target inhabitants delivered and verified).

## Time Taken

- **27m 50s** (started `2026-11-05T10:20:33-08:00`, finished `2026-11-05T10:48:23-08:00`).
