# Castle remaster: harder sample

Your first sample, in `art/castle-3d/`, won the art bakeoff and now runs in the game. Before the whole game is remastered, this sample tests the method on harder art. Keep the same look, lighting and materials as your throne room, Duncan and gargoyle, so the new files sit beside them as one set.

## Rules

- Work in `D:\silicon-adventures`, on the branch `feature/asset-parity`.
- Create or change files only in `art/castle-3d/` and its `4x/` folder. Use the same filenames as the originals.
- Do not touch `game/`, `art/castle/`, `art/remaster-3d/`, `art/castle-relief/`, or anything else. Do not commit, push, or switch branches. Play no audio.
- Deliver a native file and a 4x master for every asset. Each native file must be the box average of its 4x master.
- Dimensions and frame layout must be exact. Nothing may spill outside the original sprite mask.

## Assets

All sources are in `art/castle/`.

| File | Frames | Frame size | Why it is here |
| --- | ---: | --- | --- |
| `B-PSCR-1000.png` | 1 | 512 x 342 | The first room, with stairs and ropes |
| `B-PSCR-2020.png` | 1 | 512 x 342 | The river room, with a dark cave and a foreground mask |
| `A-PPCT-106.png` | 4 | 32 x 40 | Duncan standing |
| `A-PPCT-112.png` | 11 | 32 x 32 | Duncan's arm, drawn over the standing body |
| `A-PPCT-105.png` | 6 | 32 x 45 | Duncan's running jump |
| `B-PPCT-908.png` | 3 | 48 x 51 | The Black Knight |
| `B-PPCT-902.png` | 3 | 48 x 77 | The throne |
| `B-PPCT-903.png` | 3 | 144 x 20 | The throne's base |
| `B-PPCT-350.png` | 2 | 32 x 42 | A guard |
| `B-PPCT-435.png` | 8 | 32 x 23 | A mutant |
| `B-PPCT-300.png` | 6 | 32 x 16 | A bat, which is very small |
| `B-PPCT-310.png` | 4 | 32 x 12 | A rat, which is very small |
| `B-PPCT-710.png` | 3 | 64 x 40 | The dragon |

## What must work

1. **Sprites stay readable.** Your first sprites dropped the 1-pixel white rim. Bring it back as a thin, soft light edge inside the original rim pixels, so a sprite stays clear on dark brick. Show this on a dark test background.
2. **Frames stay consistent.** The same character must keep the same colours and materials in every frame and every reel. Duncan must match your existing walk.
3. **The arm joins the body.** In the game, `A-PPCT-112.png` draws over `A-PPCT-106.png`. Frame 3 of the standing reel faces right, and the arm sits at x + 4, y - 6 from the body. The shoulder must look continuous.
4. **Small sprites still read.** The bat and rat must be recognisable at native size.
5. **Rooms stay true.** Every floor, ladder, stair, rope and wall must stay within 1 pixel of the original. Check them against room data in `archive/dc/castle-data.js`.
6. **The river mask still fits.** `B-PSCR-2022.png` marks what stands in front of Duncan in room 2020. Do not change it. Every edge it marks must still line up with your new room.

## Report

1. A table with one row per file: dimensions, spill pixels, the largest shift from the original, and a pass or fail.
2. Where the method struggled, and what you repaired by hand.
3. How long this sample took, so the whole game can be estimated: 172 reels with 684 frames, and 20 screens.
4. Any place the result moved away from the original.
