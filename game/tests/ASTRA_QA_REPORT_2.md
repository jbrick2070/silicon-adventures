# ASTRA QA report — second pass

Test date: 2026-11-05  
Branch: `feature/asset-parity`  
Tested commit: `ad73f38` (`git pull --ff-only` reported already up to date).  
**Release recommendation: do not release yet.** The earlier Marsh defect is only partly fixed, and the opening King encounter and High Altar still have conspicuous visual/action mismatches. The Castle finale and prize rooms were tested with assistance, so the game has not been validated end to end by normal play.

## Setup

Each run used a private server started with `engine\runtime\bin\java.exe -Duser.home=<new empty temporary folder> -jar engine\adventure.jar --test <free port>`, and a fresh Chromium context/profile launched with `--mute-audio`. The Windows default audio endpoint was muted and its state verified. The real user save was not opened. Test servers were stopped. Screenshots cited below are in Windows temporary folders, outside the repository. The red circles on some room-audit images mark the tested click points.

## Blockers

None observed in the tested paths. This does not establish that all normal-play routes are completable.

## Majors

### Marsh floor wedge remains after the previous fix

- **Where:** Enchanted Scepters, Marsh, Lit colour.
- **Steps:** Start an adventure, choose **Adventures… → High Altar excursion**, enter `move altar`, then `down`. Press `⌖` to reset the viewpoint, focus the scene, hold W about 1.8 seconds, then Right Arrow about 1.3 seconds.
- **Expected:** The painted ground should remain visually coherent as the player moves and turns.
- **Observed:** The opaque jagged vertical shape from the first report is gone, but a conspicuous blue-grey diagonal wedge still cuts across and mismatches the ground. The old finding is therefore only partly fixed.
- **Screenshot:** `C:\Users\jeffr\AppData\Local\Temp\qa2-marsh-evidence-9zexwcn9\marsh-after-walk-turn.png`.

## Minors

### The King is almost entirely hidden behind the painted throne

- **Where:** Enchanted Scepters, Throne Room, Lit colour, doorway viewpoint.
- **Steps:** Begin in Quarters, go south to Marble Hall and south to the Throne Room, then answer the Guard `yes`. Reset the doorway view with `⌖` if needed.
- **Expected:** When the King enters and asks his question, his figure should be visible in the scene.
- **Observed:** The journal says the King strides in and asks “Will you go?”, but only a tiny fragment appears just to the right of the throne back; the figure is not recognizable. The fragment's hit cue says to answer in the Journal first. This reproduced in a second fresh session. The question can still be answered in the Journal, so progress was not blocked.
- **Screenshot:** `C:\Users\jeffr\AppData\Local\Temp\astra2-rooms-b_p790no\Throne_Room.png`.

### High Altar's clickable box-like object reads as murals

- **Where:** Enchanted Scepters, High Altar excursion, Lit colour.
- **Steps:** Open **Adventures… → High Altar excursion**. Hover or click the small crosshatched rectangular object on the central pedestal, around (181, 181) on the 338 × 314 canvas.
- **Expected:** The visible object and its interaction should agree so a player can tell what they are clicking.
- **Observed:** The object looks like a small box or chest with a lid-like top. Its cue says “Click to read the murals”; clicking logs `read` and describes lizards praying to a bird. No such mural is visible on the painted wall. The intended identity of the depicted object was not established.
- **Screenshot:** `C:\Users\jeffr\AppData\Local\Temp\astra2-rooms-b_p790no\High_Altar.png`.

### Canoe route is omitted from Ways out

- **Where:** Enchanted Scepters, Port and Stagnant Pool, while using the canoe.
- **Steps:** From High Altar, enter `move altar`, `down`, then `east` to Port. Enter `launch canoe`, `get in canoe`, and `paddle east` to Stagnant Pool. Compare the **Ways out** strip with the result of `paddle west`.
- **Expected:** The visible ways-out indication should include the available return route, or make clear that the canoe route is additional.
- **Observed:** At Stagnant Pool the strip lists only east, yet `paddle west` returns to Port. At Port the strip lists west and south, while `paddle east` reaches Stagnant Pool. The Stagnant Pool journal does mention a bank to the west, so the route is available but the strip is incomplete.
- **Screenshot:** `C:\Users\jeffr\AppData\Local\Temp\qa2-marsh-evidence-17nzmcnz\pool-page.png`.

## Polish

### Prominent painted furnishings give no click feedback

- **Where:** Quarters, Wizard's Sanctum, Music Room and Office, Lit colour.
- **Steps:** Start in Quarters and click the painted bed; from Quarters go south, east, east, north to Wizard's Sanctum and click the book on its stand. From the **Mirror Room** bookmark go east to Music Room and click the drum. From the **Office** bookmark click the chair or table.
- **Expected:** A player following the on-screen “Click an object” instruction should receive an interaction or a clear indication that the visible item is scenery.
- **Observed:** These furnishings appeared grounded, but hovering and clicking the indicated painted items produced no target cue or journal response. They may be background scenery; the test does not establish that the disk implements an action for them. Their prominence makes the lack of feedback confusing.
- **Screenshots:** `C:\Users\jeffr\AppData\Local\Temp\astra2-rooms-68yo3r3v\21149-Quarters.png`, `C:\Users\jeffr\AppData\Local\Temp\astra2-rooms-68yo3r3v\29408-Wizards_Sanctum.png`, `C:\Users\jeffr\AppData\Local\Temp\astra2-rooms-68yo3r3v\5196-Music_Room.png`, `C:\Users\jeffr\AppData\Local\Temp\astra2-rooms-68yo3r3v\1092-Office.png`.

## Retests and Castle coverage

- **Great Hall pause fix: passed.** In Remastered Beginner, pausing in the hall and clicking Trouble left the game in the hall; Resume also remained in the hall. Screenshot: `C:\Users\jeffr\AppData\Local\Temp\astra2-castle-end-1emae7fv\pause.png`.
- **Real play:** Entered Trouble, Fireball and Shield through their actual hall doors, and tried movement and jumping. The tester died in Trouble's opening room and did not progress beyond the first rooms of Fireball or Shield. In Classic 1986 controls, a real mouse throw while standing in Fireball reduced rocks from 60 to 59 and produced a visible projectile. Screenshot: `C:\Users\jeffr\AppData\Local\Temp\castle-qa2-classic-njulje0s\throw.png`.
- **Earth, Fire and Air:** Used in-page debug hooks to enter each prize room and position the hero adjacent to the actual scepter; the normal collision then triggered each pickup. Each reward visibly rotated in 3D and returned to the hall. Clicking each completed wing door then stayed in the hall with “That wing has given up its scepter.” No separate door-closing shot or animation was observed; the door appeared closed before and after. Screenshots: `C:\Users\jeffr\AppData\Local\Temp\castle-qa2-wings-7yrl1scr\earth-spin-1.png`, `fire-spin-1.png`, `air-spin-1.png` and corresponding `*-hall.png` files in the same folder.
- **Black Knight and Water:** Injected the first three powers, entered the Knight door normally and saw the reveal. Used debug to enter room 4020, remove hazards and invoke the five chain-pull handlers: the throne rocked, then the Knight visibly fell and Water appeared. Debug-positioning the hero on Water triggered the normal collision pickup; successive frames showed the 3D scepter rotating. The game then showed the empty throne and Scores of Merit screen, with `You` listed and 6,000 points in that assisted run. Water went straight to the ending, so a Water-door closure in the hall was not observed. Evidence is in `C:\Users\jeffr\AppData\Local\Temp\astra2-castle-end-zvv2beiq\` (`knight-reveal.png`, `throne-rock.png`, `knight-fall.png`, `water.png`, `empty-throne.png`, `scores.png`) and `C:\Users\jeffr\AppData\Local\Temp\astra2-castle-end-fpvw9glg\` (`water-spin.png`, `water-spin-2.png`, `water-spin-3.png`).

## Marsh routes

- Slough south reached Cliff Road, the higher ground mentioned in the journal. A cyclops was encountered there.
- Stagnant Pool was reached by the canoe route above; `paddle west` returned to Port, and `get out`, then west returned to Marsh. East from Stagnant Pool reached Mellow Pond.
- Slip was reached from the **Art** bookmark: west to Lab, south to Cavern, `play flute`, west to Altar, south to Corner, south to Tree Path, east to Jungle Path, east to Slip. Capture was not immediate on every entry; after being caught, Saber was carried to Pot. Clicking the visible hanging rope targeted `slip` and advanced the trap. `cut rope` after capture reported it was out of reach; the tester did not escape Pot. Screenshot: `C:\Users\jeffr\AppData\Local\Temp\qa2-marsh-evidence-hmoz0xq0\slip-hanging.png`.

## Painted-room object and furniture audit

These are **17 distinct painted rooms**, inspected at or near the doorway viewpoint. “No cue/action” records an actual click on the indicated painted item; it is not counted as a successful interactive-object test. A placement observation from one viewpoint does not prove alignment while walking or turning.

| Room | Visible item checked and observed result |
| --- | --- |
| Quarters | Bed appeared to sit on the floor; clicking it gave no cue or action. |
| Throne Room | Guard stood beside the throne; King was nearly hidden behind it. After answering the King, clicking the visible floor sword took it. |
| Courtyard | Fountain rim appeared seated on the pavement; clicking it gave no cue or action. |
| Wizard's Sanctum | Book and stand appeared grounded; clicking the book gave no cue or action. |
| Dungeon | Clicking the visible door gave “The door is locked.” |
| High Altar | Click on the rectangular pedestal object read the murals; visual/action mismatch above. |
| Music Room | Drum appeared on the floor; clicking it gave no cue or action. |
| Office | Table and chair appeared grounded; clicking either gave no cue or action. |
| Lobby | Clicking the visible open door gave “The door closes.” |
| Center | Clicking the visible crossbow targeted taking the crossbow; the game said the pack was full. Its pickup was therefore not completed. |
| Finale | Clicking the visible Elron targeted Elron; the journal echoed `Click Elron` without a further response in that state. The visible crop did not establish full-body placement. |
| Cavern | Clicking the visible bat gave a “Click to listen” cue, with no journal response. Sound was muted, so an audible result could not be checked. |
| Altar | The pedestal appeared on the steps; clicking it gave no cue or action. |
| Queen | Painted throne appeared seated on the floor; clicking it gave no cue or action. |
| Court | Clicking the visible robot's left pincer targeted the robot, provoked it and resulted in its attack. |
| Greeting | Clicking the visible oil can took it; clicking the visible robot provoked it. |
| Slip | Clicking the hanging rope targeted `slip` and advanced the trap, as described above. |

The room-audit captures and click points are under `C:\Users\jeffr\AppData\Local\Temp\astra2-rooms-_imro5_g\` and `C:\Users\jeffr\AppData\Local\Temp\astra2-rooms-68yo3r3v\`; the Lobby, Court and Greeting interactions were checked separately in the region run.

## Console and network

No page errors, console errors or HTTP responses of 400 or greater were recorded in the reported runs. Rapid room changes produced some image requests ending in `net::ERR_ABORTED`, including `AOBJ-1855.png`, `AOBJ-15391.png`, `AOBJ-8826.png`, `AOBJ-24181.png`, `AOBJ-12897.png`, `AOBJ-24183.png`, `AOBJ-24885.png`, `AOBJ-11828.png`, `AOBJ-12960.png`, `AOBJ-23636.png`, `AOBJ-19486.png`, `AOBJ-13044.png`, `AOBJ-30636.png`, `AOBJ-13057.png`, `AOBJ-21538.png`, `AOBJ-17298.png`, `AOBJ-1420.png`, `AOBJ-24033.png`, `AOBJ-28261.png`, `AOBJ-5907.png`, `AOBJ-6496.png`, `AOBJ-9925.png` and `AOBJ-3818.png`, under `/archive/es/plates/`; some repeated. No missing image was established from these cancellations.

## Not tested or not established

- Completing any Castle wing or reaching the ending by normal play; prize-room entry and the finale used the debug assistance described above. A distinct door-closing animation was not observed for Earth, Fire or Air, and Water's door closure was not observed at all.
- Escape from Pot after the Slip trap; all possible canoe commands and all Marsh routes.
- Full movement, depth and floor/furniture contact for every item in the room table; successful actions for the decorative painted furnishings, the full-pack crossbow, Elron or the muted Cavern bat.
- Controller input, actual phone hardware, other browsers, and audible sound or music. Sound remained muted as requested.

**Would I release it? No.** The remaining Marsh rendering defect and the visible King and High Altar mismatches need attention, and a full unassisted Castle playthrough remains unverified.
