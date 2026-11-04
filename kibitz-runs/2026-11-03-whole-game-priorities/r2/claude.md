VERDICT: yes-with-fixes. §2's own implementation sketch omits the data it needs to satisfy its own requirements — fixable, but not codeable as written.

MUST-FIX BEFORE BUILD:
1. [§2, "Return a stable contextual key"] Undefined shape, and nothing to attach it to. `whereNext()`'s reveal-tier state (`hintGoal`/`hintTier`, game/play.js:44) resets only on milestone `index` change. "Reset the reveal rung when context changes" needs a second tier counter keyed on the room helper's own key (e.g. `roomHintKey`/`roomHintTier`), parallel to the existing pair — not specified. Fix: define the key's concrete shape (e.g. `'computer:installed'|'computer:loose-floor'|'computer:loose-pack'|'computer:missing'`) and add the parallel state variable.
2. [§2 vs. render path, game/play.js:53] `whereNext()` always prints `milestone.title` and `'Step '+(index+1)+' of '+count'` from `ScepterHints.current()` — and `current()`'s submarine milestone still completes on `seen(SUB_DECK)` alone (game/hints.js:85-89), the exact bug §1 reports. If the room override only swaps the tier text under that header, the UI shows "Step 16 of 19 · The Hurk office" above correct submarine-piloting prose — reproducing the §1 contradiction one line up. Fix: either suppress the header for room-local hints or have the helper supply its own label.
3. [§2 control bullet, "Never print an unconditional five-click recipe on a returned or partially piloted boat"] Not satisfiable from the declared inputs. The control room's piloting progress is an internal WAGE script variable; evidence.md states the snapshot "cannot... read the ship's internal stage directly," and `transcript` resets every call (engine/src/Adventure.java:101,114), so `state.output` only ever holds the latest single action's result, not this visit's click history. §2 restricts the helper to "scene, objects and inventory," none of which distinguishes "untouched" from "partially piloted." Fix: name the actual signal (parse `state.output` per-visit for the bay/open-sea/cliff/reef/sandbar strings) or scope control hints to tier 1 only whenever that distinction is unavailable.

SHOULD-FIX:
4. [§2 computer bullet] "Installed part 2718 takes priority" needs the literal check order spelled out (scene 9709 objects for 2718, then inventory/floor for 13010) so the branching isn't reinvented per implementer.
5. [§3.2, "Guard/King yes/no Travel leak"] Name the fix shape. Today the guard intercepts `go/`/`AOBJ/`/`ACHR/` clicks post-click with a message (game/play.js:435-436) rather than disabling the buttons — state whether the fix disables them or keeps intercept-and-message.

OPTIONAL / NICE-TO-HAVE: §3.3-3.5 sequencing and gating (blind trial before funding overlays) is sound as a backlog; nothing code-level to add.

CUT THESE: None. §2 already disclaims new persisted state and the §4 Java-home note mirrors an existing repro step (art/refresh/review/README.md:38), not new instrumentation.

[ASSUMPTION] The room helper is meant to intercept before, not replace, the header line in `whereNext()` — not stated explicitly in §2, inferred from "chooses that result before the existing 19-milestone fallback."
