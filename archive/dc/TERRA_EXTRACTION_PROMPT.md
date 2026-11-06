# Dark Castle extraction brief

You are reverse engineering Dark Castle 1.2 for the Macintosh (1986) from the disk data in this repository. A playable reconstruction, The Enchanted Castle, already runs from data decoded out of these files. Your job is to supply the facts it still lacks. Accuracy matters more than speed. Never invent a number.

## Rules

- Work in `D:\silicon-adventures`, on the branch `feature/asset-parity`.
- Create or change files only inside `archive/dc/rooms/`. Do not touch anything else.
- Do not commit, push, or switch branches.
- Do not run the game, and play no audio.
- Never modify `sources/`, `archive/dc/*.rsrc`, `art/`, or `archive/es/`.
- Mark every claim `PROVEN` (you read it in code or data) or `INFERRED` (behaviour you deduced). Give the segment and offset as evidence.
- If something cannot be determined, write `null` and explain it in the notes.

## Already done, do not redo

`archive/dc/tools/build_castle.py` decodes these into `archive/dc/castle-data.js`, and they are verified against the room art:

- Floors and spans for all 14 rooms, with no misaligned records.
- Both entry points of each room.
- Moving platforms: `x0, x1, 14, left, right, y, speed, next offset, frame`.
- Great Hall paths (`GPTH`), per-room sound tables (`SFTR`), score tables (`Stbl`), shipped high scores (`HISC`) and key setup (`KDEF`).

These span kinds are settled:

| Kind | Meaning |
| --- | --- |
| 1 | Floor. Some carry a `y` in `a`, purpose unknown. |
| 2, 3 | Ladder top and foot, linked to each other by record offset in `b` and `a`. |
| 5 | Exit: `a` is the target room index (-1 is the Great Hall), `b` the entry variant. |
| 6, 27 | Wall stops. |
| 9, 10 | Stair top and foot, linked in `b` and `a`. `c` is the frame count, `e` the direction. |
| 14 | Moving platform. |
| 16 | Small step between two near floors. |
| 29 | Killing floor. |
| 35 | Chain or ring to pull: `a` index, `b` and `c` its position. |
| 519, 520, 543, 545, 546 | Rope zones with their own top and bottom limits and neighbour ropes. |
| 525 | Swinging rope catch zone. |

Routine names, by jump-table slot in `CODE 4`, inferred from the sprites each routine uses, so confirm them: `$26a` guard and whip man, `$272` door that releases guards, `$282` bat, `$28a` and `$292` rats, `$29a` rock henchman with the weight, `$2a2` dragon, `$2aa` shield chamber, `$2b2` mutant, `$2d2` levers, `$2da` Black Knight, `$2ea` gargoyle, `$2f2` moving platforms, `$2fa` drips, `$302` bridge, `$30a` gate, `$312` boulder, `$31a` wizard, `$32a` fountain and vulture, `$332` burning eye, `$342` swinging ropes, `$34a` item, `$38a` storm.

## Inputs

- `archive/dc/Data A.rsrc`: resource fork with `CODE` 0 to 7.
- `art/castle-index.js`: every `PPCT` and `PSCR` with frame count, size and PNG path.
- `archive/dc/tools/disassemble.py`: writes all code segments and the jump table to `archive/dc/rooms/work/`. Run it first. Install `capstone` and `macresources` to a private `--target` folder and use `PYTHONPATH`.
- `jsr $xxx(a5)` is a jump-table call. `work/jump-table.json` maps `xxx` (decimal) to `[segment, offset]`. Offsets in the `.asm` files exclude the 4-byte segment header.
- `CODE 5` starts with a dispatch table at `$3c` of the 14 room setup routines. `-$18e(a5)` looks like the difficulty level. `-$18c(a5)` looks like the entry side.
- The hero object is created by `CODE 2` at `$3234`. Its update routine at `$2a80` dispatches on a state number through a 53-entry table at `$2a9a`.

## Deliverables, all in `archive/dc/rooms/`

1. `span-kinds.json`: the kinds not settled above: 7, 15, 17, 18, 19 to 25, 28, 30, 36 to 40, and the `a` field on kind 1. Kinds 23 and 24 appear to be the Shield and Fireball pickup spots. Prove or refute that.
2. `spawns.json`: for each room, the ordered object calls with resolved meaning:
   - `{routine, segment, offset, meaning, condition, args, ppct:[...], soun:[...], evidence, confidence}`.
   - `condition` is the exact difficulty or entry test guarding the call. Keep every branch.
   - Explain what each argument register means for each routine.
3. `physics.json`: tick rate, Duncan's walk speed, jump arcs, fall, climb rates, rock speed and arc, lives, plague and elixir rules, shield and fireball rules, and each creature's speed, hit points, score index in `Stbl`, and animation order.
4. `hero-states.json`: what each of the 53 hero states does and which `PPCT` reel it shows.
5. `events.json`: which `SOUN` id plays on which event, from `jsr $52(a5)` call sites.
6. `demo.md`: the format of the `DEMO` resource named `Default` in Castle Preferences, and whether the recorded input can be replayed. The disk image is `sources/dark-castle/DarkCastle_1_2.dsk`. Read the file with `machfs`.
7. `NOTES.md`: method, open questions, and anything surprising or hidden. List any cheat keys, date checks, hidden rooms, debug strings or developer jokes, with the segment and offset. `DEADFACEBEEFCAFE` appears in `CODE 1` at `$670`, counted after the segment header. Explain what it is, if the code shows it.

## Done means

- Every `jsr` in the room routines of `CODE 5` is accounted for in `spawns.json` or explained in `NOTES.md`.
- All files parse as valid JSON.
- The last section of `NOTES.md` lists what is `INFERRED` and what stayed `null`.
