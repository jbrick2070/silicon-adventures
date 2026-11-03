# First-person artwork

The artwork reads from the local disk extractions. The browser loads the PNGs directly.

## Enchanted Scepters

The doorway images live in `archive/es/plates/`. The original room compositor and tile palette are documented in `archive/es/`. The pixel coordinates below use the 338 × 314 scene window.

| Scene | Native ASCN drawing commands | First-person use |
| --- | --- | --- |
| High Altar · 7990 | Dais 16 and 23, right column 17–18, left column 19–20, center plinth and stair opening 25–27 | `altar-*.png` and `game/altar.js`. The movable altar is a separate native object, AOBJ 14168. |
| Quarters · 21149 | Bed 6–9 and 12 | `quarters-*.png` and `game/rooms.js`. The room's text identifies the wooden bed. |
| Wizard's Sanctum · 29408 | Worktable 6–10 and 17, lectern and book 11–15, arch 27–30 | `sanctum-*.png` and `game/rooms.js`. The two uprights leave a passage beneath the arch. |
| Courtyard · 10021 | Basin 13 and 26–28 | `court-*.png` and `game/rooms.js`. Thirty-two sides approximate the circular rim. |

`foreground.tsv` maps another 18 ASCNs to individual objects, original draw-command numbers, and inferred thicknesses. `foreground/<id>-clean.png` is the room with the indicated commands omitted. Each sibling object file contains only the indicated commands at their original coordinates. `foreground-index.js` stores the actual opaque bounds and original eight-by-eight dither tiles from CODE 1. `game/rooms.js` places these forms, using their screen-space footprints and apparent points of contact with the ground.

The drawings establish the visible faces. The adaptation supplies world scale, footprints, reverse faces and collision bounds. The reverse of a foreground form retains its silhouette and uses an original pattern. The renderer samples separate layers for surfaces behind furniture and columns. `SeparateAltar.java` reproduces the layers with the same WAGE drawing classes used by `archive/es/ExportPlates.java`. `python art/verify_layers.py` checks their reassembly against all 22 native plates.

## Dark Castle

`draw_castle.py` reads the resource maps of Data A and Data B, expands the PPCT frame bitstreams and their original masks, and decodes the PSCR room screens. Run it with Python and Pillow after extracting the forks with `archive/dc/extract.py --forks`. `--inspect <directory>` makes contact sheets of the sprite sets.

`castle-index.js` records the source file, type, ID, raw resource SHA-256, number of frames and native frame size for every one of the 172 PPCT and 20 PSCR exports. Each PNG in `castle/` contains the original frame sequence in horizontal order, or one screen. The additional `castle-wizard.png` sheet stacks Data B PPCT 430, 431 and 432 in that order. Its rows retain all 8, 7 and 6 native frames and bottom-align them into 48 × 46 cells. Gameplay roles and sound assignments are recorded in `archive/dc/`.

## Visual refresh layers

`art/refresh/` and `game/refresh.js` hold optional 1-bit refinements in separate layers while leaving every source plate, separated room PNG, and sprite sheet untouched:

- `python art/build_refresh.py` parses the QuickDraw `ASCN` vector commands directly from `archive/es/Scepters.rsrc` and writes pattern-index and QuickDraw border maps under `art/refresh/plates/` and `art/refresh/foreground/`, verified bit-for-bit against the exported PNGs.
- `art/refresh/sprites/` adds non-destructive 1-pixel paper silhouette rims within native frame bounds for Dark Castle crossover animations (`castle-wizard-rim.png`, `B-PPCT-300-rim.png`, `B-PPCT-908/912/915-rim.png`).
- Press `L` or click `Refreshed` / `Original` in the picture window bar to compare the refreshed layers against the original plates at any viewpoint.
