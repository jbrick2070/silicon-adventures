# Castle remaster: Wave Fittings and repairs

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

These are the ropes, vultures, henchman, storm, flail and small props. Match `B-PSCR-3020.png` for rope and `B-PPCT-710.png` for the dragon. (20 reels, 86 frames)

| File | Frames | Frame size | What it is |
| --- | ---: | --- | --- |
| `A-PPCT-5000.png` | 2 | 32 x 18 | icons |
| `A-PPCT-5010.png` | 8 | 16 x 17 | icons |
| `B-PPCT-121.png` | 6 | 48 x 56 | hero |
| `B-PPCT-122.png` | 6 | 48 x 56 | hero |
| `B-PPCT-510.png` | 6 | 96 x 96 | swinging rope, on its original black panel |
| `B-PPCT-511.png` | 6 | 96 x 96 | swinging rope, on its original black panel |
| `B-PPCT-521.png` | 1 | 32 x 27 | weight |
| `B-PPCT-522.png` | 3 | 16 x 13 | prisoner |
| `B-PPCT-701.png` | 20 | 32 x 18 | vulture |
| `B-PPCT-702.png` | 4 | 32 x 16 | vulture |
| `B-PPCT-703.png` | 4 | 48 x 61 | henchman |
| `B-PPCT-704.png` | 3 | 48 x 45 | henchman |
| `B-PPCT-705.png` | 1 | 48 x 78 | storm |
| `B-PPCT-706.png` | 1 | 32 x 42 | storm |
| `B-PPCT-707.png` | 3 | 80 x 17 | storm |
| `B-PPCT-708.png` | 1 | 80 x 20 | storm |
| `B-PPCT-711.png` | 2 | 112 x 51 | dragon's extras, including the flail on the wall |
| `B-PPCT-714.png` | 2 | 80 x 40 | dragon's extras, including the flail on the wall |
| `A-PPCT-105.png` | 6 | 32 x 45 | hero |
| `B-PPCT-914.png` | 1 | 64 x 76 | knight |

## Repairs

Three repairs are included. You may replace these existing files.

- `B-PPCT-121.png` and `B-PPCT-122.png`: Duncan swinging on the rope, in the same clothes as `A-PPCT-104.png`. Duncan's skin, hair, shirt, breeches and boots must match his other reels.
- `A-PPCT-105.png`: Frames 3 and 4 have grey smears. Repaint this reel to match `A-PPCT-104.png`, following its own original poses.
- `B-PPCT-914.png`: Replace the flat slate patches around the shield with real shield and arm material. Change nothing else in the Knight.

## Report

Write `art/castle-3d/WAVE_FITTINGS_REPORT.md`: one row per file with dimensions, spill pixels, largest shift and pass or fail, then anything left out, then the time taken.
