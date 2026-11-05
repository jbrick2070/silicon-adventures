# Enchanted Scepters remaster: the four scepters

You are repainting the four scepters of a 1986 Macintosh game into a rich, truly lit 3D look. They are the prize of the whole game, so they must look precious. Study `art/castle-3d/B-PPCT-908.png` and `art/castle-3d/B-PSCR-4020.png` for materials and finish.

## Rules

- Work in `D:\silicon-adventures`, on the branch `feature/asset-parity`.
- Create files only in `art/es-3d/scepters/`. Do not touch anything else. Do not commit, push, or switch branches. Play no audio. Leave ComfyUI and its GPU alone.
- For each scepter deliver three files, using the plate's number:
  - `AOBJ-<id>.png`: the same size as the original plate, transparent outside the original shape, with nothing outside it.
  - `4x/AOBJ-<id>.png`: the 4x master of that file. The native file must be its box average.
  - `hero/AOBJ-<id>.png`: the whole scepter on plain white, 1024 x 1024, seen straight on, with nothing cropped, for making a 3D model.
- Keep each scepter's shape and proportions from its plate in `archive/es/plates/`. Add no text.
- Use a muted dark yellow key light and a cool fill, with no orange glow. Never fill a gap with one flat colour.

## Files

| Plate | Size | Name | Materials |
| --- | --- | --- | --- |
| `AOBJ-608.png` | 132 x 58 | Earth Scepter | carved green jade and bronze |
| `AOBJ-4500.png` | 95 x 46 | Fire Scepter | blackened iron and red gold, with a ruby flame crystal |
| `AOBJ-23213.png` | 107 x 33 | Air Scepter | polished silver and pale blue enamel |
| `AOBJ-19566.png` | 136 x 37 | Water Scepter | deep blue steel and pearl, with a sapphire orb |

## Before you finish

Look at every file at native size on a dark background. A check by numbers alone does not count.

## Report

Write `art/es-3d/WAVE_SCEPTERS_REPORT.md`: one row per file with dimensions, spill pixels and pass or fail, then anything left out, then the time taken.
