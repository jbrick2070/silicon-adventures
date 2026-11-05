# Castle remaster: Wave Creatures

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

These are the castle's guards, rats, whips, drips, brooms, the wizard, the eye and the mutant. Match the finished creatures `B-PPCT-435.png`, `B-PPCT-412.png` and `B-PPCT-310.png`. (33 reels, 149 frames)

| File | Frames | Frame size | What it is |
| --- | ---: | --- | --- |
| `B-PPCT-311.png` | 4 | 32 x 12 | rat |
| `B-PPCT-351.png` | 2 | 32 x 42 | guard |
| `B-PPCT-352.png` | 2 | 32 x 42 | guard |
| `B-PPCT-353.png` | 2 | 32 x 42 | guard |
| `B-PPCT-354.png` | 3 | 48 x 42 | guard |
| `B-PPCT-355.png` | 3 | 48 x 42 | guard |
| `B-PPCT-356.png` | 1 | 16 x 6 | guard |
| `B-PPCT-357.png` | 1 | 16 x 6 | guard |
| `B-PPCT-405.png` | 5 | 80 x 64 | henchman's whip |
| `B-PPCT-406.png` | 5 | 80 x 64 | henchman's whip |
| `B-PPCT-407.png` | 1 | 64 x 48 | henchman's whip |
| `B-PPCT-408.png` | 6 | 64 x 48 | henchman's whip |
| `B-PPCT-414.png` | 3 | 16 x 28 | drip |
| `B-PPCT-415.png` | 1 | 32 x 15 | drip |
| `B-PPCT-416.png` | 5 | 32 x 24 | drip |
| `B-PPCT-417.png` | 4 | 48 x 20 | drip |
| `B-PPCT-418.png` | 3 | 48 x 23 | drip |
| `B-PPCT-420.png` | 3 | 64 x 65 | fountain |
| `B-PPCT-421.png` | 8 | 32 x 40 | enchanted broom |
| `B-PPCT-422.png` | 7 | 32 x 29 | enchanted broom |
| `B-PPCT-423.png` | 7 | 16 x 22 | enchanted broom |
| `B-PPCT-424.png` | 2 | 32 x 40 | wizard |
| `B-PPCT-425.png` | 13 | 32 x 24 | floating eye |
| `B-PPCT-426.png` | 7 | 32 x 24 | floating eye |
| `B-PPCT-428.png` | 4 | 16 x 16 | boulder |
| `B-PPCT-429.png` | 5 | 64 x 20 | boulder |
| `B-PPCT-430.png` | 8 | 48 x 39 | wizard |
| `B-PPCT-431.png` | 7 | 48 x 46 | wizard |
| `B-PPCT-432.png` | 6 | 48 x 46 | wizard |
| `B-PPCT-433.png` | 3 | 32 x 22 | wizard |
| `B-PPCT-434.png` | 10 | 32 x 23 | mutant |
| `B-PPCT-436.png` | 7 | 32 x 29 | mutant |
| `B-PPCT-437.png` | 1 | 48 x 14 | wizard |

## Report

Write `art/castle-3d/WAVE_CREATURES_REPORT.md`: one row per file with dimensions, spill pixels, largest shift and pass or fail, then anything left out, then the time taken.
