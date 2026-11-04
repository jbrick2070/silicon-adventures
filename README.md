# Enchanted Scepters

Double-click **Play Enchanted Scepters.exe** on 64-bit Windows. The launcher opens the game in your desktop browser. If you are using the ZIP, extract the whole folder first. The game, Macintosh disks, sound banks, and interpreter are included and work offline.

**Lit colour** paints all 200 rooms, their inhabitants and the objects in your pack. At the High Altar, the ochre pillars cast shadows onto the paving and the aubergine at the foot of the walls blends into the upper slate. The jungle, wreck, desert and palace have their own materials. Click **Classic B/W** or press **L** at any point to see the original Macintosh picture. Press it again to return. [Colour plates and comparison](art/colour/README.md)

**Enter the High Altar** starts a short excursion at two granite columns. Headphones help. **Begin the full adventure** starts Saber in the quarters with the King’s summons. Both entries use the same 200-room game and allow you to continue exploring. In **Adventures…** you can also open the nine saved games that came with the archived image.

**Music** in the top bar turns on the optional regional score. *Violet Stone* follows the castle halls and drops in level at the High Altar. *Soundings* follows the sea floor and the wreck. The loop continues across neighbouring rooms in the same region. **Sound** mutes the score and the original effects together. Music starts off on a new browser launch address. [Soundtrack sketches and downloads](audio/soundtrack-studies/README.md)

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
| Where next? | One more clue toward the next scepter, from a nudge to the exact inputs of a winning run (an addition of this edition) |
| Up arrow in the command line | Recall the last command |
| On a phone or tablet | Hold the Walk, Back and turn buttons under the picture; tap an object; drag to look |
| ⌖ in the picture title bar | Return to the original doorway viewpoint |

Read the journal after each action. It keeps the whole session, survives a reload within a launch, and comes back with a Restore; its heading counts the scepters you hold. You can travel by approaching a room edge and pressing E, using the **Travel** tab, or typing a direction. The Travel tab also keeps Saber’s chart, a map of the rooms you have seen drawn on the disk’s own room grid, with ink edges where the map blocks a bearing and gaps where it opens. A physical step inside a room leaves the turn counter alone. An adventure command can advance an enemy, a trap or a puzzle.

**Save** keeps the world state, inventory, and first-person viewpoint in `%USERPROFILE%\Saved Games\Silicon Adventures\adventure.sav`. Use **Restore** to return there. On your own journey each new room you enter also saves there as a doorway checkpoint, and after a death the journal offers to return to it. The game keeps one save, so turn checkpoints off in the **Field guide** to keep a hand-placed save. When someone asks you a question, only the answer is safe: the journal offers Yes and No, and other actions count as a refusal. **Field guide** includes a sound-caption switch. The game runs a server on this PC’s loopback address and closes it after the browser has been gone for five minutes.

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
| [Soundtrack studies](audio/soundtrack-studies/README.md) | Two instrumental MP3 sketches, sample-free Suno seeds, a dry disk sampler and suggested room placements |
| `archive/es/PLAYTEST.md` | Complete four-scepter campaign verification |
| `archive/es/campaign-trace.tsv` | Spoilers. Room-by-room commands and clicks from the winning run |

## Runtime

A local Canvas renderer reconstructs the views. Web Audio positions the disk recordings. The bundled Java interpreter is adapted from Alexei Svitkine and Mike Burns’s MIT-licensed WAGE engine, revision `0c267e3551edacdcb3a40cb7d14db2193747a6d2`. This edition fixes original-save restoration, duplicate scene names and other verified interpreter issues. The game’s own resources stay in the Macintosh resource fork. [WAGE source](https://github.com/asvitkine/wage-engine)

The runtime is Eclipse Temurin 17.0.20.1 for Windows x64. Its license files are under `engine/runtime/legal`. To rebuild the launcher and interpreter with a local JDK 17, run `engine/build.ps1 -JdkRoot <path-to-jdk>` from PowerShell. The compiled build is ready to play.
