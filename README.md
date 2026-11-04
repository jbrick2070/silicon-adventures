# Enchanted Scepters

[Play Enchanted Scepters in your browser](https://jbrick2070.github.io/silicon-adventures/). Open the link on your Mac or PC, let the game engine load, then choose **Begin the full adventure** or **Enter the High Altar**. The web edition loads its Java runtime over the internet and runs the original game scripts on your device. Saves stay in that browser profile. Clearing the site's data erases its save. [Built with CheerpJ](https://cheerpj.com/)

For offline play on 64-bit Windows, extract the Windows ZIP and double-click **Play Enchanted Scepters.exe**. The launcher opens the game in your desktop browser. The game, Macintosh disks, sound banks, and interpreter are included.

**Lit colour** paints all 200 rooms, their inhabitants and the objects in your pack. At the High Altar, the ochre pillars cast shadows onto the paving and the aubergine at the foot of the walls blends into the upper slate. The jungle, wreck, desert and palace have their own materials. Click **Classic B/W** or press **L** at any point to see the original Macintosh picture. Press it again to return. [Colour plates and comparison](art/colour/README.md)

**Enter the High Altar** starts a short excursion at two granite columns. Headphones help. **Begin the full adventure** starts Saber in the quarters with the King’s summons. Both entries use the same 200-room game and allow you to continue exploring. In **Adventures…** you can also open the nine saved games that came with the archived image.

**Play The Answering Knock** takes you to an optional Dark Castle passage in the armory. During the full adventure, go **south, east, south** from the quarters and choose **Answer the knock**. Inspect the dents on three shields, compare their rhythms, and see what the knight is guarding. This excursion adds new artwork drawn with the Macintosh disk’s patterns. It works with sound off. **Save here** remembers your place in the passage, and **Return to the armory** continues the campaign.

Beyond the watchtower, **Use the signal lamp** begins *The Eastern Beacon*, an original Airborne-inspired encounter. Aim the lantern, compose a reply to the circling aircraft, and open the courier’s message. Colour and Classic B/W work throughout. The signal card and flash captions support silent play, and Save here keeps an unfinished signal.

**The Enchanted Castle** is a new game in this library, built from both disks. Enter the Black Knight's castle by the four doors of the Great Hall and bring out the four scepters. Its 14 rooms, floors, stairs, ladders, ropes, moving platforms, exits and creature placements are decoded from the 1986 Dark Castle code, not redrawn. All 172 sprite reels, 20 screens and 72 recordings on that disk appear in it. The rules follow the disk's manual cards and are rebuilt for this edition. Choose it on the cover, under **Adventures…**, or step through the glass in the mirror room. It runs in its own window and spends no turns in the adventure. Keyboard, mouse and touch all play it, sound captions cover every cue, and **Elron's ward** lets a blow cost bonus instead of a life.

**Room edges** are physical. Outdoor and undersea rooms stop at a visible barrier of rock, reeds, hedge, wall, dune, bank or reef, chosen from the disk's words for that side. A real exit is a gap between two marker posts, with a worn trail leading to it. The line under the picture lists the ways out from where you face. Walking into an edge costs no turn and shows the disk's own blocked message.

**Archive** also holds the **Chronicle**, which is all 987 lines of disk text, verbatim, filling in as you meet them. **Side quests** tracks 25 optional deeds and **Oddities** tracks 30 jokes and odd corners of the disk. **Cast** shows all 28 inhabitants. The **Try…** button offers the words a room's script listens for, so the whole game can be played without a keyboard. [`archive/PARITY.md`](archive/PARITY.md) records where every disk resource lives.

**Archive** opens an illustrated folio of original Dark Castle manual cards, animated inhabitants, the Great Hall, and Enchanted Scepters credits and disk notes. The tree and stored night-sky comparisons are optional views of preserved artwork. In **Pack**, select an item to open its Study Card, read its original disk inscription where one exists, or choose an explicit action. Reading a Study Card or the submarine viewplate spends no game turn. The enhanced world also includes a dungeon rat, running-computer sparks, a flame in the Devil’s Sanctum, and the Black Knight’s entrance and shattering frames. These new touches use archived sprites; reduced-motion settings freeze the ambient additions.

Sound and music start enabled on your first visit. Use the **Effects** and **Music** sliders to set their volumes independently. Both start at 60%. **Sound off** mutes everything, and your browser remembers your settings. In the castle and temple, *Hero's Quest* by jeffreyabrick alternates with *Violet Stone*. Underwater, *Submerged Bell* by jeffreyabrick alternates with *Soundings*. The title appears beneath the picture. Open **Field guide → Soundtrack credits** for the full list. [Soundtrack, credits and downloads](audio/soundtrack-studies/README.md)

| Control | Action |
| --- | --- |
| W A S D | Walk forward, strafe and back up |
| Left and right arrows | Turn |
| Drag the illustration | Turn and look up or down |
| E | Speak, examine or use the nearby prompt |
| Click a drawn object | Send the original Macintosh click to the game |
| / and Enter | Type and submit an original adventure command |
| I or M | Open your pack or the travel controls |
| Classic B/W or L | Compare the original disk view with your chosen enhanced style at the current position |
| Picture style in the title bar | Choose Lit colour, Refreshed 1-bit or Original. Lit colour uses the disk weapon silhouettes. Refreshed 1-bit includes the banana weapon art. |
| R | Repeat the last attack while someone stands against you |
| Where next? | One more clue toward the next scepter, from a nudge to the exact inputs of a winning run. At the computer and submarine controls it reads the live machine or viewplate before advising (an addition of this edition) |
| Up arrow in the command line | Recall the last command |
| On a phone or tablet | Hold the Walk, Back and turn buttons under the picture; tap an object; drag to look |
| ⌖ in the picture title bar | Return to the original doorway viewpoint |

Read the journal after each action. It keeps the whole session, survives a reload within a launch, and comes back with a Restore; its heading counts the scepters you hold. You can travel by approaching a room edge and pressing E, using the **Travel** tab, or typing a direction. A filled dot marks a doorway visible in the current drawing; the other bearings remain available because some rooms use scripts instead. When someone is waiting for Yes or No, Travel pauses until you answer, while the command line still accepts a deliberate reply. The Travel tab also keeps Saber’s chart, a map of the rooms you have seen drawn on the disk’s own room grid, with ink edges where the map blocks a bearing and gaps where it opens. A physical step inside a room leaves the turn counter alone. An adventure command can advance an enemy, a trap or a puzzle.

**Save** keeps the world state, inventory, and first-person viewpoint. The web edition uses this site's browser storage. The Windows launcher uses `%USERPROFILE%\Saved Games\Silicon Adventures\adventure.sav`. Use **Restore** to return there. The session strip names the saved room, HP, and whether it is a manual save or doorway checkpoint. Each new room you enter on your own journey also saves a doorway checkpoint. A new journey leaves an existing save alone, and checkpoints begin once you press **Save**, which replaces it. After a death the journal offers to return to it. The game keeps one save, so turn checkpoints off in the **Field guide** to keep a hand-placed save. When someone asks you a question, only the answer is safe. The journal offers Yes and No, and other actions count as a refusal. **Field guide** includes a sound-caption switch. The Windows launcher's local server closes after the browser has been gone for five minutes.

Manual saves and checkpoints now keep a matching journal record. Older saves still restore their world and viewpoint; an unmatched older journal is omitted. The King’s unanswered question is recovered from the original room state even when an older save has no reply metadata. Reloading during a native session keeps the live viewpoint and checkpoint ownership, and a command typed during a busy turn stays in the command line.

## What came from the disks

The adventure uses the Enchanted Scepters scene and global scripts, map connections, objects, inhabitants, inventory changes, traps, and four-scepter ending. All 200 rooms have a first-person view. Twenty-two have individually separated foreground geometry. The other 178 project the original illustration onto a walkable room. In the refreshed layer mode, twelve landmark rooms along the campaign (the throne room, marble hall, banquet hall, armory, bridge room, mirror room, lava tunnel, dogleg, Queen’s Chamber, Finale, cavern and cave entrance) also use measured horizons and wall depths, three of them with the throne, dais, trestle table and platform lifted off the walls as separate layers, and doorways appear on unseen walls only where the map or the room text opens them. Eighteen rooms use automatically measured rigs. Seventy more have individually reviewed layouts or surface tones. The remaining 78 use their environment’s box, with a decision recorded for each drawing. [149-room survey and native-size comparison sheets](art/refresh/review/README.md). A hand-checked table classifies every room as chamber, cave, open or submerged, so turning in a desert shows a fixed horizon rather than a castle wall and caves show rock rather than ashlar. Depths and surfaces hidden in the original illustration are interpretations.

Dark Castle supplies animated visitors and positional recordings. The High Altar wizard reacts to your actions. Bats inhabit three caves. The Black Knight’s original Dark Castle gestures also animate his counterpart in Enchanted Scepters combat. The encounters and spatial placements belong to this edition. The disk cabinet lets you inspect the source drawings, compare animation frames, play sounds, and trace resources by disk, file, type, ID and hash. Some records, including system and executable resources, are preserved for inspection.

The source images came from the Internet Archive. The source records include their hashes and local extraction instructions. [Enchanted Scepters](https://archive.org/details/EnchantedSceptersMacintosh) · [Dark Castle v1.2](https://archive.org/details/mac_DarkCastle_1_2)

| File | Contents |
| --- | --- |
| `sources/README.md` | Disk provenance, intake and extraction |
| `archive/es/catalog.json` and `archive/dc/catalog.json` | Disk-file and resource inventories |
| `art/README.md` and `art/foreground.tsv` | Original draw commands, image layers, and inferred depth |
| `game/map.js` | Saber’s chart: a 1-bit fog-of-war map of the room grid in the Travel tab, kept in the save |
| `art/refresh/README.md` and `game/refresh.js` | Separate non-destructive 1-bit refresh layers, steady `CODE 1` halftones, High Altar geometry, landmark room rigs, and lifted forms |
| `archive/dc/README.md` | Sound, motion and interface decoding |
| [Soundtrack and studies](audio/soundtrack-studies/README.md) | Four regional tracks and their credits, two MP3 sketches with Suno prompts and synth seeds, and a disk sampler |
| `archive/es/PLAYTEST.md` | Complete four-scepter campaign verification |
| `archive/es/campaign-trace.tsv` | Spoilers. Room-by-room commands and clicks from the winning run |
| `archive/PARITY.md` | Where every resource on both disks lives in this edition |
| `archive/es/chronicle.js` | Every line of disk text, verbatim, built by `archive/es/build_chronicle.py` |
| `archive/dc/castle-data.js` | Rooms, paths, sound tables and scores decoded from Dark Castle by `archive/dc/tools/build_castle.py` |

## Runtime

A local Canvas renderer reconstructs the views. Web Audio positions the disk recordings. The bundled Java interpreter is adapted from Alexei Svitkine and Mike Burns’s MIT-licensed WAGE engine, revision `0c267e3551edacdcb3a40cb7d14db2193747a6d2`. This edition fixes original-save restoration, duplicate scene names and other verified interpreter issues. The game’s own resources stay in the Macintosh resource fork. [WAGE source](https://github.com/asvitkine/wage-engine)

The runtime is Eclipse Temurin 17.0.20.1 for Windows x64. Its license files are under `engine/runtime/legal`. To rebuild the launcher and interpreter with a local JDK 17, run `engine/build.ps1 -JdkRoot <path-to-jdk>` from PowerShell. The compiled build is ready to play.
