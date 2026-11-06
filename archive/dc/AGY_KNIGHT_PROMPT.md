# Castle remaster: ropes and the Black Knight

Your harder sample now runs in the game. This job makes one repair and finishes the Black Knight, so he no longer switches to black-and-white art in play.

## Rules

- Work in `D:\silicon-adventures`, on the branch `feature/asset-parity`.
- Create or change files only in `art/castle-3d/` and its `4x/` folder, using the same filenames as the originals in `art/castle/`.
- Change no existing file except `B-PSCR-1000.png` and its 4x master.
- Do not touch `game/`, `art/castle/`, `art/remaster-3d/`, `art/castle-relief/`, or anything else. Do not commit, push, or switch branches. Play no audio. Leave ComfyUI and its GPU alone.
- Deliver a native file and a 4x master for every asset. Each native file must be the box average of its 4x master.
- Dimensions and frame layout must be exact. Nothing may spill outside the original sprite mask.

## Job 1: straighten the ropes

The three ropes in `B-PSCR-1000.png` wander by about 2 pixels. In the original they are dead straight, at x = 416 to 418, 442 to 444, and 469 to 471, and Duncan climbs them at those positions. Make each rope straight and within 0.5 pixels of the original. Change only the ropes and their shadows. Everything else in the room must stay pixel-identical.

## Job 2: finish the Black Knight

Match `art/castle-3d/B-PPCT-908.png` exactly: the same armour, steel, gold eyes, shield and lighting. Sources are in `art/castle/`.

| File | Frames | Frame size | What it is |
| --- | ---: | --- | --- |
| `B-PPCT-910.png` | 2 | 64 x 50 | Reaching for the mug |
| `B-PPCT-911.png` | 3 | 48 x 51 | Winding up to throw |
| `B-PPCT-916.png` | 2 | 64 x 59 | Throwing |
| `B-PPCT-915.png` | 5 | 48 x 50 | Shaken on the rocking throne |
| `B-PPCT-912.png` | 3 | 48 x 51 | Starting to fall |
| `B-PPCT-913.png` | 4 | 64 x 61 | Falling |
| `B-PPCT-914.png` | 1 | 64 x 76 | Fallen |
| `B-PPCT-900.png` | 1 | 64 x 7 | The step under the throne |
| `B-PPCT-905.png` | 2 | 32 x 16 | The throne shaking loose |

Open each original at a large size before you paint it, and follow its pose. Keep a thin, soft light edge inside the original rim pixels, as you did in the last sample.

## Before you finish

Look at every frame at native size on a dark background. A shape check alone does not count. If a frame fails and you cannot fix it, leave that file out and say so. A missing file is better than a bad one.

## Report

Write `art/castle-3d/KNIGHT_REPORT.md` with:

1. A table with one row per file: dimensions, spill pixels, the largest shift from the original, and pass or fail.
2. Anything you left out or could not fix.
3. The time taken.
