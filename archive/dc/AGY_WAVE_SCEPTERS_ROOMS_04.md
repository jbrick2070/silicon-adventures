# Enchanted Scepters remaster: rooms, batch 4

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
| `ASCN-20431.png` | deck | wreck | The ship extends to the north and south. |
| `ASCN-30379.png` | cannon | wreck | A rusty cannon encrusted with coral points to the west. |
| `ASCN-7395.png` | bridge room | castle | There is a courtyard to the west and a moat to the east. |
| `ASCN-6785.png` | seaside | coast | You are walking along an east-west beach. |
| `ASCN-13946.png` | dunes | coast | A shack is visible to the west, a salty breeze blows from the quiet sea to the south. |
| `ASCN-18468.png` | submarine | coast | An old submarine covered with barnacles and moss floats to the west. |
| `ASCN-1186.png` | cavern pool | crypt | A shaft of light from above breaks the darkness. |
| `ASCN-4874.png` | landing | crypt | Dark stone steps lead up to the north. |
| `ASCN-12321.png` | pedestal | crypt | There is a boiling pool north and a door east. |
| `ASCN-27318.png` | stair entrance | crypt | Dark stairs descend into blackness. |
| `ASCN-6591.png` | ravine | desert | An empty ravine provides no respite from the boiling sun. |
| `ASCN-12523.png` | mud | desert | The ground is laced with cracks from long dried mud. |
| `ASCN-26550.png` | cactus | desert | A lone cactus stands watch. |
| `ASCN-27689.png` | trail | desert | A lonely trail runs north-south. |
| `ASCN-29592.png` | sphinx vista | desert | A huge and ancient sphinx appears to be cut from the side of the cliff. |
| `ASCN-3521.png` | cliff road | highland | The trail climbs to the south and falls to the north and east. |
| `ASCN-9440.png` | narrow pass | highland | A narrow pass runs north-south. |
| `ASCN-23813.png` | chasm view | highland | The path continues east to a deep canyon. |
| `ASCN-19497.png` | tree path | jungle | You are walking along a north-south path. |
| `ASCN-27293.png` | corner | jungle | You are surrounded by a misty jungle. |
| `ASCN-1776.png` | meager room | machinery | The Queen's Chamber is north, there is a room west. |
| `ASCN-10919.png` | post | ruins | The camp lies west and a road climbs north. |

## Before you finish

Look at every room at native size and at 4x, beside its original. A check by numbers alone does not count.

## Report

Write `art/es-3d/WAVE_ROOMS_04_REPORT.md`: one row per file with dimensions, largest shift and pass or fail, then anything left out, then the time taken.
