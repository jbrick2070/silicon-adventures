VERDICT: build-ready as-is? no.
The plan relies on an impossible engine snapshot contract to locate lost items, risks breaking test harness verification for hint cues, and contradicts its own ranking rule by prioritizing a rare 100-turn Water journey soft-lock over universal early-game parser traps.

MUST-FIX BEFORE BUILD:
1. [Section A] Impossible item tracking via "current snapshot only".
   Defect: Section A dictates that Where next? at the computer must distinguish between "a chip in the pack, a missing chip with a visible local lead, and an unknown whereabouts" while using "only the current snapshot". In engine/src/Adventure.java#L92-L111, snapshot() only serializes objects and characters in the active scene (scene.getState().getObjs()) and player inventory (p.getState().getInventory()). It contains no world-wide object index or tracking of dropped/stolen items. When standing at the computer (archive/es/designs.js: ASCN 9709), if the chip is not in inventory, the snapshot cannot differentiate between a chip left on Silicon Beach, dropped in the airlock, or held by a wandering skeleton.
   Concrete fix: Ground missing-item hint logic purely on verifiable client state. Milestone 15 in game/hints.js should branch based strictly on has(CHIP). If missing, the hint text must direct the player back to Silicon Beach (archive/es/campaign-trace.tsv#L126-L128) and remind them to search the sand, rather than promising dynamic location detection across the world that Adventure.java cannot supply.

2. [Section A] Control-room click cues break hint regression harness.
   Defect: Section A specifies: "Give the control-room click a playable cue in the deepest tier." In game/hints.js#L89, the deepest tier (Tier 3) is strictly an array of typed turn commands (['south', 'west', ...]). In archive/es/check_hints.py#L10-L25, the test harness validates every Tier 3 entry against archive/es/campaign-trace.tsv where line action is turn. Control room switch interactions (archive/es/campaign-trace.tsv#L241-L245) are click AOBJ/13165, click AOBJ/4876, click AOBJ/20759, which are not turn actions. Adding clicks to Tier 3 will fail check_hints.py unless the harness schema is rewritten. Furthermore, typed text in Tier 3 is submitted to /api/turn, but clicks require /api/click (engine/src/Adventure.java#L134-L141).
   Concrete fix: Do not put raw click targets into Tier 3's command array. Instead, update Tier 2 in game/hints.js#L88 to explicitly state the sequence of switches to click (center, center, left, right, center for sub.g, sub.l, sub.r), and keep Tier 3 strictly focused on navigable turn inputs (west, east, open, up, north), updating game/play.js:labelFor() so the switches (AOBJ 13165, 4876, 20759) do not all share the ambiguous label "control".

3. [Section A vs Section C] Doorway auto-checkpoints cement 100-turn soft-locks into the single save slot.
   Defect: Section A expects to "Let the player decide whether to retrace steps" upon learning the chip is missing at the computer. However, game/play.js#L312-L319 triggers an automatic save to adventure.sav upon entering every new room doorway when checkpointsOn is true (the default). By the time the player navigates through the underwater labyrinth, airlock, and Queen's chamber to reach the computer, their only manual/auto save slot has been overwritten dozens of times. Retracing steps on foot through one-way airlocks and underwater hazards without the chip is often impossible or lethal, leaving the player permanently soft-locked with no viable restore point.
   Concrete fix: In game/hints.js, add an upfront checkpoint warning or clue before passing the point of no return (e.g., at the dock or airlock in Milestone 10/13: game/hints.js#L61, L77) verifying that the chip is held before entering the submerged complex, or suspend doorway auto-checkpoints upon entering the submarine passage.

4. [Section A vs Section B & C] Inverted sprint prioritization (Rare edge case prioritized over early-game blockers).
   Defect: Section A sets the Water journey submarine chip as the "First bet". Yet Section C explicitly commands: "Treat a button that misleads on a rare 100-turn setback differently from an everyday annoyance." Losing the chip to a wandering skeleton is a rare, documented edge case (archive/es/PLAYTEST.md#L21). In contrast, the dialogue question trap in Section B (game/play.js#L62-L72, L233-L238) affects every single playthrough starting at turn 5 (Guard and King in Throne Room: archive/es/campaign-trace.tsv#L5-L6) and throughout all four arcs (Earth Demon riddle, Queen summons, Sentry challenge).
   Concrete fix: Invert the sprint order. Make Sprint 1 the universal dialogue safety guardrail (addressing the King, Queen, Demon, and Sentry question handling across the board). Defer the submarine chip hint refactor to Sprint 2.

SHOULD-FIX:
1. [Section B] Unprotected free-form question flow in dialogue parser.
   Defect: detectPending() in game/play.js#L62-L72 categorizes questions into yesno, choice, and free. Only yesno questions trigger UI protection in controls() (game/play.js#L233-L238). When an entity asks a free-form question (e.g. Earth Demon asking rainbow at campaign-trace.tsv#L53, Queen asking scepter at #L174, Sentry asking saber at #L353), play.js leaves the entire standard Commands menu and direction pad active. Any errant click or look command is dispatched to the engine and treated as a wrong answer/refusal, triggering attacks or locking progression.
   Concrete fix: Extend the pending check in game/play.js#L233-L238 and use() (#L435) to cover kind === 'free', disabling default action buttons, hiding movement directions, and prompting the user directly in the input bar.

2. [Section A] Factual error regarding chip movement in winning trace.
   Defect: Section A claims: "On the winning trace the chip changes hands more than a hundred inputs before the computer needs it." This is demonstrably false. In archive/es/campaign-trace.tsv#L128, Saber picks up the chip (get chip) and holds it continuously in inventory until turn 234 (insert chip), never dropping it or transferring it to another character.
   Concrete fix: Amend Section A to state accurately that the chip remains dormant in inventory for 106 turns between pickup and usage, leaving an extensive window where players may discard it or lose it to wandering combatants without understanding its future necessity.

3. [Section C] Sound-off observation conflicts with audio cue validation.
   Defect: Section C requires observers to test "with sound off", yet Section A simultaneously calls for a "playable cue" for control-room switches. In game/play.js#L127, L424-L427, audio events and sound captions operate via separate toggles (captions vs muted). If testers run with sound off and captions are unconfigured or cues lack visual text reflection, the cue cannot be evaluated.
   Concrete fix: Mandate that any switch or puzzle cue added in Section A must produce a visible text caption via message() (game/play.js#L127) and journal entry, ensuring complete testability in sound-off conditions.

OPTIONAL / NICE-TO-HAVE:
1. [Section B] Excursion vs Campaign entry-point onboarding.
   Clarify the distinction between Enter the High Altar and Begin the full adventure on the landing screen (index.html, README.md#L3-L6), ensuring first-time players understand the Altar is a self-contained excursion rather than the canonical start of the 4-scepter quest.

2. [Section A] Milestone tier reset guard.
   In game/hints.js#L49, hintTier automatically resets to 0 whenever hintGoal !== index. If multi-branch clue evaluation is introduced for the submarine milestone, ensure evaluating sub-conditions does not cause hint index thrashing or reset the player's unlocked clue depth.

CUT THESE (scope / over-engineering):
1. [Section B] Separated foreground prop extraction.
   Safe to cut because slicing and rigging additional 1-bit scene props (art/foreground.tsv, art/build_refresh.py, game/rooms.js) is visual layout polish. It does not resolve any narrative blockers, clue ambiguity, or soft-locks, and directly distracts from the core gameplay sprint.

2. [Section B] Chart landmark recognition overlay.
   Safe to cut because game/map.js#L7-L56 is deliberately engineered as a minimal 1-bit 10x20 room grid using disk CODE 1 patterns. Adding landmark graphics or markers risks violating Section C's strict constraint ("No map rewrite") and inflates sprint complexity.

3. [Section B] Return to Elron / Finale rework.
   Safe to cut because the Finale sequence already has 10 dedicated directional sound cues (game/play.js#L144-L152), verified gate interactions (archive/es/campaign-trace.tsv#L353-L364), and passing playtest verification (archive/es/PLAYTEST.md#L14). There is no documented player failure on the final leg.

[ASSUMPTION] references throughout:
- [ASSUMPTION] In Must-Fix #1, inferring that "visible local lead" was intended to denote finding clues to an item left in another room, rather than a clue physically inside the computer scene.
- [ASSUMPTION] In Must-Fix #3, inferring that typical players do not disable doorway checkpoints manually in the field guide dialog (game/play.js#L416).
