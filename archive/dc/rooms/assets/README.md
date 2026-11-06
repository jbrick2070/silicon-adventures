# Asset extraction

All offsets below are resource or CODE segment-body offsets. `PROVEN` denotes data or instructions read directly; `INFERRED` denotes a conclusion that has not been established directly. A `null` value means the answer is unresolved, not that an asset or action is absent.

## Fonts

- PROVEN: `score-font.png`, `dialog-font.png`, and `scepters-font.png` contain unscaled FONT strike glyphs. Their matching JSON files record location, bitmap width, effective offset, advance, vertical metrics, the exact list of present Mac Roman character codes and characters, and resource-offset evidence. A zero-width glyph may still advance the pen.
- PROVEN: `specimen.png` uses the extracted strips and metrics at 1x. It shows the requested phrase for each font that contains all its characters; Score Font does not contain the required letters.
- PROVEN: Data A FOND associations establish the Score Font and DC Dialog Font families and sizes. The Scepters family and size are null because an association has not been established in that fork. INFERRED: Its FONT ID 394 is consistent with family 3, size 10 under the resource-ID convention used in `archive/dc/paper.py`; this is not treated as proof of an association.
- PROVEN: The images contain only fully transparent, opaque black, and opaque white pixels. `extract_fonts.py` regenerates them and validates that palette.

## Demo

- PROVEN: `demo.json` is an ordered list decoded from the `Default` DEMO resource; `decode_demo.py` verifies its SHA-256 and accounts for every one of the 1,053 stream bytes read before the original CODE 2 $311c-$3124 bound check stops playback. Each entry records its resource offset and raw bytes. A delay-only entry has `command` and `value` null because it is a timing opcode, not an unidentified command. Delay counts are update-path counts, not established wall-clock time.
- PROVEN: The original playback dispatch is at CODE 2 $3108-$322e. The four bytes beyond the bound and the preceding unread byte are described in `../demo.md`; their purpose is null. The bit and field names in the JSON are intentionally limited to what the instructions prove.

## Animation traces

- PROVEN: `hero-reels.json` identifies all 53 state dispatch entries and records the reel, frame, and facing evidence traced so far. It is not exhaustive: many states, branches, and frame orders remain null or partial. A null does not assert that a state draws no reel.
- PROVEN: `creature-reels.json` includes all thirteen requested routine slots, with traced reel and frame sequences where established. Many walking, attack, death, and other paths remain null. The routine names supplied in the brief are INFERRED until individually established.
- PROVEN: Linear disassembly can lose alignment across embedded data, so a disassembly line alone is not sufficient proof of a reachable instruction; the relevant entry points and branches require tracing.

## Workspace

- PROVEN: No dependencies were installed for this extraction. Existing dependencies and disassembly under the pre-existing `../work/` directory were read without modification. That directory, including its existing dependency folder, remains outside the permitted `assets/` write scope; therefore the brief's condition that no temporary folders remain anywhere in the repository has not been satisfied.
- PROVEN: The game was not run and no audio was played. Animation extraction remains incomplete despite the valid JSON and image outputs.
