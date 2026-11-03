# Dark Castle · Macintosh v1.2

The source is the Internet Archive's 819,200-byte HFS image of the volume **Dark Castle**. The downloaded disk matches the catalogue SHA-1 `e6633eaf1ea8601dfd9cd3957cfea61c70fc791c`. Its SHA-256 is `102e644bb7aa85b28efe362d9fe94f58fa721988ed9939762b3f51ec83f0a0b1`. [Internet Archive item](https://archive.org/details/mac_DarkCastle_1_2)

`catalog.json` records both forks of all six files and all 473 resources, including preferences, application code, the Finder and the System file. Each record has the original file, type, ID, name when present, byte count and SHA-256. The original bytes remain in `sources/dark-castle/DarkCastle_1_2.dsk`. The two game-data resource forks are also available here for local inspection.

## Decoded material

| Resource | Records | Local use |
| --- | ---: | --- |
| PPCT | 172 | Pixel-exact frame sheets under `art/castle/`, including transparent masks where supplied. The cabinet can animate and step through them. |
| PSCR | 20 | Screen plates under `art/castle/`. |
| SOUN | 73 | 72 playable mono recordings plus an empty 22-byte header at Data A, ID 97. |
| PICT | 23 | Original picture resources, including credits, room headings and instruction cards, rendered under `archive/dc/paper/`. |
| ICON / ICN# | 18 | 32-pixel interface icons. ICN# masks are retained. |
| FONT | 5 nonempty | Character specimens from the game's bitmap font strikes and the included System file. |

The cabinet's Castle papers shelf uses the glyphs from the disk when drawing the original QuickDraw instruction cards. Data A PICT 20002 recounts the wizard hurling fireballs and a rumored elixir. [Inspect the instruction card](paper/Data-A-PICT-20002.png)

`extract.py` decodes each SOUN byte as two consecutive delta indices, high nibble first. The 16-entry table is in the resource, immediately after six header bytes. The accumulator starts at 128 and wraps at 256. `audio/dark-castle-bank.js` retains the resulting unsigned PCM. Playback uses 11,025 Hz. The catalogue records the SHA-256 of each decoded stream as well as that of the source payload. [Format reference](https://github.com/fuzziqersoftware/resource_dasm/blob/master/src/ResourceFile.cc)

## World assignments

The SOUN records have no names. The following labels describe uses chosen for this game. The disk cabinet presents the recordings at their native playback rate under their original IDs.

| File | SOUN | Assigned use |
| --- | ---: | --- |
| Data A | 0 | Moving inhabitant's footfall and the Black Knight's shield strike, also his own periodic cue in the armory |
| Data A | 1 | Voice from the High Altar inhabitant |
| Data B | 69 | Answering knock from the armory doorway |
| Data B | 70 | Pitched directional cue behind the column, the cave bat's call, and the jungle corner's `song bird` ambient, which the Enchanted Scepters disk names but has no recording for |
| Data B | 84 | Player footfall |

Sound captions come from one dictionary in `game/spatial.js`: a shield blow, a voice, a knock from the doorway, two short notes, and `Dark Castle SOUN n` for any other recording picked at the listening stone. Footfalls are not captioned. The samples share a Web Audio listener with Enchanted Scepters' original scene and event sounds. The bell, pickup chime and four-note call and answer in the audio renderer are locally composed effects. The optional synthesis fallback is explicitly identified in `audio/vault-audio.js`.

## Rebuilding

Run `python -m pip install machfs==1.3 macresources==1.2 Pillow`, then `python archive/dc/extract.py --forks` from the project folder. This refreshes the two resource forks, inventory and browser sound bank. `art/draw_castle.py` decodes PPCT and PSCR graphics. `python archive/dc/paper.py` draws the picture, icon and font shelf. Re-run the inventory after graphics extraction to refresh each exported file's disposition.
