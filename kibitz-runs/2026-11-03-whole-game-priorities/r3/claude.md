VERDICT: yes-with-fixes. Core state-reading mechanics (`game/hints.js`, `game/play.js:45-55`) are correctly grounded, but one evidentiary claim (ACOD) has no decoded data path in this repo, and one existing code branch directly conflicts with a new constraint.

MUST-FIX BEFORE BUILD:
1. [Wiring / Release gates] "ACOD 23272 moves four viewplate pictures" and "Verify hazard decisions against ACOD" cite a data type with no decoded representation anywhere reachable by JS or the Python test (`archive/es/catalog.json:5194` ACOD id 23272 has `"name": null`, 1188 raw bytes routed to the opaque `archive/es/Scepters.rsrc` blob per `archive/es/extract.py:143`; the only interpreter is server-side Java, `engine/vendor/wage/Script.java`, not test-reachable). The release gate literally forbids the only real oracle ("not an indiscriminate replay of five clicks" — those five clicks are `archive/es/campaign-trace.tsv:241-245`) while naming an oracle that doesn't exist in buildable form. Fix: drop the ACOD framing; gate on `state.objects` membership (VIEW.1-4, sub.l/g/r ids) returned by real engine turns, which is what `hints.js`/`play.js` already read.
2. [Wiring] `play.js:50`'s existing exhaustion branch hard-codes `milestone.tiers[2].join(' · ')`. The new constraint "Avoid calling join() on local prose" is correct but the doc never names this line; without an explicit rewrite here, a local variant with prose-only tiers throws or prints `[object Object]` on the third press.
3. [Wiring] `hintGoal`/`hintTier` (`play.js:44`) key off milestone `index` only. "Compare local contexts... reset on a different state" requires a composite (index, semanticKey) cursor — not named, and the type change (int → tuple) ripples through the `index!==hintGoal` check.

SHOULD-FIX:
1. [Release gates] `archive/es/check_hints.py` is a lexical word-presence regex, not an order/semantics check — "existing exact-input validation stays valid" is true but weak; it won't catch the submarine `done()` boundary shift from removing `seen(SUB_DECK)`.
2. [Release gates] "isolated test home... click Sound off" has a real precedent (`art/review_rigs.py:158,163-164`, `#soundBtn`/`#soundLabel`) worth citing — no full milestone-walkthrough harness exists yet though.

OPTIONAL: None beyond above.

CUT THESE: None — scope is already minimal per the domain profile's constraints.
