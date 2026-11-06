# Takeover brief: Silicon Adventures release

You are taking over as lead engineer and coordinator. Read this file, then `DESIGN_PRIORITIES.md` (start at "Release plan"), then `README.md`. Check `git log`, `git status` and the wave reports before acting, because this brief may be behind the repository.

**Deadline:** midnight at the end of Friday 6 November 2026. Aim to finish by 9 pm Pacific.

**Branch:** `feature/asset-parity`. Commit and push checked work without asking. Do not merge to `main` until the release step. Never force-push.

## The project

- **Enchanted Scepters:** the 1986 adventure, 200 rooms, Java WAGE engine with a browser front end in `game/`.
- **The Enchanted Castle:** a separate new action game from Dark Castle disk data, 14 rooms. Its rules are in `game/castle-core.js` and `game/castle-plan.js`, and its drawing is in `game/enchanted-castle.js`.

## The goal for this release

Ship the finished castle plus about 24 repainted adventure rooms, chosen for impact. The other 176 rooms keep Lit colour. If the rooms are not ready, the castle ships alone. Stop adding features at 5 pm Friday. Cut in this order: adventure moving light, Memorable places, Big moments, painted inhabitants. Keep the marsh, the opening rooms and the castle.

## Rules that never bend

- Keep all disk language and dialogue exactly, typos included.
- Every disk asset, text line and easter egg stays used.
- Make no Java or JAR changes. Do not change the disk's exits, puzzles or text.
- Do not modify originals in `art/castle/`, `archive/es/plates/` or `archive/dc/*.rsrc`.
- Keep sound muted in tests, use fresh browser profiles and throwaway save homes, and never touch the real save. Never play a cue through the user's speakers.
- New art keeps its original dimensions and shapes. Castle floors, ropes and ladders stay within 1 pixel. Masks `B-PSCR-2022`, `3012` and `3032` stay binary.
- The user dislikes orange light. Use a muted dark yellow.
- Use they/them for people unless told otherwise.

## Verify everything

Shape reports from agents have passed visibly bad art. Measure each delivery and look at every frame yourself. Past catches include a Knight frame with flat filler for a helmet, grey smears on Duncan, and a sky mask that would have let floors move. Terra's reports must be checked against the disassembly: see `archive/dc/rooms/trace/CORRECTIONS.md`.

## Current state

- **Castle:** all 14 rooms are painted and lit, with drifting sky outdoors and light on sprites. 144 reels are painted.
- **Waiting on Argon:** `archive/dc/AGY_WAVE_FITTINGS.md` and `archive/dc/AGY_WAVE_HALL.md`. Their reports land in `art/castle-3d/WAVE_*_REPORT.md`.
- **Adventure:** `game/view.js` can show painted rooms, but `PlateView.painted` is empty. Add a room id only after its art passes.
- **Waiting on Argon for the adventure:** `AGY_WAVE_SCEPTERS_PILOT.md`, `_ROOMS_A.md`, `_ROOMS_B.md`, `_ART.md` and `_INHABITANTS.md`, all in `archive/dc/`. Files and reports land in `art/es-3d/`.
- **Google Flow fallback:** `archive/dc/FLOW_ROOMS.md`. The user drops results in `art/es-3d/incoming/`. These need aligning to the plate and resizing to 338 x 314, with a 4x master. Uploads are in `art/es-3d/guides/`, which is not committed.

## Still to do

1. When a castle report lands: run the checks below, view every frame, repair or reject, add reels with `add_painted.py`, test, commit and push. Stage only the wave's own files.
2. When adventure rooms land: compare each with its plate, add the id to `PlateView.painted`, test with `paint_test.py <id> <file>`, then commit and push.
3. When turning, players see parts the disk never drew, which stay in Lit colour. Tint them to match each room's painting in the `if(C)` block of `PlateView.render`.
4. Painted inhabitants need code: `render` still draws sprites from 1-bit bits with `C.spritePixel`. Drop this if time runs short.
5. Make the marsh rooms harder to get lost in, using `game/boundary.js` and `game/hints.js`.
6. Scepters: the castle draws black-and-white plates in `case 'scepter'` of `drawEntity`. Use the new art, and make Pixal3D spins from the `hero/` images if time allows.
7. Rebuild the flowchart with `python archive/dc/tools/build_flowchart.py <folder of room shots>`, after running `tour_rooms.py`.
8. Add `art/castle-3d`, `art/remaster-3d/full`, `art/es-3d` and any other new art folders to the file list in `web/stage.py`. The web build does not include them yet. Keep guides, previews and `art/castle-models` out.
9. Release: update `archive/PARITY.md` and the README, run every test, play the winning route muted, open a pull request, merge to `main` only with the user's go-ahead, confirm the GitHub Pages deploy, and rebuild the Windows ZIP.
10. Stop ComfyUI when finished.

## Tools

All are in `archive/dc/tools/qa/` unless a path is given. Some have machine paths or a fixed output folder at the top, so read a script before running it.

| Tool | Use |
| --- | --- |
| `check_wave.py <outdir> <brief>` | Sizes, spill and shape per frame, plus contact sheets |
| `flat_fill.py [count]` | Finds flat filler. Black panels and doorways are expected |
| `add_painted.py <brief>` | Adds a wave's reels to `HD_PAINTED` |
| `check_rooms.py <outdir>` | Room sheets beside the originals. Its drift score is noisy |
| `tour_rooms.py <outdir>` | Muted tour of all 14 castle rooms |
| `play_hd.py` | Muted real-game capture |
| `frame_time.py` | Frame time in each room |
| `moge_room.py <room>` | Surface map from ComfyUI |
| `make_sky.py`, `sky_check.py` | Sky layers, and proof that floors and ropes cannot drift |
| `paint_test.py <id> [file]` | Painted room in the walking view, served only to the test browser |
| `exits.js` | The real room exit graph |

**Tests:** `node --test game/tests/castle_core.test.js`, likewise `boundary`, `hints_state`, `parity` and the other `*.test.js` files, then `node game/tests/castle_reach.js`, `parity_smoke.py`, `polish_smoke.py` and `browser_smoke.py`.

**ComfyUI:** run this from `C:\Users\jeffr\ComfyUI-Installs\ComfyUI\ComfyUI`:

`C:\Users\jeffr\Documents\ComfyUI\.venv\Scripts\python.exe main.py --port 8000 --user-directory C:\Users\jeffr\Documents\ComfyUI --disable-auto-launch`

It needs no credits. Use the HTTP API and avoid anything that opens console windows. The laptop has an RTX 5080 with 16 GB. Pixal3D template: `3d_pixal3d_trellis2_image_to_model`, with boolean node 316 False. FLUX with ControlNet held layouts but got the look wrong, and it failed on scepters.

**Agents:** the user runs agy (Gemini 4 Argon) in the Antigravity app and pastes prompts. Do not launch agents with unsafe permission flags. Argon's CPU Blender renders worked well for creatures, but Duncan must stay painted to match. Commit each wave quickly, because parallel work has overwritten uncommitted art before.

**Commit attribution:** end each commit message with your own co-author line.
