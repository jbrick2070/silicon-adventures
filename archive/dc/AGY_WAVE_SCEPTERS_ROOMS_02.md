# Enchanted Scepters remaster: rooms, batch 2

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
| `ASCN-22001.png` | murals | sea | The walls of this tunnel are covered with faded murals that depict an ancient underwater civilization. |
| `ASCN-5101.png` | shrine | temple | There is an exit south. |
| `ASCN-5896.png` | sepulchre | temple | A shrine sits in the center of the room. |
| `ASCN-10573.png` | gambling | village | A large table is in the center of the room. |
| `ASCN-2293.png` | snake trail | volcanic | The top of the volcano is north. |
| `ASCN-8807.png` | banquet hall | castle | A large banquet hall lies before you. |
| `ASCN-12197.png` | rampart | castle | Two huge rampart doors lead south into the desert battlefield. |
| `ASCN-20357.png` | armory | castle | Empty racks stand against the south wall. |
| `ASCN-22844.png` | marble hall | castle | You are walking along a polished marble hallway. |
| `ASCN-1193.png` | sea cliff | coast | Tall cliffs block the north and east. |
| `ASCN-15787.png` | dock | coast | A rickety dock extends over the sea. |
| `ASCN-9232.png` | cell | crypt | There is a hallway west. |
| `ASCN-12795.png` | well tunnel | crypt | North is a heavy oaken door, the path winds to the east. |
| `ASCN-11734.png` | butte | desert | A tall butte breaks the rolling sands. |
| `ASCN-21798.png` | crossroads | desert | You are at a crossroad. |
| `ASCN-23160.png` | bunker | desert | The entrance to the Hurk command post lies beneath the western cliff. |
| `ASCN-27492.png` | main road | desert | The main road runs north to the rampart doors and south into enemy territory. |
| `ASCN-28820.png` | sphinx | desert | You stand between the paws of a massive sphinx. |
| `ASCN-5049.png` | ledge | highland | A precarious trail leads down to the north and up to the south. |
| `ASCN-9709.png` | computer | machinery | A large central computer stands against the north wall. |
| `ASCN-28995.png` | lab | machinery | This room has recently been changed into an alchemist's lab. |
| `ASCN-18458.png` | Queen's Chamber | palace | There is a door to the north and to the south. |

## Before you finish

Look at every room at native size and at 4x, beside its original. A check by numbers alone does not count.

## Report

Write `art/es-3d/WAVE_ROOMS_02_REPORT.md`: one row per file with dimensions, largest shift and pass or fail, then anything left out, then the time taken.
