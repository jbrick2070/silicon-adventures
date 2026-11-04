VERDICT: build-ready as-is? no. Multiple interface contract mismatches in `game/play.js`, a state ambiguity on Silicon Beach, and an unhandled crash in `whereNext()` break runtime and validation.

MUST-FIX BEFORE BUILD:
1. [Section 2 - Wiring] **`whereNext()` string `.join()` crash**: `game/play.js:50` unconditionally executes `milestone.tiers[2].join(' · ')`. For local variants returning 3 display strings, exhaustion throws `TypeError: milestone.tiers[2].join is not a function`.
   Fix: Guard `.join()` with `Array.isArray()` in `whereNext()` for both exhaustion and tier formatting before appending to journal.
2. [Section 2 - The broken milestone] **Silicon Beach state ambiguity**: `ASCN 20301` (`silicon beach`) was already charted in Milestone 10. `game/hints.js` cannot distinguish whether a player holding Water (`AOBJ 19566`) is ashore post-voyage or wandering pre-voyage, because `Y1#` is unexposed in `state` and global object locations are forbidden.
   Fix: Condition "ashore" on visiting post-landing scenes (`ASCN 1193` `sea cliff` or `ASCN 11672` `mesa`), or write dual-clause guidance ("If ashore... if preparing to sail...") without code branching [ASSUMPTION].
3. [Section 2 - At the control panel] **Target label mismatch**: Section 2 claims target labels use left (4876), centre (13165), right (20759). In `game/play.js:15-19`, `STEMS.sub` maps all `sub.*` objects to `'control'`, causing all switches to display `'Click control'`.
   Fix: Update `STEMS` or `labelFor()` in `game/play.js` to return `'left control'`, `'centre control'`, and `'right control'` so UI matches clue text.
4. [Section 2 - Release gates] **`check_hints.py` parser failure**: `archive/es/check_hints.py` parses `tiers` via regex `\[((?:'[^']*'(?:,\s*)?)+)\]\]` and asserts all tokens match `turn` lines in `campaign-trace.tsv`. Sub controls are `click` lines (`click AOBJ/13165`).
   Fix: Keep local variant tiers strictly as plain string tuples outside bracketed regex, and do not put sub clicks into Milestone 15 exact-input arrays.

SHOULD-FIX:
1. [Section 3 - Priority 3] **Checkpoint journal desynchronization**: `game/play.js:314` writes doorway checkpoints to `adventure.sav` without updating `localStorage['scepters-saved-journal']` (only updated on manual save at `play.js:397`). Restoring a checkpoint plays back stale manual journal history.
   Fix: Persist journal state during auto-saves or clear/resync journal on checkpoint restoration.
2. [Section 3 - Priority 2] **Incomplete travel prompt suppression**: `game/play.js:255` travel buttons bypass `detectPending()` and fire turns directly. Limiting suppression to `yesno` leaves free-form character questions (Earth Demon at `ASCN 13357`, gate sentries) vulnerable to accidental refusal turns.
   Fix: Intercept travel button dispatch in `command()` for any active prompt (`pending !== null`).

OPTIONAL / NICE-TO-HAVE:
- [Section 2 - At the computer]: Explicitly prevent `use('AOBJ/2718')` from triggering a click when chip is installed, avoiding accidental removal.

CUT THESE (over-engineering):
1. [Section 2 - At the control panel] **Verifying switch presence**: `AOBJ 4876`, `13165`, and `20759` are static definitions in `ASCN 23272` and never moved by `ACOD 23272`. Checking their presence on every hint tick is redundant.
