# Source disks

The workspace began empty. Both game images were retrieved from Internet Archive on November 2, 2026. Their SHA-1 digests match the Archive item manifests. All inspection, drawing conversion, sound decoding and game assembly took place locally.

| Game | Preserved file | SHA-256 |
| --- | --- | --- |
| [Enchanted Scepters](https://archive.org/details/EnchantedSceptersMacintosh) | `enchanted-scepters/EnchantedScepters.img` | `0afd6026f09cb003a5ddf8bb5d70f58dba45266a3fe29fa5db8e09d828d2d476` |
| [Dark Castle 1.2](https://archive.org/details/mac_DarkCastle_1_2) | `dark-castle/DarkCastle_1_2.dsk` | `102e644bb7aa85b28efe362d9fe94f58fa721988ed9939762b3f51ec83f0a0b1` |

## Following an asset

The two indexes, `archive/es/catalog.json` and `archive/dc/catalog.json`, retain separate disk identities. An entry identifies its parent file and four-character Macintosh resource type and ID. The untouched images preserve the original data. Runtime application of a source sound, character or image can add new behavior or placement.

For Enchanted Scepters, 17 HFS files contain 1,225 resources in total. The Scepters application contributes 861 of those, including 200 scene designs, their 200 descriptions and 200 scripts, one global script, 152 objects, 28 characters and 30 sounds. Nine other files are saved games. `archive/es/designs.json` records each PNG's original placement and scene coordinates. `archive/es/sounds.json` identifies each WAV by its ASND ID and name. Duplicate room names retain their individual IDs.

Dark Castle's index covers six files and 473 resources. Its drawing and sound banks are keyed by source file, type and resource ID. Check the visual or audio index for the individual strip, frames, or playable sample.

The High Altar, quarters, Wizard's Sanctum and courtyard use separated artwork from ASCN 7990, 21149, 29408 and 10021. The layer exporter is `art/SeparateAltar.java`. Another 18 scenes have separable foreground features. `art/foreground.tsv` binds their ASCN IDs and original drawing-command numbers to the named cutouts in `art/foreground/`. Their depth and the surfaces behind them were authored for first-person movement.

## Evidence for the High Altar

ASCN 7990 contains the columned room. ATXT 7990 describes its two granite columns. AOBJ 14168 (`high.1`) starts on its altar. Its source rectangle is 45 × 31 at (160, 165) on the 338 × 314 plate. AOBJ 23213 (`Air Scepter`) starts in storage. ACOD 7990 makes it appear when the player prays. Reading the murals supplies the prayer clue. Collecting the scepter for the first time triggers ASND 20958 (`horn`) and a stat change. Moving the altar plays ASND 5665 (`door opening`) and exposes a descent to ASCN 24338 (`marsh`). ASCN 20189 (`squasher`) has the other side of the locked east door.

The original game begins in `quarters`, ASCN 21149. Starting at the High Altar, adding a Dark Castle witness, placing sounds in three dimensions and constructing hidden faces of the stonework are adaptation choices. A save named `Finale` is present on the Archive image. These saved documents establish what this copy contains. Their presence alone cannot establish who made them or whether a retail floppy included them.

## Rebuilding the Enchanted Scepters assets

The shipped build includes the decoded assets. To reproduce them locally from the preserved image, use Python with `machfs==1.3` and `rsrcfork==1.8.0`, and a JDK 17 or later. Run these PowerShell commands from the project root, with the Python and Java tools on PATH.

```powershell
python archive/es/extract.py
$plateClasses = Join-Path $env:TEMP 'scepters-plate-classes'
New-Item -ItemType Directory -Path $plateClasses -Force | Out-Null
javac -cp engine/adventure.jar -d $plateClasses archive/es/Graphics2DCanvas.java archive/es/ExportPlates.java
java '-Djava.awt.headless=true' -cp "$plateClasses;engine/adventure.jar" ExportPlates archive/es/Scepters.rsrc archive/es/plates
python archive/es/extract.py
```

The renderer reads native design commands and the 29 eight-byte patterns in CODE 1. Transparent object crops keep their original offsets. Saber, the player, has an empty source drawing and a transparent one-pixel export. Each ASND resource supplies its own signed delta table. Its nibbles decode to unsigned 8-bit mono PCM at 11 kHz and its original repeat count is folded into the WAV. `Graphics2DCanvas.java` is the rendering adapter from [WAGE](https://github.com/asvitkine/wage-engine/tree/0c267e3551edacdcb3a40cb7d14db2193747a6d2), under the included WAGE license.
