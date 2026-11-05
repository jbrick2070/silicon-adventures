# Enchanted Scepters remaster: rooms, batch 3

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
| `ASCN-28106.png` | fountain | palace | An ancient fountain still dribbles water in the center of the room. |
| `ASCN-25308.png` | art | ruins | This room once held many paintings. |
| `ASCN-26096.png` | cannon | ruins | A large cannon points at the rampart wall to the north. |
| `ASCN-290.png` | sea room | sea | The tunnel continues east and west. |
| `ASCN-2352.png` | bend | sea | A narrow rock channel bends down to the south and leads up to the west. |
| `ASCN-6048.png` | crawl tunnel | sea | A low tunnel runs east-west. |
| `ASCN-9841.png` | hook | sea | The rock path runs up to the north and down to the west. |
| `ASCN-23679.png` | south sea | sea | Sharp coral formations line the south wall of the ocean. |
| `ASCN-25538.png` | lair | sea | The tunnel ends in a large round room. |
| `ASCN-27201.png` | trench | sea | A deep trench cuts down into the cliff wall to the east. |
| `ASCN-3122.png` | dogleg | temple | There is a door to the east. |
| `ASCN-7039.png` | spikes | temple | There is a door on the west wall. |
| `ASCN-9691.png` | jumping door | temple | There is an entrance on every wall. |
| `ASCN-20189.png` | squasher | temple | There is a door on the west wall. |
| `ASCN-30856.png` | phoenix | temple | The hallway runs north-south. |
| `ASCN-13371.png` | drinks | village | There are pool tables west and a smaller room south. |
| `ASCN-2933.png` | lava path | volcanic | The path runs up to the north and down to the south. |
| `ASCN-4684.png` | boiling pool | volcanic | You stand on the north side of a boiling pool. |
| `ASCN-17983.png` | lava tunnel | volcanic | A lava path is up to the north. |
| `ASCN-6364.png` | hold | wreck | The hull runs north-south. |
| `ASCN-15266.png` | galleon | wreck | A shipwreck shimmers in the murky water to the west. |
| `ASCN-17595.png` | wheel | wreck | The wheel of this galleon has been untouched since an ancient mariner lost the ship on a coral reef below. |

## Before you finish

Look at every room at native size and at 4x, beside its original. A check by numbers alone does not count.

## Report

Write `art/es-3d/WAVE_ROOMS_03_REPORT.md`: one row per file with dimensions, largest shift and pass or fail, then anything left out, then the time taken.
