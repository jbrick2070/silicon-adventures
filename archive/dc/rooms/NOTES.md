# Extraction notes

## Method and limits

- PROVEN: `archive/dc/tools/disassemble.py` reads CODE resources from `Data A.rsrc`, removes the four-byte CODE segment header and writes `work/seg1.asm` through `work/seg7.asm` and `work/jump-table.json`. All CODE offsets in these deliverables refer to the segment body, unless explicitly stated otherwise. The program was not run and audio was not played.
- PROVEN: CODE 5 contains inline data. A linear disassembly can lose instruction alignment when it crosses data; room routines and fixed-size dispatch slots need decoding from their actual entry points. For example, CODE 2 $722-$732 jumps into eight-byte slots at $73a, and the linear listing misdecodes the instruction at $76a.
- PROVEN: CODE 2 $2a80-$2a94 indexes a four-byte state dispatch table beginning at $2a9a. Mapping a table entry is not, by itself, proof of the associated animation or gameplay semantics.
- PROVEN: This extraction is incomplete. The JSON files distinguish traced facts from unresolved fields; `null` does not mean the original game has no value. See the individual files for addresses and scope.

## The DEADFACEBEEFCAFE marker

- PROVEN: CODE 1 $670 contains the sixteen ASCII bytes `DEADFACEBEEFCAFE`. CODE 1 $642-$65e loads those bytes as four longwords and compares them with sixteen bytes beginning at address $00f80030. CODE 1 $660-$66c returns a boolean through the stack, true only if all four comparisons match.
- PROVEN: The jump table maps slot $72 to CODE 1 $640; CODE 3 $4e0 calls it, then inverts and combines the returned byte with another test at $4e4-$4ee. The larger purpose of that check is unresolved. The comparison itself does not establish a cheat, joke, date check, or hidden-room trigger.

## Other discoveries and open questions

- PROVEN: A printable-string scan found `Dark Castle 2` at CODE 1 $1a55 and `Castle Preferences` at CODE 3 $aeb. Their full context has not been established.
- PROVEN: No claim is made here that cheat keys, date checks, hidden rooms, or developer jokes are absent; a complete search and control-flow analysis has not been performed. Their identities and locations remain null.
- PROVEN: Span kinds 23 and 24 route to distinct hero states (CODE 2 $7ea and $7f2 respectively), but that alone does not prove the proposed Shield and Fireball pickup labels. Their item identities remain null pending evidence tying the handlers to resources or inventory.

## Inferred and null

- INFERRED: Any routine labels explicitly marked INFERRED in `spawns.json` come from the supplied brief and remain hypotheses until confirmed by code or resources. Consult that file for each call's evidence.
- PROVEN: The unresolved span meanings and kind 1's `a` field are null in `span-kinds.json`; the missing state behavior and reel IDs are null in `hero-states.json`; missing mechanics are null in `physics.json`. Other nulls and inferred observations are recorded in their respective deliverables. These gaps mean the brief's full completion criteria are not yet met.
