VERDICT: build-ready as-is? yes-with-fixes. The architecture and release gates have converged, but an interface contract mismatch in `ScepterHints.current()`, an unhandled title omission during exhaustion in `whereNext()`, and undefined chapter-wide wording for Milestone 14 post-landing still block an unambiguous build.

MUST-FIX BEFORE BUILD:
1. [Section 2 - Wiring and return visits] **`ScepterHints.current()` return contract ambiguity**: The plan specifies local title, prose strings, and key from a room helper, but does not define how `game/hints.js` exposes them. Existing callers (`play.js:47`, `evidence.md:9`) expect `current().milestone.title` and `current().milestone.tiers`.
   Fix: Specify that `current(state, visited)` returns `{ index, count, milestone: { title, tiers }, key }`. When a local variant applies (`ASCN 9709` or `ASCN 23272`), `milestone` is replaced by the local title and 3-string prose tiers with `key = 'local/' + scene + '/' + state`; otherwise `milestone` retains the milestone definition and `key = 'chapter/' + index`.
2. [Section 2 - Wiring and return visits] **Exhaustion formatting in `whereNext()` omits title**: `game/play.js:50` hardcodes `line('No more clues for this step: ' + milestone.tiers[2].join(' · ') + '.', 'aside hint')`. While guarding `.join()` with `Array.isArray()` prevents a runtime TypeError, the line omits `milestone.title`, causing the Section 2 release gate ("Check the visible title and all four button presses, including exhaustion") to fail.
   Fix: In `play.js:whereNext()`, construct the step header before branching (`const label = 'Step ' + (index + 1) + ' of ' + count + ' · ' + milestone.title;`). On exhaustion (`hintTier >= 3`), output `line(label + ' · No more clues: ' + text + '.', 'aside hint');`.
3. [Section 2 - The broken milestone] **Milestone 14 chapter-wide tiers post-landing**: Removing `seen(SUB_DECK)` extends Milestone 14 until `seen(OFFICE)` (`ASCN 1092`). However, Milestone 14's default `tiers[0..2]` still instruct inserting the chip and diving (`game/hints.js:87-89`). Any player ashore wandering into unhandled rooms (`ASCN 1193`, `10573`, `11672`) falls back to unconditional repair instructions, violating Section 2's explicit invariant.
   Fix: Define conditional chapter-wide fallback tiers for Milestone 14 when ashore (`visited[28593]` or `visited[23272]` is true) directing travel north across the dunes and road toward the Hurk command post.

SHOULD-FIX:
1. [Section 2 - Wiring and return visits] **Missing `busy` guard in `whereNext()`**: `game/play.js:45-46` fails to check `busy`. Rapid `#hint` button presses during an active `/api/turn` or `/api/start` fetch evaluate stale `state`.
   Fix: Add `if (busy) return;` at `play.js:46`.
2. [Section 2 - Wiring and return visits] **`hintGoal` / `hintTier` state leakage on new game**: `game/play.js:368` (`begin()`) resets `checkpoint` and `lastCommand` but leaves `hintGoal` and `hintTier` intact, causing hint tier skipping in fresh sessions.
   Fix: Reset `hintGoal = -1; hintTier = 0;` inside `begin()`.
3. [Section 2 - At the computer] **Concrete semantic keys for scene 9709**: The four computer states (installed, held, loose, unknown) lack explicit key strings.
   Fix: Formally bind them to `local/9709/installed`, `local/9709/held`, `local/9709/loose`, and `local/9709/unknown` [ASSUMPTION].

OPTIONAL / NICE-TO-HAVE:
- [Section 2 - At the control panel]: Explicitly define `AOBJ 4876`, `13165`, and `20759` labels as `'left control'`, `'centre control'`, `'right control'` directly ahead of `STEMS.sub` in `labelFor()` (`game/play.js:16-19`).

CUT THESE:
1. [Section 2 - The broken milestone] **Individual local variants for all 15 road/approach scenes**: Authoring separate local room variants for every scene between Silicon Beach (`ASCN 20301`) and Hurk Office (`ASCN 1092`) is unnecessary scope. Safe to cut in favor of the conditional post-landing chapter fallback for Milestone 14.

VERIFY-AT-BUILD checklist:
1. `ASCN 9709`: Missing chip ("unknown" state) with synthetic snapshot generates guidance without throwing or asserting global coordinates.
2. `ASCN 23272`: Button labels match `'left control'`, `'centre control'`, `'right control'` on touch/pointer and keyboard `E` (`game/play.js:534,606`).
3. Viewplate state changes (cliff `VIEW.1+2`, reef `VIEW.1+2+3`, grounded `VIEW.1+4`) reset reveal cursor and advance hints under `--test` without audio cues.
4. Milestone 14 cleanly transitions to Milestone 15 at `ASCN 1092` (`seen(OFFICE)`) without reverting to repair instructions.
