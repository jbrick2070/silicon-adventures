# Castle remaster: Wave Duncan

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

All of these are Duncan, or effects around him (55 reels, 217 frames). Keep his cream linen tunic, slate trousers, brown boots and long brown hair from `A-PPCT-101.png`, `A-PPCT-105.png` and `A-PPCT-106.png`.

| File | Frames | Frame size | Group |
| --- | ---: | --- | --- |
| `A-PPCT-102.png` | 2 | 32 x 48 | hero |
| `A-PPCT-103.png` | 5 | 32 x 48 | hero |
| `A-PPCT-104.png` | 6 | 32 x 45 | hero |
| `A-PPCT-107.png` | 6 | 32 x 48 | hero |
| `A-PPCT-108.png` | 6 | 32 x 48 | hero |
| `A-PPCT-109.png` | 6 | 32 x 48 | hero |
| `A-PPCT-110.png` | 6 | 32 x 48 | hero |
| `A-PPCT-114.png` | 3 | 32 x 48 | hero |
| `A-PPCT-115.png` | 3 | 32 x 48 | hero |
| `A-PPCT-116.png` | 2 | 32 x 56 | hero |
| `A-PPCT-117.png` | 7 | 32 x 50 | hero |
| `A-PPCT-118.png` | 7 | 32 x 50 | hero |
| `A-PPCT-119.png` | 2 | 32 x 32 | hero |
| `A-PPCT-120.png` | 2 | 32 x 32 | hero |
| `A-PPCT-123.png` | 2 | 32 x 48 | hero |
| `A-PPCT-125.png` | 4 | 32 x 40 | hero |
| `A-PPCT-126.png` | 3 | 32 x 40 | hero |
| `A-PPCT-128.png` | 6 | 32 x 40 | hero |
| `A-PPCT-129.png` | 6 | 32 x 40 | hero |
| `A-PPCT-130.png` | 7 | 48 x 42 | hero |
| `A-PPCT-131.png` | 7 | 48 x 42 | hero |
| `A-PPCT-149.png` | 2 | 32 x 26 | hero |
| `B-PPCT-121.png` | 6 | 48 x 56 | hero |
| `B-PPCT-122.png` | 6 | 48 x 56 | hero |
| `B-PPCT-132.png` | 1 | 32 x 51 | hero |
| `B-PPCT-133.png` | 4 | 48 x 42 | hero |
| `B-PPCT-134.png` | 3 | 48 x 58 | hero |
| `B-PPCT-146.png` | 5 | 48 x 47 | pull |
| `B-PPCT-147.png` | 2 | 32 x 40 | pull |
| `B-PPCT-155.png` | 5 | 48 x 47 | pull |
| `B-PPCT-142.png` | 3 | 32 x 42 | power |
| `B-PPCT-143.png` | 2 | 48 x 59 | power |
| `B-PPCT-150.png` | 2 | 32 x 49 | power |
| `B-PPCT-151.png` | 2 | 48 x 44 | power |
| `B-PPCT-154.png` | 1 | 16 x 60 | power |
| `B-PPCT-157.png` | 2 | 32 x 47 | power |
| `B-PPCT-158.png` | 8 | 32 x 41 | power |
| `A-PPCT-124.png` | 4 | 32 x 25 | harm |
| `A-PPCT-135.png` | 8 | 32 x 26 | harm |
| `A-PPCT-136.png` | 8 | 48 x 34 | harm |
| `A-PPCT-137.png` | 2 | 64 x 9 | harm |
| `B-PPCT-139.png` | 5 | 64 x 41 | harm |
| `B-PPCT-140.png` | 4 | 48 x 46 | harm |
| `B-PPCT-141.png` | 3 | 48 x 30 | harm |
| `B-PPCT-148.png` | 1 | 48 x 45 | harm |
| `B-PPCT-152.png` | 5 | 48 x 44 | harm |
| `B-PPCT-153.png` | 5 | 48 x 44 | harm |
| `B-PPCT-156.png` | 2 | 32 x 51 | harm |
| `A-PPCT-144.png` | 2 | 48 x 43 | shield |
| `A-PPCT-145.png` | 2 | 48 x 43 | shield |
| `B-PPCT-709.png` | 1 | 16 x 27 | shield |
| `A-PPCT-113.png` | 4 | 16 x 8 | arm |
| `A-PPCT-127.png` | 6 | 32 x 9 | arm |
| `A-PPCT-138.png` | 2 | 16 x 9 | arm |
| `A-PPCT-520.png` | 1 | 32 x 17 | arm |

## Report

Write `art/castle-3d/WAVE_DUNCAN_REPORT.md`: one row per file with dimensions, spill pixels, largest shift and pass or fail, then anything left out, then the time taken.
