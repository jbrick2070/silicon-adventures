# Where the game should go next

## 1. Restore the player's trust in the next decision

Build the Water voyage first. After taking the Water Scepter, a player on the verified route can ask for help at the submarine controls and receive directions to the Hurk office. At the computer, the same insertion advice appears with or without the chip. A separate run documents a skeleton taking that part. The successful run has 106 recorded inputs between pickup and installation. These are three different pieces of evidence. Theft frequency and novice frustration remain unmeasured.

Make the pleasure of this sequence reading the viewplate, choosing a control and seeing the boat respond. The journal offers help when asked. Its first clue points the eye towards the glass. Its second describes the danger. Only a third request names the safe control if the drawing and disk rules support it. The original consequence still belongs to the player.

## 2. Smallest shippable slice

**The broken milestone.** Keep the existing nineteen milestones. Remove seen(SUB_DECK) as proof that the voyage is over. Extend the submarine milestone's remit and wording through the road to the Hurk office. The existing stronger evidence of office visited, rope or Fire then advances to the next appropriate milestone. Before that boundary, supply local variants within the current milestone. On the bay/deck/helm leg, offer phase-neutral guidance to read the view and respect the hatch. Never tell a mid-voyage player to open it. On the ambiguous beach, distinguish preparing to sail from already being ashore in conditional prose. On the road/ram/bunker/lobby approach, give directions from the actual location towards the command post. For other eligible rooms offer a conditional landmark nudge. Success after landing must never loop back to an unconditional repair instruction. No new flag, save format or Java dependency.

**At the computer.** In scene 9709, order the tests: installed AOBJ 2718 in state.objects, loose 13010 in inventory, loose 13010 among local objects, else unknown. Installed means the computer works even if the pack also contains a chip. Offer the way west. Avoid clicking the installed part, which removes it. A held part permits the insertion clue. A visible loose part permits a pickup clue. Unknown means Saber can check the pack and prior journal. The beach is the original discovery place only. No suggestion of a thief's position, guaranteed recovery or an earlier save. Do not use global object locations.

**At the control panel.** The snapshot contains the live scene objects. ACOD 23272 moves four viewplate pictures as the ship advances. Filter to VIEW.1 (16192), VIEW.2 (11543), VIEW.3 (3992) and VIEW.4 (4051). Verify the named switch is locally present. Use left (4876), centre (13165), right (20759) in clue copy and existing target labels. Match the complete set. An unrecognized combination gets a conservative text nudge. These are player-facing observations, never raw IDs.

| Visible VIEW set | Deepest permitted advice |
| --- | --- |
| No overlays | Departure prerequisites are off-screen. Ask the player to check the computer and confirm the hatch is closed before diving. Avoid an unconditional launch instruction. |
| 1 only | The first open water and the later approach look alike. A single centre press advances one step in either. Read the new view before the next choice. |
| 1 and 2 | Cliff on the right. The left control clears it. |
| 1, 2 and 3 | Reef on the left. The right control clears it. |
| 1 and 4 | The boat is grounded. The player can go east to the helm, open the hatch, climb up and go north onto the beach. |
| Any other set or required control absent | Withhold a manoeuvre and invite inspection of the drawing or the last disk response. |

**Wiring.** Keep state interpretation pure in game/hints.js. A local variant returns a semantic key such as computer/installed or control/cliff, a title, and three display strings, or null for the legacy ladder. Compare local contexts and the original milestone explicitly, including uninitialized bookmarks and return visits. In game/play.js whereNext(), resolve the title and tiers before writing the entry. Use one active hint key/cursor, reset on a different state and clamp repeated presses to safe text. Local entries get their own title and explicit prose formatter. Legacy step X of 19, exact arrays and the existing hint-count semantics stay valid. Avoid calling join() on local prose. No automatic command, movement, click, sound or save.

**Release gates.** Exercise the pure helper with the four computer states, both presentations of VIEW.1 alone, cliff, reef, grounded, incomplete/unknown assets, missing prerequisites and a changed state after the third clue. Test the global selector along the winning branch from computer through deck, helm, controls, beach, lobby and office. Include an earlier beach visit, a revisit with later progress, an archived computer start and a restored partial voyage. Check the visible title and all four button presses, including exhaustion and re-entry. Exercise touch/pointer and keyboard E on named controls. Hint requests cost zero engine actions; one intentional switch action sends one click to its actual AOBJ ID. Verify only the prepared departure against the archived route. Verify hazard decisions against ACOD, not an indiscriminate replay of five clicks. Keep the existing exact-input validation. Use an isolated test home, verify a save there, click Sound off before all gameplay, and do not play cues.

## 3. Rank the following work by what it changes in play

| Priority | Player decision | Evidence and next slice |
| --- | --- | --- |
| 2. Answering a character | Can I answer the Guard or King without a Travel tap becoming a refusal? | Dedicated Yes/No already works. Disable direct turn-sending Travel shortcuts while a recognized yes/no reply is pending, preserve intentional typed responses, No and turn-free navigation among panels. Test the Earth riddle, Queen and return sentries separately before touching free-form choices. |
| 3. Returning after a setback | What place am I restoring, and can I trust the journal I see there? | Manual saves and doorway checkpoints replace one slot. The general Restore dialog says manual, and a checkpoint can be newer than the manually cached transcript. Fix the copy first, display verified room/HP when known, test manual A then checkpoint B, reload and a new launch. Fall back to what is actually known. |
| 4. Remembering a route | Can I leave the quarters, then recognize an old junction on the trip back to Elron? | Observe keyboard and touch. South is behind the initial camera, Travel is already available, chart hover already names visited rooms. If observed trouble persists, compare a short Travel instruction with tap-to-read names on visited cells. Keep the map's unknowns. |
| 5. Selective visual and encounter work | Does something the player reads in the scene cause the wrong action? | Test the dock pilings, first. A visible bend alone is insufficient. Compare the Air temple's click targets and Fire encounter feedback before commissioning another art batch or combat overlay. Use the working four-scepter gate and muted Finale captions as the homecoming baseline. |

## 4. Decide when to stop

The first implementation is one Water slice. Later rows are independently funded candidates. Observe at least a first-timer and a returning player when available. Record attempted choice, unintended turns, clue level and recovery separately for Earth, Air, Water, Fire and the trip home. A recurring early refusal or a harmful recovery mismatch moves ahead of a second Water pass. If the presentation is understood and no misclick is observed, stop at the corrected clues. Without human sessions report fixture outcomes only. Source scripts, two-colour 338 x 314 plates, original actors, protected assets and the Windows package stay under existing project constraints.
