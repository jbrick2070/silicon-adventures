# Dark Castle 1.2 Behaviour Trace (`archive/dc/rooms/trace/`)

This directory contains the completed static 68000 disassembly trace for *The Enchanted Castle* reconstruction, derived strictly from `Data A.rsrc`, `Data B.rsrc`, `archive/dc/rooms/`, `archive/dc/castle-data.js`, and `art/castle-index.js` without executing the game or playing audio.

- **Offset convention**: All `CODE` offsets are segment-body hex offsets (`$xxxx`), excluding the 4-byte resource data length header and the 4-byte Macintosh `CODE` segment header.

---

## 1. What Was Finished

All eight requested JSON deliverables are complete and validated:

1. **`timing.json`** — Main-loop frame pacing (`PROVEN`):
   - `_TickCount` (`$a975`) is called only once at startup (`CODE 3:$04f6`) and never paces gameplay.
   - Gameplay is paced by a System VBL queue task installed at `CODE 3:$093c-$095a` (`CODE 1:$1378` -> `CODE 4:$05ba-$0724`), which reloads `vblCount = 5` (`CODE 4:$060a, $0680, $070a`) and clears sync byte `-$65(a5)`, paired with spin-wait barrier `$24a(a5)` (`CODE 4:$0726-$079a`).
   - Update rate is `f_VBL / max(5, ceil(t_CPU * f_VBL))` (`~12.03` updates/s = `83.13 ms/update` on compact Mac with no overrun), independent of difficulty `-$18e(a5)`.

2. **`state-25.json`** — Hero states `25..28` (`CODE 2:$2020-$213e`, `PROVEN`):
   - Entered exclusively from span kind `20` (`CODE 2:$07d2`) in Room `1020` (Trouble 3 / Dungeon).
   - Reels `$94(a4)` and `$98(a4)` hold `Data A PPCT 132` (left-facing) and `PPCT 133` (right-facing) animations of Duncan gripping/yanking the overhead spiked-mace chain.
   - Pressing mouse-click (`btst #1, $14(a6)` at `CODE 2:$20dc`) in state `26` transitions to state `27` (instead of throwing a rock), plays `SOUN 84` (`CODE 2:$20f2`), awards `Stbl` index `4` (`50` pts at `CODE 2:$2050`), and sets `-$274(a5) = $ffff` (`CODE 2:$205c`), which swings the spiked mace into the Dungeon Whip Guard (`$26a`, `CODE 4:$0ba0`) for `150` pts (`Stbl` index `1`).

3. **`kinds.json`** — Span kinds `21`, `37`, and Room `4020` kind-`36` levers (`PROVEN`):
   - **Kind `21`** (`CODE 2:$07da` -> state `32` at `CODE 2:$2140-$217a`): Room `4020` Black Knight throne-topple trigger span; sets `-$274(a5) = $ffff`, which topples the Black Knight (`CODE 4:$2b10-$2b60`, `SOUN 54`, `Stbl` index `19` = `5,000` pts) if and only if all 5 throne pillars are currently lowered.
   - **Kind `37`** (`CODE 2:$085a` -> state `52` at `CODE 2:$08f4-$0944`): Room `4020` post-victory exit doorway unlocked after the Black Knight falls; sets `-$18a(a5) = -1` (`$ffff`) and exits to the victory throne scene (`CODE 6:$09cc`).
   - **Two kind-`36` levers (`$2d2`) in Room `4020`** (`CODE 4:$24d4-$25bc`, `CODE 5:$1dfa-$1e26`): Toggle paired middle-tier walkway spans horizontally by `±68` (`$44`) px (`SOUN 29`, `Stbl` index `17` = `0` pts). They never touch pillar state or `-$274(a5)` and are not mechanically required to topple the Black Knight (only aiding navigation across the gap).

4. **`ropes.json`** — Rope span kinds `519, 520, 543, 545, 546` and swinging rope `525` (`PROVEN`):
   - Vertical climbable ropes (`519`, `520`, and enabled `545`) climb at `-8` px/update up and `+8` px/update down (`SOUN 14` every 9 updates), and leap off via trajectory table `CODE 2:$140c` (`(+1,+12), (+10,+12), (+8,+19), (0,+6)` after an initial `y -= 8` snap, followed by standard `+10` then `+8/update²` fall).
   - Kind `543` (Room `1020` Dungeon chute) forces a fixed `(+18, +16)` px/update diagonal slide on first visit (`SOUN 79`).
   - Kind `546` (Room `3030` trick rope) immediately drops Duncan into standard freefall (`+10`, then `+8/update²`).
   - Kind `525` (Room `1010` `$342` pendulum rope) carries Duncan through table-driven swing offsets and leaps off via full-jump table `CODE 2:$13a4` (`8` arc updates before post-arc fall).

5. **`rules.json`** — Core game rules (`PROVEN`):
   - **Lives**: Starts at `5` (`-$234(a5)`, `CODE 1:$20a6`); bottomless pits (kind `29`) route to Room `1020` via `-$18a(a5) = -42` without costing a life.
   - **Plague & Elixir**: Triggered by Rat hazard type `5` (when not crouching) or latched Plague Bats (`-$25e(a5) >= 1`). When immunity timer `$2a(a6) <= 0` and elixirs `-$33c(a5) > 0`, Duncan auto-drinks 1 elixir (`SOUN 12`), granting `20` updates (`~1.66 s`) of immunity in `$2a(a6)` without detaching latched bats.
   - **Shield**: Bit `1` of `-$276(a5)` (Room `3030`, `1,000` pts); holding Action while standing enters state `37` (`SOUN 99`) for up to `30` updates (`~2.49 s`), blocking `-$20c(a5)` contact hazards and `-$19c(a5)` projectiles, but **bypassed** by Gargoyle (`$2ea`) swoop-grabs (`CODE 4:$2f88`) and Storm Cloud (`$38a`) lightning (`CODE 4:$55f0`).
   - **Fireball**: Bit `0` of `-$276(a5)` (Room `2030`, `1,000` pts); consumes 1 BCD rock from `-$2c2(a5)` per shot (`SOUN 9`), downs Gargoyles (`100` pts), disintegrates Guards (`PPCT 409`), and knocks down the Whip Guard (`150` pts). Powers persist across deaths and clear only on new game or post-Black-Knight difficulty promotion (`CODE 6:$0b60`).
   - **Extra lives**: Awarded whenever 8-digit BCD score `-$258(a5)` reaches `-$25c(a5)` (`CODE 4:$5af4-$5b32`, double-chime `SOUN 8`), advancing by `Stbl+$44`: **`5,000`** (Novice), **`7,500`** (Intermediate), **`10,000`** (Advanced), **`15,000`** (Black Knight).

6. **`creatures.json`** — All `50` unique routines in `spawns.json` (`PROVEN`):
   - Documents speed (px/update), hit points, direction-choice rules, and `Stbl` score indices (`0..19`) for every routine in `spawns.json`.
   - **`$32a` Splitting Magic Broom** (`CODE 4:$4958 -> $467a`, Room `2030`, `PPCT 420..423`, correcting `spawns.json`'s earlier `INFERRED` label `"fountain and vulture"`): Patrols at `±2` px/update between `X = 120..442`; 1 rock/fireball hit splits tier `0 -> 3x tier 1 -> 9x tier 2` (`SOUN 46`, `Stbl` index `8` = `25` pts/hit); smallest brooms stun for `24` updates on hit (`SOUN 45`, `25` pts) and self-retire by hopping into the right pit up to quota `-$27e(a5)` (`6 / 4 / 2` by difficulty).
   - **`$332` Floating Burning Eye** (`CODE 4:$464c -> $419a`, Room `2030` on Advanced/Black Knight, `PPCT 426`): 50% hover-bob (`0` net px/update) and 50% `±1` px/update X,Y homing toward Duncan's 32-px grid cell (firing an 8-way `±4.9999` px/update `PPCT 138` fireball on half of homing cycles, `SOUN 9`); infinite HP (1 rock/fireball stuns stationary for `70` updates, `SOUN 43`, `Stbl` index `9` = `25` pts).

7. **`conditions.json`** — Exact `CODE 5` difficulty, entry, visited, and PRNG guards (`PROVEN`):
   - Exhaustive 32-state 68000 execution across `-$18e(a5)` (`0..3`), `-$18c(a5)` (`0` vs `!= 0`), `-$280(a5)` (`0` vs `!= 0`), and `$3fa(a5)` `d0` (`<= 0` vs `> 0`) reaches all `232/232` call sites in `spawns.json`.
   - Resolves all **`188`** calls that had `required_guards: []` / `other_values: null` in `spawns.json`: **`119`** are unconditional in both execution and arguments, **`69`** execute unconditionally after reconvergent branches with exact per-branch register/table variants documented, and **`0`** have hidden execution guards. All **`44`** remaining guarded calls are also given exact algebraic predicates and variants.

8. **`sounds.json`** — All `73` `SOUN` resources and all `114` `events.json` call sites:
   - Resolves all `58` `SOUN` IDs that were unnamed or partially unnamed in `events.json`, clarifies the `6` register-labeled IDs (`0, 2, 12, 14, 84, 99`), traces the `7` `SOUN` IDs (`88..94`) played via stack wrapper `$3a(a5)` (`CODE 1:$0078`) in `CODE 6` and `CODE 7`, documents `$5a(a5)` stop-loop sites (`SOUN 14, 99`), and proves `SOUN 1` and `SOUN 97` unused (`0` call sites).

---

## 2. What Is `INFERRED`

1. **`timing.json` -> `update_rate_formula.compact_mac_vbl_hz` (`60.14742 Hz`)**:
   - The game binary's divisor of **5 VBL interrupts per gameplay update** (`vblCount = 5` at `CODE 4:$060a, $0680, $070a`) is `PROVEN`. Converting `f_VBL / 5` into `12.029484` updates/s (`83.129 ms/update`) uses the standard compact Macintosh hardware vertical retrace rate (`60.14742 Hz`), which is a property of Macintosh hardware rather than a constant stored in the binary.
2. **`sounds.json` -> `epistemic_note.descriptive_timbre_nouns`**:
   - Every `SOUN` trigger event, state transition, guard condition, and call site in `sounds.json` is `PROVEN` from `CODE 1..7`. Because playing or decoding audio waveforms was prohibited by the brief, descriptive acoustic nouns in human-readable strings (e.g. *"chime"*, *"buzz"*, *"squeak"*, *"squawk"*, *"caw"*) are `INFERRED` from the proven gameplay/animation context.

---

## 3. What Stayed `null` (and Why)

1. **`sounds.json` — `SOUN 1` and `SOUN 97` (`Data A.rsrc`)**:
   - `meaning` and `confidence` are `null`. Exhaustive disassembly of all `$52(a5)`, `$3a(a5)`, and `SFTR` references across `CODE 0..7` proves neither resource ID is ever referenced by the game (`0` call sites), and playing audio to inspect their waveforms is prohibited by the rules.
2. **`ropes.json` — Non-applicable climb / leap fields on special `0x0200`-flagged spans**:
   - `kinds.543.climb_speed_px_per_update.value` and `kinds.543.leap_speed_and_arc.value`: `null` because span kind `543` (state `41`, `CODE 2:$09be-$0a52`) is Room `1020`'s forced one-way entry chute (`+18` X, `+16` Y px/update) and never reads climb or jump input.
   - `kinds.546.climb_speed_px_per_update.value` and `kinds.546.leap_speed_and_arc.value`: `null` because span kind `546` (state `48`, `CODE 2:$0b5e-$0bb6`) is Room `3030`'s non-holdable trick rope that drops Duncan immediately into freefall.
   - `kinds.525.swing_behaviour.leap_off_swinging_rope.climb_speed_px_per_update`: `null` because clinging to swinging pendulum rope `525` (state `12`, `CODE 2:$196c-$1b0e`) ignores Up/Down climb inputs (its swing sync and leap-off arc are `PROVEN`).
3. **`creatures.json` — Non-applicable entity fields on helpers, spawners, and indestructible mechanisms**:
   - **16 setup / graphics / PRNG / sound / main-loop helpers** (`$1a2`, `$1c2`, `$1f2`, `$222`, `$33a`, `$3e2`, `$3fa`, `$52`, `$80(pc)`, `$34c8(pc)`, `$4360(pc)`, `$46e4(pc)`, `$59b4(pc)`, `$5ea8(pc)`, `$5f30(pc)`, `$6770(pc)`): `update_handler`, `speed_px_per_update.value`, `hit_points.value`, `direction_choice.value`, and `stbl_index.value` are `null` because they are one-shot setup or engine routines rather than room creatures (hero movement for `$1f2` was already settled in the brief).
   - **3 stationary creature spawners** (`$272`, `$292`, `$2b2`): spawner-level `hit_points.value`, `direction_choice.value`, and `stbl_index.value` are `null` because the invisible/door spawner object itself is stationary and untargetable; the spawned `Guard`, `Rat`, and `Mutant` creatures' `PROVEN` speed, HP, direction choice, and `Stbl` index are provided in `spawned_creature_*` fields on the same entries.
   - **Indestructible mechanisms, platforms, hazards, pickups, and props** (`$2aa`, `$2ba`, `$2c2`, `$2ca`, `$2d2`, `$2f2`, `$2fa`, `$302`, `$30a`, `$312`, `$31a`, `$342`, `$34a`, `$372`, `$382`, `$38a`, `$392`, `$39a`, `$1d68(pc)`, `$1f6a(pc)`): fields that do not apply (`hit_points.value` on untargetable objects, `direction_choice.value` on stationary objects, and `stbl_index.value` on routines that never call `$5c14` — including Wizard `$31a`, whose `100` pts are scored by `$30a`) are `null` with explicit `why_null` explanations.
   - `spawns_json_label` is `null` on the `29` routines whose input `meaning` in `spawns.json` was `null`, and `previous_event_in_events_json` in `sounds.json` preserves the `null` markers from input `events.json` for traceability.
