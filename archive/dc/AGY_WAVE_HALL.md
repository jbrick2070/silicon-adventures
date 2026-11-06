# Castle remaster: Wave Great hall

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

Every pixel inside the mask must be real painted material. Never fill a gap with one flat colour: a past delivery lost a helmet that way and still passed its shape check. If your render does not cover part of the shape, repaint that part from the same pose in a neighbouring frame.

## Before you finish

Look at every frame at native size on a dark background. A shape check alone does not count, and past deliveries that passed shape checks were still visibly wrong. The same character must keep the same colours and materials in every frame of every reel.

## Files

These are the large close-up views of Duncan running through the great hall, and the great door. They are shown big, so detail matters most here. Match Duncan to `A-PPCT-106.png`: same face, hair, shirt, breeches and boots. (22 reels, 72 frames)

| File | Frames | Frame size | What it is |
| --- | ---: | --- | --- |
| `A-PPCT-10008.png` | 3 | 64 x 104 | Duncan's run through the great hall, seen large |
| `A-PPCT-10010.png` | 3 | 64 x 104 | Duncan's run through the great hall, seen large |
| `A-PPCT-10011.png` | 3 | 48 x 96 | Duncan's run through the great hall, seen large |
| `A-PPCT-10012.png` | 4 | 64 x 88 | Duncan's run through the great hall, seen large |
| `A-PPCT-10013.png` | 2 | 32 x 88 | Duncan's run through the great hall, seen large |
| `A-PPCT-10020.png` | 3 | 64 x 104 | Duncan's run through the great hall, seen large |
| `A-PPCT-10021.png` | 3 | 48 x 93 | Duncan's run through the great hall, seen large |
| `A-PPCT-10022.png` | 4 | 48 x 86 | Duncan's run through the great hall, seen large |
| `A-PPCT-10023.png` | 4 | 48 x 78 | Duncan's run through the great hall, seen large |
| `A-PPCT-10024.png` | 2 | 32 x 64 | Duncan's run through the great hall, seen large |
| `A-PPCT-10030.png` | 3 | 64 x 104 | Duncan's run through the great hall, seen large |
| `A-PPCT-10031.png` | 3 | 64 x 96 | Duncan's run through the great hall, seen large |
| `A-PPCT-10032.png` | 4 | 64 x 88 | Duncan's run through the great hall, seen large |
| `A-PPCT-10033.png` | 4 | 48 x 88 | Duncan's run through the great hall, seen large |
| `A-PPCT-10034.png` | 4 | 48 x 80 | Duncan's run through the great hall, seen large |
| `A-PPCT-10040.png` | 3 | 64 x 104 | Duncan's run through the great hall, seen large |
| `A-PPCT-10041.png` | 3 | 48 x 96 | Duncan's run through the great hall, seen large |
| `A-PPCT-10042.png` | 4 | 48 x 80 | Duncan's run through the great hall, seen large |
| `A-PPCT-10043.png` | 5 | 32 x 64 | Duncan's run through the great hall, seen large |
| `A-PPCT-10050.png` | 3 | 64 x 159 | the great hall door |
| `A-PPCT-10051.png` | 3 | 80 x 169 | the great hall door |
| `A-PPCT-10052.png` | 2 | 64 x 120 | the great hall door |

## Report

Write `art/castle-3d/WAVE_HALL_REPORT.md`: one row per file with dimensions, spill pixels, largest shift and pass or fail, then anything left out, then the time taken.
