# Design priorities for Enchanted Scepters

**Give the next sprint to the submarine.** On the winning route, Saber steps onto the sub deck before reaching the controls. That visit currently marks the voyage complete. Pressing **Where next?** at the controls can send the player to the Hurk office while the boat is still in its bay. This is reproducible in the current hint selector. The archived playtest records a separate Water run in which a skeleton took the computer chip. The successful run records 106 inputs between picking up the chip and installing it.

The design opportunity is to make looking at the drawing worth doing. When the submarine approaches a cliff, the first requested clue might ask, “What changed in the viewplate?” The second could say, “The cliff fills the right side. Where is there room to steer?” Only the third would say, “Press the left control.” Reading is free. Pressing the switch takes the original turn and has its original consequences.

## What to fund, in order

| Priority | Player experience | Decision |
| --- | --- | --- |
| 1. Puzzle feedback | Read the computer and the submarine’s viewplate, make a choice, see the result. | Correct Water’s milestone and clues. Test the full stretch from the computer through the landing and the Hurk office. |
| 2. Dialogue | Answer the Guard and King deliberately. | Yes/No already works. Disable the Travel buttons that still send a direction during recognized yes/no questions. Preserve No and intentional typed replies. Observe the Earth riddle, Queen and return sentries before widening the guard. |
| 3. Save and recovery | Know what place and history a restore will bring back. | Manual saves and doorway checkpoints share one slot. Correct the “last manual save” wording. Test manual save A followed by checkpoint B, including reload and a new launch. Show room and HP only when known. Omit an old journal when it cannot be matched to that slot. |
| 4. Exploration | Leave the quarters unaided and recognize a familiar junction on the return to Elron. | The first south exit is behind Saber. Travel already works from the doorway, and the chart names visited rooms on pointer hover. Observe keyboard and touch players. Prototype one Travel cue or tap-to-read names only where they actually get lost. Keep the High Altar excursion available. |
| 5. Scene and encounter polish | Read the action implied by an illustration. | Try the dock pilings on approach, the Air temple’s clickable floor and a Fire encounter. Fund a single foreground separation or feedback change if players repeatedly misread that scene. The 78 documented generic rooms can wait. |

Water comes first because the wrong clue occurs on the ordinary route. Its prevalence among players is unknown. Dialogue moves ahead of another Water pass if first-time players repeatedly send unintended refusals. Promote recovery if a player restores a different place or history than the interface led them to expect. The existing four-scepter homecoming and Finale are working comparison points for these tests.

## The Water slice

**Progress.** Remove the sub-deck visit as proof of completion in the existing nineteen-milestone ladder. Extend the voyage milestone through the approach to the Hurk office. The office visit, rope and Fire remain stronger evidence of later progress. On the vessel, group the bay submarine (18468), sub deck (28593) and helm (10472). The sunken wreck also has a room named deck (20431). Keep its earlier Water clues independent. At the grounded boat, offer the way ashore. Group the Hurk approach through mesa (11672), ram (23935), bunker (23160) and lobby (29467). Help the player find the command post from their current location. The beach itself is visited twice. An appropriate fallback there is “If you have just come ashore, look inland for the command post. If you are preparing to sail, check the submarine and its hatch.” Off-route and sparse-history saves also need conditional wording at every tier. A visit to the beach, helm or deck alone establishes no landfall.

**Computer room 9709.** Check these cases in order. The installed part (AOBJ 2718) in the room means the machine is running, including when Saber also has a loose chip. Offer the way west. The disk allows an intentional click on that part to take it back out. A loose chip (13010) in the pack permits the insertion clue. A loose chip on the floor permits a pickup clue. If neither is visible, invite the player to search the machine, inspect the pack and consult earlier journal entries. The beach can be named as the original discovery site. The snapshot cannot locate an absent chip or guarantee recovery from a save.

**Control room 23272.** Name the three existing targets **left control** (4876), **centre control** (13165) and **right control** (20759). The room script changes the visible viewplate pictures, and the browser receives their IDs in the live room objects. Match the filtered VIEW IDs by exact set equality and check that the suggested switch is present.

| Viewplate pictures present | What the deepest clue can say |
| --- | --- |
| None | The computer and closed hatch are departure prerequisites. Their condition is off-screen. Ask the player to check before diving. |
| 1 | This picture appears twice. One centre press advances the boat in either case. Read the new view before making the next choice. |
| 1 and 2 | Cliff on the right. Use the left control. |
| 1, 2 and 3 | Reef on the left. Use the right control. |
| 1 and 4 | The boat is grounded. Return east to the helm, open the hatch, climb up and go north onto the beach. |
| Unrecognized set or absent target | Invite inspection of the viewplate and the last disk response. Withhold an exact manoeuvre. |

The four picture IDs in order are 16192, 11543, 3992 and 4051. Reserve the hatch-opening instruction for the grounded picture set. Opening it earlier in the voyage can destroy the submarine. A prepared five-click route from the bay is evidence for one run. A player resuming halfway needs one decision from the view they actually have.

## Implementation and release checks

1. Keep the selection logic in `game/hints.js`. Preserve the `current(state, visited)` return fields `index`, `count` and `milestone`. Return one display key alongside those fields. Every ordinary milestone uses `chapter/<index>`. A local key includes the scene and observed state, such as `local/9709/installed` or `local/23272/cliff`. A local milestone supplies its own title and three prose tiers. Use the returned milestone’s title and tiers for local entries, with a room label in place of a campaign step number. At the computer or controls, give local evidence precedence for a sparse bookmark. On a clearly later campaign revisit, preserve the later objective.
2. In `game/play.js`, have `whereNext()` choose the header and format the tier once for normal and exhausted presses. Format a legacy command array with `join` and local prose as text. A fourth press repeats the current last clue with its title and does not increase usage. Ignore presses during an engine request. Reset the local reveal cursor on a new context, room re-entry or fresh start. In `labelFor()`, resolve these three IDs before the generic control label. Keep the existing pointer, touch and E handlers.
3. Test the four computer cases and every row above against synthetic snapshots. Exercise the actual bundled engine at the cliff, reef and landing to confirm room objects, labels and outcomes. Include an earlier beach visit, first boarding, a partially piloted restore, the archived computer bookmark and a return carrying Fire. A wrong chapter, an unsafe manoeuvre, a stale third-tier reveal or a click generated by reading a hint blocks release. One deliberate switch press must send one click to the intended object.
4. Keep the existing 153-input hint check as a text regression. Add separate room-and-state checks for clicks. Future gameplay tests must confirm a test save under a throwaway Java home and switch Sound off before play. Preserve the offline game, native sprite frames, 338 × 314 two-colour drawing, Original toggle and disk-authored puzzles.

**What remains to verify.** This is a design plan. The current selector result and original script rules were checked during review. The proposed UI, real-engine acceptance cases and human comprehension tests have not run. Observe at least one first-time player and one returning player when available. Record what they saw, which choice they made, what they expected to happen and how much help they requested before funding the next pass.
