# Enchanted Scepters remaster: rooms, batch 7

You are repainting 22 rooms of a 1986 Macintosh adventure into a rich, truly lit 3D look. Players stand inside these first-person drawings and can walk and turn, so each painting is stretched across the room as they move. Study `art/castle-3d/B-PSCR-4020.png`, `B-PSCR-2030.png` and `B-PSCR-2010.png` first. Match those materials and solid forms, with a muted dark yellow key light, a cool fill and no orange.

## Rules

- Work in `D:\silicon-adventures`, on the branch `feature/asset-parity`.
- Create files only in `art/es-3d/` and `art/es-3d/4x/`, using the original filenames from `archive/es/plates/`. Create only the files listed below. Other agents are painting other files at the same time.
- Do not touch `game/`, `archive/`, `art/castle/`, `art/castle-3d/`, or anything else. Do not commit, push, or switch branches. Play no audio. Leave ComfyUI and its GPU alone.
- Deliver a native file at 338 x 314 and a 4x master at 1352 x 1256. Each native file must be the box average of its 4x master. Both must be fully opaque.

## What must hold

- Keep the camera, horizon and vanishing point of the original. Every wall corner, floor edge, doorway, exit, object and landmark must stay within 1 native pixel of the original.
- Every clickable thing in the drawing must stay where it is and stay recognisable.
- Add nothing the drawing does not show. Add no new objects, people, signs or text. Keep any lettering in the drawing exactly as it is.
- Do not bake a dark vignette or strong shadows into the walls: the game adds moving light on top.
- Never fill a gap with one flat colour.

## Method

Build a clean guide from each original, generate the 3D render, register it to the original so every edge lands in place, then export. Files you cannot make good are better left out than delivered bad.

## Files

Use the room's disk text and place to choose its colour and light. Neighbouring rooms in the same place should feel related, but no two may look the same. Use a muted dark yellow key light and a cool fill, with no orange glow unless the room is lit by fire. Paint no leftover dither patterns.

| File | Room | Place | Disk text |
| --- | --- | --- | --- |
| `ASCN-10850.png` | cave entrance | highland | The forest surrounds you. |
| `ASCN-11124.png` | upward path | highland | The path climbs to the east and falls to the south. |
| `ASCN-14435.png` | grave | highland | A lonely grave marks the roadside. |
| `ASCN-14969.png` | large cave | highland | There is a large cave in the east side of the canyon wall. |
| `ASCN-19597.png` | valley vista | highland | The path rises to the west and falls east. |
| `ASCN-24035.png` | nest | highland | A large nest overlooks the misty valley. |
| `ASCN-32624.png` | mountain spring | highland | A mountain spring bubbles from the rocky ground and runs south. |
| `ASCN-3617.png` | piranhas | jungle | The stream flows south. |
| `ASCN-4658.png` | dark woods | jungle | The forest here is overcast and damp. |
| `ASCN-5112.png` | rapids | jungle | White water churns to either side, the stream roars southward. |
| `ASCN-5878.png` | mellow pond | jungle | Tall cliffs rise to the north, there is a rocky wall south. |
| `ASCN-9387.png` | jungle clearing | jungle | The jungle surrounds a small clearing. |
| `ASCN-9603.png` | port | jungle | Redwoods thrust to the sky. |
| `ASCN-10456.png` | quiet water | jungle | The stream continues north-south. |
| `ASCN-12217.png` | riverside | jungle | A peaceful stream runs by to the east. |
| `ASCN-12955.png` | whirlpool | jungle | The water slows considerably. |
| `ASCN-14279.png` | beaten path | jungle | You are on a well worn path that runs from east to west. |
| `ASCN-14979.png` | shallows | jungle | The water runs from north to south between narrow river banks. |
| `ASCN-17473.png` | pot | jungle | There is a large pot and some wood here. |
| `ASCN-20168.png` | magic hut | jungle | You are inside a grass hut. |
| `ASCN-20177.png` | vines | jungle | Larger trees fill the center of the jungle. |
| `ASCN-20359.png` | forest clearing | jungle | You arrive at a peaceful forest clearing. |

## Before you finish

Look at every room at native size and at 4x, beside its original. A check by numbers alone does not count.

## Report

Write `art/es-3d/WAVE_ROOMS_07_REPORT.md`: one row per file with dimensions, largest shift and pass or fail, then anything left out, then the time taken.
