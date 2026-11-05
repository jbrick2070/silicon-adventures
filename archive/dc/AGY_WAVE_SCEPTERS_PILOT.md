# Enchanted Scepters remaster: pilot rooms

You are repainting eight rooms of a 1986 Macintosh adventure into a rich, truly lit 3D look. Players stand inside these first-person drawings and can walk and turn, so each painting is stretched across the room as they move. Study `art/castle-3d/B-PSCR-4020.png`, `B-PSCR-2030.png` and `B-PSCR-2010.png` first. Match that lighting and those materials: warm key light, cool fill, solid forms.

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

| File | Room | Direction |
| --- | --- | --- |
| `ASCN-21149.png` | quarters | Saber's quarters, the first room players see. It must be striking. |
| `ASCN-7990.png` | high altar | Ochre pillars, paving, aubergine at the foot of the walls, upper slate. |
| `ASCN-24338.png` | marsh | Hidden valley: pale gold morning mist. |
| `ASCN-25936.png` | slough | Rust-brown water under a low amber sun. |
| `ASCN-2577.png` | bog | Sickly green, dangerous, with a dim glow on the mud. |
| `ASCN-25694.png` | swamp | Deep teal shadow and dark water. |
| `ASCN-4315.png` | stagnant pool | Still violet dusk, with the pool reflecting the sky. |
| `ASCN-4957.png` | slip | Cold grey-blue stone and wet mud. |

The six marsh rooms must never be mistaken for each other. Give each its own colour and light as directed, without changing what the drawing shows.

## Before you finish

Look at every room at native size and at 4x, beside its original. A check by numbers alone does not count.

## Report

Write `art/es-3d/WAVE_PILOT_REPORT.md`: one row per file with dimensions, largest shift and pass or fail, then anything left out, then the time taken.
