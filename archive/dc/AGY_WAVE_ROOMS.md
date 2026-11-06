# Castle remaster: Wave Rooms

You are repainting art from a 1986 Macintosh game into a rich, truly lit 3D look. The target is the existing art in `art/castle-3d/`. Study `B-PSCR-4020.png`, `B-PSCR-2020.png`, `B-PPCT-908.png`, `B-PPCT-902.png` and `A-PPCT-106.png` there first, and match that lighting and those materials exactly: warm key light from the upper left, cool slate fill, solid forms.

## Rules

- Work in `D:\silicon-adventures`, on the branch `feature/asset-parity`.
- Create files only in `art/castle-3d/` and `art/castle-3d/4x/`, using the original filenames from `art/castle/`. Create only the files listed below. Other agents are painting other files at the same time.
- Do not touch `game/`, `art/castle/`, `art/remaster-3d/`, `art/castle-relief/`, `art/castle-models/`, or anything else. Do not commit, push, or switch branches. Play no audio. Leave ComfyUI and its GPU alone.
- Deliver a native file and a 4x master for every asset. Each native file must be the box average of its 4x master.
- Dimensions and frame layout must be exact. Nothing may spill outside the original sprite mask.
- Keep a thin, soft light edge inside the original rim pixels of sprites, so they stay clear on dark brick.

## Method

Build a clean guide from each original, generate the 3D render, register it to the original so every edge lands in place, then export. Files you cannot make good are better left out than delivered bad.

## Before you finish

Look at every frame at native size on a dark background. A shape check alone does not count, and past deliveries that passed shape checks were still visibly wrong. The same character must keep the same colours and materials in every frame of every reel.

## Files

Paint these 11 rooms, each 512 x 342, as native and 4x: `B-PSCR-1010.png`, `B-PSCR-1020.png`, `B-PSCR-2000.png`, `B-PSCR-2010.png`, `B-PSCR-2030.png`, `B-PSCR-3000.png`, `B-PSCR-3010.png`, `B-PSCR-3020.png`, `B-PSCR-3030.png`, `B-PSCR-4000.png`, `B-PSCR-4010.png`.

Also repair `B-PSCR-1000.png`: its three ropes wander by about 2 pixels. Make them straight at x = 416 to 418, 442 to 444 and 469 to 471, and change nothing else.

## What must hold

- Every floor, ledge, ladder, stair, rope, wall and door must stay within 1 pixel of the original. Check against room data in `archive/dc/castle-data.js`. Ropes and ladders must be straight.
- `B-PSCR-3012.png` and `B-PSCR-3032.png` are masks for what stands in front of Duncan in rooms 3010 and 3030. Do not change them. Every edge they mark must line up with your room.
- Room 3030 must show all 20 floating ledges with identical slabs, because the game hides which are real.
- Rows 310 to 341 sit under the status bar. Fill them with dark stone.

## Report

Write `art/castle-3d/WAVE_ROOMS_REPORT.md`: one row per file with dimensions, spill pixels, largest shift and pass or fail, then anything left out, then the time taken.
