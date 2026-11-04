# Grounding for the design review

The review uses local revision 7391827. The following checks read source data or exercise the hint selector with plain objects. None starts the engine.

## A reproducible wrong clue

In a JS console with game/hints.js loaded, evaluate the following expression.

    ScepterHints.current(
      { scene: 23272, inventory: [{ id: 19566, name: 'Water Scepter' }] },
      id => id === 28593
    ).milestone.title

The result is “The Hurk office”. The winning trace visits the sub deck (28593) before descending to the helm and control (23272). The submarine milestone treats a visit to the deck as completion. The handoff occurs while the player still has to operate the boat. At the computer (9709), the same Water inventory returns “The submarine” both with and without the loose chip (13010). At the High Altar, an empty inventory and a visited mark for 7990 correctly select “The Air Scepter”.

Sources: game/hints.js, ScepterHints.current and the submarine milestone. archive/es/campaign-trace.tsv, rows 229–249. The legacy check_hints.py tests text inputs for membership in the turn vocabulary of the winning trace. It does not establish the current scene, input order, script phase, or click targets.

## What the disk lets the player observe

In archive/es/Scepters.rsrc, ACOD 9709 moves COMP.1 (AOBJ 2718) into the room and the loose CHIP (13010) to storage on successful installation. GET CHIP or clicking the installed COMP.1 reverses this and silences the machine. SEARCH has its own missing-part output. The labels, IDs and bounds are in archive/es/designs.json. The browser snapshot includes room objects, held objects, the latest transcript and room ID. It cannot locate an absent object across the world or read the ship's internal stage directly. A loose chip that appears among the room objects can be identified without speculating that Saber dropped it.

ACOD 23272 advances an internal variable in response to the switches and prints the bay, open sea, cliff, reef and sandbar outcomes. Some choices destroy the boat. The first departure checks both the computer and the hatch. The archive shows two consecutive centre presses, left, right, then centre, from a particular prepared entry. The visible controls are left 4876 (x76), centre 13165 (x150), right 20759 (x225). A whole sequence offered to a resumed or interrupted voyage can kill Saber.

Sources: WAGE WorldLoader.java reads ACOD by ASCN ID. ScriptTextConverter.java maps the IF, MOVE and PRINT tokens. engine/src/Adventure.java, snapshot(). archive/es/PLAYTEST.md documents a skeleton picking up the chip in one run. The winning trace records GET CHIP and INSERT CHIP 106 input rows apart. Those are observations about two runs, not a loss rate for players.

## Other design tradeoffs

- The first exit from the quarters is south. The default camera faces north and the physical south exit only appears near the rear wall. Travel and typed south are available immediately. The Guard and King ask for two answers on the winning route. Existing yes/no controls coexist with six active Travel buttons during pending questions.
- The chart already shows visited rooms and static blocked bearings. A gap describes the map geometry. A script can still deny passage. The finale and both return gates already work in the archived run.
- Local room characters provide HP but no hostility flag in the browser snapshot. The product already supplies HP feedback, flinches, weapons, R and bulk rest. A threat-specific redesign would need stronger evidence than character presence.
- Doorway and manual saves share one atomic slot. The ordinary restore dialog calls it a manual save even after a doorway checkpoint. The saved-journal browser key is written on manual Save only. A room change may update the slot without updating that local transcript. Neither the newest text nor the pre-loss state can be presumed available in a new launch.
- The renderer review gives four named prop seams and 78 documented class-box decisions. Native comparison panels are available to assess a prop before assigning more art time. No new novice study, theft-frequency estimate or full campaign run was conducted for this design review.

Sources: game/play.js (actionNear, controls, apply, begin, manual Save, Restore), game/map.js, index.html, archive/es/PLAYTEST.md, art/refresh/review/README.md.

## Ship fixtures for later implementation

In ACOD 18468, entering the bay submarine at loop zero resets the voyage and removes all four viewplate overlays. In ACOD 23272 the following are the normal sets of VIEW sprites present in Control. Use ASCN IDs for rooms and AOBJ IDs for their furnishings. A recorded trace is one course through these rules.

| Local VIEW set | Archive rule |
| --- | --- |
| none | At departure, the centre switch checks COMP.1 and the remote hatch first. An open hatch destroys the boat. |
| 1 only | Either stage 1 or stage 4. All three switches advance one step in both. The next view must be read again. |
| 1, 2 | Cliff to the right. Only the left switch clears it. |
| 1, 2, 3 | Reef to the left. Only the right switch clears it. |
| 1, 4 | Ship grounded. A further switch press reports that the sub is stuck. |
| any other set | Withhold an exact move. |

VIEW.1–4 have IDs 16192, 11543, 3992 and 4051. ACOD 10472 makes opening the hatch during stages 1–4 lethal. ACOD 28593 allows the north departure onto the beach at stage 5. ASCN 20301 is also visited long before piloting. A past visit alone proves nothing about arrival. At the computer the installed component is direct evidence of a running machine. SEARCH at the beach can move a chip from storage, so chip possession on its own cannot establish that the computer is silent.

The 356 typed inputs include 206 directions and 24 REST turns, clustered into ten at the closet and fourteen at the office. The current browser already offers interruptible Rest until healed under injury and occupancy conditions. These trace counts suggest tasks for observing wayfinding and recovery. They do not measure annoyance in the current UI or represent 24 separate room visits.
