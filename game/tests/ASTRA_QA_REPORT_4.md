# ASTRA QA report — fourth pass

Test date: 2026-11-05  
Branch: `feature/asset-parity`  
Tested commit: `084673178951f165ade25a304cc7f4ba113bc6fd` (`git pull --ff-only` reported already up to date).  
**Release recommendation: no.** The adventure can be won by normal play, but multiple “Exactly” clues still fail from the states where they are presented, and the Finale does not show the action its journal describes.

## Setup

Each test used a separate private server started with `engine\runtime\bin\java.exe -Duser.home=<new empty temp folder> -jar engine\adventure.jar --test <free port>` and fresh Chromium contexts with `--mute-audio`. The Windows default audio endpoint was muted and its state verified. No real user save was opened. All game actions in the adventure win and Castle attempts were ordinary UI inputs, with no debug hooks or state injection; ordinary saves and doorway restores were used. Servers and browsers were stopped. Screenshots cited below are outside the repository in temporary folders.

## Blockers

None established: the adventure was won with deviations from its instructions. The Castle was not completed in these attempts, so this does not establish that all Castle routes are completable.

## Majors

### “Exactly” directions still fail or omit required actions at several steps

- **Where:** Enchanted Scepters, **Where next**, in a new normal-play adventure.
- **Expected:** The displayed sequence should work from the state in which it is offered, including necessary intervening moves and actions. When a combat action is not guaranteed to succeed in one turn, the instructions should not imply that a single hit necessarily finishes it.
- **Observed:** The tester tried the clues as written. The examples below are separate reproduced failures in the same run; the journey continued by the stated deviations and normal checkpoint restores.

| Step and reproduction | Result and route/action actually used |
| --- | --- |
| **2 — Sanctum.** From Quarters go south twice, answer the Guard and King yes, take the sword, then read clue 2. It describes Wizard's Sanctum as north of Banquet Hall. Go north to Marble Hall, east to Banquet Hall, then north. | North says “You can't go north.” East to Courtyard, then north reaches Sanctum. Independently reproduced. Screenshots: `C:\Users\jeffr\AppData\Local\Temp\astra3-adventure-evidence-a65shk2x\step2-hint.png` and `step2-wall.png` in that folder. |
| **3 — key ring.** At Armory follow `get shield · east · get key ring`. | East reaches Dungeon; `get key ring` returns “Huh?” Another east reaches Cell, where the key ring is found. The subsequent return needs the intervening room as well. Screenshot: `C:\Users\jeffr\AppData\Local\Temp\astra4-adventure-evidence-fm22kquw\step3-exact.png`. |
| **7 — temple.** At Corner follow the exact opening `sit · south · up`. | `sit` returned “What?”; south reached Tree Path, where up returned “You can't go up here.” Two further south moves reached Temple Stairs before up worked. The same exact list also omits the Spikes floor-stone click, the Squasher door click and the final west after unlocking it. Clue 2 and room-specific clues did identify the clicks, and the temple was cleared. Screenshots: `C:\Users\jeffr\AppData\Local\Temp\astra4-adventure-evidence-fm22kquw\corner-sit.png`, `step7-exact.png`; independent Tree Path evidence `C:\Users\jeffr\AppData\Local\Temp\astra3-adventure-evidence-uvfm_fzu\tree-up.png`. |
| **11 — wreck.** After obtaining the chip at Silicon Beach, follow exact `south · west · north · down` toward the pearl. | This reached Clear Water → Tidewater → Seaside; down returned “You can't go down here.” The tester navigated to the shipwreck by other moves and obtained the pearl. Screenshot: `C:\Users\jeffr\AppData\Local\Temp\astra4-adventure-evidence-fm22kquw\step11-exact.png`. |
| **12 — trident.** Immediately after taking the pearl in Store Room, follow the exact sequence beginning `up`. | Up returned “You can't go up here.” Two north moves to Hold were needed before up to Deck; the tester then reached Shell and Neptune's Throne and obtained the trident. Screenshot: `C:\Users\jeffr\AppData\Local\Temp\astra4-adventure-evidence-fm22kquw\step12-up.png`. |
| **14 — Water.** After the Queen gives the iron key, follow exact `open · west · throw trident · wait · south · get water scepter`. | At Queen, open said “You can't open anything here.” West reached Court; throwing the trident there said “There is no one to fight.” The tester used the broader clue and additional airlock, grate and lair navigation, defeated the Sea Demon and returned for Water. Screenshot: `C:\Users\jeffr\AppData\Local\Temp\astra4-adventure-evidence-fm22kquw\step14-exact.png`. |
| **15 — submarine.** From Queen's Chamber follow the exact sequence through Computer, insert chip and go west to Submarine; then `open`. | Open twice returned “You can't open anything here,” including on an enemy-free retry. An additional west reached Sub Deck. The exact list also omitted the Control panel switches: following its remaining `east · open · up · north` without them left the boat unmoved and north said “There is water north!” Room-specific clues supplied centre, centre, left, right, centre; after that the voyage succeeded. Screenshots: `C:\Users\jeffr\AppData\Local\Temp\astra4-adventure-evidence-fm22kquw\step15-open.png`, `step15-end.png`. |
| **16 — rope.** After the submarine reaches Silicon Beach, follow exact `open · north · cast freeze spell · get rope`. | The first open returned “You can't open anything here.” The broader clue mentions Mesa and Lobby but does not give the beach-to-Mesa route. Following it from Ram via Center to Bunker, north gave “There are rocks north”; an extra west reached Lobby before open/north to Office. The Captain fled, `cast freeze spell` found nobody, and `get rope` succeeded. Screenshots: `C:\Users\jeffr\AppData\Local\Temp\astra4-adventure-evidence-fm22kquw\step16-open.png`, `bunker-hint.png`. |
| **17 — Fire.** After taking rope in Office, follow exact `search · down …`. At Sphinx, follow `search · down · south · east …`; later, from Shrine follow `north · tie rope · down`. | In Office, search found nothing and down failed. At Sphinx, down → Stair Entrance and south → Passage worked, but east failed; south to Annex then east reached Basin. From Shrine, north reached Cliff Path, where tie rope returned “Huh?” and down failed; two more north moves reached Volcano Top, where tie/down worked. The Fire Demon then needed three successful sword hits in this run; the exact single-swing sequence did not guarantee a pickup. Screenshots: `C:\Users\jeffr\AppData\Local\Temp\astra4-adventure-evidence-fm22kquw\step17-exact.png`, `step17-passage.png`, `step17-cliff.png`. |
| **18 — return.** With all four scepters, follow exact `up · west …` from Devil's Sanctum; later follow its final north from Bridge Room. | Up reached Volcano Top, where west said “You can't go west.” At Bridge Room, north also failed; west reached Courtyard. The tester explored and used ordinary restores to reach the Finale. Screenshots: `C:\Users\jeffr\AppData\Local\Temp\astra4-adventure-evidence-fm22kquw\step18-west.png`, `step18-bridge.png`. |

These failures did not make the adventure impossible, but the exact-clue-only route did not work. In enemy areas, extra turns can be dangerous: the tester experienced deaths while navigating and recovered with ordinary saves. Individual combat outcomes varied; the three Fire Demon hits are an observation from this run, not a claim that every encounter requires exactly three.

## Minors

### Finale picture contradicts Elron's described action

- **Where:** Enchanted Scepters, Finale, Lit colour.
- **Steps:** Earn all four scepters by normal play, return to Courtyard and go north to the Finale. Observe the scene as the journal says Elron takes the scepters.
- **Expected:** The image should show, or at least agree with, the described moment of Elron holding all four scepters high overhead.
- **Observed:** The painted stone wall and window loaded, but Elron was a large flat figure cropped at the lower edge, with his arms lowered and hands empty. The journal simultaneously says he holds the four scepters overhead. The image makes the climax look unfinished. Screenshot: `C:\Users\jeffr\AppData\Local\Temp\astra4-adventure-evidence-fm22kquw\finale-before.png`.

## Polish and Beginner fairness

### Trouble's route and opening bat are hard to read as a new player

- **Where:** The Enchanted Castle, Beginner, Remastered, Trouble 1; ward off.
- **Steps:** Begin a new game, enter Trouble, descend the first stairs, and approach the next landing while throwing with F. Continue down the stair flights and approach the lower-left wooden gate. In another attempt, jump from the middle ledge toward the hanging ropes.
- **Expected:** The easiest difficulty should give a new player enough opportunity to recognize and respond to the immediate hazards and understand where to go.
- **Observed:** The fast opening bat struck on two visible attempts and each contact cost a full life, even while the tester held F; an aimed throw also arrived too late on one attempt. The lower-left gate looked like a potential exit but A, Q, W and S produced no transition or prompt. An independent run found the route by jumping from the middle ledge to the ropes, climbing and crossing to the upper-right ledge. This is a difficulty and signposting judgment, not proof the bat is unavoidable or the gate is broken. Screenshots: `C:\Users\jeffr\AppData\Local\Temp\astra4-castle-evidence-_1p4phgt\a2-bat-death.png`, `left-door.png` in the same folder; rope route `C:\Users\jeffr\AppData\Local\Temp\astra4-castle-evidence-6l8vwbhj\jump1.png`.

**Fairness judgment:** Beginner felt harsh for these new-player attempts. The specific hazards were the fast Trouble 1 bats that remove a life on contact and, in Trouble 2, the long drop from the entry ledge and the guard encountered after releasing the swinging rope. The tester could not establish that these hazards are unavoidable, and did get through Trouble 1 by learning the rope route. Elron's ward was off in these attempts.

## Adventure result and clue coverage

**Normal-play victory achieved.** The tester started a new game, earned Earth, Air, Water and Fire, and carried all four to Courtyard. Going north triggered Finale. The first `wait` described the disasters defeating the Hurks; the second produced “Elron: Bravo! You have saved Callion!” and “All four scepters have come home.” Later waits returned status and the game remained in Finale. No screenshot of the Bravo line was captured before the session stopped; the output was observed and recorded during the run. Finale scene and journal before the waits: `C:\Users\jeffr\AppData\Local\Temp\astra4-adventure-evidence-fm22kquw\finale-before.png`; first-wait sequence: `C:\Users\jeffr\AppData\Local\Temp\astra4-adventure-evidence-fm22kquw\finale-after.png`; four-scepter pickup: `C:\Users\jeffr\AppData\Local\Temp\astra4-adventure-evidence-fm22kquw\four-scepters.png`.

The tester requested Where next throughout and tried its exact action lists. The win required the deviations in the findings above, room-specific clues, normal exploration, and ordinary checkpoint restores; it was **not** an exact-clue-only win. Coverage by step:

| Step | Result |
| --- | --- |
| 1–2 | Exact actions worked once at the relevant Throne/Sanctum location; travel used room text. Step 2's broader Sanctum location was wrong as above. |
| 3 | Exact sequence failed at Dungeon; extra movement to Cell was needed. |
| 4 — flute | Corrected exact sequence from Boiling Pool reached Music Room and took the flute. Independently verified after an ordinary checkpoint retry. |
| 5 — cavern | Corrected Lab → south Cavern wording and flute/wand actions worked; independently verified. |
| 6 — Earth | Exact actions from Chasm worked and Earth was acquired. |
| 7 — temple/Squasher | Exact sequence failed and omitted actions as above. The corrected room-specific Squasher clue explicitly identified the narrow high door; clicking it opened the secret button and west worked. Independently verified. |
| 8 — Air | Exact actions succeeded and Air was taken. A demon later stole it; the tester followed the in-world south lead and recovered it from Nest. The hint had regressed to step 8, but the tester did not establish whether following the altar clue would also recover the stolen scepter. |
| 9 — dunes | Corrected suffix from Cliff Road to Closet worked after a normal retry; the complete sequence from Marsh was not followed exactly because of the stolen-scepter recovery. Independent tester observed the corrected route and also reached the gear. |
| 10 — chip | Corrected south, oil can, east, east, search, get chip sequence succeeded from Salty Bar. |
| 11–12 | Exact sequences failed at Seaside and Store Room as above; pearl and trident were obtained by additional navigation. |
| 13 — Queen | Corrected Hatch-to-Queen sequence, including the second east, succeeded and gave the iron key. |
| 14–18 | Exact sequences failed or omitted required travel/actions as documented above; Water and Fire were earned and the player returned through normal play. |
| 19 — Finale | `wait` produced the disaster sequence; a second `wait` produced victory. |

The independently retested flute, cavern, dunes and Squasher instructions were seen in live hints and followed successfully. The independent tester also performed the corrected chip and Queen routes, but their live hint remained at step 8 after an Air Demon theft; the primary playthrough above verified those live clues.

## Castle attempts

All attempts began on Beginner with Remastered enabled, ward off, and used ordinary mouse/keyboard input. Trouble was tried first.

- Independent tester, game 1: an opening bat cost one life; three stair flights were descended and the lower-left gate reached with four lives. A, Q, W and S produced no transition or prompt; the tester restarted to try again.
- Independent tester, game 2: all five lives were lost in Trouble 1 before reaching the rope. Two observed bat contacts on the first stairs/landing cost lives despite holding F; other deaths occurred during held controls and their exact attackers were not established. No score screenshot was captured.
- Separate run: two early lives were lost near the Trouble 1 opening while learning the stairs. The tester then climbed back to the middle ledge, jumped to the first rope, climbed, switched across the ropes and jumped to the upper-right exit, reaching **Trouble 2 with three lives**. Walking off the entry ledge resulted in “A long fall”; a later aerial attempt received an “A blow lands” caption, with the exact attacker not established. The last life was lost after releasing a swinging rope and landing near a guard. The score screen reported 250 points. Screenshots: `C:\Users\jeffr\AppData\Local\Temp\astra4-castle-evidence-6l8vwbhj\trouble2.png`, `swing3.png`, `fail.png`, `final.png` in the same folder.

No Castle scepter was earned and no Castle victory occurred. The first room's rope route is therefore proven reachable by normal inputs, while the subsequent guard and swing route remain unresolved in this pass.

## Console and network

The first monitored adventure context recorded no page/console errors or HTTP 404s; some image requests ended `net::ERR_ABORTED` during room changes. A later fresh context restored the ordinary save without network/console listeners, so later adventure and Finale coverage is unknown. The independently monitored clue session also saw no page/console or HTTP errors, with some transition-related aborted image requests; its later context was not monitored. Both Castle normal-play sessions recorded no page/console errors or failed requests.

## Not tested or not established

- A win by following every displayed exact clue without deviation: it failed at the steps listed. Steps 1–2 used room text for travel, and step 9 was not followed strictly from Marsh after the Air Scepter was stolen.
- Whether the regressed step-8 hint can recover a stolen Air Scepter at the altar; recovery was instead achieved by following the demon's in-world lead to Nest.
- A normal-play Castle scepter, Trouble beyond room 2, the other wings, Knight and Castle ending. The observed bat and guard hazards were not proven unavoidable.
- Full network/console coverage in the later adventure context, other browsers, physical controller or mobile input, and audible sound/music, which remained muted.

**Would I release it? No.** The main adventure can be won, but its exact guidance repeatedly fails at real progression points, and the Finale's image contradicts the climax. Castle Beginner was only partially covered and felt harsh in these attempts.
