# Enchanted Scepters remaster: rooms, batch 8

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
| `ASCN-22874.png` | ferns | jungle | The path runs east-west along the canyon wall, tall trees lie north. |
| `ASCN-25584.png` | idols | jungle | Silent idols stand to either side of the east-west trail. |
| `ASCN-26193.png` | rocky water | jungle | The stream picks up speed to the south, quieter water lies north. |
| `ASCN-28370.png` | jungle path | jungle | The path runs east-west. |
| `ASCN-30474.png` | hut | jungle | To the east is a large grass hut. |
| `ASCN-30680.png` | fast water | jungle | The water pulls quickly to the south. |
| `ASCN-15901.png` | view | machinery | Large clear panels span the west wall of the room. |
| `ASCN-14237.png` | past battle | ruins | The remains of the first assault on the castle lie scattered nearby. |
| `ASCN-15246.png` | barracks | ruins | Row after row of bunk beds line the walls. |
| `ASCN-17455.png` | pikes | ruins | Large pikes protect a weak point in the Hurks' line. |
| `ASCN-25730.png` | sandstone | ruins | The hallway angles to the north and south. |
| `ASCN-29561.png` | turn | ruins | There is a hallway north. |
| `ASCN-31748.png` | strategy | ruins | Large charts on the wall detail the Hurks' advances. |
| `ASCN-8642.png` | deep | sea | The light barely filters down from above. |
| `ASCN-24601.png` | coral reef | sea | A multi-colored coral reef forms a patchwork on the sea floor. |
| `ASCN-26847.png` | sand bar | sea | A sand bar wells up from the sea floor. |
| `ASCN-31593.png` | osiris | temple | A stone statue of the goddess Osiris stands at the north end of the hall. |
| `ASCN-21831.png` | pool table | village | A dusty pool table sits in the corner of the room. |
| `ASCN-12242.png` | fire room | volcanic | A fire smokes in the center of the room. |
| `ASCN-640.png` | cabin | wreck | You are in a once magnificent cabin that probably belonged to a captain. |
| `ASCN-7083.png` | aft | wreck | The southern part of the galleon is almost buried in deep sand. |
| `ASCN-12464.png` | bow | wreck | The bow of the ship is covered with moss and slime. |

## Before you finish

Look at every room at native size and at 4x, beside its original. A check by numbers alone does not count.

## Report

Write `art/es-3d/WAVE_ROOMS_08_REPORT.md`: one row per file with dimensions, largest shift and pass or fail, then anything left out, then the time taken.
