# Refinement log

## 2026-11-06 (run 1)
**Chosen item:** 2, replaying the step-by-step hints through the real engine. Item 1 had nothing to do: no `WAVE_ROOMS_05` or `WAVE_OBJECTS_*` reports exist yet.

**Changed:** added `archive/es/replay_hints.js`. It starts a private engine (throwaway Java home, test port, no browser, no sound), walks to the Throne Room, then types each milestone's exact-input tier through `/api/turn`. After each milestone it asks `ScepterHints.current` whether the hint ladder has moved on. It reports a random-combat death as `DIED` and stops. No game files changed.

**Result:**
- Milestones 0–5 (permission, Elron's charge, dungeon, boiling pool, snake and wand, Earth Scepter) replayed clean through the real engine, over two separate runs. The hint ladder advanced correctly each time, so no hint text needed correcting.
- Several runs stopped on random combat. The wandering Alchemist (177 hp) follows Saber through the lab and altar and swallows the typed inputs, and one run died at the Earth/temple stretch. These are encounters, not hint errors.
- Milestones 6 onward (temple, Air, diving gear, onward) are still unreplayed. The script is the way to do them: `node archive/es/replay_hints.js <from> <to>`. Combat means several attempts are needed. It cannot resume from a save yet.

**Tested:** the five node test files (63 pass), `check_hints.py`, `polish_smoke.py` and `parity_smoke.py` all pass.

**For the user:** nothing to decide. Idea, not done: the harness could answer an interrupting fight automatically, so later milestones replay more reliably. That changes nothing in the game.
