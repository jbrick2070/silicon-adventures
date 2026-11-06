# Enchanted Scepters remaster: rooms, batch 5

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
| `ASCN-12086.png` | ante chamber | ruins | There is a large entrance west and smaller tunnels running north and south. |
| `ASCN-12320.png` | annex | ruins | Scattered debris fills the empty annex. |
| `ASCN-26748.png` | camp | ruins | The ramparts are to the west and a path climbs east. |
| `ASCN-23449.png` | seaweed | sea | Large underwater plants wave in the gentle ocean current. |
| `ASCN-31555.png` | clear water | sea | Green light plays on the sea floor. |
| `ASCN-2818.png` | basin | temple | A small basin punctuates the end of the hallway. |
| `ASCN-16874.png` | temple vista | temple | To the south lies a huge Mayan Temple. |
| `ASCN-18278.png` | temple stairs | temple | Stairs climb to a small room at the summit. |
| `ASCN-21162.png` | slide floor | temple | There is a door to the east. |
| `ASCN-25655.png` | ball | temple | There are entrances to the north and south. |
| `ASCN-27504.png` | passage | temple | Stairs lead up to the north. |
| `ASCN-63.png` | volcano vista | volcanic | A volcano smolders in the south. |
| `ASCN-19939.png` | cliff path | volcanic | To the north is an upward winding path. |
| `ASCN-29926.png` | south road | volcanic | The gravel road winds down to the south, the castle is northward. |
| `ASCN-2464.png` | spiral stairs | castle | Steps lead up to the top of the battlements. |
| `ASCN-17568.png` | map room | castle | An ornate map is painted on the west wall of this small room. |
| `ASCN-24275.png` | arena | castle | There is no exit except a door on the west wall. |
| `ASCN-15776.png` | tidewater | coast | The ocean floor slants down to the south. |
| `ASCN-1725.png` | back room | crypt | This room contains a rough straw bed. |
| `ASCN-10525.png` | cave painting | crypt | Charcoal paintings line the north wall of the cave. |
| `ASCN-16121.png` | lonely hall | crypt | The hallway runs east-west. |
| `ASCN-17730.png` | dead end | crypt | This alcove looks like the lair of a large insect. |

## Before you finish

Look at every room at native size and at 4x, beside its original. A check by numbers alone does not count.

## Report

Write `art/es-3d/WAVE_ROOMS_05_REPORT.md`: one row per file with dimensions, largest shift and pass or fail, then anything left out, then the time taken.
