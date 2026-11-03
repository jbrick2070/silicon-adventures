# Campaign playtest

**Passed on Windows, November 2, 2026.** A fresh game started Saber in the quarters. The run obtained all four scepters through the original scripts, returned them to Elron and received the original victory message. It used the production loopback turn and click endpoints. Ordinary saves and restores allowed retries after lethal random encounters. No original bookmark or authored starting-room shortcut was used in the successful campaign.

`campaign-trace.tsv` records the successful run's 356 text inputs and seven object clicks, including mistaken inputs and commands intercepted by other characters. The run visited 121 distinct room names. The trace gives the command and resulting room and omits housekeeping requests and discarded lethal attempts. New runs can encounter different enemies or need another turn to finish an interrupted action. The browser's physical traversal and artwork were tested separately.

| Milestone | Original interactions exercised |
| --- | --- |
| Permission to leave | Answered the King's two questions, received the sword, read the book and summoned Elron. |
| Earth | Froze the boiling pool, found the flute, charmed the snake, prayed for a wand, spanned the chasm and answered the Earth Demon's riddle. Took the scepter at the Elven Throne. |
| Air | Entered the temple, operated its sand-room button and traversed the slide floor, jumping door, boulder, spikes, web and sliding walls. Read the murals, prayed and took the scepter at the High Altar. Moved the altar and descended to the marsh. |
| Water | Retrieved diving gear, oil and a computer chip. Found the wreck's pearl, opened the route past the oyster and recovered the trident. Operated the hatch and pumps, met the Queen, unlocked the grate and struck the Sea Demon. Took the scepter, repaired the computer and piloted the submarine back to the beach. |
| Fire | Obtained rope from the Hurk Captain's office, opened the sphinx and worked through the phoenix, sealed doors and sarcophagus. Tied the rope, descended into the volcano and fought the Fire Demon for his scepter. |
| Return | Passed both gate challenges, entered the courtyard with all four scepters and went north. The Finale triggered ten sound cues before Elron confirmed that Callion was saved. The cues replay from the disk's Finale bookmark: south, west, north, then wait. In the first-person edition each run of cues plays from the bearing the script names. |

## Save and map checks

* Each of the nine WDOC files on the Archive disk opened with the player in the scene recorded by its native save. Physical HP, loop count and the nine base stats matched the source bytes. A new save made after collecting the Air Scepter and moving the altar was byte-identical after leaving, loading and saving again.
* In a separate branch from the disk's Finale save, dropping the Air Scepter before heading north from the courtyard led to the Wizard's Sanctum. Returning to the courtyard and picking the scepter up restored access to the Finale.
* The desert cannon at (5, 5) and the shipboard cannon at (1, 19) both resolved by coordinates. The named initial location of `can.1` resolved to the desert room, as in the source saves.
* A separate new-game run acquired Earth, Air and Water after a skeleton had picked up the computer chip. The original submarine puzzle then lacked a required item. The successful run verified that the player still held the chip before visiting the Queen.
