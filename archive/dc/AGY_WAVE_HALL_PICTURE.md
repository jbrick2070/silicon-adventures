# Castle remaster: the Great Hall picture

You are repainting the Great Hall of a 1986 Macintosh game into a rich, truly lit 3D look. This is the first screen players see in the castle, so it must be striking. The painted Duncan runs across it, and the painted doors open on top of it. Study `art/castle-3d/B-PSCR-4020.png` and `art/castle-3d/A-PPCT-10051.png` for materials and finish.

## Rules

- Work in `D:\silicon-adventures`, on the branch `feature/asset-parity`.
- Create or change only the files listed below, in `art/castle-3d/` and `art/castle-3d/4x/`. Do not touch anything else. Do not commit, push, or switch branches. Play no audio. Leave ComfyUI and its GPU alone.
- Deliver a native file and a 4x master for each. Each native file must be the box average of its 4x master.
- Use a muted dark yellow key light and a cool fill, with no orange glow. Never fill a gap with one flat colour. Add no new objects or text.

## Files

| File | Source | Size | What it is |
| --- | --- | --- | --- |
| `A-PICT-10000.png` | `archive/dc/paper/Data-A-PICT-10000.png` | 512 x 342, opaque | The Great Hall. |
| `A-PICT-10004.png` | `archive/dc/paper/Data-A-PICT-10004.png` | 57 x 87, keep its transparency | The holiday tree. It sits at x 347, y 82 in the hall. |

## What must hold

- Keep the camera and perspective. All four doors, their arches, the steps, the floor lines and every wall edge must stay within 1 pixel of the original, because the painted door reels are drawn at those exact positions.
- Rows 310 to 341 sit under the status bar. Fill them with dark stone.

## Repairs

- `A-PPCT-10012.png`, frame 3: remove the hollow outline beside the elbow, keeping the original mask.
- `A-PPCT-10034.png`, frame 3: the rear shin is a thin dark stick. Repaint it to match the other leg, keeping the original mask.

## Before you finish

Look at each file at native size beside its original. A check by numbers alone does not count.

## Report

Write `art/castle-3d/WAVE_HALL_PICTURE_REPORT.md`: one row per file with dimensions, largest shift and pass or fail, then anything left out, then the time taken.
