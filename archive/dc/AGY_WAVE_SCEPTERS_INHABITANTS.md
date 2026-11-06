# Enchanted Scepters remaster: the inhabitants

You are repainting the inhabitants of a 1986 Macintosh adventure into a rich, truly lit 3D look. They stand in painted first-person rooms, so they must feel solid and belong there. Study `art/castle-3d/B-PPCT-908.png`, `art/castle-3d/B-PPCT-435.png` and `art/castle-3d/A-PPCT-106.png` for materials and finish.

## Rules

- Work in `D:\silicon-adventures`, on the branch `feature/asset-parity`.
- Create files only in `art/es-3d/inhabitants/` and `art/es-3d/inhabitants/4x/`, using the original filenames from `archive/es/plates/`. Do not touch anything else. Do not commit, push, or switch branches. Play no audio. Leave ComfyUI and its GPU alone.
- Deliver a native file and a 4x master. Each native file must be the box average of its 4x master.
- Dimensions and frame layout must be exact. Nothing may spill outside the original sprite mask, and every pixel inside it must be real painted material. Never fill a gap with one flat colour.
- Keep a thin, soft light edge inside the original rim pixels, so each figure stays clear on dark rooms.
- The same character must keep the same colours and materials in every frame.
- Use a muted dark yellow key light and a cool fill, with no orange glow. Add no text.

## Files

| File | Size | Who |
| --- | --- | --- |
| `ACHR-9384.png` | 205 x 200 | Hurk Gunner |
| `ACHR-25019.png` | 158 x 184 | mummy |
| `ACHR-24571.png` | 255 x 228 | Hurk Trooper |
| `ACHR-10366.png` | 240 x 261 | ghoul |
| `ACHR-28937.png` | 293 x 254 | Fire Demon |
| `ACHR-1671.png` | 281 x 242 | giant scorpion |
| `ACHR-15894.png` | 209 x 200 | Hurk Soldier |
| `ACHR-9069.png` | 226 x 234 | robot |
| `ACHR-29732.png` | 247 x 266 | skeleton |
| `ACHR-29194.png` | 221 x 215 | shark |
| `ACHR-28427.png` | 150 x 221 | eel |
| `ACHR-20762.png` | 396 x 249 | octopus |
| `ACHR-18927.png` | 273 x 268 | Water Demon |
| `ACHR-6991.png` | 137 x 181 | river monster |
| `ACHR-15976.png` | 257 x 214 | witch doctor |
| `ACHR-7686.png` | 264 x 254 | cave man |
| `ACHR-30432.png` | 354 x 156 | spider |
| `ACHR-27783.png` | 408 x 241 | Air Demon |
| `ACHR-5605.png` | 290 x 196 | chief |
| `ACHR-27230.png` | 262 x 300 | tyrannosaurus |
| `ACHR-1238.png` | 220 x 234 | cyclops |
| `ACHR-19177.png` | 176 x 202 | Hurk Captain |
| `ACHR-8529.png` | 1 x 1 | Saber |
| `ACHR-17175.png` | 188 x 261 | Alchemist |
| `ACHR-13357.png` | 243 x 297 | Earth Demon |
| `ACHR-17327.png` | 217 x 230 | Priest |
| `ACHR-16393.png` | 257 x 248 | Black Knight |
| `ACHR-6060.png` | 186 x 260 | Troll |

## Before you finish

Look at every frame at native size on a dark background. A check by numbers alone does not count. Files you cannot make good are better left out than delivered bad.

## Report

Write `art/es-3d/WAVE_INHABITANTS_REPORT.md`: one row per file with dimensions, spill pixels, largest shift and pass or fail, then anything left out, then the time taken.
