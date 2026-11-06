# ASTRA QA report — third pass

Test date: 2026-11-05  
Branch: `feature/asset-parity`  
Tested commit: `51a42624ff612aa9adb2857558284047e3a25bd5` — `git pull --ff-only` reported already up to date. Other agents were adding art during this pass; the staged folder size and screenshots describe the files present when tested, not a guarantee about later workspace contents.

## Setup

The web build was staged into a new empty temporary directory with `python web/stage.py <temp folder>` and served with Python's plain local HTTP server, with no Java server for that build. Java-backed tests used separate servers started as `engine\runtime\bin\java.exe -Duser.home=<new empty temp folder> -jar engine\adventure.jar --test <free port>`. Browser contexts were fresh and launched with `--mute-audio`; the Windows default audio endpoint was set to mute and verified. The real user save was not opened. Evidence paths are outside the repository. Test servers were stopped.

## Blockers

None established in the tested paths. The Castle and the full adventure were not completed, so this is not proof that the complete games are blocker-free.

## Majors

### Where next gives routes that stop short or point into walls

- **Where:** Enchanted Scepters, the edition's **Where next** clues during a normal new game.
- **Steps and observations:**
  1. At step 4, follow the clue from Well Tunnel through Boiling Pool, Pedestal and east into Lab. The exact sequence clue says `cast freeze · south · east · north · search · get flute`. Enter `north` in Lab: the game replies “There is a wall there.” The successful route was Lab east → Art east → Great Hall east → Fountain north → Music Room; `search`, then `get flute` worked there. Screenshot: `C:\Users\jeffr\AppData\Local\Temp\astra3-adventure-evidence-zzdx2hy6\hint-lab.png`.
  2. At step 9, reach Lava Path and follow the clue towards Dunes. It directs west after Lava Path; `west` returns “You can't go west.” The successful route was south to Lava Tunnel, south to Sea Cliff, then west to Dunes. Screenshot: `C:\Users\jeffr\AppData\Local\Temp\astra3-adventure-evidence-zzdx2hy6\lava-hint-west.png`.
  3. At step 10, from Salty Bar follow the exact clue `south · get oil can · east · search · get chip`. One east reaches Seaside, where `search` finds nothing; a second east reaches Silicon Beach, where `search` and `get chip` succeed. Screenshot: `C:\Users\jeffr\AppData\Local\Temp\astra3-adventure-evidence-zzdx2hy6\seaside-hint.png`.
  4. At step 13, follow the clue through Greeting to Court. Its exact sequence gives `north · east · wait · scepter · get iron key`. The first east only sends the robot east and leaves Saber in Court; a second east reaches Queen, where the remaining commands succeed. Screenshot: `C:\Users\jeffr\AppData\Local\Temp\astra3-adventure-evidence-zzdx2hy6\queen-hint-court.png`.
  5. At step 5, the clue describes Cavern as south of Great Hall. In Great Hall, `south` returned “You can't go south.” The successful route was west to Art, west to Lab, then south to Cavern. Screenshot: `C:\Users\jeffr\AppData\Local\Temp\astra3-adventure-evidence-zzdx2hy6\hall-south.png`.
- **Expected:** A step-by-step clue should lead to the stated room or action when followed from the described location.
- **Impact:** These were encountered in a normal playthrough. Failed moves consume attention and, where enemies are active, expose the player to attacks; one Lab attempt ended in death after the Alchemist followed. The incorrect direction itself is not claimed to have directly caused that death.

### Lit Marsh floor wedge remains after the earlier fix

- **Where:** Enchanted Scepters, Marsh, Lit colour; independently retested in Edge.
- **Steps:** Start the full adventure, choose **Adventures… → High Altar excursion**, enter `move altar`, then `down`. Press `⌖`, focus the scene, hold W about 1.8 seconds, then Right Arrow about 1.3 seconds.
- **Expected:** The painted ground remains coherent while walking and turning.
- **Observed:** The old jagged vertical barrier remains absent, but a sharply bounded diagonal dark/blue-grey wedge still crosses the ground. The ground does not read as a continuous painted surface at the tested pose.
- **Screenshot:** `C:\Users\jeffr\AppData\Local\Temp\astra3-edge-evidence-lvczsedk\marsh-moved.png`.

## Minors

### Squasher hint does not distinguish two door targets in a timed room

- **Where:** Enchanted Scepters, Squasher, Lit colour, after the Web.
- **Steps:** Reach Squasher from the temple route. Ask **Where next** for the Squasher clue; it says to click the door's secret button, then go west. Hover and click the prominent lower rectangular door, around (168, 108) on the 338 × 314 canvas; then enter `west`.
- **Expected:** The instructed visible door click should make the secret button discoverable without spending a misleading turn on another door target.
- **Observed:** The lower target says `Click squash door · takes a turn`; clicking logs `Click squash door` and “This room is getting stuffy!” The subsequent west says the walls slide closer and the door is locked. The successful target was a separate narrow brown rectangle near (168, 12), with cue `Click door · takes a turn`: clicking it said “A secret button opens the door!”, after which west reached High Altar. The clue does not distinguish those targets. The tester died after issuing additional commands while the door was locked; the death is not attributed to the single click alone.
- **Screenshot:** `C:\Users\jeffr\AppData\Local\Temp\astra3-adventure-evidence-zzdx2hy6\squasher.png`.

### High Altar object still reads as murals despite its appearance

- **Where:** High Altar excursion, Lit colour, also checked in Edge.
- **Steps:** Open the High Altar excursion and hover/click the crosshatched, box-like object on the central pedestal, around (181, 181) on the 338 × 314 canvas.
- **Expected:** The visible object and its interaction should identify the same thing.
- **Observed:** The object still looks like a small lidded box. Its cue says “Click to read the murals”; the resulting text describes lizards and a bird, neither visible on the painted wall. This repeats the second report's observation; the intended identity of the depicted object remains unknown.
- **Screenshot:** `C:\Users\jeffr\AppData\Local\Temp\astra3-extra-e53bqr_1\altar.png`.

### Ways out still omits the canoe return

- **Where:** Port and Stagnant Pool.
- **Steps:** From High Altar enter `move altar`, `down`, `east`, `launch canoe`, `get in canoe`, `paddle east`; compare Ways out with `paddle west`.
- **Expected:** The strip includes or explains the available canoe route.
- **Observed:** Stagnant Pool lists only east, yet `paddle west` returns to Port. Port lists west and south, even though `paddle east` reaches Stagnant Pool. The journal mentions the western bank, so the route is not impassable.

### A Corner instruction does not match the accepted command

- **Where:** Where next, step 7, Corner on the temple route.
- **Steps:** Follow the temple clue to Corner and enter the suggested `sit`.
- **Expected:** The suggested command should be recognized or the clue should say what to do instead.
- **Observed:** The journal echoed `sit` and returned “Huh?” The tester nevertheless continued to the temple, so this did not block progress. No dedicated screenshot was captured.

## Polish and new-player difficulty

### Fireball 2's apparent landing was hard to read

- **Where:** The Enchanted Castle, Fireball 2, Beginner, Remastered.
- **Steps:** Enter Fireball normally. Cross Fireball 1's first gap with a running Space jump, defeat the mutant, climb the rightmost rope, jump onto the upper ledge and walk right into Fireball 2. Ride its lowest moving platform toward the right-hand stone ledge and try to step or jump across when they appear adjacent.
- **Expected:** The art and timing should make the safe landing and route apparent to a new player.
- **Observed:** Three attempts ended in “A long fall” and exhausted the remaining lives. The platform and ledge appeared to meet in the captured frame; the tester could not establish whether timing, collision geometry or the art explains the fall, so this is reported as a usability observation, not a proven collision defect.
- **Screenshots:** `C:\Users\jeffr\AppData\Local\Temp\castle3-evidence-krlpb4t1\fireball2-last-ready.png`, `C:\Users\jeffr\AppData\Local\Temp\castle3-evidence-krlpb4t1\fireball2-last-outcome.png`.

## Fix retests and browser coverage

- **King: fixed in the tested scene.** In Edge, Quarters → south → south and `yes` to the Guard displayed a recognizable seated King when his question appeared. Screenshot: `C:\Users\jeffr\AppData\Local\Temp\astra3-edge-evidence-lvczsedk\king.png`. The staged web build also displayed him during the same normal route.
- **Marsh: partially fixed.** The old black vertical barrier was absent, but the floor wedge remains as described above.
- **Other browser:** Microsoft Edge `156.0.4314.58` was used in a fresh muted context against a private Java server. The King, Marsh, High Altar and canoe-route checks ran with no page/console errors or failed requests in those Edge sessions. This is a targeted check, not a full cross-browser playthrough.

## Staged web build

- Staged folder: `C:\Users\jeffr\AppData\Local\Temp\astra3-web-72068d662dd04debad5ae25e8b04dabe`, **247,257,750 bytes** (about 235.8 MiB), summed across files.
- Headless Chrome `156.0.8078.81`, fresh context, local `ThreadingHTTPServer` / `SimpleHTTPRequestHandler`. A monotonic timer started immediately before navigation: DOM content loaded in **0.234 s**; the status contained “Ready” and the Begin full adventure button was enabled at **6.873 s**. Quarters was visible at **8.501 s** after navigation, including the start click. A second fresh run reached ready in **6.634 s**. These are local-machine measurements, not public-host or cold-network download estimates.
- Normal interactions rendered the painted Quarters and Throne Room King. The Eastern Beacon was played through opening the courier message; the coloured lamp and aircraft were visible. Castle Options' **See the remastered throne room** preview rendered the coloured Knight room.
- For asset coverage only, in-page debug entered a Castle room, invoked each Earth/Fire/Air/Water claim and invoked the Knight and empty-throne cinematic hooks. Each scepter visibly rotated across paired frames; both throne shots rendered. These are assisted asset checks, not evidence that normal-play triggers or an unassisted win work. Evidence: `C:\Users\jeffr\AppData\Local\Temp\astra3-web-castle-br5cabfr\` (`trouble`, `fireball`, `shield`, `knight` `-spin1.png` and `-spin2.png`, plus `knight.png` and `empty.png`).
- Listeners were attached before navigation. No HTTP 404, other HTTP error, page error or console error was recorded in these tested web flows. Two remote CheerpJ requests ended `net::ERR_ABORTED` while startup and the tested flows succeeded: `https://cjrtnc.leaningtech.com/5.0/etc/localtime` and `https://cjrtnc.leaningtech.com/5.0/17/conf/accessibility.properties`. A missing visible asset was not established from those cancellations.

## Castle normal-play result

No debug hooks or state mutation were used in the normal-play Castle attempts.

- On Beginner, the first Trouble attempt lost a life to a bat. With the ordinary **Options → Elron's ward** subsequently enabled, the tester descended three stair flights to a lower-left wooden barrier in Trouble 1. A, W and Q there did not reveal a way onward or a prompt. Screenshot: `C:\Users\jeffr\AppData\Local\Temp\castle3-evidence-krlpb4t1\trouble-left-door.png`. This is where the tester got stuck, not proof that the room cannot be passed.
- In Fireball, the tester found the running jump, fought the mutant, climbed the rightmost rope, jumped to the upper ledge and reached Fireball 2 with four lives. Three attempts to reach the right stone ledge from a moving platform ended in long falls. All remaining lives were lost; Scores of Merit displayed `You` with 430 points. No scepter was earned and Fireball 3 was not reached. Screenshot: `C:\Users\jeffr\AppData\Local\Temp\castle3-evidence-krlpb4t1\fireball2-gameover.png`.
- A separate Beginner/Remastered, ward-off run reached the top center platform of Shield 1 after climbing the ladders; a mutant killed one life on an earlier ascent. A jump left fell to a lower level, and the tester did not find the route to Shield 2 or a scepter. Screenshot: `C:\Users\jeffr\AppData\Local\Temp\astra3-normal-castle-8zcw9bt8\shield-top-left-jump.png`.
- The initial Fireball gap, rope route, moving-platform landing and Shield's upper-platform route were not immediately clear to these new-player testers. These observations do not establish that a route is impossible. No normal-play attempt reached the Knight wing or ending.

## Adventure normal-play result


The tester started a new game and used ordinary movement, commands, clicks, Where next, saves and doorway restores; no debug hooks or state injection were used. The run reached **Queen's Chamber with Earth, Air and Water Scepters**, 90/188 HP, and Where next step 15 of 19, “The submarine.” It stopped there after the Water Scepter segment, not because further progress was established to be blocked. Screenshot: `C:\Users\jeffr\AppData\Local\Temp\astra3-adventure-evidence-zzdx2hy6\water.png`.

The route included receiving the sword and freeze spell, obtaining the flute and wand, earning Earth, solving the temple and Squasher, and earning Air. The tester then acquired diving gear, oil and chip, fought through the shipwreck, made pack space for the pearl, escaped a pursuing shark after several lethal attempts, traded the pearl, found Neptune's trident, obtained the iron key, opened the Grate and killed the Sea Demon by throwing the trident. On returning to Atlantis and Queen's Chamber, the Water Scepter was taken. Several deaths were recovered through the game's own checkpoints. The misleading route clues and Squasher interaction above were the established progress problems; the shark encounters and pack limit were difficult but not established as bugs.

The initial adventure context recorded no console/page errors or HTTP 404s, and some image requests were aborted during transitions. A later resumed context did not record console or network events, so later adventure network coverage is unknown. The two Castle normal-play sessions recorded no page/console errors or failed requests.

## Not tested or not established

- An unassisted Castle win, any Castle scepter earned through normal play, Fireball beyond room 2, Shield beyond room 1, and the Knight wing or ending through their normal triggers. Assisted staged-web asset checks are described separately.
- Adventure after Queen's Chamber and step 15, including the submarine, remaining scepter and ending; the run stopped after the Water segment, not at a proven blocker.
- Full cross-browser coverage in Edge, actual mobile hardware, controller input, or audible sound and music, which remained muted.
- Every staged asset and network request outside the exercised web routes; public-host download speed and a cold-network first load.

**Would I release it? No.** The repeated inaccurate guidance and remaining Marsh rendering defect affect normal play, and neither game received a complete unassisted playthrough in this pass.
