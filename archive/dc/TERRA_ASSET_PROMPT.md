# Dark Castle asset extraction brief

You are extracting the last unextracted assets from two 1986 Macintosh disks in this repository. The sprites, screens, pictures, icons and recordings are already done, so do not redo them. Accuracy matters more than speed. Never invent a value.

## Rules

- Work in `D:\silicon-adventures`, on the branch `feature/asset-parity`.
- Create or change files only inside `archive/dc/rooms/assets/`. Do not touch anything else.
- Install any Python packages to a private folder under your system temp directory, never inside this repository. Delete that folder when you finish.
- Do not commit, push, or switch branches. Do not run the game, and play no audio.
- Never modify `sources/`, `archive/dc/*.rsrc`, `archive/es/Scepters.rsrc`, `art/`, or `archive/es/plates/`.
- Images must be strictly two colours with a real transparent background: only black, white and fully transparent pixels.
- Mark every claim `PROVEN` (read from the data) or `INFERRED`. If something cannot be determined, write `null` and say why.

## Inputs

- `archive/dc/Data A.rsrc`: Dark Castle resource fork.
- `archive/es/Scepters.rsrc`: Enchanted Scepters resource fork.
- `sources/dark-castle/DarkCastle_1_2.dsk`: the disk image, readable with `machfs`.
- `archive/dc/paper.py`: read it to learn how the `Strike` class decodes `FONT` resources. Do not change it.
- `archive/dc/rooms/demo.md`, `hero-states.json`, `physics.json`: earlier findings, partly unresolved.
- `art/castle-index.js`: every `PPCT` with frame count, size and path.

## Deliverables, all in `archive/dc/rooms/assets/`

### 1. Bitmap fonts

These matter most. The game now draws its status bar and high scores in modern fonts, and these are the originals.

| Output name | Resource | Disk name |
| --- | --- | --- |
| `score-font` | Data A `FONT` 25737 | Score Font |
| `dialog-font` | Data A `FONT` 29452 | DC Dialog Font |
| `scepters-font` | Scepters `FONT` 394 | Find its family and size from the resource, or write `null` |

For each font write:

- `<name>.png`: every glyph in one horizontal strip at 1x, with no scaling or smoothing.
- `<name>.json`: `{resource, family, size, ascent, descent, leading, glyphs}`. `glyphs` maps each character code to `{x, width, offset, advance}`, where `x` and `width` locate it in the strip.

Also write `specimen.png`, showing each font setting `0123456789`, and `SCORE BONUS ROCKS LIVES ELIXIR` where those letters exist, using only your metrics. A font may hold digits only. List exactly which characters each font contains.

### 2. The recorded demo

Using `demo.md`, decode the `DEMO` resource named `Default` in Castle Preferences into `demo.json`: an ordered list of `{delay, command, value}`. Name each command only where the code proves it. Account for every byte up to the stream bound.

### 3. Duncan's animation map

`hero-states.json` leaves the reels of 47 of the 53 hero states unresolved. Trace the pointer table at `-$17e(a5)` and the reel slots read from it, such as `$cc(a4)`, `$30(a4)` and `$f4(a4)`.

Write `hero-reels.json`: for each state, the `PPCT` ids it draws, the order of frames, and the facing rule. Include `evidence` as segment and offset for every entry.

### 4. Creature animation order

For each routine in `CODE 4`, record which `PPCT` frames it draws in which order for walking, attacking and dying. The routines are `$26a`, `$272`, `$282`, `$28a`, `$29a`, `$2a2`, `$2aa`, `$2b2`, `$2da`, `$2ea`, `$31a`, `$32a` and `$332`. Write `creature-reels.json`.

## Done means

- All JSON parses.
- `specimen.png` is readable and proves the metrics work.
- Every image passes a check that it holds only black, white and transparent pixels.
- `README.md` in the same folder lists what was finished and what stayed `null`.
- No temporary folders remain inside this repository.
