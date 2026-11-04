# Dark Castle behaviour trace brief

You are tracing the behaviour still missing from The Enchanted Castle, a reconstruction built from the Dark Castle 1.2 disk data in this repository. Earlier work extracted the rooms, fonts, recorded demo and most animations. This pass answers the questions that remain. Accuracy matters more than speed. Never invent a number.

## Rules

- Work in `D:\silicon-adventures`, on the branch `feature/asset-parity`.
- Create or change files only inside `archive/dc/rooms/trace/`. Do not touch anything else.
- Install any Python packages to a private folder under your system temp directory, never inside this repository. Delete that folder when you finish.
- Do not commit, push, or switch branches. Do not run the game, and play no audio.
- Never modify `sources/`, `archive/dc/*.rsrc`, `archive/es/`, `art/`, or the files already in `archive/dc/rooms/`.
- Mark every claim `PROVEN` (read from code or data) or `INFERRED`. Give the segment and offset as evidence.
- If something cannot be determined, write `null` and say why.

## Already settled, do not redo

- Duncan moves 8 pixels a walking update, 10 on a ladder, and falls 10 then 8 more each update. Jumps come from the tables at CODE 2 `$13a4`, `$13e4` and `$1434`.
- Span kinds 38 and 39 are the ends of a ladder that joins two rooms (CODE 2 `$8b0`-`$8e6`).
- The mouse sets the arm position in `$20(a6)`, 0 to 511, on one axis chosen by key setup field `$12`. Frames come from `$20 >> 6`. The click is bit 1 of `$14(a6)`. Holding it throws every six updates (CODE 2 `$3434`-`$3498`).
- The arm is drawn only while Duncan stands still (CODE 2 `$d28`, `$d6c`).
- Rock flight: speed from the arm position, gravity `$d555`, bounds at CODE 2 `$337e`-`$339c`.

## Inputs

- `archive/dc/rooms/work/seg1.asm` to `seg7.asm`, and `jump-table.json`. If they are missing, run `archive/dc/tools/disassemble.py` first.
- `archive/dc/rooms/`: `hero-states.json`, `span-kinds.json`, `spawns.json`, `physics.json`, `events.json`, `NOTES.md`, and `assets/`.
- `art/castle-index.js`: every `PPCT` with frame count, size and path.
- `archive/dc/castle-data.js`: decoded rooms.

## Deliverables, all in `archive/dc/rooms/trace/`

1. `timing.json`: the game's real update rate. Find what paces the main loop, whether through `TickCount`, a VBL task or a wait loop, and give updates per second, or the formula if it depends on the machine or the difficulty.
2. `state-25.json`: hero states 25 to 28 (CODE 2 `$2020`-`$20dc`). This is the only place found where a click does something other than throw. Say which span kind or event enters state 26, which room uses it, what the reels at `$94(a4)` and `$98(a4)` are, what sound 84 is for, and what setting `-$274(a5)` does.
3. `kinds.json`: the meaning of span kind 21 (state 32, CODE 2 `$7da`) and kind 37 (state 52, CODE 2 `$85a`). Also say what the two levers of kind 36 in room 4020 do, and whether they matter to toppling the Black Knight.
4. `ropes.json`: climb speed, leap speed and arc for kinds 519, 520, 543, 545 and 546, and the swing behaviour of kind 525, as update rates like those for walking.
5. `rules.json`: lives, the plague and how the elixir cures it, the Shield's timing and what it blocks, the Fireball power's rules, what ends a game, and how extra lives are awarded.
6. `creatures.json`: for each routine in `spawns.json`, its speed in pixels per update, its hit points, how it chooses direction, and the `Stbl` index it scores. Include `$32a` and `$332`, which earlier passes did not trace.
7. `conditions.json`: for every object call in `spawns.json` with a `null` condition, the exact difficulty or entry test guarding it.
8. `sounds.json`: the meaning of every `SOUN` id still unnamed in `events.json`, from its `jsr $52(a5)` call sites.

## Done means

- All JSON parses.
- `README.md` in the same folder lists what was finished, what is `INFERRED`, and what stayed `null`.
- No temporary folders remain inside this repository.
