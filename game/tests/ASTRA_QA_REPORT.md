# ASTRA independent QA report

Test date: 2026-11-05  
Branch: `feature/asset-parity`  
Recommendation: **Do not release yet.** The Lit colour Marsh rendering visibly breaks during ordinary movement, and substantial Castle and adventure coverage remains unverified.

## Setup

The tests used private Java servers started with `engine\runtime\bin\java.exe -Duser.home=<new empty temp folder> -jar engine\adventure.jar --test <free port>`, and fresh Chromium browser contexts or profiles with `--mute-audio`. The Windows default audio endpoint was muted and its mute state verified. No real user save was opened. Test servers were stopped. Art was being added concurrently, so these observations describe the assets present during this run.

Screenshots below are outside the repository in the Windows temporary directory. They are evidence from this run, not permanent project assets.

## Blocker

None observed in the paths tested. This is not a claim that the full games are blocker-free.

## Major

### Lit colour Marsh breaks up when moving and turning

- **Where:** Enchanted Scepters, Marsh, Lit colour.
- **Steps:** Start an adventure, open **Adventures…**, choose **High Altar excursion**, enter `move altar`, then `down`. In Marsh press the doorway-view button `⌖`, focus the scene, hold W for about 1.8 seconds, then hold Right Arrow for about 1.3 seconds. Repeat from the reset viewpoint.
- **Expected:** The painted surroundings and navigable scene remain coherent as the player walks and turns.
- **Observed:** A conspicuous opaque, jagged dark vertical shape cuts across the painted scenery, and a blue-grey diagonal floor wedge visibly mismatches the surrounding ground. The result reproduced after resetting the view. At the same pose, Refreshed 1-bit shows a drawn fence and path; Original displays its original plate. Switching modes itself worked.
- **Screenshots:** `C:\Users\jeffr\AppData\Local\Temp\astra-marsh-repeat.png` (Lit), `C:\Users\jeffr\AppData\Local\Temp\astra-marsh-ink.png` (Refreshed), `C:\Users\jeffr\AppData\Local\Temp\astra-marsh-original.png` (Original).

## Minor

### A paused Great Hall still accepts door clicks

- **Where:** The Enchanted Castle, Remastered Great Hall.
- **Steps:** Start a Beginner game, pause in the Great Hall, and click the canvas near the Trouble door while the pause panel is open. Resume.
- **Expected:** Pausing prevents the game from accepting a door selection until play resumes.
- **Observed:** The click immediately changes the underlying game from the hall to a door run. The animation stays frozen while paused, then completes into Trouble after Resume. The player can therefore select a wing accidentally while the game says it is paused.
- **Screenshot:** `C:\Users\jeffr\AppData\Local\Temp\castle-qa-4269ad86-34d5-4b3a-b130-9341ebb99214\paused-click.png` (paused view after the click).

## Polish

No separate polish finding was established in the tested paths. The Marsh artifact above is the point at which the visual presentation felt unfinished enough that I would hesitate to continue exploring in Lit colour.

## Coverage and observations

- **Adventure:** Started a new game in Quarters and used Travel south to Marble Hall. The Marsh route was entered via the High Altar excursion; Marsh south → Slough east → Bog east → Swamp, and the reverse route back to Marsh, worked. The four rooms had distinct names and paintings, and Ways out listed compass exits. Slough's journal mentioned higher ground south, but that route was not followed to its destination. In Marsh, the three picture modes switched successfully at a moved pose; this is not a comprehensive check of mode changes during motion or across several rooms.
- **Persistence and panels:** With doorway checkpoints off, saved in Marble Hall, moved north to Quarters, selected Restore and confirmed the restore dialog; the game returned to Marble Hall. Clearing session storage and reloading also exposed Continue and restored Marble Hall. Where next displayed an initial direction, Pack displayed the empty inventory, and Archive and Chronicle opened. These are basic checks, not exhaustive content audits.
- **Eastern Beacon:** Followed Quarters → south → east → south, answered the knock, solved the shield, climbed to the watchtower, read the signal card, aimed east, sent short/long/short and opened the courier's message. The card's text was readable at 390 × 844. An unfinished east-facing short/long signal survived saving and reload. The quest was also completed in Classic B/W; the canvas at the reply contained only black and white pixels. Screenshot of the phone-sized card: `C:\Users\jeffr\AppData\Local\Temp\beacon-card-phone.png`.
- **Castle:** With Remastered enabled, used modern controls to enter the opening rooms of Trouble, Fireball and Shield, and tried movement and jumping. Classic 1986 controls were exercised in Fireball: door selection and entry, movement, jumping and pause/resume worked; a successful throw was not verified. The Black Knight door refused entry before the first three scepters; with those powers injected into test state, the normal door revealed the knight and holding F skipped the shot. This assisted check does not establish that those powers can be earned through play.
- **Window sizes and input:** Adventure layouts were inspected at 390 × 844, 1366 × 768 and 1920 × 1080 with no horizontal page overflow in Quarters. A 390 × 844 touch-emulated context exposed the touch controls, and holding turn right changed the compass from N to E. Castle rendering was inspected at 390 × 844, 1024 × 768 and 1920 × 1080 desktop viewports; those were not physical touch-device tests.
- **Console and network:** No page errors, console errors, or HTTP responses of 400 or greater were recorded in the tested sessions. During rapid travel through Dogleg, Slide Floor, Jumping Door, Ball and Spikes, several `archive/es/plates/AOBJ-*.png` requests ended with `net::ERR_ABORTED` as rooms changed. The cancelled filenames were `AOBJ-23636.png`, `AOBJ-19486.png`, `AOBJ-25069.png`, `AOBJ-28002.png`, `AOBJ-13044.png`, `AOBJ-5907.png`, `AOBJ-6496.png`, `AOBJ-30636.png`, `AOBJ-17298.png`, `AOBJ-19657.png`, `AOBJ-1855.png`, `AOBJ-15391.png` and `AOBJ-1420.png`, with some repeated. These are observed cancellations; missing assets or a visible failure were not established. The other recorded runs reported no failed requests.

## Not tested or not established

- Stagnant pool and slip; the actual route out of the marsh to higher ground; a complete new-player journey to the marsh.
- Thorough object and inhabitant placement, floor/furniture contact, click targets and hit alignment across painted rooms; wall locking across all first rooms and during every movement type.
- Picture switching during movement in several rooms, and the absence of painted content in every non-Lit room.
- All four Castle wings through completion, actual scepter pickups and spins, the ending and its skip, and successful Classic throwing. The knight reveal was reached with injected powers, not earned in a complete playthrough.
- Controller menus, play, aiming and pause: Chromium reported zero gamepads, so no usable controller was available to the browser.
- Quest canvas hit regions and incorrect signal responses; broad save compatibility and full Archive/Chronicle content.
- Audible music and sound quality, intentionally muted for the entire run; actual phone hardware and other browsers.

