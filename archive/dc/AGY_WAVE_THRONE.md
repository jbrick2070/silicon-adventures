# Castle remaster: Wave Throne room

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

These are the Black Knight, his throne room, gargoyles and castle fittings (30 reels, 99 frames). Match the Knight's armour to `B-PPCT-908.png` and the gargoyle to `B-PPCT-906.png`.

| File | Frames | Frame size | Group |
| --- | ---: | --- | --- |
| `B-PPCT-904.png` | 8 | 16 x 15 | knight |
| `B-PPCT-905.png` | 2 | 32 x 16 | knight |
| `B-PPCT-910.png` | 2 | 64 x 50 | knight |
| `B-PPCT-911.png` | 3 | 48 x 51 | knight |
| `B-PPCT-912.png` | 3 | 48 x 51 | knight |
| `B-PPCT-913.png` | 4 | 64 x 61 | knight |
| `B-PPCT-914.png` | 1 | 64 x 76 | knight |
| `B-PPCT-915.png` | 5 | 48 x 50 | knight |
| `B-PPCT-916.png` | 2 | 64 x 59 | knight |
| `B-PPCT-917.png` | 8 | 16 x 14 | knight |
| `B-PPCT-920.png` | 1 | 16 x 36 | knight |
| `B-PPCT-921.png` | 4 | 16 x 9 | knight |
| `B-PPCT-712.png` | 5 | 32 x 34 | lever |
| `B-PPCT-918.png` | 5 | 32 x 34 | lever |
| `B-PPCT-919.png` | 6 | 16 x 26 | lever |
| `B-PPCT-907.png` | 3 | 48 x 32 | gargoyle |
| `B-PPCT-922.png` | 7 | 48 x 44 | gargoyle |
| `B-PPCT-715.png` | 4 | 48 x 31 | hatch |
| `B-PPCT-716.png` | 2 | 32 x 14 | hatch |
| `B-PPCT-717.png` | 2 | 64 x 13 | hatch |
| `B-PPCT-200.png` | 3 | 64 x 83 | gate |
| `B-PPCT-400.png` | 2 | 32 x 48 | gate |
| `B-PPCT-401.png` | 2 | 32 x 48 | gate |
| `B-PPCT-438.png` | 2 | 16 x 71 | gate |
| `B-PPCT-410.png` | 2 | 48 x 9 | ledges |
| `B-PPCT-411.png` | 1 | 64 x 24 | ledges |
| `B-PPCT-413.png` | 6 | 48 x 56 | ledges |
| `B-PPCT-700.png` | 1 | 32 x 6 | ledges |
| `B-PPCT-900.png` | 1 | 64 x 7 | ledges |
| `B-PPCT-901.png` | 2 | 64 x 9 | ledges |

## Report

Write `art/castle-3d/WAVE_THRONE_REPORT.md`: one row per file with dimensions, spill pixels, largest shift and pass or fail, then anything left out, then the time taken.
