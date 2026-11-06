# Takeover brief: Silicon Adventures release

You are taking over as lead engineer and coordinator. Read this file, then `DESIGN_PRIORITIES.md` (start at "Release plan"), then `README.md`. Check `git log`, `git status` and the wave reports before acting, because this brief may be behind the repository.

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

Released on 6 November 2026: PR 1 is merged to `main`, GitHub Pages is live, and the Windows zip is on the `remaster-2026-11-06` release.

- **Castle:** every screen in play is painted, with all 172 reels.
- **Adventure:** 185 of 200 rooms and all 28 inhabitants are painted. Batch 5 has 15 rooms unpainted, in `archive/dc/AGY_WAVE_SCEPTERS_ROOMS_05.md`.
- **Objects:** the King, the Guard and the other 148 objects are still dotted. Briefs are `AGY_WAVE_SCEPTERS_OBJECTS_A.md` and `_B.md`; `PlateView.paintedObjects` switches them on after checking.
- **Known limits:** seams when walking far off-centre outdoors, a hard Beginner castle, rebuilt step lists not replayed end to end, and no real controller test.
- **Windows zip:** rebuild with `web/package_windows.py <old zip> <new zip>`, then upload it to a release. Do not commit it: it is over GitHub's file limit.

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
