# Enchanted Scepters remaster: rooms, batch 6

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
| `ASCN-20791.png` | mirror room | crypt | The hallway is cut from smooth stone. |
| `ASCN-21025.png` | cage | crypt | You are in a long filthy rock corridor. |
| `ASCN-25054.png` | gate | crypt | A gateway of ancient construction spans the east-west tunnel. |
| `ASCN-26180.png` | keeper | crypt | There is a cage built into the east wall and a passage west. |
| `ASCN-27610.png` | troll's lair | crypt | Judging from the smell of things you are in a Troll's den. |
| `ASCN-29622.png` | Treasury | crypt | A narrow tunnel leads north. |
| `ASCN-327.png` | castle road | desert | The castle road stretches from east to west. |
| `ASCN-859.png` | water hole | desert | A small pool of water comforts a lone tree. |
| `ASCN-999.png` | flats | desert | Miles of featureless desert surround the relentless sun. |
| `ASCN-4787.png` | peak | desert | A silent peak stands in the desert sand. |
| `ASCN-4940.png` | weapons storage | desert | A shady storage rack protects armaments from the desert sun. |
| `ASCN-6029.png` | pen | desert | A large cage bakes in the desert sun. |
| `ASCN-14895.png` | outcrop | desert | A stone outcrop stands in the fearsome heat. |
| `ASCN-20641.png` | drift | desert | The relentless sun bakes the shifting sands. |
| `ASCN-23064.png` | catapult | desert | You stand in the center of a smoky and ravaged battle field. |
| `ASCN-25219.png` | oasis | desert | A small oasis shelters a pool of blue water. |
| `ASCN-27740.png` | desert vista | desert | Far below you can see thousands of Hurk soldiers moving huge war machines into place. |
| `ASCN-964.png` | alcove | highland | You come to a small alcove in the south wall of the canyon. |
| `ASCN-4896.png` | twisty trail | highland | The trail runs east up the canyon wall and down to the north. |
| `ASCN-4980.png` | gulley | highland | High rock walls line the path. |
| `ASCN-7132.png` | well | highland | A well sits by the side of the path. |
| `ASCN-9497.png` | cliff side | highland | You are walking along a steep mountain trail. |

## Before you finish

Look at every room at native size and at 4x, beside its original. A check by numbers alone does not count.

## Report

Write `art/es-3d/WAVE_ROOMS_06_REPORT.md`: one row per file with dimensions, largest shift and pass or fail, then anything left out, then the time taken.
